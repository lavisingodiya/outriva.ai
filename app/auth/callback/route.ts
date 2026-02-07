import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next');

  if (code) {
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    await supabase.auth.exchangeCodeForSession(code);
  }

  // If coming from email verification (no 'next' param), show activation page
  // Otherwise redirect to the next URL or dashboard
  const redirectUrl = next || (!requestUrl.searchParams.has('next') ? '/auth/activated' : '/dashboard');
  return NextResponse.redirect(new URL(redirectUrl, request.url));
}
