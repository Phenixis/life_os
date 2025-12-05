ALTER TABLE "note" ADD COLUMN "share_token" varchar(32);--> statement-breakpoint
ALTER TABLE "note" ADD CONSTRAINT "note_share_token_unique" UNIQUE("share_token");