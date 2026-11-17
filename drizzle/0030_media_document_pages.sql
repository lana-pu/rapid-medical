-- A PDF's pages as pictures and its text, for «the document on the page» (decision 2026-11-16, screens/material.md).
ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "pages" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "text" text DEFAULT '' NOT NULL;
