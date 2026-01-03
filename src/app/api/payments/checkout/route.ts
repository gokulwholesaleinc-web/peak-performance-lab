import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createCheckoutSession } from '@/lib/stripe';

const checkoutSchema = z.object({
  items: z.array(z.object({
    name: z.string(),
    description: z.string().optional(),
    amount: z.number().positive(), // in cents
    quantity: z.number().positive().default(1),
  })),
  customerEmail: z.string().email(),
  metadata: z.record(z.string(), z.string()).optional(),
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = checkoutSchema.parse(body);

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const session = await createCheckoutSession({
      customerEmail: data.customerEmail,
      items: data.items,
      metadata: data.metadata,
      successUrl: data.successUrl || `${appUrl}/dashboard?payment=success`,
      cancelUrl: data.cancelUrl || `${appUrl}/dashboard?payment=cancelled`,
    });

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    });
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
