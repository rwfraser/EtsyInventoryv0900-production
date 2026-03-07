import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Initialize Redis client from environment variables
// Required: UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN
const redis = Redis.fromEnv();

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

// Create rate limiter for anonymous users
export const anonymousRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(
    RATE_LIMITS.anonymous.requests,
    RATE_LIMITS.anonymous.window
  ),
  analytics: true,
  prefix: 'ratelimit:anonymous',
});

// Create rate limiter for authenticated users
export const authenticatedRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(
    RATE_LIMITS.authenticated.requests,
    RATE_LIMITS.authenticated.window
  ),
  analytics: true,
  prefix: 'ratelimit:authenticated',
});

// Create rate limiter for admin users (high limit)
export const adminRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(
    RATE_LIMITS.admin.requests,
    RATE_LIMITS.admin.window
  ),
  analytics: true,
  prefix: 'ratelimit:admin',
});

/**
 * Get the appropriate rate limiter based on user role
 */
export function getRateLimiter(role: 'anonymous' | 'user' | 'admin') {
  switch (role) {
    case 'admin':
      return adminRateLimiter;
    case 'user':
      return authenticatedRateLimiter;
    case 'anonymous':
    default:
      return anonymousRateLimiter;
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
