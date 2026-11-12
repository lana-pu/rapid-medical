-- Decision 2026-11-10 (Emily's audit): the Duda one-media "wrapper" pages are replaced by links that open the
-- video / picture in a window on the product page. Unpublished (kept as drafts, reversible), not deleted;
-- their old URLs redirect to the product page (content/seed/settings.ts → REDIRECTS).
UPDATE "pages" SET "status" = 'draft', "updated_at" = now()
-- region compared as text: on a fresh database all migrations run in one transaction, where the enum value
-- 'apac' added by 0001 cannot be used yet (Postgres 55P04)
WHERE ("region"::text, "slug") IN (
  ('us', 'see-the-comparison'),
  ('apac', 'see-the-comparison'),
  ('ous', 'comparison-video'),
  ('ous', 'comaneci-for-vasospasm'),
  ('apac', 'comaneci-for-vasospasm'),
  ('us', 'dw24-svin-poster')
);
