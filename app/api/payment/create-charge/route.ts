import { NextRequest, NextResponse } from 'next/server';
import { createPlusCharge } from '@/lib/coinbase-commerce';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Generate redirect URL for after payment
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || `https://${request.headers.get('host')}`;
    const redirectUrl = `${appUrl}/auth/payment-success?email=${encodeURIComponent(email)}`;

    const hostedUrl = await createPlusCharge(email, redirectUrl);

    return NextResponse.json({ success: true, url: hostedUrl });
  } catch (error: any) {
    // Return more specific error messages
    const errorMessage = error?.message || 'Failed to create payment charge';
    const status = error?.message?.includes('401') ? 401 : 500;

    return NextResponse.json(
      {
        error: 'Failed to create payment charge',
        message: errorMessage
      },
      { status }
    );
  }
}
