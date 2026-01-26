# Authentication Setup Guide

This guide will help you configure and deploy the authentication system for the Gemstone Earrings application.

## Prerequisites

- Vercel account
- Resend account (for sending verification emails)
- Git repository connected to Vercel

## Step 1: Set Up Vercel Postgres Database

1. Go to your Vercel Dashboard
2. Select your project
3. Navigate to **Storage** tab
4. Click **Create Database** → **Postgres**
5. Follow the prompts to create a new Postgres database
6. Once created, go to **Settings** → **Environment Variables**
7. Vercel will automatically add the following environment variables:
   - `POSTGRES_URL`
   - `POSTGRES_PRISMA_URL`
   - `POSTGRES_URL_NON_POOLING`
   - `POSTGRES_USER`
   - `POSTGRES_HOST`
   - `POSTGRES_PASSWORD`
   - `POSTGRES_DATABASE`

## Step 2: Generate NextAuth Secret

Generate a secure random string for NextAuth:

```bash
# Using OpenSSL (Mac/Linux/Git Bash on Windows)
openssl rand -base64 32

# Or using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Add this to Vercel environment variables:
- **Key**: `NEXTAUTH_SECRET`
- **Value**: [your generated string]

## Step 3: Set NextAuth URL

Add your production URL to Vercel environment variables:
- **Key**: `NEXTAUTH_URL`
- **Value**: `https://your-app-name.vercel.app` (or your custom domain)

## Step 4: Set Up Resend Email Service

1. Go to [https://resend.com](https://resend.com)
2. Sign up / Log in
3. Go to **API Keys** section
4. Click **Create API Key**
5. Copy the API key (starts with `re_`)

### Configure Email Domain (Optional but Recommended)

For production emails from your own domain:

1. In Resend dashboard, go to **Domains**
2. Click **Add Domain**
3. Enter your domain (e.g., `yourdomain.com`)
4. Add the DNS records shown to your domain provider
5. Wait for verification (usually takes a few minutes)

For testing, you can use the default `onboarding@resend.dev`.

Add these to Vercel environment variables:
- **Key**: `RESEND_API_KEY`
- **Value**: `re_your_api_key_here`
- **Key**: `RESEND_FROM_EMAIL`
- **Value**: `noreply@yourdomain.com` (or `onboarding@resend.dev` for testing)

## Step 5: Run Database Migrations

After setting up environment variables, you need to push the Prisma schema to your database.

### Option A: Using Vercel CLI (Recommended)

```bash
# Install Vercel CLI if you haven't
npm i -g vercel

# Link your project
vercel link

# Pull environment variables
vercel env pull .env.local

# Run Prisma migration
npx prisma db push

# Generate Prisma client
npx prisma generate
```

### Option B: Manual Setup

1. Create a `.env.local` file in your project root
2. Copy all environment variables from Vercel to `.env.local`
3. Run:
```bash
npx prisma db push
npx prisma generate
```

## Step 6: Deploy to Vercel

```bash
# Build locally to check for errors
npm run build

# If successful, push to GitHub
git add .
git commit -m "Add authentication system"
git push

# Vercel will automatically deploy
```

Or deploy manually:
```bash
vercel --prod
```

## Step 7: Verify Deployment

1. Visit your deployed application
2. You should see the authentication gate on the homepage
3. Click "Sign Up" and create a test account
4. Check your email for the verification link
5. Click the verification link
6. Log in with your credentials
7. You should now see the full homepage and be able to browse products

## Local Development Setup

To run the application locally with authentication:

1. Create `.env.local` file (see `.env.example`)
2. Add all required environment variables
3. Run database migration:
   ```bash
   npx prisma db push
   npx prisma generate
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```
5. Visit `http://localhost:3000`

Update `NEXTAUTH_URL` for local development:
```
NEXTAUTH_URL=http://localhost:3000
```

## Troubleshooting

### "Database connection failed"
- Verify all `POSTGRES_*` environment variables are set correctly
- Check that Vercel Postgres database is active
- Try running `npx prisma db push` again

### "Email not sending"
- Verify `RESEND_API_KEY` is correct
- Check that your domain is verified in Resend (if using custom domain)
- Check Resend dashboard for error logs

### "Session not persisting"
- Verify `NEXTAUTH_SECRET` is set
- Check that `NEXTAUTH_URL` matches your domain
- Clear browser cookies and try again

### "Prisma Client not found"
- Run `npx prisma generate`
- Restart your development server

## Security Notes

- Never commit `.env.local` to Git
- Keep your `NEXTAUTH_SECRET` secure and random
- Rotate your `RESEND_API_KEY` periodically
- Use HTTPS in production (Vercel provides this automatically)

## Features Implemented

✅ Email/password authentication with NextAuth.js v5
✅ Email verification with 24-hour expiration
✅ Protected routes (products, cart, returns)
✅ Homepage authentication gate
✅ User session management
✅ Cart synchronization between localStorage and database
✅ User profile menu with logout
✅ Secure password hashing with bcrypt

## What's Next?

Optional enhancements you might want to add:
- Password reset functionality
- OAuth providers (Google, Facebook)
- User profile page
- Order history
- Remember me functionality
- Two-factor authentication
