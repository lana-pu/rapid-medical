ALTER TYPE "public"."region" ADD VALUE 'apac';--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "family" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "regions" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "aliases" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "solutions" ADD COLUMN "hero_video_url" text;--> statement-breakpoint
ALTER TABLE "solutions" ADD COLUMN "intro_video_url" text;--> statement-breakpoint
ALTER TABLE "solutions" ADD COLUMN "intro_image_url" text;--> statement-breakpoint
ALTER TABLE "solutions" ADD COLUMN "closing_embed_url" text;