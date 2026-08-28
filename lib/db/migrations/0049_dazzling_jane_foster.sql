CREATE TABLE IF NOT EXISTS "meal_planner-ingredient_to_meal_to_list" (
	"id" serial PRIMARY KEY NOT NULL,
	"ingredient_to_meal_id" integer NOT NULL,
	"list_id" integer NOT NULL,
	"day" timestamp,
	"moment_of_day" varchar(50),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "meal_planner-ingredient_to_meal" (
	"id" serial PRIMARY KEY NOT NULL,
	"meal_id" integer NOT NULL,
	"ingredient_id" integer NOT NULL,
	"quantity" real DEFAULT 1 NOT NULL,
	"unit" varchar(50) DEFAULT 'unit' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "meal_planner-ingredient" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar(8) NOT NULL,
	"image_url" varchar(1000),
	"name" varchar(255) NOT NULL,
	"description" varchar(1000),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "meal_planner-list" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar(8) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" varchar(1000),
	"project_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "meal_planner-meal" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar(8) NOT NULL,
	"image_url" varchar(1000),
	"name" varchar(255) NOT NULL,
	"description" varchar(1000),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "meal_planner-ingredient_to_meal_to_list" ADD CONSTRAINT "meal_planner-ingredient_to_meal_to_list_ingredient_to_meal_id_meal_planner-ingredient_to_meal_id_fk" FOREIGN KEY ("ingredient_to_meal_id") REFERENCES "public"."meal_planner-ingredient_to_meal"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "meal_planner-ingredient_to_meal_to_list" ADD CONSTRAINT "meal_planner-ingredient_to_meal_to_list_list_id_meal_planner-list_id_fk" FOREIGN KEY ("list_id") REFERENCES "public"."meal_planner-list"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "meal_planner-ingredient_to_meal" ADD CONSTRAINT "meal_planner-ingredient_to_meal_meal_id_meal_planner-meal_id_fk" FOREIGN KEY ("meal_id") REFERENCES "public"."meal_planner-meal"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "meal_planner-ingredient_to_meal" ADD CONSTRAINT "meal_planner-ingredient_to_meal_ingredient_id_meal_planner-ingredient_id_fk" FOREIGN KEY ("ingredient_id") REFERENCES "public"."meal_planner-ingredient"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "meal_planner-ingredient" ADD CONSTRAINT "meal_planner-ingredient_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "meal_planner-list" ADD CONSTRAINT "meal_planner-list_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "meal_planner-list" ADD CONSTRAINT "meal_planner-list_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "meal_planner-meal" ADD CONSTRAINT "meal_planner-meal_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "meal_planner_itm_to_list_itm_id_idx" ON "meal_planner-ingredient_to_meal_to_list" USING btree ("ingredient_to_meal_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "meal_planner_itm_to_list_list_id_idx" ON "meal_planner-ingredient_to_meal_to_list" USING btree ("list_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "meal_planner_itm_to_list_list_id_day_idx" ON "meal_planner-ingredient_to_meal_to_list" USING btree ("list_id","day");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "meal_planner_ingredient_to_meal_meal_id_idx" ON "meal_planner-ingredient_to_meal" USING btree ("meal_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "meal_planner_ingredient_to_meal_ingredient_id_idx" ON "meal_planner-ingredient_to_meal" USING btree ("ingredient_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "meal_planner_ingredient_to_meal_meal_id_deleted_at_idx" ON "meal_planner-ingredient_to_meal" USING btree ("meal_id","deleted_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "meal_planner_ingredient_user_id_idx" ON "meal_planner-ingredient" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "meal_planner_ingredient_user_id_deleted_at_idx" ON "meal_planner-ingredient" USING btree ("user_id","deleted_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "meal_planner_list_user_id_idx" ON "meal_planner-list" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "meal_planner_list_user_id_deleted_at_idx" ON "meal_planner-list" USING btree ("user_id","deleted_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "meal_planner_list_project_id_idx" ON "meal_planner-list" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "meal_planner_meal_user_id_idx" ON "meal_planner-meal" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "meal_planner_meal_user_id_deleted_at_idx" ON "meal_planner-meal" USING btree ("user_id","deleted_at");