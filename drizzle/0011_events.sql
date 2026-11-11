CREATE TABLE "events" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"subtitle" text DEFAULT '' NOT NULL,
	"starts_on" timestamp NOT NULL,
	"start_time" text DEFAULT '' NOT NULL,
	"ends_on" timestamp,
	"city" text DEFAULT '' NOT NULL,
	"venue" text DEFAULT '' NOT NULL,
	"congress" text DEFAULT '' NOT NULL,
	"description_html" text DEFAULT '' NOT NULL,
	"image_url" text,
	"registration" text DEFAULT 'none' NOT NULL,
	"registration_url" text,
	"registration_closes_on" timestamp,
	"recap_html" text DEFAULT '' NOT NULL,
	"recap_photos" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"status" "status" DEFAULT 'draft' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "events_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE INDEX "events_date" ON "events" USING btree ("starts_on");