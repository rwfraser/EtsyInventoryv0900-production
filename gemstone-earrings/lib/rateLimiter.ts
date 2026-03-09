import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Lazy-loaded Redis client to prevent build failures without env vars
// Required: UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN
let redis: Redis | null = null;

function getRedisClient(): Redis {
  if (!redis) {
    // Check if environment variables are set
    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
      throw new Error(
        'Upstash Redis not configured. Please set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN environment variables.'
      );
    }
    redis = Redis.fromEnv();
  }
  return redis;
}

// Rate limit configurations
export const RATE_LIMITS = {
  anonymous: {
    requests: 20,
    window: '1 h',
  },
  authenticated: {
    requests: 100,
    window: '1 h',
  },
  admin: {
    requests: 1000, // Effectively unlimited but tracked
    window: '1 h',
  },
} as const;

// Lazy-create rate limiters
let anonymousRateLimiter: Ratelimit | null = null;
let authenticatedRateLimiter: Ratelimit | null = null;
let adminRateLimiter: Ratelimit | null = null;

function getAnonymousRateLimiter(): Ratelimit {
  if (!anonymousRateLimiter) {
    anonymousRateLimiter = new Ratelimit({
      redis: getRedisClient(),
      limiter: Ratelimit.slidingWindow(
        RATE_LIMITS.anonymous.requests,
        RATE_LIMITS.anonymous.window
      ),
      analytics: true,
      prefix: 'ratelimit:anonymous',
    });
  }
  return anonymousRateLimiter;
}

function getAuthenticatedRateLimiter(): Ratelimit {
  if (!authenticatedRateLimiter) {
    authenticatedRateLimiter = new Ratelimit({
      redis: getRedisClient(),
      limiter: Ratelimit.slidingWindow(
        RATE_LIMITS.authenticated.requests,
        RATE_LIMITS.authenticated.window
      ),
      analytics: true,
      prefix: 'ratelimit:authenticated',
    });
  }
  return authenticatedRateLimiter;
}

function getAdminRateLimiter(): Ratelimit {
  if (!adminRateLimiter) {
    adminRateLimiter = new Ratelimit({
      redis: getRedisClient(),
      limiter: Ratelimit.slidingWindow(
        RATE_LIMITS.admin.requests,
        RATE_LIMITS.admin.window
      ),
      analytics: true,
      prefix: 'ratelimit:admin',
    });
  }
  return adminRateLimiter;
}

/**
 * Get the appropriate rate limiter based on user role
 */
export function getRateLimiter(role: 'anonymous' | 'user' | 'admin') {
  switch (role) {
    case 'admin':
      return getAdminRateLimiter();
    case 'user':
      return getAuthenticatedRateLimiter();
    case 'anonymous':
    default:
      return getAnonymousRateLimiter();
  }
}

/**
 * Check rate limit for a user
 * @param identifier - Unique identifier (email, IP, etc.)
 * @param role - User role
 * @returns Rate limit result with success status and metadata
 */
export async function checkRateLimit(
  identifier: string,
  role: 'anonymous' | 'user' | 'admin' = 'anonymous'
) {
  const rateLimiter = getRateLimiter(role);
  const result = await rateLimiter.limit(identifier);

  return {
    success: result.success,
    limit: result.limit,
    remaining: result.remaining,
    reset: result.reset,
    role,
  };
}

/**
 * Format rate limit error response
 */
export function formatRateLimitError(rateLimitResult: {
  remaining: number;
  reset: number;
  limit: number;
  role: string;
}) {
  const resetDate = new Date(rateLimitResult.reset);
  const minutesUntilReset = Math.ceil(
    (resetDate.getTime() - Date.now()) / 1000 / 60
  );

  return {
    error: 'Rate limit exceeded',
    message: `You have exceeded your rate limit. Please try again in ${minutesUntilReset} minute(s).`,
    limit: rateLimitResult.limit,
    remaining: rateLimitResult.remaining,
    resetAt: resetDate.toISOString(),
    resetIn: `${minutesUntilReset} minute(s)`,
  };
}

/**
 * Get rate limit headers for response
 */
export function getRateLimitHeaders(rateLimitResult: {
  limit: number;
  remaining: number;
  reset: number;
}) {
  return {
    'X-RateLimit-Limit': rateLimitResult.limit.toString(),
    'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
    'X-RateLimit-Reset': new Date(rateLimitResult.reset).toISOString(),
  };
}
