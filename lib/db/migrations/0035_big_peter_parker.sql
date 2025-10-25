CREATE TABLE IF NOT EXISTS "feature" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"display_name" varchar(150) NOT NULL,
	"description" text,
	"is_paid" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "feature_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "plan_feature" (
	"id" serial PRIMARY KEY NOT NULL,
	"stripe_product_id" varchar(255) NOT NULL,
	"feature_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_subscription" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" char(8) NOT NULL,
	"stripe_customer_id" varchar(255) NOT NULL,
	"stripe_subscription_id" varchar(255) NOT NULL,
	"stripe_product_id" varchar(255) NOT NULL,
	"stripe_price_id" varchar(255) NOT NULL,
	"status" varchar(50) NOT NULL,
	"current_period_start" timestamp NOT NULL,
	"current_period_end" timestamp NOT NULL,
	"trial_start" timestamp,
	"trial_end" timestamp,
	"canceled_at" timestamp,
	"cancel_at_period_end" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_subscription_stripe_subscription_id_unique" UNIQUE("stripe_subscription_id")
);
--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "stripe_customer_id" varchar(255);--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "plan_feature" ADD CONSTRAINT "plan_feature_feature_id_feature_id_fk" FOREIGN KEY ("feature_id") REFERENCES "public"."feature"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_subscription" ADD CONSTRAINT "user_subscription_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "feature_name_idx" ON "feature" USING btree ("name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "feature_active_idx" ON "feature" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "plan_feature_unique_idx" ON "plan_feature" USING btree ("stripe_product_id","feature_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "plan_feature_stripe_product_idx" ON "plan_feature" USING btree ("stripe_product_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "plan_feature_feature_idx" ON "plan_feature" USING btree ("feature_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_subscription_user_active_idx" ON "user_subscription" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_subscription_stripe_idx" ON "user_subscription" USING btree ("stripe_subscription_id");