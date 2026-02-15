# Security Cleanup - Remove Secrets from Git History

## CRITICAL: API Keys Were Exposed in Public Repository

Files `.env.bak` and `.env.misc` were committed to the public GitHub repository in commit `4cba767`.
Even though they were later "removed", they still exist in git history and are publicly accessible.

## Immediate Actions Required

### 1. Rotate ALL API Keys (DO THIS FIRST!)

**Resend:**
- Go to: https://resend.com/api-keys
- Delete the compromised key
- Create a new API key
- Update in Vercel

**Vercel Postgres:**
- Go to Vercel Dashboard → Storage → Your Database → Settings
- Click "Reset Credentials" or create new database

**NextAuth Secret:**
```powershell
# Generate new secret
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
# Update in Vercel environment variables
```

**Update Vercel Environment Variables:**
```powershell
# Open Vercel project settings
vercel env ls

# For each compromised variable, remove and re-add:
vercel env rm RESEND_API_KEY production
vercel env add RESEND_API_KEY production

vercel env rm NEXTAUTH_SECRET production  
vercel env add NEXTAUTH_SECRET production

# Redeploy with new secrets
vercel --prod
```

### 2. Remove Secrets from Git History

**Option A: Using git-filter-repo (Recommended)**

```powershell
# Install git-filter-repo
# Download from: https://github.com/newren/git-filter-repo/releases

# Backup first!
cd C:\Users\RogerIdaho\etsy\EtsyInventoryv0900-production
git clone --mirror . ../EtsyInventory-backup.git

# Remove the files from all history
python git-filter-repo --invert-paths --path .env.bak --path .env.misc --force

# Force push (WARNING: This rewrites history)
git push origin --force --all
git push origin --force --tags
```

**Option B: Using BFG Repo-Cleaner (Easier)**

```powershell
# Download BFG from: https://rtyley.github.io/bfg-repo-cleaner/

# Backup first!
cd C:\Users\RogerIdaho\etsy\EtsyInventoryv0900-production
git clone --mirror . ../EtsyInventory-backup.git

# Run BFG to remove env files
java -jar bfg.jar --delete-files '.env.bak' --no-blob-protection .
java -jar bfg.jar --delete-files '.env.misc' --no-blob-protection .

# Clean up and push
git reflog expire --expire=now --all
git gc --prune=now --aggressive
git push origin --force --all
```

**Option C: Nuclear Option - Create New Repo**

If the above is too complex, simplest solution:

1. Create a brand new GitHub repository
2. Copy only the current code (no git history)
3. Push to new repo
4. Update Vercel to use new repo
5. Archive/delete old compromised repo

### 3. Update .gitignore (Already Done)

The `.gitignore` in `gemstone-earrings/` directory already includes:
```
.env
.env.*
.env.local
.env.bak
.env.backup
```

This is correct. The issue was files were committed BEFORE .gitignore was properly set up.

### 4. Verify Cleanup

After removing from history:

```powershell
# Check that files are gone from all history
cd C:\Users\RogerIdaho\etsy\EtsyInventoryv0900-production
git log --all --full-history --oneline -- "*.env*"

# Should return nothing
```

### 5. Notify GitHub (Optional)

If you've rotated all keys, GitHub's alert should automatically close.
If not, you can manually dismiss the alert in:
https://github.com/rwfraser/EtsyInventoryv0900-production/security

## Prevention for Future

1. **Always add .gitignore BEFORE committing**
2. **Use `git add -p`** to review what you're committing
3. **Enable pre-commit hooks** to block env files:

```powershell
# Create .git/hooks/pre-commit
git config core.hooksPath .githooks
```

4. **Use Vercel CLI for secrets** - never store in files:
```powershell
vercel env add VARIABLE_NAME production
```

## Timeline

- **Jan 28, 2026**: `.env.bak` and `.env.misc` committed with secrets
- **Later**: Files "removed" but still in git history  
- **Feb 15, 2026**: GitHub detected exposed secrets
- **ACTION REQUIRED**: Clean up history + rotate all keys

## Status Checklist

- [ ] Rotated Resend API key
- [ ] Rotated database credentials
- [ ] Rotated NEXTAUTH_SECRET
- [ ] Updated all keys in Vercel
- [ ] Redeployed application
- [ ] Removed secrets from git history
- [ ] Force pushed cleaned history
- [ ] Verified files removed from history
- [ ] Dismissed GitHub security alerts
