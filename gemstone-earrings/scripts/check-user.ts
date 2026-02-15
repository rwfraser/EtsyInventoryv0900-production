// Script to check user status in database
// Run with: npx tsx scripts/check-user.ts <email>

// Load environment variables
import { loadEnvConfig } from '@next/env';
loadEnvConfig(process.cwd());

import { db } from '../lib/db';
import { users } from '../drizzle/schema';
import { eq } from 'drizzle-orm';

const email = process.argv[2];

async function checkUser() {
  try {
    if (!email) {
      console.error('❌ Error: Please provide an email address');
      console.log('Usage: npx tsx scripts/check-user.ts <email>');
      process.exit(1);
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user) {
      console.log(`❌ User not found: ${email}`);
      console.log('\n💡 This user has not signed up yet.');
    } else {
      console.log(`✅ User found:`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Name: ${user.name}`);
      console.log(`   Role: ${user.role}`);
      
      if (user.emailVerified) {
        console.log(`   Email Verified: ✅ ${user.emailVerified}`);
        console.log('\n👉 User can login at: ' + process.env.NEXTAUTH_URL + '/login');
      } else {
        console.log(`   Email Verified: ❌ NOT VERIFIED`);
        console.log('\n⚠️  User cannot login until email is verified.');
        console.log('\n💡 Options:');
        console.log(`   1. Manually verify: npx tsx scripts/verify-user.ts ${email}`);
        console.log(`   2. Resend email: npx tsx scripts/resend-verification.ts ${email}`);
      }
      
      console.log(`\n   Created: ${user.createdAt}`);
      console.log(`   Updated: ${user.updatedAt}`);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkUser();
