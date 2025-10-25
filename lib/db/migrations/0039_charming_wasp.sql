CREATE TABLE IF NOT EXISTS "task_recurrency"
(
    "task_id"
    integer
    PRIMARY
    KEY
    NOT
    NULL,
    "cycle"
    varchar
(
    50
) NOT NULL,
    "interval" integer NOT NULL,
    "until" timestamp,
    "count" integer,
    "current_count" integer DEFAULT 0 NOT NULL
    );
--> statement-breakpoint

DO
$$
BEGIN
ALTER TABLE "task_recurrency"
    ADD CONSTRAINT "task_recurrency_task_id_task_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."task" ("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

ALTER TABLE "feature" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "plan_feature" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "feature" CASCADE;--> statement-breakpoint
DROP TABLE "plan_feature" CASCADE;
--> statement-breakpoint

ALTER TABLE "note" DROP CONSTRAINT "note_project_title_project_title_fk";
--> statement-breakpoint
ALTER TABLE "task" DROP CONSTRAINT "task_project_title_project_title_fk";
--> statement-breakpoint

-- 1. Add the id column as a serial (auto-increment) field
ALTER TABLE "project"
    ADD COLUMN "id" SERIAL;
--> statement-breakpoint

-- 2. Set id as NOT NULL for all rows
ALTER TABLE "project"
    ALTER COLUMN "id" SET NOT NULL;
--> statement-breakpoint

-- 3. Drop the primary key on title
ALTER TABLE "project" DROP CONSTRAINT "project_pkey";
--> statement-breakpoint

-- 4. Set id as the new primary key
ALTER TABLE "project"
    ADD PRIMARY KEY ("id");--> statement-breakpoint

ALTER TABLE "note"
    ADD COLUMN "project_id" integer;--> statement-breakpoint

DO
$$
BEGIN
ALTER TABLE "note"
    ADD CONSTRAINT "note_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project" ("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

UPDATE "note"
SET project_id = project.id FROM project
WHERE note.project_title = project.title;--> statement-breakpoint

ALTER TABLE "task"
    ADD COLUMN "project_id" integer;--> statement-breakpoint

DO
$$
BEGIN
ALTER TABLE "task"
    ADD CONSTRAINT "task_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project" ("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

UPDATE "task"
SET project_id = project.id FROM project
WHERE task.project_title = project.title;--> statement-breakpoint

ALTER TABLE "note" DROP COLUMN IF EXISTS "project_title";--> statement-breakpoint
ALTER TABLE "task" DROP COLUMN IF EXISTS "project_title";
