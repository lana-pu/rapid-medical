CREATE TYPE "public"."material_kind" AS ENUM('study', 'publication', 'news', 'case', 'document');--> statement-breakpoint
CREATE TABLE "materials" (
	"id" serial PRIMARY KEY NOT NULL,
	"kind" "material_kind" DEFAULT 'publication' NOT NULL,
	"title" text NOT NULL,
	"published_on" timestamp NOT NULL,
	"product_id" integer,
	"regions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"authors" text DEFAULT '' NOT NULL,
	"journal" text DEFAULT '' NOT NULL,
	"source" text DEFAULT '' NOT NULL,
	"url" text,
	"doi" text,
	"pdf_url" text,
	"pdf_license" text DEFAULT '' NOT NULL,
	"pdf_source" text,
	"abstract" text DEFAULT '' NOT NULL,
	"abstract_source" text DEFAULT '' NOT NULL,
	"excerpt" text DEFAULT '' NOT NULL,
	"image_url" text,
	"show_in_evidence" boolean DEFAULT false NOT NULL,
	"show_in_news" boolean DEFAULT false NOT NULL,
	"featured" boolean DEFAULT false NOT NULL,
	"slug" text,
	"body_html" text DEFAULT '' NOT NULL,
	"blocks" jsonb,
	"meta_title" text DEFAULT '' NOT NULL,
	"meta_description" text DEFAULT '' NOT NULL,
	"share_image_url" text,
	"noindex" boolean DEFAULT false NOT NULL,
	"legacy_ref" text,
	"status" "status" DEFAULT 'published' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "materials" ADD CONSTRAINT "materials_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "materials_date" ON "materials" USING btree ("published_on");--> statement-breakpoint
CREATE INDEX "materials_slug" ON "materials" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "materials_legacy" ON "materials" USING btree ("legacy_ref");--> statement-breakpoint
-- ADR-009 step 1 (docs/briefs/materials.md): move publications, news and the material pages one to one.
-- Publications keep their ids (their addresses /{region}/evidence/{id}-… stay); news and pages get new ids.
INSERT INTO "materials" ("id", "kind", "title", "published_on", "product_id", "regions", "authors", "journal", "url", "doi", "pdf_url", "pdf_license", "pdf_source", "abstract", "abstract_source", "image_url", "show_in_evidence", "featured", "legacy_ref", "status", "created_at", "updated_at")
SELECT "id", 'publication', "title", "published_on", "product_id", "regions", "authors", "journal", "url", "doi", "pdf_url", "pdf_license", "pdf_source", "abstract", "abstract_source", "image_url", true, "featured", 'publications:' || "id", "status", "created_at", "updated_at"
FROM "publications" ORDER BY "id";--> statement-breakpoint
SELECT setval(pg_get_serial_sequence('materials', 'id'), GREATEST((SELECT COALESCE(MAX("id"), 0) FROM "materials"), 1));--> statement-breakpoint
INSERT INTO "materials" ("kind", "title", "published_on", "source", "url", "excerpt", "image_url", "show_in_news", "featured", "legacy_ref", "status", "created_at", "updated_at")
SELECT 'news', "title", "published_on", "source", "url", "excerpt", "image_url", true, "featured", 'news_items:' || "id", "status", "created_at", "updated_at"
FROM "news_items" ORDER BY "published_on", "id";--> statement-breakpoint
INSERT INTO "materials" ("kind", "title", "published_on", "regions", "slug", "body_html", "blocks", "meta_title", "meta_description", "share_image_url", "noindex", "legacy_ref", "status", "created_at", "updated_at")
SELECT CASE
    WHEN "slug" IN ('success-study-final-results', 'distals-results', 'dw24-svin-poster') THEN 'study'::"material_kind"
    WHEN "slug" = 'LongTerm_Outcomes' THEN 'publication'::"material_kind"
    WHEN "slug" = 'ifu-tigertriever-canada' THEN 'document'::"material_kind"
    ELSE 'case'::"material_kind" END,
  "title", "created_at"::date, CASE WHEN "region" IS NULL THEN '[]'::jsonb ELSE jsonb_build_array("region") END,
  "slug", "body_html", "blocks", "meta_title", "meta_description", "share_image_url", "noindex", 'pages:' || "id", "status", "created_at", "updated_at"
FROM "pages"
WHERE "slug" IN ('success-study-final-results', 'distals-results', 'dw24-svin-poster', 'LongTerm_Outcomes', 'ifu-tigertriever-canada', 'comaneci-spinal-case-patankar', 'see-the-comparison', 'comparison-video')
ORDER BY "id";--> statement-breakpoint
-- The editorial trail follows the records (empty before launch, kept correct for any database).
UPDATE "drafts" d SET "resource" = 'materials', "record_id" = m."id",
  "data" = CASE WHEN d."resource" = 'pages' AND d."data" IS NOT NULL
    THEN (d."data" - 'region') || jsonb_build_object('regions', CASE WHEN d."data"->>'region' IS NULL THEN '[]'::jsonb ELSE jsonb_build_array(d."data"->>'region') END)
    ELSE d."data" END
FROM "materials" m WHERE m."legacy_ref" = (CASE d."resource" WHEN 'publications' THEN 'publications:' WHEN 'news' THEN 'news_items:' WHEN 'pages' THEN 'pages:' END) || d."record_id";--> statement-breakpoint
UPDATE "revisions" r SET "resource" = 'materials', "record_id" = m."id"
FROM "materials" m WHERE m."legacy_ref" = (CASE r."resource" WHEN 'publications' THEN 'publications:' WHEN 'news' THEN 'news_items:' WHEN 'pages' THEN 'pages:' END) || r."record_id";--> statement-breakpoint
UPDATE "comments" c SET "resource" = 'materials', "record_id" = m."id"
FROM "materials" m WHERE m."legacy_ref" = (CASE c."resource" WHEN 'publications' THEN 'publications:' WHEN 'news' THEN 'news_items:' WHEN 'pages' THEN 'pages:' END) || c."record_id";--> statement-breakpoint
UPDATE "audit_log" a SET "resource" = 'materials', "record_id" = m."id"::text
FROM "materials" m WHERE m."legacy_ref" = (CASE a."resource" WHEN 'publications' THEN 'publications:' WHEN 'news' THEN 'news_items:' WHEN 'pages' THEN 'pages:' END) || a."record_id";--> statement-breakpoint
-- The moved pages live in materials now (whole rows, legacy_ref); publications and news_items stay for rollback.
DELETE FROM "pages" WHERE 'pages:' || "id" IN (SELECT "legacy_ref" FROM "materials" WHERE "legacy_ref" LIKE 'pages:%');
