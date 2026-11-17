-- Evidence redesign (DESIGN.md → Evidence, decisions 2026-11-15): the number and the carousel become «overview» (the
-- region's publications counted per product, the line, the featured ones as cards); «Featured publications» (the latest
-- three with a picture — a repeat of the featured ones) is removed; the tabs by product become the archive («library»:
-- search, product filter, rows). Texts stay as they are. Live pages of every region and their drafts.
UPDATE "site_pages" sp SET "blocks" = (
  SELECT jsonb_agg(
    CASE
      WHEN e->>'type' = 'publications' AND e->>'variant' = 'spotlight' THEN jsonb_set(e, '{variant}', '"overview"')
      WHEN e->>'type' = 'publications' AND e->>'variant' = 'byProduct' THEN jsonb_set(e, '{variant}', '"library"')
      ELSE e
    END ORDER BY i)
  FROM jsonb_array_elements(sp."blocks") WITH ORDINALITY t(e, i)
  WHERE NOT (e->>'type' = 'publications' AND e->>'variant' = 'cards' AND e->>'source' = 'latestPublications')
)
WHERE sp."key" = 'evidence' AND sp."blocks" @> '[{"type": "publications", "variant": "spotlight"}]';--> statement-breakpoint
UPDATE "drafts" d SET "data" = jsonb_set(d."data", '{blocks}', (
  SELECT jsonb_agg(
    CASE
      WHEN e->>'type' = 'publications' AND e->>'variant' = 'spotlight' THEN jsonb_set(e, '{variant}', '"overview"')
      WHEN e->>'type' = 'publications' AND e->>'variant' = 'byProduct' THEN jsonb_set(e, '{variant}', '"library"')
      ELSE e
    END ORDER BY i)
  FROM jsonb_array_elements(d."data"->'blocks') WITH ORDINALITY t(e, i)
  WHERE NOT (e->>'type' = 'publications' AND e->>'variant' = 'cards' AND e->>'source' = 'latestPublications')
))
WHERE d."resource" = 'site-pages'
  AND d."record_id" IN (SELECT "id" FROM "site_pages" WHERE "key" = 'evidence')
  AND jsonb_typeof(d."data"->'blocks') = 'array'
  AND d."data"->'blocks' @> '[{"type": "publications", "variant": "spotlight"}]';
