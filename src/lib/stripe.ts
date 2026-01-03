import Stripe from 'stripe';

// Initialize Stripe (only on server side)
export const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-12-15.clover',
    })
  : null;

// ============================================
// Types
// ============================================

export interface CreateCheckoutParams {
  customerId?: string;
  customerEmail: string;
  items: {
    name: string;
    description?: string;
    amount: number; // in cents
    quantity: number;
  }[];
  metadata?: Record<string, string>;
  successUrl: string;
  cancelUrl: string;
}

export interface PackageCheckoutParams {
  packageId: number;
  packageName: string;
  packageDescription?: string;
  packagePrice: number; // in cents
  clientId: string;
  clientEmail: string;
  customerId?: string;
}

export interface InvoiceCheckoutParams {
  invoiceId: number;
  invoiceAmount: number; // in cents
  invoiceDescription: string;
  clientId: string;
  clientEmail: string;
  customerId?: string;
}

// ============================================
// Checkout Session Functions
// ============================================

/**
 * Create a Stripe Checkout Session for one-time payments
 */
export async function createCheckoutSession(params: CreateCheckoutParams) {
  if (!stripe) {
    throw new Error('Stripe is not configured');
  }

  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = params.items.map(
    (item) => ({
      price_data: {
        currency: 'usd',
        product_data: {
          name: item.name,
          description: item.description,
        },
        unit_amount: item.amount,
      },
      quantity: item.quantity,
    })
  );

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: lineItems,
    mode: 'payment',
    customer: params.customerId,
    customer_email: params.customerId ? undefined : params.customerEmail,
    metadata: params.metadata,
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
  });

  return session;
}

/**
 * Create a Stripe Checkout Session for package purchases
 */
export async function createPackageCheckoutSession(params: PackageCheckoutParams) {
  if (!stripe) {
    throw new Error('Stripe is not configured');
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: params.packageName,
            description: params.packageDescription || `Session package: ${params.packageName}`,
          },
          unit_amount: params.packagePrice,
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    customer: params.customerId,
    customer_email: params.customerId ? undefined : params.clientEmail,
    metadata: {
      type: 'package_purchase',
      packageId: String(params.packageId),
      clientId: params.clientId,
    },
    success_url: `${appUrl}/dashboard/payment/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/dashboard/payment/cancel`,
  });

  return session;
}

/**
 * Create a Stripe Checkout Session for invoice payments
 */
export async function createInvoiceCheckoutSession(params: InvoiceCheckoutParams) {
  if (!stripe) {
    throw new Error('Stripe is not configured');
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: `Invoice #${params.invoiceId}`,
            description: params.invoiceDescription,
          },
          unit_amount: params.invoiceAmount,
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    customer: params.customerId,
    customer_email: params.customerId ? undefined : params.clientEmail,
    metadata: {
      type: 'invoice_payment',
      invoiceId: String(params.invoiceId),
      clientId: params.clientId,
    },
    success_url: `${appUrl}/dashboard/payment/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/dashboard/payment/cancel`,
  });

  return session;
}

// ============================================
// Customer Functions
// ============================================

/**
 * Create a Stripe Customer
 */
export async function createStripeCustomer(email: string, name?: string, metadata?: Record<string, string>) {
  if (!stripe) {
    throw new Error('Stripe is not configured');
  }

  const customer = await stripe.customers.create({
    email,
    name: name || undefined,
    metadata,
  });

  return customer;
}

/**
 * Get or create a Stripe Customer
 */
export async function getOrCreateCustomer(email: string, name?: string, metadata?: Record<string, string>) {
  if (!stripe) {
    throw new Error('Stripe is not configured');
  }

  // Try to find existing customer
  const customers = await stripe.customers.list({
    email,
    limit: 1,
  });

  if (customers.data.length > 0) {
    return customers.data[0];
  }

  // Create new customer
  return createStripeCustomer(email, name, metadata);
}

/**
 * Get a Stripe Customer by ID
 */
export async function getStripeCustomer(customerId: string) {
  if (!stripe) {
    throw new Error('Stripe is not configured');
  }

  const customer = await stripe.customers.retrieve(customerId);
  return customer;
}

// ============================================
// Customer Portal Functions
// ============================================

/**
 * Get Stripe Customer Portal session URL
 */
export async function getCustomerPortalUrl(customerId: string, returnUrl?: string) {
  if (!stripe) {
    throw new Error('Stripe is not configured');
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl || `${appUrl}/dashboard`,
  });

  return session.url;
}

/**
 * Create a Stripe Customer Portal session (returns full session object)
 */
export async function createCustomerPortalSession(
  customerId: string,
  returnUrl: string
) {
  if (!stripe) {
    throw new Error('Stripe is not configured');
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });

  return session;
}

// ============================================
// Payment Intent Functions
// ============================================

/**
 * Create a Payment Intent for direct payments
 */
export async function createPaymentIntent(
  amount: number,
  currency: string = 'usd',
  metadata?: Record<string, string>
) {
  if (!stripe) {
    throw new Error('Stripe is not configured');
  }

  const paymentIntent = await stripe.paymentIntents.create({
    amount,
    currency,
    metadata,
  });

  return paymentIntent;
}

// ============================================
// Webhook Functions
// ============================================

/**
 * Verify Stripe webhook signature
 */
export function verifyWebhookSignature(
  payload: string | Buffer,
  signature: string
): Stripe.Event {
  if (!stripe) {
    throw new Error('Stripe is not configured');
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    throw new Error('Stripe webhook secret is not configured');
  }

  return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
}

// ============================================
// Session Retrieval Functions
// ============================================

/**
 * Retrieve a Checkout Session
 */
export async function retrieveCheckoutSession(sessionId: string) {
  if (!stripe) {
    throw new Error('Stripe is not configured');
  }

  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ['line_items', 'payment_intent'],
  });

  return session;
}

/**
 * Retrieve a Payment Intent
 */
export async function retrievePaymentIntent(paymentIntentId: string) {
  if (!stripe) {
    throw new Error('Stripe is not configured');
  }

  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
  return paymentIntent;
}

// ============================================
// Utility Functions
// ============================================

/**
 * Convert dollars to cents
 */
export function dollarsToCents(dollars: number | string): number {
  const amount = typeof dollars === 'string' ? parseFloat(dollars) : dollars;
  return Math.round(amount * 100);
}

/**
 * Convert cents to dollars
 */
export function centsToDollars(cents: number): number {
  return cents / 100;
}

/**
 * Check if Stripe is configured
 */
export function isStripeConfigured(): boolean {
  return !!stripe;
}
