-- A PDF copied from an open-access source (decision 2026-11-15: the full text is shown on our page where the licence
-- allows it): its licence and where it came from, shown under the PDF.
ALTER TABLE "publications" ADD COLUMN IF NOT EXISTS "pdf_license" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "publications" ADD COLUMN IF NOT EXISTS "pdf_source" text DEFAULT '' NOT NULL;
