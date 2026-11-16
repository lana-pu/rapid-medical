-- «PDF source» is a url field: the admin saves an empty one as null (security review 2026-11-15 — with NOT NULL every
-- save of a publication without a source failed).
ALTER TABLE "publications" ALTER COLUMN "pdf_source" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "publications" ALTER COLUMN "pdf_source" DROP DEFAULT;
