-- Usability pass 2026-11-13: «Request to view» (In-Practice tab) opens the webinars with this product's webinar chosen.
UPDATE "solutions" SET "blocks" = replace("blocks"::text, '{"href": "/{region}/webinars", "label": "Request to view"}', '{"href": "/{region}/webinars?product={product}", "label": "Request to view"}')::jsonb
WHERE "blocks"::text LIKE '%{"href": "/{region}/webinars", "label": "Request to view"}%';--> statement-breakpoint
UPDATE "drafts" SET "data" = replace("data"::text, '{"href": "/{region}/webinars", "label": "Request to view"}', '{"href": "/{region}/webinars?product={product}", "label": "Request to view"}')::jsonb
WHERE "resource" = 'solutions' AND "data"::text LIKE '%{"href": "/{region}/webinars", "label": "Request to view"}%';
