import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { db, clientPackages, packages, invoices, payments } from '@/db';
import { eq } from 'drizzle-orm';
import { verifyWebhookSignature, centsToDollars } from '@/lib/stripe';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      );
    }

    let event: Stripe.Event;

    try {
      event = verifyWebhookSignature(body, signature);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }

      case 'invoice.paid': {
        const stripeInvoice = event.data.object as Stripe.Invoice;
        await handleStripeInvoicePaid(stripeInvoice);
        break;
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentSucceeded(paymentIntent);
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentFailed(paymentIntent);
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionChange(subscription, event.type);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

/**
 * Handle checkout.session.completed event
 * This is triggered when a customer completes a Stripe Checkout session
 */
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  console.log('Checkout completed:', session.id);

  const metadata = session.metadata || {};
  const paymentType = metadata.type;

  if (paymentType === 'package_purchase') {
    await handlePackagePurchase(session, metadata);
  } else if (paymentType === 'invoice_payment') {
    await handleInvoicePayment(session, metadata);
  } else {
    console.log('Unknown payment type:', paymentType);
  }
}

/**
 * Handle package purchase from checkout completion
 */
async function handlePackagePurchase(
  session: Stripe.Checkout.Session,
  metadata: Record<string, string>
) {
  const packageId = parseInt(metadata.packageId, 10);
  const clientId = metadata.clientId;

  if (!packageId || !clientId) {
    console.error('Missing package or client ID in metadata');
    return;
  }

  // Fetch the package to get session count and validity
  const [pkg] = await db
    .select()
    .from(packages)
    .where(eq(packages.id, packageId))
    .limit(1);

  if (!pkg) {
    console.error('Package not found:', packageId);
    return;
  }

  // Calculate expiration date
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + pkg.validityDays);

  // Create client package record
  await db.insert(clientPackages).values({
    clientId,
    packageId: pkg.id,
    remainingSessions: pkg.sessionCount,
    purchasedAt: new Date(),
    expiresAt,
  });

  // Create invoice record for the purchase
  const [newInvoice] = await db
    .insert(invoices)
    .values({
      clientId,
      amount: pkg.price,
      status: 'paid',
      stripeInvoiceId: session.id,
      paidAt: new Date(),
    })
    .returning();

  // Create payment record
  if (newInvoice) {
    const paymentIntent = session.payment_intent as string;
    await db.insert(payments).values({
      invoiceId: newInvoice.id,
      amount: pkg.price,
      method: 'stripe',
      stripePaymentId: paymentIntent,
      paidAt: new Date(),
    });
  }

  console.log('Package purchase completed:', {
    packageId,
    clientId,
    sessionCount: pkg.sessionCount,
    expiresAt,
  });
}

/**
 * Handle invoice payment from checkout completion
 */
async function handleInvoicePayment(
  session: Stripe.Checkout.Session,
  metadata: Record<string, string>
) {
  const invoiceId = parseInt(metadata.invoiceId, 10);
  const clientId = metadata.clientId;

  if (!invoiceId || !clientId) {
    console.error('Missing invoice or client ID in metadata');
    return;
  }

  // Update invoice status to paid
  await db
    .update(invoices)
    .set({
      status: 'paid',
      stripeInvoiceId: session.id,
      paidAt: new Date(),
    })
    .where(eq(invoices.id, invoiceId));

  // Fetch the invoice to get the amount
  const [invoice] = await db
    .select()
    .from(invoices)
    .where(eq(invoices.id, invoiceId))
    .limit(1);

  if (!invoice) {
    console.error('Invoice not found:', invoiceId);
    return;
  }

  // Create payment record
  const paymentIntent = session.payment_intent as string;
  await db.insert(payments).values({
    invoiceId,
    amount: invoice.amount,
    method: 'stripe',
    stripePaymentId: paymentIntent,
    paidAt: new Date(),
  });

  console.log('Invoice payment completed:', {
    invoiceId,
    clientId,
    amount: invoice.amount,
  });
}

/**
 * Handle Stripe invoice.paid event
 * This is for Stripe-managed invoices (e.g., subscriptions)
 */
async function handleStripeInvoicePaid(stripeInvoice: Stripe.Invoice) {
  console.log('Stripe invoice paid:', stripeInvoice.id);

  // Find invoice by Stripe invoice ID
  const [invoice] = await db
    .select()
    .from(invoices)
    .where(eq(invoices.stripeInvoiceId, stripeInvoice.id))
    .limit(1);

  if (!invoice) {
    console.log('No matching invoice found for Stripe invoice:', stripeInvoice.id);
    return;
  }

  // Update invoice status
  await db
    .update(invoices)
    .set({
      status: 'paid',
      paidAt: new Date(),
    })
    .where(eq(invoices.id, invoice.id));

  // Create payment record
  // Extract payment intent ID - handle both string and object types
  let paymentIntentId: string | undefined;
  const paymentIntent = (stripeInvoice as Stripe.Invoice & { payment_intent?: string | Stripe.PaymentIntent | null }).payment_intent;
  if (typeof paymentIntent === 'string') {
    paymentIntentId = paymentIntent;
  } else if (paymentIntent && typeof paymentIntent === 'object' && 'id' in paymentIntent) {
    paymentIntentId = paymentIntent.id;
  }

  await db.insert(payments).values({
    invoiceId: invoice.id,
    amount: String(centsToDollars(stripeInvoice.amount_paid)),
    method: 'stripe',
    stripePaymentId: paymentIntentId || stripeInvoice.id,
    paidAt: new Date(),
  });

  console.log('Invoice updated to paid:', invoice.id);
}

/**
 * Handle payment_intent.succeeded event
 */
async function handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  console.log('Payment succeeded:', paymentIntent.id);

  // Check if there's an existing payment record
  const existingPayments = await db
    .select()
    .from(payments)
    .where(eq(payments.stripePaymentId, paymentIntent.id))
    .limit(1);

  if (existingPayments.length > 0) {
    console.log('Payment already recorded:', paymentIntent.id);
    return;
  }

  // Log for monitoring - the actual record should be created in checkout.session.completed
  console.log('Payment intent succeeded (record may be created by checkout handler):', {
    id: paymentIntent.id,
    amount: centsToDollars(paymentIntent.amount),
    metadata: paymentIntent.metadata,
  });
}

/**
 * Handle payment_intent.payment_failed event
 */
async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  console.log('Payment failed:', paymentIntent.id);

  const metadata = paymentIntent.metadata || {};

  // Log the failure for monitoring
  console.error('Payment failed:', {
    id: paymentIntent.id,
    amount: centsToDollars(paymentIntent.amount),
    metadata,
    lastError: paymentIntent.last_payment_error?.message,
  });

  // If this was an invoice payment, we might want to update the invoice status
  if (metadata.type === 'invoice_payment' && metadata.invoiceId) {
    const invoiceId = parseInt(metadata.invoiceId, 10);

    // We don't change the status here, just log it
    // The invoice remains in 'sent' status until successfully paid
    console.log('Invoice payment failed:', invoiceId);
  }
}

/**
 * Handle subscription lifecycle events
 */
async function handleSubscriptionChange(
  subscription: Stripe.Subscription,
  eventType: string
) {
  console.log(`Subscription ${eventType}:`, subscription.id);

  // Handle subscription lifecycle events
  // This is a placeholder for future subscription-based features
  switch (eventType) {
    case 'customer.subscription.created':
      console.log('Subscription created:', {
        id: subscription.id,
        customer: subscription.customer,
        status: subscription.status,
      });
      break;

    case 'customer.subscription.updated':
      console.log('Subscription updated:', {
        id: subscription.id,
        status: subscription.status,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      });
      break;

    case 'customer.subscription.deleted':
      console.log('Subscription deleted:', {
        id: subscription.id,
        customer: subscription.customer,
      });
      break;
  }
}
