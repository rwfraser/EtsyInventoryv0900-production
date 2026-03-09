# Secret Rotation Procedures

Reference guide for rotating exposed or compromised credentials for the MyEarringAdvisor.com application.

## General Principle

1. Generate a new credential in the provider's dashboard
2. Update `.env.local` and Vercel environment variables
3. Redeploy on Vercel
4. Verify the affected feature works
5. Revoke/delete the old credential

Rotate one service at a time so you can isolate any issues.

## 1. Neon PostgreSQL Password (highest priority)

- **Dashboard:** [console.neon.tech](https://console.neon.tech) → project `twilight-mode-58754786` → Settings → Roles
- **Action:** Reset password for the `neondb_owner` role
- **Env vars to update (all contain the password):**
  - `DATABASE_URL`
  - `DATABASE_URL_UNPOOLED`
  - `PGPASSWORD`
  - `POSTGRES_PASSWORD`
  - `POSTGRES_PRISMA_URL`
  - `POSTGRES_URL`
  - `POSTGRES_URL_NON_POOLING`
  - `POSTGRES_URL_NO_SSL`
- **Verify:** Load products page, log in, admin dashboard

## 2. Upstash Redis / KV Tokens

- **Dashboard:** [console.upstash.com](https://console.upstash.com) → database `tough-raven-17890` → REST API → Rotate
- **Env vars to update:**
  - `KV_REST_API_TOKEN`
  - `KV_REST_API_READ_ONLY_TOKEN`
  - `KV_URL`
  - `REDIS_URL`
- **Verify:** Rate limiting, cost tracking

## 3. Vercel Blob Token

- **Dashboard:** [vercel.com](https://vercel.com) → project → Storage → Blob store → Regenerate token
- **Env vars to update:**
  - `BLOB_READ_WRITE_TOKEN`
- **Verify:** Image uploads in admin product creation

## 4. Resend API Key

- **Dashboard:** [resend.com/api-keys](https://resend.com/api-keys) → Create new key, delete old
- **Env vars to update:**
  - `RESEND_API_KEY`
- **Verify:** Email verification flow (signup)

## 5. OpenAI API Key

- **Dashboard:** [platform.openai.com/api-keys](https://platform.openai.com/api-keys) → Create new key, revoke old
- **Env vars to update:**
  - `OPENAI_API_KEY`
- **Verify:** Chat widget, AI description generation

## 6. Gemini API Key

- **Dashboard:** [aistudio.google.com/apikey](https://aistudio.google.com/apikey) or Google Cloud Console → Create new key, delete old
- **Env vars to update:**
  - `GEMINI_API_KEY`
- **Verify:** AI image enhancement

## 7. NextAuth Secret

- **Generate new secret:**
  ```powershell
  node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
  ```
- **Env vars to update:**
  - `NEXTAUTH_SECRET`
- **Note:** This invalidates all existing user sessions. Users will need to log in again. Do this during low-traffic time.
- **Verify:** Login/logout flow

## After All Rotations

1. Verify each feature: product listing, login, admin product creation/upload, chat, email verification
2. Keep Vercel dashboard as the source of truth for env vars. Sync locally with:
   ```powershell
   npx vercel env pull .env.local
   ```

## Prevention

- Never commit `.env.local` or any `.env.*` files (already in `.gitignore`)
- Use `npx vercel env pull` to sync env vars rather than manually editing `.env.local`
- If secrets are accidentally displayed in logs or terminals, rotate immediately using this guide
