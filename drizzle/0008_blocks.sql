ALTER TABLE "solutions" ADD COLUMN "overview_features" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "solutions" ADD COLUMN "annotated_image" jsonb;