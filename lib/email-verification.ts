import { User } from '@supabase/supabase-js';

/**
 * Checks if a user's email is verified
 */
export function isEmailVerified(user: User): boolean {
  return !!user.email_confirmed_at;
}

/**
 * Returns a standardized error response for unverified emails
 */
export function getVerificationError() {
  return {
    error: 'Email verification required',
    message: 'Please verify your email address to use this feature. Check your inbox and spam folder for the verification link, or request a new verification email.',
    code: 'EMAIL_NOT_VERIFIED',
    action: 'VERIFY_EMAIL'
  };
}
