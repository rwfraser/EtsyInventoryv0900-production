# Monitoring Setup Guide

## 1. Sentry Error Tracking (Code is installed, needs DSN)

The Sentry SDK (`@sentry/nextjs`) is installed and configured. You need to create a Sentry account and add your DSN to activate it.

### Setup Steps

1. Go to [sentry.io](https://sentry.io) and create a free account
2. Create a new project → select **Next.js** as the platform
3. Copy the DSN (looks like `https://abc123@o123456.ingest.sentry.io/1234567`)
4. Add to Vercel environment variables:
   - **Name:** `NEXT_PUBLIC_SENTRY_DSN`
   - **Value:** your DSN
   - **Environments:** Production, Preview
5. Add the same to `.env.local` for local testing (or run `npx vercel env pull .env.local`)
6. Redeploy on Vercel

### Configure Alerts

In the Sentry dashboard:
1. Go to **Alerts** → **Create Alert Rule**
2. Set: "When a new issue is created, send an email to rojer@myearringdepot.com"
3. Optionally set a second rule: "When an issue occurs more than 10 times in 1 hour"

### What Gets Tracked

- All unhandled client-side errors (via `global-error.tsx`)
- All unhandled server-side errors (API routes, server components)
- 10% of transactions sampled for performance monitoring

## 2. Uptime Monitoring (External service, 15 min setup)

The health check endpoint is deployed at `/api/health`. Set up an external monitor to ping it.

### Option A: UptimeRobot (Free)

1. Go to [uptimerobot.com](https://uptimerobot.com) and create a free account
2. Click **Add New Monitor**:
   - **Monitor Type:** HTTP(s)
   - **Friendly Name:** MyEarringAdvisor
   - **URL:** `https://www.myearringadvisor.com/api/health`
   - **Monitoring Interval:** 5 minutes
3. Under **Alert Contacts**, add your email: `rojer@myearringdepot.com`
4. Set "Alert after 2 consecutive failures" to avoid false alarms

### Option B: Better Stack (Free)

1. Go to [betterstack.com](https://betterstack.com) and create a free account
2. Go to **Monitors** → **Create Monitor**:
   - **URL:** `https://www.myearringadvisor.com/api/health`
   - **Check period:** 3 minutes
   - **Confirm after:** 2 failures
3. Set up email notification to `rojer@myearringdepot.com`

### What the Health Endpoint Returns

```json
{
  "status": "healthy",
  "version": "1.0.0",
  "uptime": 12345,
  "timestamp": "2026-03-09T18:00:00.000Z",
  "checks": {
    "database": { "status": "ok", "latencyMs": 45 }
  }
}
```

- Returns **200** when all checks pass
- Returns **503** when database is unreachable (triggers uptime alert)

## 3. Budget Alert Emails (Already Active)

Budget alerts are sent automatically via Resend when AI costs hit thresholds:

- **Warning email** at $15/day (75% of $20 budget)
- **Exceeded email** at $20/day (100% of budget)
- Sent to: `rojer@myearringdepot.com`
- Deduplication: only one alert per threshold per day

No setup needed — this is wired up and will work as soon as the cost tracking records usage.

## 4. Google Analytics (Already Active)

Google Analytics (G-9FFETKZG8L) is already tracking page views. No changes needed.
