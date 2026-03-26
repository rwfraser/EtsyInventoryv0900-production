/**
 * Generate API Key Script
 * 
 * Usage:
 *   $env:POSTGRES_PRISMA_URL="<connection_string>"
 *   $env:API_KEY_NAME="Partner Name Integration"
 *   npx tsx scripts/generate-api-key.ts
 * 
 * Optional: Set EXPIRES_DAYS to set expiration (default: never expires)
 *   $env:EXPIRES_DAYS="365"
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { apiKeys } from '../drizzle/schema';
import { createHash, randomBytes } from 'crypto';

const connectionString = process.env.POSTGRES_PRISMA_URL;
const keyName = process.env.API_KEY_NAME;
const expiresDays = process.env.EXPIRES_DAYS ? parseInt(process.env.EXPIRES_DAYS) : null;

if (!connectionString) {
  console.error('Error: POSTGRES_PRISMA_URL environment variable is required');
  process.exit(1);
}

if (!keyName) {
  console.error('Error: API_KEY_NAME environment variable is required');
  process.exit(1);
}

function generateApiKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = 'mea_';
  const randomValues = randomBytes(32);
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(randomValues[i] % chars.length);
  }
  return result;
}

function hashApiKey(key: string): string {
  return createHash('sha256').update(key).digest('hex');
}

async function main() {
  console.log('Connecting to database...');
  
  const client = postgres(connectionString!, { ssl: 'require' });
  const db = drizzle(client);

  try {
    // Generate the API key
    const apiKey = generateApiKey();
    const keyHash = hashApiKey(apiKey);
    const keyPrefix = apiKey.slice(0, 8);

    // Calculate expiration date if specified
    let expiresAt: Date | null = null;
    if (expiresDays) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiresDays);
    }

    // Insert the API key record
    await db.insert(apiKeys).values({
      name: keyName!,
      keyHash,
      keyPrefix,
      isActive: 1,
      expiresAt,
    });

    console.log('\n========================================');
    console.log('API KEY GENERATED SUCCESSFULLY');
    console.log('========================================\n');
    console.log(`Name: ${keyName}`);
    console.log(`Prefix: ${keyPrefix}`);
    console.log(`Expires: ${expiresAt ? expiresAt.toISOString() : 'Never'}`);
    console.log('\n----------------------------------------');
    console.log('IMPORTANT: Save this API key securely.');
    console.log('It will NOT be shown again.\n');
    console.log(`API Key: ${apiKey}`);
    console.log('----------------------------------------\n');
    console.log('Usage:');
    console.log('  curl -H "Authorization: Bearer <api_key>" https://your-domain.com/api/products');
    console.log('  curl -H "X-API-Key: <api_key>" https://your-domain.com/api/products\n');

  } catch (error) {
    console.error('Error generating API key:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
