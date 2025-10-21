CREATE TABLE IF NOT EXISTS "password_reset_request" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"user_id" char(8) NOT NULL,
	"is_initial_setup" boolean DEFAULT false NOT NULL,
	"is_resolved" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp NOT NULL,
	"resolved_at" timestamp
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "password_reset_request" ADD CONSTRAINT "password_reset_request_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
