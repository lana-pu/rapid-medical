-- The product of the materials kept at their old address (moved pages, 0032): the old pages had none, and a therapy page
-- lists its product's studies, cases and IFU (docs/screens/therapy.md, 2026-11-19). Same mapping as MATERIAL_PRODUCTS in
-- src/lib/material.ts. Only where no product is set yet — a product someone chose since is kept.
UPDATE "materials" m SET "product_id" = p."id"
FROM "products" p,
  (VALUES
    ('success-study-final-results', 'comaneci'),
    ('distals-results', 'tigertriever-13'),
    ('dw24-svin-poster', 'drivewire'),
    ('comaneci-spinal-case-patankar', 'comaneci'),
    ('ifu-tigertriever-canada', 'tigertriever')
  ) AS map(material_slug, product_slug)
WHERE m."slug" = map.material_slug AND p."slug" = map.product_slug AND m."product_id" IS NULL;
