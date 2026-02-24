import { db } from '../lib/db';
import { sql } from 'drizzle-orm';

/**
 * Apply chat tables migration manually
 * Run with: npx tsx scripts/apply-chat-migration.ts
 */
async function applyMigration() {
  try {
    console.log('🚀 Starting chat tables migration...\n');

    // Check if tables already exist
    const tablesCheck = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name IN ('chat_sessions', 'chat_messages', 'chat_analytics')
    `);

    if (tablesCheck.rows.length > 0) {
      console.log('⚠️  Chat tables already exist:');
      tablesCheck.rows.forEach(row => console.log(`   - ${row.table_name}`));
      console.log('\nSkipping migration. Tables are already created.');
      return;
    }

    console.log('📋 Creating chat_sessions table...');
    await db.execute(sql`
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
      )
    `);
    console.log('✅ chat_sessions created');

    console.log('📋 Creating chat_messages table...');
    await db.execute(sql`
      CREATE TABLE "chat_messages" (
        "id" text PRIMARY KEY NOT NULL,
        "session_id" text NOT NULL,
        "role" text NOT NULL,
        "content" text NOT NULL,
        "function_name" text,
        "function_args" text,
        "function_result" text,
        "timestamp" timestamp DEFAULT now() NOT NULL
      )
    `);
    console.log('✅ chat_messages created');

    console.log('📋 Creating chat_analytics table...');
    await db.execute(sql`
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
      )
    `);
    console.log('✅ chat_analytics created');

    console.log('\n📋 Adding foreign key constraints...');
    
    await db.execute(sql`
      ALTER TABLE "chat_analytics" 
      ADD CONSTRAINT "chat_analytics_session_id_chat_sessions_id_fk" 
      FOREIGN KEY ("session_id") REFERENCES "public"."chat_sessions"("id") 
      ON DELETE cascade ON UPDATE no action
    `);
    console.log('✅ chat_analytics FK added');

    await db.execute(sql`
      ALTER TABLE "chat_messages" 
      ADD CONSTRAINT "chat_messages_session_id_chat_sessions_id_fk" 
      FOREIGN KEY ("session_id") REFERENCES "public"."chat_sessions"("id") 
      ON DELETE cascade ON UPDATE no action
    `);
    console.log('✅ chat_messages FK added');

    await db.execute(sql`
      ALTER TABLE "chat_sessions" 
      ADD CONSTRAINT "chat_sessions_user_id_users_id_fk" 
      FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") 
      ON DELETE set null ON UPDATE no action
    `);
    console.log('✅ chat_sessions FK added');

    console.log('\n🎉 Migration completed successfully!');
    console.log('\nCreated tables:');
    console.log('  ✓ chat_sessions');
    console.log('  ✓ chat_messages');
    console.log('  ✓ chat_analytics');

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    throw error;
  }
}

// Run migration
applyMigration()
  .then(() => {
    console.log('\n✅ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error:', error);
    process.exit(1);
  });
