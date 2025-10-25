ALTER TABLE "project" ALTER COLUMN "title" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "task" ALTER COLUMN "user_id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "task" ALTER COLUMN "importance" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "task" ALTER COLUMN "urgency" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "task" ALTER COLUMN "duration" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "task" ALTER COLUMN "score" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "task" ALTER COLUMN "due" DROP DEFAULT;