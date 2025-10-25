CREATE TABLE IF NOT EXISTS "ai_profile" (
	"id" char(12) PRIMARY KEY NOT NULL,
	"user_id" char(8) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"system_prompt" text NOT NULL,
	"avatar_url" varchar(500),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "conversation" (
	"id" char(12) PRIMARY KEY NOT NULL,
	"user_id" char(8) NOT NULL,
	"profile_id" char(12) NOT NULL,
	"title" varchar(255) NOT NULL,
	"is_archived" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "message" (
	"id" char(12) PRIMARY KEY NOT NULL,
	"conversation_id" char(12) NOT NULL,
	"role" varchar(20) NOT NULL,
	"content" text NOT NULL,
	"token_count" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ai_profile" ADD CONSTRAINT "ai_profile_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "conversation" ADD CONSTRAINT "conversation_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "conversation" ADD CONSTRAINT "conversation_profile_id_ai_profile_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."ai_profile"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "message" ADD CONSTRAINT "message_conversation_id_conversation_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversation"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ai_profile_user_id_idx" ON "ai_profile" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ai_profile_name_idx" ON "ai_profile" USING btree ("name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "conversation_user_id_idx" ON "conversation" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "conversation_profile_id_idx" ON "conversation" USING btree ("profile_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "conversation_updated_at_idx" ON "conversation" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "message_conversation_id_idx" ON "message" USING btree ("conversation_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "message_created_at_idx" ON "message" USING btree ("created_at");