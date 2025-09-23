CREATE TABLE IF NOT EXISTS "task_recurrence" (
	"id" serial PRIMARY KEY NOT NULL,
	"task_id" integer NOT NULL,
	"user_id" char(8) NOT NULL,
	"recurrence_type" varchar(20) DEFAULT 'none' NOT NULL,
	"recurrence_interval" integer DEFAULT 1 NOT NULL,
	"parent_task_id" integer,
	"is_template" boolean DEFAULT false NOT NULL,
	"next_due_date" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "task_recurrence" ADD CONSTRAINT "task_recurrence_task_id_task_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."task"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "task_recurrence" ADD CONSTRAINT "task_recurrence_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "task_recurrence" ADD CONSTRAINT "task_recurrence_parent_task_id_task_id_fk" FOREIGN KEY ("parent_task_id") REFERENCES "public"."task"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;