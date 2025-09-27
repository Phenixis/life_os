ALTER TABLE "user_subscription" DROP COLUMN IF EXISTS "current_period_start";--> statement-breakpoint
ALTER TABLE "user_subscription" DROP COLUMN IF EXISTS "current_period_end";--> statement-breakpoint
ALTER TABLE "user_subscription" DROP COLUMN IF EXISTS "trial_start";--> statement-breakpoint
ALTER TABLE "user_subscription" DROP COLUMN IF EXISTS "trial_end";