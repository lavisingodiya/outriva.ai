import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { ZodError } from 'zod';

/**
 * Standard API error codes
 */
export const ErrorCode = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  BAD_REQUEST: 'BAD_REQUEST',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  RATE_LIMITED: 'RATE_LIMITED',
  LIMIT_EXCEEDED: 'LIMIT_EXCEEDED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  API_KEY_MISSING: 'API_KEY_MISSING',
  MODEL_UNAVAILABLE: 'MODEL_UNAVAILABLE',
} as const;

export type ErrorCodeType = (typeof ErrorCode)[keyof typeof ErrorCode];

interface ApiErrorOptions {
  code?: ErrorCodeType;
  details?: Record<string, unknown>;
  headers?: Record<string, string>;
}

/**
 * Create a standardized error response
 */
export function apiError(
  message: string,
  status: number,
  options: ApiErrorOptions = {}
): NextResponse {
  const { code, details, headers } = options;

  const body: Record<string, unknown> = {
    error: message,
    ...(code && { code }),
    ...(details && { ...details }),
  };

  return NextResponse.json(body, {
    status,
    headers: headers ? new Headers(headers) : undefined,
  });
}

/**
 * Common error responses
 */
export const ApiErrors = {
  unauthorized: (message = 'Unauthorized') =>
    apiError(message, 401, { code: ErrorCode.UNAUTHORIZED }),

  forbidden: (message = 'Forbidden') =>
    apiError(message, 403, { code: ErrorCode.FORBIDDEN }),

  notFound: (resource = 'Resource') =>
    apiError(`${resource} not found`, 404, { code: ErrorCode.NOT_FOUND }),

  badRequest: (message: string, details?: Record<string, unknown>) =>
    apiError(message, 400, { code: ErrorCode.BAD_REQUEST, details }),

  validationError: (errors: Record<string, string[]>) =>
    apiError('Validation failed', 400, {
      code: ErrorCode.VALIDATION_ERROR,
      details: { errors },
    }),

  rateLimited: (resetAt?: number) =>
    apiError('Rate limit exceeded. Please try again later.', 429, {
      code: ErrorCode.RATE_LIMITED,
      details: resetAt ? { resetAt } : undefined,
      headers: resetAt
        ? {
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': resetAt.toString(),
          }
        : undefined,
    }),

  limitExceeded: (
    message: string,
    details?: { currentCount?: number; limit?: number; daysUntilReset?: number }
  ) =>
    apiError(message, 429, {
      code: ErrorCode.LIMIT_EXCEEDED,
      details: { limitReached: true, ...details },
    }),

  apiKeyMissing: (provider: string) =>
    apiError(`${provider} API key not configured`, 400, {
      code: ErrorCode.API_KEY_MISSING,
    }),

  modelUnavailable: (message = 'Selected model is not available') =>
    apiError(message, 400, { code: ErrorCode.MODEL_UNAVAILABLE }),

  internal: (error?: unknown, context?: string) => {
    if (error) {
      logger.error(context || 'Internal API error', error);
    }
    return apiError('Internal server error', 500, {
      code: ErrorCode.INTERNAL_ERROR,
    });
  },
};

/**
 * Handle errors in API routes with consistent formatting
 */
export function handleApiError(error: unknown, context?: string): NextResponse {
  // Zod validation errors
  if (error instanceof ZodError) {
    const errors: Record<string, string[]> = {};
    error.errors.forEach((e) => {
      const path = e.path.join('.');
      if (!errors[path]) errors[path] = [];
      errors[path].push(e.message);
    });
    return ApiErrors.validationError(errors);
  }

  // Known error with message
  if (error instanceof Error) {
    logger.error(context || 'API error', error);

    // Don't expose internal error details in production
    if (process.env.NODE_ENV === 'production') {
      return ApiErrors.internal();
    }
    return apiError(error.message, 500, { code: ErrorCode.INTERNAL_ERROR });
  }

  // Unknown error
  return ApiErrors.internal(error, context);
}

/**
 * Wrapper for API route handlers with automatic error handling
 */
export function withErrorHandler<T extends (...args: any[]) => Promise<NextResponse>>(
  handler: T,
  context?: string
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await handler(...args);
    } catch (error) {
      return handleApiError(error, context);
    }
  }) as T;
}
