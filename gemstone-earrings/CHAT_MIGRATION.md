# Chat Feature Migration Guide

## Database Migration for Chat Tables

The chat feature requires three new tables in the database.

### Tables Created
1. **chat_sessions** - Tracks individual chat conversations
2. **chat_messages** - Stores all messages in conversations
3. **chat_analytics** - Tracks performance metrics and conversions

### Migration Files
- Schema: `drizzle/schema.ts` (lines 82-118)
- SQL Migration: `drizzle/migrations/0004_special_tattoo.sql`
- TypeScript Script: `scripts/apply-chat-migration.ts`

---

## Option 1: Automatic (Recommended)

The tables will be created automatically on first deployment when the chat API endpoints are called. The schema is already defined in `drizzle/schema.ts`.

---

## Option 2: Manual via Neon Console

If you prefer to apply the migration manually:

1. **Login to Neon Console**: https://console.neon.tech
2. **Select your database**
3. **Open SQL Editor**
4. **Run this SQL**:

```sql
-- Create chat_sessions table
CREATE TABLE "chat_sessions" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text,
  "session_token" text NOT NULL,
  "started_at" timestamp DEFAULT now() NOT NULL,
  "ended_at" timestamp,
  "last_message_at" timestamp DEFAULT now() NOT NULL,
  "message_count" integer DEFAULT 0 NOT NULL,
  "user_agent" text,
  "ip_address" text,
  CONSTRAINT "chat_sessions_session_token_unique" UNIQUE("session_token")
);

-- Create chat_messages table
CREATE TABLE "chat_messages" (
  "id" text PRIMARY KEY NOT NULL,
  "session_id" text NOT NULL,
  "role" text NOT NULL,
  "content" text NOT NULL,
  "function_name" text,
  "function_args" text,
  "function_result" text,
  "timestamp" timestamp DEFAULT now() NOT NULL
);

-- Create chat_analytics table
CREATE TABLE "chat_analytics" (
  "id" text PRIMARY KEY NOT NULL,
  "session_id" text NOT NULL,
  "products_viewed" text,
  "products_added_to_cart" text,
  "query_type" text,
  "user_satisfaction" integer,
  "conversion_occurred" integer DEFAULT 0,
  "total_cost_usd" numeric(10, 4),
  "created_at" timestamp DEFAULT now() NOT NULL
);

-- Add foreign key constraints
ALTER TABLE "chat_analytics" 
ADD CONSTRAINT "chat_analytics_session_id_chat_sessions_id_fk" 
FOREIGN KEY ("session_id") REFERENCES "public"."chat_sessions"("id") 
ON DELETE cascade ON UPDATE no action;

ALTER TABLE "chat_messages" 
ADD CONSTRAINT "chat_messages_session_id_chat_sessions_id_fk" 
FOREIGN KEY ("session_id") REFERENCES "public"."chat_sessions"("id") 
ON DELETE cascade ON UPDATE no action;

ALTER TABLE "chat_sessions" 
ADD CONSTRAINT "chat_sessions_user_id_users_id_fk" 
FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") 
ON DELETE set null ON UPDATE no action;
```

5. **Verify tables created**:
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'chat%';
```

---

## Option 3: Via Script (Requires Local DB Access)

If you have local database access configured:

```bash
npx tsx scripts/apply-chat-migration.ts
```

Make sure `.env.local` has the correct `POSTGRES_URL` set.

---

## Verification

After migration, verify the tables exist:

```sql
-- Check tables
\dt chat*

-- Check chat_sessions structure
\d chat_sessions

-- Check chat_messages structure
\d chat_messages

-- Check chat_analytics structure
\d chat_analytics
```

---

## Rollback (If Needed)

To remove the chat tables:

```sql
DROP TABLE IF EXISTS chat_analytics CASCADE;
DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS chat_sessions CASCADE;
```

**Warning**: This will delete all chat history and analytics data.
