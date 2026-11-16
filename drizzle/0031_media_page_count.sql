-- How many pages the PDF has: when not all of them were drawn (limits, screens/material.md), the page says so.
ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "page_count" integer DEFAULT 0 NOT NULL;
