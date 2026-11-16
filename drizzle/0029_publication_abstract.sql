-- The article's abstract, quoted with its source, on the publication's page when the full text cannot be shown there
-- (decision 2026-11-15; full text only where the licence or a reprint right allows).
ALTER TABLE "publications" ADD COLUMN IF NOT EXISTS "abstract" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "publications" ADD COLUMN IF NOT EXISTS "abstract_source" text DEFAULT '' NOT NULL;
