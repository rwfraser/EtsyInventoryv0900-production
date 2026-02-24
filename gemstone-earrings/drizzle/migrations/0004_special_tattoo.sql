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
--> statement-breakpoint
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
--> statement-breakpoint
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
--> statement-breakpoint
ALTER TABLE "chat_analytics" ADD CONSTRAINT "chat_analytics_session_id_chat_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."chat_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_session_id_chat_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."chat_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_sessions" ADD CONSTRAINT "chat_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;