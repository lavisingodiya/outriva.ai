import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

/**
 * Test endpoint to simulate a complete Coinbase payment flow
 * Only available when PAYMENT_TESTING=true environment variable is set
 *
 * Usage: POST /api/payment/test-payment
 * Body: { email: "test@example.com", action: "confirm" | "fail" }
 */
export async function POST(request: NextRequest) {
  // Only allow when payment testing is enabled
  if (process.env.PAYMENT_TESTING !== 'true') {
    return NextResponse.json(
      { error: 'Test endpoint disabled. Set PAYMENT_TESTING=true to enable.' },
      { status: 403 }
    );
  }

  try {
    const { email, action = 'confirm' } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        userType: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: `User with email ${email} not found` },
        { status: 404 }
      );
    }

    if (action === 'confirm') {
      // Simulate charge:confirmed webhook
      const chargeId = `test-charge-${Date.now()}`;

      // Update user to PLUS tier (same as webhook does)
      const updatedUser = await prisma.user.update({
        where: { email },
        data: {
          userType: 'PLUS',
        },
      });

      console.log(`[TEST] User ${email} upgraded to PLUS, charge ID: ${chargeId}`);

      return NextResponse.json({
        success: true,
        message: `User ${email} upgraded to PLUS tier`,
        chargeId,
        userType: updatedUser.userType,
      });
    } else if (action === 'fail') {
      // Just log the failure (no database changes needed for failed payments)
      console.log(`[TEST] Payment failed for ${email}`);

      return NextResponse.json({
        success: true,
        message: `Payment marked as failed for ${email}`,
      });
    } else {
      return NextResponse.json(
        { error: 'Invalid action. Must be "confirm" or "fail"' },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Test payment error:', error?.message || error);
    console.error('Full error:', error);
    return NextResponse.json(
      {
        error: 'Failed to process test payment',
        message: error?.message || 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  // Only allow when payment testing is enabled
  if (process.env.PAYMENT_TESTING !== 'true') {
    return NextResponse.json(
      { error: 'Test endpoint disabled. Set PAYMENT_TESTING=true to enable.' },
      { status: 403 }
    );
  }

  return NextResponse.json({
    message: 'Test Payment Endpoint',
    description: 'Simulates a complete Coinbase payment flow for testing',
    endpoint: '/api/payment/test-payment',
    method: 'POST',
    body: {
      email: 'user@example.com',
      action: 'confirm | fail',
    },
    examples: {
      confirmPayment: {
        method: 'POST',
        url: 'http://localhost:3000/api/payment/test-payment',
        body: { email: 'test@example.com', action: 'confirm' },
      },
      failPayment: {
        method: 'POST',
        url: 'http://localhost:3000/api/payment/test-payment',
        body: { email: 'test@example.com', action: 'fail' },
      },
    },
  });
}
