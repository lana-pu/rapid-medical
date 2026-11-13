-- Usability pass 2026-11-13: «Customer support» on pages opens the contact form with the support topic chosen.
-- Stored pages and their drafts keep the old link; only that exact button changes (jsonb text keeps keys in order).
UPDATE "solutions" SET "blocks" = replace("blocks"::text, '{"href": "/contact-us?region={region}", "label": "Customer support"}', '{"href": "/contact-us?region={region}&topic=support", "label": "Customer support"}')::jsonb
WHERE "blocks"::text LIKE '%{"href": "/contact-us?region={region}", "label": "Customer support"}%';--> statement-breakpoint
UPDATE "pages" SET "blocks" = replace("blocks"::text, '{"href": "/contact-us?region={region}", "label": "Customer support"}', '{"href": "/contact-us?region={region}&topic=support", "label": "Customer support"}')::jsonb
WHERE "blocks"::text LIKE '%{"href": "/contact-us?region={region}", "label": "Customer support"}%';--> statement-breakpoint
UPDATE "site_pages" SET "blocks" = replace("blocks"::text, '{"href": "/contact-us?region={region}", "label": "Customer support"}', '{"href": "/contact-us?region={region}&topic=support", "label": "Customer support"}')::jsonb
WHERE "blocks"::text LIKE '%{"href": "/contact-us?region={region}", "label": "Customer support"}%';--> statement-breakpoint
UPDATE "drafts" SET "data" = replace("data"::text, '{"href": "/contact-us?region={region}", "label": "Customer support"}', '{"href": "/contact-us?region={region}&topic=support", "label": "Customer support"}')::jsonb
WHERE "data"::text LIKE '%{"href": "/contact-us?region={region}", "label": "Customer support"}%';
