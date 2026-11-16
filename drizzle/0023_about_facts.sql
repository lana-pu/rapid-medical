-- About redesign (DESIGN.md → About): the intro («text large») and «What we do» («text surface») become one block —
-- company facts on the left, both texts on the right. Nothing is dropped: the intro keeps its text and image,
-- «What we do» moves into title2 / body2. Runs only where both old blocks are still there (live page and its draft).
UPDATE "site_pages" sp SET "blocks" = (
  SELECT jsonb_agg(
    CASE WHEN e->>'type' = 'text' AND e->>'variant' = 'large' THEN
      jsonb_build_object('id', e->'id', 'type', 'text', 'variant', 'facts', 'source', 'companyFacts', 'data',
        coalesce(e->'data', '{}'::jsonb)
        || '{"countries": "30+", "headquarters": "Yokneam, Israel"}'::jsonb
        || coalesce((SELECT jsonb_strip_nulls(jsonb_build_object('title2', s->'data'->'title', 'body2', s->'data'->'body'))
                     FROM jsonb_array_elements(sp."blocks") s WHERE s->>'type' = 'text' AND s->>'variant' = 'surface' LIMIT 1), '{}'::jsonb))
    ELSE e END ORDER BY i)
  FROM jsonb_array_elements(sp."blocks") WITH ORDINALITY t(e, i)
  WHERE NOT (e->>'type' = 'text' AND e->>'variant' = 'surface')
)
WHERE sp."key" = 'about'
  AND sp."blocks" @> '[{"type": "text", "variant": "large"}]'
  AND sp."blocks" @> '[{"type": "text", "variant": "surface"}]';--> statement-breakpoint
UPDATE "drafts" d SET "data" = jsonb_set(d."data", '{blocks}', (
  SELECT jsonb_agg(
    CASE WHEN e->>'type' = 'text' AND e->>'variant' = 'large' THEN
      jsonb_build_object('id', e->'id', 'type', 'text', 'variant', 'facts', 'source', 'companyFacts', 'data',
        coalesce(e->'data', '{}'::jsonb)
        || '{"countries": "30+", "headquarters": "Yokneam, Israel"}'::jsonb
        || coalesce((SELECT jsonb_strip_nulls(jsonb_build_object('title2', s->'data'->'title', 'body2', s->'data'->'body'))
                     FROM jsonb_array_elements(d."data"->'blocks') s WHERE s->>'type' = 'text' AND s->>'variant' = 'surface' LIMIT 1), '{}'::jsonb))
    ELSE e END ORDER BY i)
  FROM jsonb_array_elements(d."data"->'blocks') WITH ORDINALITY t(e, i)
  WHERE NOT (e->>'type' = 'text' AND e->>'variant' = 'surface')
))
WHERE d."resource" = 'site-pages'
  AND d."record_id" IN (SELECT "id" FROM "site_pages" WHERE "key" = 'about')
  AND jsonb_typeof(d."data"->'blocks') = 'array'
  AND d."data"->'blocks' @> '[{"type": "text", "variant": "large"}]'
  AND d."data"->'blocks' @> '[{"type": "text", "variant": "surface"}]';
