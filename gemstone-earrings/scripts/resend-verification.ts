// Script to resend verification email to a user
// Run with: npx tsx scripts/resend-verification.ts <email>

// Load environment variables
import { loadEnvConfig } from '@next/env';
loadEnvConfig(process.cwd());

import { db } from '../lib/db';
import { users } from '../drizzle/schema';
import { eq } from 'drizzle-orm';
import { generateVerificationToken, sendVerificationEmail } from '../lib/email';

const userEmail = process.argv[2];

async function resendVerification() {
  try {
    if (!userEmail) {
      console.error('❌ Error: Please provide an email address');
      console.log('Usage: npx tsx scripts/resend-verification.ts <email>');
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
      console.log(`   No need to resend verification email.`);
      process.exit(0);
    }

    console.log(`📧 Generating new verification token for ${userEmail}...`);
    const token = await generateVerificationToken(userEmail);
    
    console.log(`📧 Sending verification email...`);
    const result = await sendVerificationEmail(userEmail, token);

    if (result.success) {
      console.log(`✅ Verification email sent successfully!`);
      console.log(`   Email: ${userEmail}`);
      console.log(`   Name: ${existingUser.name}`);
      console.log(`\n👉 Ask the user to check their email (including spam folder)`);
    } else {
      console.error(`❌ Failed to send verification email`);
      console.error(`   Error:`, result.error);
      console.log(`\n💡 Try manually verifying instead: npx tsx scripts/verify-user.ts ${userEmail}`);
    }

    process.exit(result.success ? 0 : 1);
  } catch (error) {
    console.error('❌ Error:', error);
    console.log(`\n💡 Try manually verifying instead: npx tsx scripts/resend-verification.ts ${userEmail}`);
    process.exit(1);
  }
}

resendVerification();
