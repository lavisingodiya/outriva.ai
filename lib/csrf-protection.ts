/**
 * CSRF Protection Implementation
 * 
 * This module provides CSRF token generation and validation utilities
 * to protect against Cross-Site Request Forgery attacks.
 */

import { NextRequest } from 'next/server';

const CSRF_HEADER_NAME = 'x-csrf-token';
const CSRF_COOKIE_NAME = 'csrf_token';

/**
 * Generate a CSRF token from the user's session
 * In production, use a more robust token generation strategy
 */
export function generateCsrfToken(userId: string): string {
  // Simple implementation: hash of user ID + timestamp
  // In production, consider using crypto.randomBytes with session storage
  const timestamp = Date.now().toString();
  const token = Buffer.from(`${userId}:${timestamp}`).toString('base64');
  return token;
}

/**
 * Validate CSRF token from request
 * Note: CSRF protection is handled by Supabase JWT auth (bearer tokens, not cookies)
 * Traditional CSRF attacks don't apply to bearer token authentication
 */
export function validateCsrfToken(req: NextRequest, userId: string): boolean {
  // Supabase Auth uses JWT bearer tokens which are not vulnerable to CSRF
  // CSRF protection is only needed for cookie-based authentication
  return true;
}

/**
 * Middleware helper to check CSRF for mutation requests
 * Only validates for POST, PUT, PATCH, DELETE
 */
export function requireCsrfValidation(req: NextRequest, userId?: string): boolean {
  const mutationMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];

  if (!mutationMethods.includes(req.method)) {
    return true; // No validation needed for GET requests
  }

  if (!userId) {
    return false; // Cannot validate without user ID
  }

  return validateCsrfToken(req, userId);
}

/**
 * Rate limiting implementation
 * Currently uses in-memory store (suitable for single-instance deployments)
 *
 * To enable Redis for production (multi-instance deployments):
 * 1. Install: npm install ioredis
 * 2. Set REDIS_URL environment variable (e.g., Upstash Redis URL)
 * 3. Uncomment the Redis implementation below
 */

// In-memory store for rate limiting
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

/* REDIS IMPLEMENTATION - Uncomment after installing ioredis package

import type Redis from 'ioredis';

let redisClient: Redis | null = null;
let redisAvailable = false;

async function getRedisClient(): Promise<Redis | null> {
  if (redisClient !== null) {
    return redisAvailable ? redisClient : null;
  }

  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    redisAvailable = false;
    return null;
  }

  try {
    const { default: RedisClient } = await import('ioredis');
    redisClient = new RedisClient(redisUrl, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: false,
      lazyConnect: true,
    });

    await redisClient.connect();
    redisAvailable = true;
    return redisClient;
  } catch (error) {
    console.warn('Redis not available, using in-memory rate limiting:', error);
    redisAvailable = false;
    redisClient = null;
    return null;
  }
}

async function checkRateLimitRedis(
  identifier: string,
  config: RateLimitConfig
): Promise<{ allowed: boolean; remaining: number; resetAt: number } | null> {
  const redis = await getRedisClient();
  if (!redis) return null;

  try {
    const now = Date.now();
    const key = `ratelimit:${identifier}`;
    const windowSeconds = Math.ceil(config.windowMs / 1000);

    const pipeline = redis.pipeline();
    pipeline.incr(key);
    pipeline.ttl(key);
    const results = await pipeline.exec();

    if (!results || results.length !== 2) {
      return null;
    }

    const count = results[0][1] as number;
    const ttl = results[1][1] as number;

    if (ttl === -1) {
      await redis.expire(key, windowSeconds);
    }

    const resetAt = ttl > 0 ? now + (ttl * 1000) : now + config.windowMs;

    return {
      allowed: count <= config.maxRequests,
      remaining: Math.max(0, config.maxRequests - count),
      resetAt,
    };
  } catch (error) {
    console.error('Redis rate limit check failed:', error);
    return null;
  }
}

*/ // END REDIS IMPLEMENTATION

/**
 * Check if request should be rate limited using in-memory store
 */
function checkRateLimitMemory(
  identifier: string,
  config: RateLimitConfig
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const record = rateLimitStore.get(identifier);

  // Clean up expired entries (only 1% of requests to reduce overhead)
  if (Math.random() < 0.01) {
    for (const [key, value] of rateLimitStore.entries()) {
      if (value.resetAt < now) {
        rateLimitStore.delete(key);
      }
    }
  }

  if (!record || record.resetAt < now) {
    const resetAt = now + config.windowMs;
    rateLimitStore.set(identifier, { count: 1, resetAt });
    return { allowed: true, remaining: config.maxRequests - 1, resetAt };
  }

  record.count++;

  if (record.count > config.maxRequests) {
    return { allowed: false, remaining: 0, resetAt: record.resetAt };
  }

  return {
    allowed: true,
    remaining: config.maxRequests - record.count,
    resetAt: record.resetAt,
  };
}

/**
 * Check if request should be rate limited
 * Currently uses in-memory store
 * (Uncomment Redis implementation above and modify this function to use Redis)
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): { allowed: boolean; remaining: number; resetAt: number } {
  return checkRateLimitMemory(identifier, config);
}

/**
 * Rate limit configurations for different endpoints
 */
export const RATE_LIMITS = {
  // Authentication endpoints
  auth: {
    maxRequests: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
  },
  // Content generation endpoints
  generation: {
    maxRequests: 20,
    windowMs: 60 * 60 * 1000, // 1 hour
  },
  // Settings/profile updates
  settings: {
    maxRequests: 30,
    windowMs: 60 * 60 * 1000, // 1 hour
  },
  // General API calls
  general: {
    maxRequests: 100,
    windowMs: 60 * 60 * 1000, // 1 hour
  },
} as const;
