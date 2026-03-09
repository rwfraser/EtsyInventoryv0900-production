# Database Backup & Restore Procedures

MyEarringAdvisor uses three data stores. This document covers backup and restore for each.

## Data Stores Overview

- **Neon PostgreSQL** — All application data (users, products, orders, chat, tryon). Critical.
- **Upstash Redis** — Rate limit counters and daily cost tracking. Ephemeral, auto-expires after 7 days. Low priority.
- **Vercel Blob** — Product images. Important but replaceable (images can be re-uploaded).

## 1. Neon PostgreSQL

### Layer 1: Neon Built-in Point-in-Time Recovery (PITR)

Neon provides automatic recovery depending on your plan:

- **Free plan:** Restore from branch history (7-day window)
- **Pro plan:** Full PITR with configurable retention (up to 30 days)

To restore via Neon:
1. Go to [console.neon.tech](https://console.neon.tech) → project → **Branches**
2. Create a new branch from a point in time before the corruption occurred
3. Update your connection strings to point to the new branch
4. Verify the data, then optionally promote the branch to primary

**Recommendation:** Upgrade to Pro if not already — PITR is the fastest recovery option for accidental data changes or corruption.

### Layer 2: Local `pg_dump` Backups (Offline Protection)

PITR protects against data corruption, but local exports protect against account-level issues (accidental project deletion, billing lapses, Neon outages).

#### Prerequisites

Install PostgreSQL client tools (only `pg_dump` and `psql` are needed):

```powershell
# Option A: Full install via Chocolatey (requires admin shell)
choco install postgresql17

# Option B: Download from postgresql.org and select "Command Line Tools" only
# https://www.postgresql.org/download/windows/
```

Verify installation:
```powershell
pg_dump --version
psql --version
```

#### Manual Backup

```powershell
.\scripts\backup-database.ps1
```

Backups are saved to `C:\Users\RogerIdaho\backups\myearringadvisor\` with timestamps. Files older than 30 days are automatically cleaned up.

#### Automated Daily Backup (Windows Task Scheduler)

1. Open Task Scheduler (`taskschd.msc`)
2. Create Basic Task:
   - **Name:** MyEarringAdvisor DB Backup
   - **Trigger:** Daily at a low-traffic time (e.g., 3:00 AM)
   - **Action:** Start a program
   - **Program:** `powershell.exe`
   - **Arguments:** `-ExecutionPolicy Bypass -File "C:\Users\RogerIdaho\etsy\etsyinventoryv0900-production\gemstone-earrings\scripts\backup-database.ps1"`
3. Check "Run whether user is logged on or not"

#### Restore from Backup

```powershell
.\scripts\restore-database.ps1 -BackupFile "C:\Users\RogerIdaho\backups\myearringadvisor\neondb_2026-03-09_120000.sql"
```

The script will:
- Show a red warning and require you to type `RESTORE` to confirm
- Drop and recreate all tables from the backup
- Print verification steps

**Important:** This overwrites all current data. If you only need to restore specific tables, open the `.sql` file in a text editor, extract the relevant `CREATE TABLE` and `COPY` sections, and run them manually with `psql`.

### Layer 3: Neon Branch Before Migrations

Before running any Drizzle migration (`db:push` or `db:generate`), create a Neon branch as a snapshot:

1. Go to Neon Console → Branches → **Create Branch**
2. Name it `pre-migration-YYYY-MM-DD`
3. Run your migration
4. If the migration breaks something, restore from the branch

## 2. Upstash Redis

Redis data is ephemeral (rate limit counters reset hourly, cost entries expire after 7 days). No backup is needed.

If Redis data is lost:
- Rate limiters reset — users get fresh request quotas (harmless)
- Cost tracking history for the current week is lost (minor)

Upstash Pro plans include daily automatic backups if you want this data preserved.

## 3. Vercel Blob (Product Images)

Images stored in Vercel Blob have no built-in export. To create a local backup:

```powershell
# List all blob URLs from the database
psql $POSTGRES_URL_NON_POOLING -c "SELECT image1, image2, image3, image4, enhanced_image1, enhanced_image2, enhanced_image3, enhanced_image4 FROM products WHERE image1 IS NOT NULL" -t -A -F ','
```

Then download them. If images are lost, they can be re-uploaded through the admin product edit page.

## Recovery Decision Tree

```
Problem: Data looks wrong or missing
├── Happened in the last few hours?
│   └── Use Neon PITR (fastest, no data loss beyond the restore point)
├── Happened in the last 30 days?
│   └── Use Neon branch restore or local pg_dump backup
├── Need to undo a specific migration?
│   └── Restore from pre-migration Neon branch
└── Neon account inaccessible?
    └── Restore from local pg_dump backup to a new PostgreSQL instance
```

## Backup Verification

Periodically verify backups are usable:

1. Create a temporary Neon branch (free, isolated)
2. Restore a local backup into the branch:
   ```powershell
   psql "<branch-connection-string>" -f "C:\Users\RogerIdaho\backups\myearringadvisor\neondb_LATEST.sql"
   ```
3. Spot-check: count rows, verify a known product exists
4. Delete the temporary branch
