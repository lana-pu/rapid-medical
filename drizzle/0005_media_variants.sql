ALTER TABLE "media" ADD COLUMN "key" text;--> statement-breakpoint
ALTER TABLE "media" ADD COLUMN "variants" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "media" ADD COLUMN "placeholder" text;--> statement-breakpoint
ALTER TABLE "media" ADD COLUMN "poster_url" text;