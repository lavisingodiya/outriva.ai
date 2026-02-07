/**
 * CSRF Protection Utility
 *
 * This implements CSRF token validation for API routes.
 * Tokens are stored in HTTP-only cookies and validated on mutation requests.
 */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

const CSRF_COOKIE_NAME = 'csrf_token';
const CSRF_HEADER_NAME = 'x-csrf-token';
const CSRF_TOKEN_LENGTH = 32;

/**
 * Generates a random CSRF token
 */
export function generateCsrfToken(): string {
  return crypto.randomBytes(CSRF_TOKEN_LENGTH).toString('hex');
}

/**
 * Sets CSRF token in response cookie
 */
export function setCsrfTokenCookie(response: NextResponse, token: string): void {
  response.cookies.set(CSRF_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24, // 24 hours
    path: '/',
  });
}

/**
 * Validates CSRF token from request
 * Returns true if valid, false otherwise
 */
export function validateCsrfToken(req: NextRequest): boolean {
  const tokenFromCookie = req.cookies.get(CSRF_COOKIE_NAME)?.value;
  const tokenFromHeader = req.headers.get(CSRF_HEADER_NAME);

  if (!tokenFromCookie || !tokenFromHeader) {
    return false;
  }

  // Constant-time comparison to prevent timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(tokenFromCookie),
    Buffer.from(tokenFromHeader)
  );
}

/**
 * Middleware helper to validate CSRF for mutation requests
 * Only validates for POST, PUT, PATCH, DELETE
 */
export function requireCsrfToken(req: NextRequest): NextResponse | null {
  const mutationMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];

  if (!mutationMethods.includes(req.method)) {
    return null; // No validation needed for GET requests
  }

  try {
    if (!validateCsrfToken(req)) {
      return NextResponse.json(
        { error: 'Invalid CSRF token' },
        { status: 403 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'CSRF validation error' },
      { status: 403 }
    );
  }

  return null; // Validation passed
}

/**
 * Gets or creates CSRF token for the request
 * Use this in GET requests to provide token to client
 */
export function getCsrfToken(req: NextRequest): string {
  let token = req.cookies.get(CSRF_COOKIE_NAME)?.value;

  if (!token) {
    token = generateCsrfToken();
  }

  return token;
}
