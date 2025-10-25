CREATE TABLE IF NOT EXISTS "wmcdm_criterion" (
	"id" serial PRIMARY KEY NOT NULL,
	"matrix_id" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"weight" integer DEFAULT 1 NOT NULL,
	"description" text,
	"position" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "wmcdm_matrix" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" char(8) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "wmcdm_option" (
	"id" serial PRIMARY KEY NOT NULL,
	"matrix_id" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"position" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "wmcdm_score" (
	"id" serial PRIMARY KEY NOT NULL,
	"matrix_id" integer NOT NULL,
	"option_id" integer NOT NULL,
	"criterion_id" integer NOT NULL,
	"score" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "wmcdm_criterion" ADD CONSTRAINT "wmcdm_criterion_matrix_id_wmcdm_matrix_id_fk" FOREIGN KEY ("matrix_id") REFERENCES "public"."wmcdm_matrix"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "wmcdm_matrix" ADD CONSTRAINT "wmcdm_matrix_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "wmcdm_option" ADD CONSTRAINT "wmcdm_option_matrix_id_wmcdm_matrix_id_fk" FOREIGN KEY ("matrix_id") REFERENCES "public"."wmcdm_matrix"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "wmcdm_score" ADD CONSTRAINT "wmcdm_score_matrix_id_wmcdm_matrix_id_fk" FOREIGN KEY ("matrix_id") REFERENCES "public"."wmcdm_matrix"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "wmcdm_score" ADD CONSTRAINT "wmcdm_score_option_id_wmcdm_option_id_fk" FOREIGN KEY ("option_id") REFERENCES "public"."wmcdm_option"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "wmcdm_score" ADD CONSTRAINT "wmcdm_score_criterion_id_wmcdm_criterion_id_fk" FOREIGN KEY ("criterion_id") REFERENCES "public"."wmcdm_criterion"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
