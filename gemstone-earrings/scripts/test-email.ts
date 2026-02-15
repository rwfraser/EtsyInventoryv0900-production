// Script to test email sending
// Run with: npx tsx scripts/test-email.ts <email>

// Load environment variables from .env.local
import { loadEnvConfig } from '@next/env';
loadEnvConfig(process.cwd());

import { sendVerificationEmail, generateVerificationToken } from '../lib/email';

const testEmailAddress = process.argv[2];

async function testEmailSending() {
  try {
    if (!testEmailAddress) {
      console.error('❌ Error: Please provide an email address');
      console.log('Usage: npx tsx scripts/test-email.ts <email>');
      process.exit(1);
    }

    console.log(`📧 Testing email sending to: ${testEmailAddress}`);
    console.log(`🔑 Generating verification token...`);
    
    const token = await generateVerificationToken(testEmailAddress);
    console.log(`✅ Token generated: ${token.substring(0, 10)}...`);
    
    console.log(`📤 Sending verification email...`);
    const result = await sendVerificationEmail(testEmailAddress, token);
    
    if (result.success) {
      console.log(`✅ Email sent successfully!`);
      console.log(`\n👉 Check ${testEmailAddress} for the verification email`);
      console.log(`   (Don't forget to check spam/junk folder)`);
    } else {
      console.error(`❌ Email failed to send`);
      console.error(`   Error:`, result.error);
      console.log(`\n💡 Troubleshooting:`);
      console.log(`   1. Check RESEND_API_KEY in .env.local`);
      console.log(`   2. Check RESEND_FROM_EMAIL is a verified domain`);
      console.log(`   3. Check Resend dashboard: https://resend.com/emails`);
    }

    process.exit(result.success ? 0 : 1);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testEmailSending();
