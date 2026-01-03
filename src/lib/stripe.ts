import Stripe from 'stripe';

// Initialize Stripe (only on server side)
export const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-12-15.clover',
    })
  : null;

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
 * Create a Stripe Customer
 */
export async function createStripeCustomer(email: string, name?: string) {
  if (!stripe) {
    throw new Error('Stripe is not configured');
  }

  const customer = await stripe.customers.create({
    email,
    name: name || undefined,
  });

  return customer;
}

/**
 * Get or create a Stripe Customer
 */
export async function getOrCreateCustomer(email: string, name?: string) {
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
  return createStripeCustomer(email, name);
}

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

/**
 * Get Stripe Customer Portal session URL
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
