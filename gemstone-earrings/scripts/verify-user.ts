// Script to manually verify a user's email
// Run with: npx tsx scripts/verify-user.ts <email>

// Load environment variables
import { loadEnvConfig } from '@next/env';
loadEnvConfig(process.cwd());

import { db } from '../lib/db';
import { users } from '../drizzle/schema';
import { eq } from 'drizzle-orm';

const userEmail = process.argv[2];

async function verifyUser() {
  try {
    if (!userEmail) {
      console.error('❌ Error: Please provide an email address');
      console.log('Usage: npx tsx scripts/verify-user.ts <email>');
      process.exit(1);
    }

    // Check if user exists
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, userEmail))
      .limit(1);

    if (!existingUser) {
      console.error(`❌ User with email ${userEmail} not found`);
      process.exit(1);
    }

    if (existingUser.emailVerified) {
      console.log(`✅ User ${userEmail} is already verified`);
      console.log(`   Verified on: ${existingUser.emailVerified}`);
      process.exit(0);
    }

    // Mark user as verified
    const [updated] = await db
      .update(users)
      .set({ 
        emailVerified: new Date(),
      })
      .where(eq(users.email, userEmail))
      .returning();
    
    console.log(`✅ User email verified successfully!`);
    console.log(`   Email: ${updated.email}`);
    console.log(`   Name: ${updated.name}`);
    console.log(`   Verified: ${updated.emailVerified}`);
    console.log(`\n👉 User can now log in at: ${process.env.NEXTAUTH_URL}/login`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

verifyUser();
