# Authentication Setup Instructions - Drizzle ORM

## CURRENT STATUS

✅ **Code**: Complete  
✅ **NPM Packages**: Installed (Drizzle, NextAuth, Resend, bcryptjs)  
✅ **Vercel Postgres Database**: Created  
✅ **Resend Email**: Setup and verified  
✅ **Database Tables**: Created (users, sessions, verification_tokens, carts)  
✅ **.env.local file**: Exists with variables  

**WHAT'S LEFT**: Just add environment variables to Vercel dashboard and deploy

---

## YOUR .env.local FILE

**Location**: `C:\Users\RogerIdaho\Etsy\Etsyv0900\gemstone-earrings\.env.local`

Should contain:
```
GEMSTONE_EARRINGS__POSTGRES_URL="postgres://...@db.prisma.io:5432/postgres?sslmode=require"
POSTGRES_PRISMA_URL="postgres://...@db.prisma.io:5432/postgres?sslmode=require"
POSTGRES_URL_NON_POOLING="postgres://...@db.prisma.io:5432/postgres?sslmode=require"
NEXTAUTH_SECRET="your-generated-secret"
NEXTAUTH_URL="http://localhost:3000"
RESEND_API_KEY="re_your_key"
RESEND_FROM_EMAIL="noreply@yourdomain.com"
```

---

## TASK 1: REMOVE OLD PRISMA VARIABLES FROM VERCEL

**Go to**: https://vercel.com → Your Project → Settings → Environment Variables

**Delete these Prisma variables** (click the trash icon for each):
- Any variable containing "PRISMA" in the name (except POSTGRES_PRISMA_URL)
- `User` table variables (if any)
- `Session` table variables (if any)
- Any Prisma-specific migration variables

**Keep these** (needed for Drizzle):
- `GEMSTONE_EARRINGS__POSTGRES_URL`
- `GEMSTONE_EARRINGS__DATABASE_URL`

---

## TASK 2: ADD VARIABLES TO VERCEL

**Same place**: https://vercel.com → Your Project → Settings → Environment Variables

Add these 6 variables (click "Add New" for each):

| Variable Name | Value | Get From |
|--------------|-------|----------|
| `POSTGRES_PRISMA_URL` | Copy from your .env.local | Same value as local |
| `POSTGRES_URL_NON_POOLING` | Copy from your .env.local | Same value as local |
| `NEXTAUTH_SECRET` | Copy from your .env.local | The random string |
| `NEXTAUTH_URL` | `https://your-app.vercel.app` | Your actual URL |
| `RESEND_API_KEY` | Copy from your .env.local | Your re_... key |
| `RESEND_FROM_EMAIL` | Copy from your .env.local | Your email |

**For each**: Select **Production**, **Preview**, **Development** (all 3 environments)

### Important: Redeploy After Adding Variables

After adding/changing environment variables, Vercel will show a yellow banner:
**"Environment variables updated. Redeploy to apply changes."**

You have two options:

**Option A**: Click **"Redeploy"** button in Vercel dashboard
- Go to Deployments tab
- Click ⋯ (three dots) on latest deployment
- Click "Redeploy"
- Select "Use existing Build Cache" 
- Click "Redeploy"

**Option B**: Push new code (which will trigger deployment automatically)

**Why?** Environment variables are read during build time. Your current deployment is still using old values until you redeploy.

---

## TASK 3: TEST LOCALLY

```powershell
npm run dev
```

Open http://localhost:3000 and test:
1. Signup
2. Check email for verification link
3. Click link to verify
4. Login
5. Browse products

---

## TASK 4: DEPLOY

```powershell
git add .
git commit -m "Add authentication with Drizzle ORM"
git push
```

Vercel will auto-deploy. Test on production URL.

---

## DRIZZLE COMMANDS

If you need to modify the database schema later:

```powershell
# Edit drizzle/schema.ts, then run:
npx drizzle-kit push
```

To view your database:
```powershell
npx drizzle-kit studio
```

---

## TROUBLESHOOTING

### "Can't connect to database"
Check that `POSTGRES_PRISMA_URL` in .env.local has the correct value

### "Email not sending"
Verify `RESEND_API_KEY` starts with `re_` and is correct

### "Session not working in production"
Make sure `NEXTAUTH_URL` in Vercel matches your deployment URL exactly

---

## WHAT WAS DONE

✅ Removed Prisma  
✅ Installed Drizzle ORM  
✅ Created 4 database tables: users, sessions, verification_tokens, carts  
✅ Updated all code to use Drizzle instead of Prisma  
✅ Tested migration successfully  

**Database**: All tables created and ready  
**Code**: Fully converted to Drizzle  
**Ready**: Yes, just needs Vercel variables and deployment
