import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db, packages, invoices, users } from '@/db';
import { eq } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';
import {
  createPackageCheckoutSession,
  createInvoiceCheckoutSession,
  dollarsToCents,
  isStripeConfigured,
} from '@/lib/stripe';

// Schema for package checkout
const packageCheckoutSchema = z.object({
  packageId: z.number().positive(),
});

// Schema for invoice checkout
const invoiceCheckoutSchema = z.object({
  invoiceId: z.number().positive(),
});

// Combined schema - accepts either packageId OR invoiceId
const checkoutSchema = z.union([
  packageCheckoutSchema,
  invoiceCheckoutSchema,
]);

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const data = checkoutSchema.parse(body);

    // Determine checkout type
    if ('packageId' in data) {
      return await handlePackageCheckout(data.packageId, user.id);
    } else if ('invoiceId' in data) {
      return await handleInvoiceCheckout(data.invoiceId, user.id);
    }

    return NextResponse.json(
      { error: 'Invalid checkout request' },
      { status: 400 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}

async function handlePackageCheckout(packageId: number, userId: string) {
  // Fetch the package
  const [pkg] = await db
    .select()
    .from(packages)
    .where(eq(packages.id, packageId))
    .limit(1);

  if (!pkg) {
    return NextResponse.json(
      { error: 'Package not found' },
      { status: 404 }
    );
  }

  if (!pkg.isActive) {
    return NextResponse.json(
      { error: 'Package is no longer available' },
      { status: 400 }
    );
  }

  // Fetch the user
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) {
    return NextResponse.json(
      { error: 'User not found' },
      { status: 404 }
    );
  }

  // Create Stripe checkout session
  const stripeSession = await createPackageCheckoutSession({
    packageId: pkg.id,
    packageName: pkg.name,
    packageDescription: pkg.description || undefined,
    packagePrice: dollarsToCents(pkg.price),
    clientId: user.id,
    clientEmail: user.email,
  });

  return NextResponse.json({
    sessionId: stripeSession.id,
    url: stripeSession.url,
  });
}

async function handleInvoiceCheckout(invoiceId: number, userId: string) {
  // Fetch the invoice
  const [invoice] = await db
    .select()
    .from(invoices)
    .where(eq(invoices.id, invoiceId))
    .limit(1);

  if (!invoice) {
    return NextResponse.json(
      { error: 'Invoice not found' },
      { status: 404 }
    );
  }

  // Verify the invoice belongs to the user
  if (invoice.clientId !== userId) {
    return NextResponse.json(
      { error: 'Unauthorized to pay this invoice' },
      { status: 403 }
    );
  }

  // Check if invoice is payable
  if (invoice.status === 'paid') {
    return NextResponse.json(
      { error: 'Invoice is already paid' },
      { status: 400 }
    );
  }

  if (invoice.status === 'cancelled') {
    return NextResponse.json(
      { error: 'Invoice is cancelled' },
      { status: 400 }
    );
  }

  if (invoice.status === 'draft') {
    return NextResponse.json(
      { error: 'Invoice is still in draft' },
      { status: 400 }
    );
  }

  // Fetch the user
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) {
    return NextResponse.json(
      { error: 'User not found' },
      { status: 404 }
    );
  }

  // Create Stripe checkout session
  const stripeSession = await createInvoiceCheckoutSession({
    invoiceId: invoice.id,
    invoiceAmount: dollarsToCents(invoice.amount),
    invoiceDescription: `Payment for Invoice #${invoice.id}`,
    clientId: user.id,
    clientEmail: user.email,
  });

  return NextResponse.json({
    sessionId: stripeSession.id,
    url: stripeSession.url,
  });
}
