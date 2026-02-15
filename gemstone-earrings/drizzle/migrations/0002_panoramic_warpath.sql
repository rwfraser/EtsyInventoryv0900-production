CREATE TABLE "orders" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"total" numeric(10, 2) NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"items" text NOT NULL,
	"shipping_address" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"price" numeric(10, 2) NOT NULL,
	"image_url" text,
	"category" text,
	"image1" text,
	"image2" text,
	"image3" text,
	"image4" text,
	"enhanced_image1" text,
	"enhanced_image2" text,
	"enhanced_image3" text,
	"enhanced_image4" text,
	"stock" integer DEFAULT 0 NOT NULL,
	"original_description" text,
	"ai_description" text,
	"ai_keywords" text,
	"ai_processed_at" timestamp,
	"ai_model_used" text,
	"embedding_vector" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;