import { NextRequest, NextResponse } from 'next/server';
import { z, ZodSchema } from 'zod';
import { ApiErrors } from './errors';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/db/prisma';
import type { User } from '@supabase/supabase-js';

/**
 * Validated request context passed to handlers
 */
export interface ValidatedContext<T = unknown> {
  user: User;
  userId: string;
  body: T;
  dbUser?: {
    id: string;
    userType: 'FREE' | 'PLUS' | 'ADMIN';
    openaiApiKey: string | null;
    anthropicApiKey: string | null;
    geminiApiKey: string | null;
  };
}

interface ValidationOptions {
  requireAuth?: boolean;
  requireAdmin?: boolean;
  fetchDbUser?: boolean;
  fetchApiKeys?: boolean;
}

/**
 * Validate request body against a Zod schema
 */
export async function validateBody<T>(
  req: NextRequest,
  schema: ZodSchema<T>
): Promise<{ success: true; data: T } | { success: false; response: NextResponse }> {
  try {
    const rawBody = await req.json();
    const result = schema.safeParse(rawBody);

    if (!result.success) {
      const errors: Record<string, string[]> = {};
      result.error.errors.forEach((e) => {
        const path = e.path.join('.') || 'body';
        if (!errors[path]) errors[path] = [];
        errors[path].push(e.message);
      });
      return { success: false, response: ApiErrors.validationError(errors) };
    }

    return { success: true, data: result.data };
  } catch {
    return {
      success: false,
      response: ApiErrors.badRequest('Invalid JSON body'),
    };
  }
}

/**
 * Authenticate request and optionally fetch user data
 */
export async function authenticateRequest(
  options: ValidationOptions = {}
): Promise<
  | { success: true; user: User; dbUser?: ValidatedContext['dbUser'] }
  | { success: false; response: NextResponse }
> {
  const { requireAuth = true, requireAdmin = false, fetchDbUser = false, fetchApiKeys = false } = options;

  if (!requireAuth) {
    return { success: true, user: null as unknown as User };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, response: ApiErrors.unauthorized() };
  }

  let dbUser: ValidatedContext['dbUser'] | undefined;

  if (fetchDbUser || fetchApiKeys || requireAdmin) {
    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        userType: true,
        ...(fetchApiKeys && {
          openaiApiKey: true,
          anthropicApiKey: true,
          geminiApiKey: true,
        }),
      },
    });

    if (!userData) {
      return { success: false, response: ApiErrors.notFound('User') };
    }

    dbUser = {
      id: userData.id,
      userType: userData.userType,
      openaiApiKey: (userData as any).openaiApiKey ?? null,
      anthropicApiKey: (userData as any).anthropicApiKey ?? null,
      geminiApiKey: (userData as any).geminiApiKey ?? null,
    };

    if (requireAdmin && userData.userType !== 'ADMIN') {
      return { success: false, response: ApiErrors.forbidden() };
    }
  }

  return { success: true, user, dbUser };
}

/**
 * Combined authentication and body validation
 */
export async function validateRequest<T>(
  req: NextRequest,
  schema: ZodSchema<T>,
  options: ValidationOptions = {}
): Promise<
  | { success: true; context: ValidatedContext<T> }
  | { success: false; response: NextResponse }
> {
  // Authenticate first
  const authResult = await authenticateRequest(options);
  if (!authResult.success) {
    return authResult;
  }

  // Then validate body
  const bodyResult = await validateBody(req, schema);
  if (!bodyResult.success) {
    return bodyResult;
  }

  return {
    success: true,
    context: {
      user: authResult.user,
      userId: authResult.user.id,
      body: bodyResult.data,
      dbUser: authResult.dbUser,
    },
  };
}

/**
 * Validate query parameters against a Zod schema
 */
export function validateQuery<T>(
  req: NextRequest,
  schema: ZodSchema<T>
): { success: true; data: T } | { success: false; response: NextResponse } {
  const searchParams = req.nextUrl.searchParams;
  const params: Record<string, string> = {};

  searchParams.forEach((value, key) => {
    params[key] = value;
  });

  const result = schema.safeParse(params);

  if (!result.success) {
    const errors: Record<string, string[]> = {};
    result.error.errors.forEach((e) => {
      const path = e.path.join('.') || 'query';
      if (!errors[path]) errors[path] = [];
      errors[path].push(e.message);
    });
    return { success: false, response: ApiErrors.validationError(errors) };
  }

  return { success: true, data: result.data };
}
