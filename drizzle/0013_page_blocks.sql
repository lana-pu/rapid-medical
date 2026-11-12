CREATE TABLE "site_pages" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"region" "region",
	"title" text NOT NULL,
	"blocks" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"status" "status" DEFAULT 'published' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "pages" ADD COLUMN "blocks" jsonb;--> statement-breakpoint
ALTER TABLE "solutions" ADD COLUMN "blocks" jsonb;--> statement-breakpoint
CREATE UNIQUE INDEX "site_pages_key_region" ON "site_pages" USING btree ("key","region");--> statement-breakpoint
CREATE UNIQUE INDEX "site_pages_key_global" ON "site_pages" USING btree ("key") WHERE "site_pages"."region" is null;