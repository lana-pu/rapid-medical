ALTER TABLE "jobs" ADD COLUMN "description_html" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "pages" ADD COLUMN "body_html" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "solutions" ADD COLUMN "specs" jsonb;--> statement-breakpoint
ALTER TABLE "solutions" ADD COLUMN "regulatory_html" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "solutions" ADD COLUMN "references_html" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "team_members" ADD COLUMN "bio_html" text DEFAULT '' NOT NULL;