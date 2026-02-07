import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { verifyCoinbaseWebhookSignature } from '@/lib/coinbase-commerce';

export async function POST(request: NextRequest) {
  try {
    const payload = await request.text();
    const signature = request.headers.get('x-cc-webhook-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing webhook signature' },
        { status: 401 }
      );
    }

    // Verify webhook signature
    const isValid = verifyCoinbaseWebhookSignature(
      payload,
      signature,
      process.env.COINBASE_WEBHOOK_SECRET || ''
    );

    if (!isValid) {
      console.warn('Invalid webhook signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    const payload_obj = JSON.parse(payload);
    console.log('Full webhook payload:', JSON.stringify(payload_obj, null, 2));

    const event = payload_obj.event;
    const { type, data } = event;

    console.log('Webhook event received:', type);
    console.log('Event data:', JSON.stringify(data, null, 2));

    // Handle charge confirmed event
    if (type === 'charge:confirmed') {
      const { email, plan } = data.metadata || {};

      console.log('Charge confirmed for email:', email, 'plan:', plan);

      if (email && plan === 'PLUS') {
        try {
          // Update user to PLUS tier
          const updatedUser = await prisma.user.update({
            where: { email },
            data: {
              userType: 'PLUS',
            },
          });

          console.log(`User ${email} upgraded to PLUS, charge ID: ${data.id}`);
        } catch (error: any) {
          console.error(`Failed to update user ${email}:`, error?.message);
          // Don't throw - webhook should still return success so Coinbase doesn't retry
        }
      } else {
        console.log('Skipping charge:confirmed - missing email or plan metadata');
      }
    }

    // Handle charge failed event
    if (type === 'charge:failed') {
      const { email } = data.metadata || {};
      console.log(`Payment failed for ${email}`, email ? '- logging for future reference' : '- no email in metadata');
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
