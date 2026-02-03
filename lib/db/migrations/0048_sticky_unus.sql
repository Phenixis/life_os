CREATE TABLE IF NOT EXISTS "addiction" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar(8) NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" varchar(1000),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "addiction_entries" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar(8) NOT NULL,
	"addiction_id" integer NOT NULL,
	"content" varchar(250) NOT NULL,
	"relapse_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "addiction_relapses" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar(8) NOT NULL,
	"addiction_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "addiction" ADD CONSTRAINT "addiction_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "addiction_entries" ADD CONSTRAINT "addiction_entries_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "addiction_entries" ADD CONSTRAINT "addiction_entries_addiction_id_addiction_id_fk" FOREIGN KEY ("addiction_id") REFERENCES "public"."addiction"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "addiction_entries" ADD CONSTRAINT "addiction_entries_relapse_id_addiction_relapses_id_fk" FOREIGN KEY ("relapse_id") REFERENCES "public"."addiction_relapses"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "addiction_relapses" ADD CONSTRAINT "addiction_relapses_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "addiction_relapses" ADD CONSTRAINT "addiction_relapses_addiction_id_addiction_id_fk" FOREIGN KEY ("addiction_id") REFERENCES "public"."addiction"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
