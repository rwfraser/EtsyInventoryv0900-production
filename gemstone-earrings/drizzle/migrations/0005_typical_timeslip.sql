CREATE TABLE "product_tryon_assets" (
	"id" text PRIMARY KEY NOT NULL,
	"product_id" text NOT NULL,
	"left_earring_url" text,
	"right_earring_url" text,
	"real_world_width" numeric(6, 2),
	"real_world_height" numeric(6, 2),
	"anchor_point_x" numeric(4, 3),
	"anchor_point_y" numeric(4, 3),
	"reflectivity" numeric(3, 2),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "product_tryon_assets_product_id_unique" UNIQUE("product_id")
);
--> statement-breakpoint
CREATE TABLE "tryon_results" (
	"id" text PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"product_id" text NOT NULL,
	"result_image_url" text,
	"rendering_time" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tryon_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"session_token" text NOT NULL,
	"selfie_url" text,
	"face_landmarks" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "product_tryon_assets" ADD CONSTRAINT "product_tryon_assets_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tryon_results" ADD CONSTRAINT "tryon_results_session_id_tryon_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."tryon_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tryon_results" ADD CONSTRAINT "tryon_results_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tryon_sessions" ADD CONSTRAINT "tryon_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;