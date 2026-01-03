import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import {
  getCustomerPortalUrl,
  getOrCreateCustomer,
  isStripeConfigured,
} from '@/lib/stripe';

export async function GET(request: NextRequest) {
  try {
    // Check if Stripe is configured
    if (!isStripeConfigured()) {
      return NextResponse.json(
        { error: 'Payment system is not configured' },
        { status: 503 }
      );
    }

    // Get authenticated user
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get return URL from query params or use default
    const { searchParams } = new URL(request.url);
    const returnUrl = searchParams.get('returnUrl') || undefined;

    // Get or create Stripe customer
    const customer = await getOrCreateCustomer(
      user.email,
      user.name || undefined,
      { userId: user.id }
    );

    // Create customer portal session
    const portalUrl = await getCustomerPortalUrl(customer.id, returnUrl);

    return NextResponse.json({ url: portalUrl });
  } catch (error) {
    console.error('Portal error:', error);
    return NextResponse.json(
      { error: 'Failed to create portal session' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  // POST method for compatibility - same functionality as GET
  return GET(request);
}
