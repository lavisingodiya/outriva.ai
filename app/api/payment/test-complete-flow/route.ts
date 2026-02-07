import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { createPlusCharge } from '@/lib/coinbase-commerce';

/**
 * Complete payment flow test endpoint
 * Creates user → Creates charge → Confirms payment
 * Only available when PAYMENT_TESTING=true
 *
 * NOTE: This endpoint skips Supabase user creation and email verification.
 * In the real PLUS signup flow:
 * 1. User signs up with email/password → Supabase sends verification email
 * 2. User goes through payment
 * 3. Webhook upgrades user to PLUS
 * 4. User verifies email from inbox
 *
 * Usage: POST /api/payment/test-complete-flow
 * Body: { email: "test@example.com" }
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

    console.log(`[TEST FLOW] Starting complete payment flow for ${email}`);

    // Step 1: Create or get user
    let user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        userType: true,
      },
    });

    if (!user) {
      console.log(`[TEST FLOW] Creating new user: ${email}`);
      user = await prisma.user.create({
        data: {
          email,
          userType: 'FREE',
        },
      });
      console.log(`[TEST FLOW] User created: ${user.id}`);
    } else {
      console.log(`[TEST FLOW] User already exists: ${user.id}`);
    }

    // Step 2: Create charge
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://ai-job-master.vercel.app';
    const redirectUrl = `${appUrl}/auth/payment-success?email=${encodeURIComponent(email)}`;

    console.log(`[TEST FLOW] Creating Coinbase charge for ${email}`);
    const hostedUrl = await createPlusCharge(email, redirectUrl);
    console.log(`[TEST FLOW] Charge created: ${hostedUrl}`);

    // Step 3: Confirm payment (upgrade to PLUS)
    const chargeId = hostedUrl.split('/').pop() || `test-charge-${Date.now()}`;

    console.log(`[TEST FLOW] Upgrading user to PLUS tier with charge ${chargeId}`);
    const updatedUser = await prisma.user.update({
      where: { email },
      data: {
        userType: 'PLUS',
      },
      select: {
        id: true,
        email: true,
        userType: true,
        createdAt: true,
      },
    });

    console.log(`[TEST FLOW] User upgraded to PLUS: ${updatedUser.userType}`);

    // Step 4: Verify upgrade
    const verifyUser = await prisma.user.findUnique({
      where: { email },
      select: {
        userType: true,
        email: true,
      },
    });

    if (verifyUser?.userType !== 'PLUS') {
      throw new Error('Failed to verify user upgrade to PLUS');
    }

    console.log(`[TEST FLOW] Complete flow successful for ${email}`);

    return NextResponse.json({
      success: true,
      message: 'Complete payment flow test successful',
      steps: {
        userCreated: user.id,
        chargeId,
        hostedUrl,
        userUpgraded: true,
        userVerified: verifyUser.userType === 'PLUS',
      },
      user: updatedUser,
      nextSteps: {
        1: `Visit success page: ${appUrl}/auth/payment-success?email=${encodeURIComponent(email)}`,
        2: 'Page should detect PLUS status and redirect to email verification',
      },
    });
  } catch (error: any) {
    console.error('[TEST FLOW] Error:', error?.message || error);
    console.error('[TEST FLOW] Full error:', error);
    return NextResponse.json(
      {
        error: 'Failed to complete test flow',
        message: error?.message || 'Unknown error',
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
    message: 'Complete Payment Flow Test Endpoint',
    description: 'Creates user, charge, confirms payment, and verifies upgrade in one call',
    endpoint: '/api/payment/test-complete-flow',
    method: 'POST',
    body: {
      email: 'user@example.com',
    },
    example: {
      method: 'POST',
      url: 'https://ai-job-master.vercel.app/api/payment/test-complete-flow',
      body: { email: 'testuser@example.com' },
    },
    expectedResponse: {
      success: true,
      message: 'Complete payment flow test successful',
      steps: {
        userCreated: 'uuid',
        chargeId: 'charge-id',
        hostedUrl: 'https://commerce.coinbase.com/pay/...',
        userUpgraded: true,
        userVerified: true,
      },
      user: {
        id: 'uuid',
        email: 'testuser@example.com',
        userType: 'PLUS',
        createdAt: 'ISO-8601 timestamp',
      },
      nextSteps: {
        1: 'Visit the payment success page with the email',
        2: 'Page should immediately show success and redirect to verification',
      },
    },
  });
}
