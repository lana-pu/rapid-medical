CREATE TABLE "page_views" (
	"id" serial PRIMARY KEY NOT NULL,
	"at" timestamp with time zone DEFAULT now() NOT NULL,
	"kind" text NOT NULL,
	"path" text NOT NULL,
	"visit" boolean DEFAULT false NOT NULL,
	"region" text,
	"country" text,
	"source" text,
	"referrer_host" text,
	"utm_source" text,
	"utm_medium" text,
	"utm_campaign" text,
	"file" text
);
--> statement-breakpoint
CREATE INDEX "page_views_at_idx" ON "page_views" USING btree ("at");