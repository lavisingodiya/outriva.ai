import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { checkRateLimit, RATE_LIMITS } from '@/lib/csrf-protection';

export const dynamic = 'force-dynamic';

interface PasswordChangeRequest {
  currentPassword: string;
  newPassword: string;
}

// Password validation regex patterns
const PASSWORD_REQUIREMENTS = {
  minLength: 8,
  hasUppercase: /[A-Z]/,
  hasLowercase: /[a-z]/,
  hasNumber: /[0-9]/,
  hasSpecialChar: /[^A-Za-z0-9]/,
};

function validatePassword(password: string): { valid: boolean; error?: string } {
  if (password.length < PASSWORD_REQUIREMENTS.minLength) {
    return { valid: false, error: `Password must be at least ${PASSWORD_REQUIREMENTS.minLength} characters` };
  }
  if (!PASSWORD_REQUIREMENTS.hasUppercase.test(password)) {
    return { valid: false, error: 'Password must contain at least one uppercase letter' };
  }
  if (!PASSWORD_REQUIREMENTS.hasLowercase.test(password)) {
    return { valid: false, error: 'Password must contain at least one lowercase letter' };
  }
  if (!PASSWORD_REQUIREMENTS.hasNumber.test(password)) {
    return { valid: false, error: 'Password must contain at least one number' };
  }
  if (!PASSWORD_REQUIREMENTS.hasSpecialChar.test(password)) {
    return { valid: false, error: 'Password must contain at least one special character' };
  }
  return { valid: true };
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limiting check - stricter for password changes
    const rateLimitResult = checkRateLimit(
      `password-change:${user.id}`,
      RATE_LIMITS.auth
    );

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          error: 'Too many password change attempts. Please try again later.',
          resetAt: rateLimitResult.resetAt,
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': RATE_LIMITS.auth.maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimitResult.resetAt.toString(),
          },
        }
      );
    }

    const body: PasswordChangeRequest = await req.json();
    const { currentPassword, newPassword } = body;

    // Validate input
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Current password and new password are required' },
        { status: 400 }
      );
    }

    // Validate new password meets requirements
    const validation = validatePassword(newPassword);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    // Supabase requires reauthentication for password changes for security
    // We need to verify the current password by attempting sign in
    // Note: This creates a temporary session that we immediately discard
    try {
      // Import createClient for server-side auth
      const { createClient: createSupabaseClient } = await import('@supabase/supabase-js');
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
      
      // Create a temporary client for verification
      const tempClient = createSupabaseClient(supabaseUrl, supabaseAnonKey);
      
      // Verify current password
      const { data: authData, error: signInError } = await tempClient.auth.signInWithPassword({
        email: user.email!,
        password: currentPassword,
      });

      if (signInError) {
        logger.error('Current password verification failed', signInError);
        return NextResponse.json(
          { error: 'Current password is incorrect' },
          { status: 400 }
        );
      }

      // Sign out the temporary session immediately
      if (authData.session) {
        await tempClient.auth.signOut();
      }
    } catch (verifyError) {
      logger.error('Password verification error', verifyError);
      return NextResponse.json(
        { error: 'Failed to verify current password' },
        { status: 500 }
      );
    }

    // Update password using the original session
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      logger.error('Password update failed', updateError);
      return NextResponse.json(
        { error: 'Failed to update password' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    logger.error('Change password error', error);
    return NextResponse.json(
      { error: 'Failed to change password' },
      { status: 500 }
    );
  }
}
