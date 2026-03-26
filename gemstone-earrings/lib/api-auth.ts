import { NextRequest } from 'next/server';
import { createHash } from 'crypto';
import { db } from '@/lib/db';
import { apiKeys } from '@/drizzle/schema';
import { eq, and, or, isNull, gt } from 'drizzle-orm';

export interface ApiKeyValidationResult {
  valid: boolean;
  error?: string;
  keyId?: string;
  keyName?: string;
}

/**
 * Hash an API key using SHA-256
 */
export function hashApiKey(key: string): string {
  return createHash('sha256').update(key).digest('hex');
}

/**
 * Generate a new API key with prefix
 * Format: mea_<random32chars>
 */
export function generateApiKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = 'mea_';
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Extract API key from request headers
 * Supports: Authorization: Bearer <key> or X-API-Key: <key>
 */
export function extractApiKey(request: NextRequest): string | null {
  // Check Authorization header (Bearer token)
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }

  // Check X-API-Key header
  const apiKeyHeader = request.headers.get('x-api-key');
  if (apiKeyHeader) {
    return apiKeyHeader;
  }

  return null;
}

/**
 * Validate an API key against the database
 */
export async function validateApiKey(request: NextRequest): Promise<ApiKeyValidationResult> {
  const key = extractApiKey(request);

  if (!key) {
    return {
      valid: false,
      error: 'API key required. Provide via Authorization: Bearer <key> or X-API-Key header.',
    };
  }

  // Validate key format
  if (!key.startsWith('mea_') || key.length !== 36) {
    return {
      valid: false,
      error: 'Invalid API key format.',
    };
  }

  const keyHash = hashApiKey(key);
  const keyPrefix = key.slice(0, 8);

  try {
    // Find the API key in database
    const now = new Date();
    const [apiKey] = await db
      .select()
      .from(apiKeys)
      .where(
        and(
          eq(apiKeys.keyHash, keyHash),
          eq(apiKeys.keyPrefix, keyPrefix),
          eq(apiKeys.isActive, 1),
          or(isNull(apiKeys.expiresAt), gt(apiKeys.expiresAt, now))
        )
      )
      .limit(1);

    if (!apiKey) {
      return {
        valid: false,
        error: 'Invalid or expired API key.',
      };
    }

    // Update last used timestamp (fire-and-forget)
    db.update(apiKeys)
      .set({ lastUsedAt: now })
      .where(eq(apiKeys.id, apiKey.id))
      .catch(console.error);

    return {
      valid: true,
      keyId: apiKey.id,
      keyName: apiKey.name,
    };
  } catch (error) {
    console.error('API key validation error:', error);
    return {
      valid: false,
      error: 'Authentication service unavailable.',
    };
  }
}

/**
 * Create a JSON response for authentication errors
 */
export function unauthorizedResponse(message: string) {
  return new Response(
    JSON.stringify({ error: message }),
    {
      status: 401,
      headers: {
        'Content-Type': 'application/json',
        'WWW-Authenticate': 'Bearer realm="MyEarringAdvisor API"',
      },
    }
  );
}
