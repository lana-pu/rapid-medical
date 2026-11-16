-- Careers redesign (DESIGN.md → Careers): open positions become a section of Careers (`/open-positions` redirects to
-- `/careers#open-positions`), right above the general application, which takes the shared-line layout. Nothing is
-- dropped: the form keeps its title, EEO note, topics and anchor. Runs once, where the roles section is not there yet.
UPDATE "site_pages" sp SET "blocks" = (
  SELECT jsonb_agg(x ORDER BY i, k)
  FROM (
    SELECT i, 1 AS k, CASE WHEN e->>'type' = 'form' AND e->>'variant' = 'section' THEN jsonb_set(e, '{variant}', '"split"') ELSE e END AS x
    FROM jsonb_array_elements(sp."blocks") WITH ORDINALITY t(e, i)
    UNION ALL
    SELECT i, 0, jsonb_build_object('id', substr(md5(random()::text), 1, 10), 'type', 'jobs', 'variant', 'roles', 'source', 'openRoles',
      'data', '{"anchor": "open-positions", "title": "Open positions", "note": "Applications go through Spark Hire.", "generalHref": "#general-interest"}'::jsonb)
    FROM jsonb_array_elements(sp."blocks") WITH ORDINALITY t(e, i)
    WHERE e->>'type' = 'form' AND e->>'variant' = 'section'
  ) q
)
WHERE sp."key" = 'careers'
  AND sp."blocks" @> '[{"type": "form", "variant": "section"}]'
  AND NOT sp."blocks" @> '[{"type": "jobs"}]';--> statement-breakpoint
UPDATE "drafts" d SET "data" = jsonb_set(d."data", '{blocks}', (
  SELECT jsonb_agg(x ORDER BY i, k)
  FROM (
    SELECT i, 1 AS k, CASE WHEN e->>'type' = 'form' AND e->>'variant' = 'section' THEN jsonb_set(e, '{variant}', '"split"') ELSE e END AS x
    FROM jsonb_array_elements(d."data"->'blocks') WITH ORDINALITY t(e, i)
    UNION ALL
    SELECT i, 0, jsonb_build_object('id', substr(md5(random()::text), 1, 10), 'type', 'jobs', 'variant', 'roles', 'source', 'openRoles',
      'data', '{"anchor": "open-positions", "title": "Open positions", "note": "Applications go through Spark Hire.", "generalHref": "#general-interest"}'::jsonb)
    FROM jsonb_array_elements(d."data"->'blocks') WITH ORDINALITY t(e, i)
    WHERE e->>'type' = 'form' AND e->>'variant' = 'section'
  ) q
))
WHERE d."resource" = 'site-pages'
  AND d."record_id" IN (SELECT "id" FROM "site_pages" WHERE "key" = 'careers')
  AND jsonb_typeof(d."data"->'blocks') = 'array'
  AND d."data"->'blocks' @> '[{"type": "form", "variant": "section"}]'
  AND NOT d."data"->'blocks' @> '[{"type": "jobs"}]';
