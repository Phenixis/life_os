ALTER TABLE "task" ADD COLUMN "state" varchar(20) DEFAULT 'to do' NOT NULL;
--> statement-breakpoint

UPDATE "task" SET "state" = 'done' WHERE "completed_at" IS NOT NULL;