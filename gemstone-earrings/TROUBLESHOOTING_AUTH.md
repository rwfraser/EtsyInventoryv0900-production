# Authentication Troubleshooting Guide

## Common Issue: User Stuck in Unverified State

### Problem Description
Users attempt to sign up but don't receive verification email. When they try to sign up again, they get "email already exists" error. When they try to login, they get "invalid email or password" error because their email is unverified.

### Root Cause
1. User creates account successfully in database
2. Verification email fails to send (or goes to spam)
3. User's `emailVerified` field remains `NULL` in database
4. NextAuth blocks login for unverified users
5. User is stuck - can't re-signup, can't login

---

## Quick Fix Solutions

### Option 1: Manually Verify User (Fastest)

```bash
npx tsx scripts/verify-user.ts user@example.com
```

This immediately marks the user as verified and allows them to login.

### Option 2: Resend Verification Email

```bash
npx tsx scripts/resend-verification.ts user@example.com
```

This generates a new verification token and attempts to send the email again.

### Option 3: Have User Try Signing Up Again

With the updated code, if a user tries to sign up with an email that exists but is unverified, the system will automatically resend the verification email.

---

## Prevention: Check Email Configuration

### 1. Verify Resend API Key

```bash
# Check if environment variables are set (Windows PowerShell)
Select-String -Path .env.local -Pattern "RESEND" | ForEach-Object { $_.Line -replace '=.*', '=***' }
```

Should show:
```
RESEND_API_KEY=***
RESEND_FROM_EMAIL=***
```

### 2. Test Email Sending

Create a test script `scripts/test-email.ts`:

```typescript
import { sendVerificationEmail, generateVerificationToken } from '../lib/email';

const testEmail = process.argv[2] || 'test@example.com';

async function testEmail() {
  console.log(`Testing email to: ${testEmail}`);
  const token = await generateVerificationToken(testEmail);
  const result = await sendVerificationEmail(testEmail, token);
  
  if (result.success) {
    console.log('✅ Email sent successfully!');
  } else {
    console.error('❌ Email failed:', result.error);
  }
}

testEmail();
```

Run: `npx tsx scripts/test-email.ts your-email@example.com`

### 3. Check Resend Dashboard

1. Go to https://resend.com/emails
2. Check recent email logs
3. Look for failed deliveries or errors

### 4. Verify Domain Configuration (if using custom domain)

In Resend dashboard:
- Check that domain is verified (green checkmark)
- Verify DNS records are properly configured
- Ensure SPF, DKIM records are set up

---

## Code Improvements Made

### 1. Improved Signup API Route

**File**: `app/api/auth/signup/route.ts`

**Changes**:
- Detects if user exists but is unverified
- Automatically resends verification email
- Provides clearer error messages
- Logs email sending failures

### 2. Created Helper Scripts

**Scripts created**:
- `scripts/verify-user.ts` - Manually verify a user
- `scripts/resend-verification.ts` - Resend verification email

---

## Debugging Steps

### Step 1: Check if User Exists

Query the database to see user status. Create `scripts/check-user.ts`:

```typescript
import { db } from '../lib/db';
import { users } from '../drizzle/schema';
import { eq } from 'drizzle-orm';

const email = process.argv[2];

async function checkUser() {
  if (!email) {
    console.error('Usage: npx tsx scripts/check-user.ts <email>');
    process.exit(1);
  }

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (!user) {
    console.log(`❌ User not found: ${email}`);
  } else {
    console.log(`✅ User found:`);
    console.log(`   ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Name: ${user.name}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Email Verified: ${user.emailVerified || 'NOT VERIFIED'}`);
    console.log(`   Created: ${user.createdAt}`);
  }
}

checkUser();
```

Run: `npx tsx scripts/check-user.ts user@example.com`

### Step 2: Check Environment Variables

```powershell
# In PowerShell
Get-Content .env.local | Select-String "RESEND|NEXTAUTH"
```

### Step 3: Test Database Connection

```bash
npx tsx scripts/create-admin.ts
```

If this works, database connection is fine.

### Step 4: Check Vercel Logs (for production issues)

```bash
vercel logs --follow
```

Look for errors during signup or email sending.

---

## User Instructions

### For Users Who Are Stuck

If you're unable to login and getting errors:

1. **Try signing up again** with the same email - the system will now automatically resend your verification email

2. **Check spam/junk folder** - verification emails sometimes end up there

3. **Contact support** with your email address - we can manually verify your account

### Email Not Received?

Common reasons:
- Email went to spam/junk folder
- Email address was mistyped
- Email provider blocked the message
- Temporary email service blocked

Solutions:
- Check all email folders including spam
- Add noreply@myearringadvisor.com to contacts
- Try signing up again (system will resend)
- Contact support for manual verification

---

## Production Deployment

After making code changes:

```bash
# Test locally first
npm run build

# Commit and push
git add .
git commit -m "Fix: Improve signup handling for unverified users

- Auto-resend verification email if user exists but unverified
- Add helper scripts for manual verification
- Improve error messages
- Add email sending failure handling"

git push

# Vercel will auto-deploy
```

### Verify Fix in Production

1. Test signup with new email
2. Test signup with existing unverified email (should resend)
3. Check that verification emails are received
4. Verify login works after email verification

---

## Long-term Improvements

Consider implementing:

1. **Email Queue/Retry System** - Automatically retry failed emails
2. **Admin Dashboard** - UI to manage user verification
3. **Email Provider Backup** - Fallback to alternative provider if Resend fails
4. **Manual Verification Request** - Let users request verification from login page
5. **Account Recovery Flow** - Password reset can also verify email
6. **Monitoring/Alerts** - Get notified when verification emails fail

---

## Support Contact

For urgent issues or questions:
- Check application logs: `vercel logs`
- Check Resend logs: https://resend.com/emails
- Run diagnostic scripts in `scripts/` folder
