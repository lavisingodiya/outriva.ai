/**
 * Creates a charge using Coinbase Commerce REST API
 * Documentation: https://docs.cdp.coinbase.com/commerce/reference/createcharge
 */
export async function createPlusCharge(
  email: string,
  redirectUrl: string
): Promise<string> {
  const apiKey = process.env.COINBASE_KEY;

  if (!apiKey) {
    throw new Error('COINBASE_KEY environment variable is not set');
  }

  console.log('Creating charge for email:', email);
  console.log('Using API Key:', apiKey ? '***' : 'MISSING');

  const chargeData = {
    name: 'AI Job Master Plus - Monthly Subscription',
    description: 'Plus plan subscription at $5/month',
    local_price: {
      amount: '5.00',
      currency: 'USD',
    },
    pricing_type: 'fixed_price',
    metadata: {
      email,
      plan: 'PLUS',
      created_at: new Date().toISOString(),
    },
    redirect_url: redirectUrl,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/auth/payment-failed`,
  };

  try {
    const response = await fetch('https://api.commerce.coinbase.com/charges/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CC-Api-Key': apiKey,
      },
      body: JSON.stringify(chargeData),
    });

    console.log('Coinbase API response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Coinbase API error response:', errorData);
      throw new Error(`Coinbase API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    console.log('Charge created successfully:', data.data?.id);

    if (!data.data?.hosted_url) {
      console.error('No hosted_url in response:', data);
      throw new Error('No hosted_url in Coinbase response');
    }

    return data.data.hosted_url;
  } catch (error) {
    console.error('Error creating Coinbase charge:', error);
    throw error;
  }
}

/**
 * Verify Coinbase Commerce webhook signature
 * Documentation: https://docs.cdp.coinbase.com/commerce/docs/webhooks
 */
export function verifyCoinbaseWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  try {
    // Coinbase Commerce uses HMAC-SHA256 for webhook signatures
    const crypto = require('crypto');
    const hash = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    const isValid = hash === signature;
    console.log('Webhook signature verification:', isValid ? 'valid' : 'invalid');
    return isValid;
  } catch (error) {
    console.error('Error verifying webhook signature:', error);
    return false;
  }
}

/**
 * Retrieve charge details using Coinbase Commerce REST API
 */
export async function getChargeById(chargeId: string): Promise<any> {
  const apiKey = process.env.COINBASE_KEY;

  if (!apiKey) {
    throw new Error('COINBASE_KEY environment variable is not set');
  }

  try {
    const response = await fetch(`https://api.commerce.coinbase.com/charges/${chargeId}`, {
      method: 'GET',
      headers: {
        'X-CC-Api-Key': apiKey,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Failed to retrieve charge: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error retrieving charge:', error);
    throw error;
  }
}

/**
 * Check if a charge is confirmed
 */
export function isChargeConfirmed(charge: any): boolean {
  // Charge is confirmed when timeline has a 'confirmed' status event
  return charge.timeline?.some((event: any) => event.status === 'confirmed');
}
