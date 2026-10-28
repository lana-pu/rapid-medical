CREATE TYPE "public"."region" AS ENUM('us', 'ous');--> statement-breakpoint
CREATE TYPE "public"."status" AS ENUM('draft', 'published');--> statement-breakpoint
CREATE TYPE "public"."submission_status" AS ENUM('new', 'in_progress', 'done', 'spam');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('admin', 'editor');--> statement-breakpoint
CREATE TABLE "contact_submissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"form" text DEFAULT 'contact' NOT NULL,
	"topic" text DEFAULT '' NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"organization" text DEFAULT '' NOT NULL,
	"email" text NOT NULL,
	"phone" text DEFAULT '' NOT NULL,
	"region" text DEFAULT '' NOT NULL,
	"country" text DEFAULT '' NOT NULL,
	"state" text DEFAULT '' NOT NULL,
	"message" text DEFAULT '' NOT NULL,
	"opt_in" boolean DEFAULT false NOT NULL,
	"meta" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"status" "submission_status" DEFAULT 'new' NOT NULL,
	"ip" text,
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "jobs" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"location" text DEFAULT '' NOT NULL,
	"department" text DEFAULT '' NOT NULL,
	"description_md" text DEFAULT '' NOT NULL,
	"apply_url" text,
	"apply_email" text,
	"status" "status" DEFAULT 'draft' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "jobs_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "media" (
	"id" serial PRIMARY KEY NOT NULL,
	"url" text NOT NULL,
	"filename" text NOT NULL,
	"mime" text NOT NULL,
	"size" integer NOT NULL,
	"width" integer,
	"height" integer,
	"alt" text DEFAULT '' NOT NULL,
	"source_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "news_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"published_on" timestamp NOT NULL,
	"url" text NOT NULL,
	"source" text DEFAULT '' NOT NULL,
	"image_url" text,
	"excerpt" text DEFAULT '' NOT NULL,
	"featured" boolean DEFAULT false NOT NULL,
	"status" "status" DEFAULT 'published' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pages" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"region" "region",
	"title" text NOT NULL,
	"body_md" text DEFAULT '' NOT NULL,
	"meta_title" text DEFAULT '' NOT NULL,
	"meta_description" text DEFAULT '' NOT NULL,
	"noindex" boolean DEFAULT false NOT NULL,
	"status" "status" DEFAULT 'draft' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"full_name" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "products_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "publications" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"authors" text DEFAULT '' NOT NULL,
	"journal" text DEFAULT '' NOT NULL,
	"published_on" timestamp NOT NULL,
	"url" text,
	"pdf_url" text,
	"doi" text,
	"product_id" integer,
	"regions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"featured" boolean DEFAULT false NOT NULL,
	"image_url" text,
	"status" "status" DEFAULT 'published' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "redirects" (
	"id" serial PRIMARY KEY NOT NULL,
	"from" text NOT NULL,
	"to" text NOT NULL,
	"permanent" boolean DEFAULT true NOT NULL,
	"hits" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "redirects_from_unique" UNIQUE("from")
);
--> statement-breakpoint
CREATE TABLE "site_settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "solutions" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"region" "region" NOT NULL,
	"product_id" integer,
	"status" "status" DEFAULT 'draft' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"nav_label" text NOT NULL,
	"breadcrumb" text DEFAULT '' NOT NULL,
	"meta_title" text DEFAULT '' NOT NULL,
	"meta_description" text DEFAULT '' NOT NULL,
	"hero_title" text NOT NULL,
	"hero_body" text DEFAULT '' NOT NULL,
	"hero_image_url" text,
	"hero_cta" jsonb,
	"intro_title" text,
	"intro_body" text,
	"benefits" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"overview_title" text DEFAULT 'Product overview' NOT NULL,
	"overview_body" text DEFAULT '' NOT NULL,
	"overview_image_url" text,
	"spec_image_urls" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"spec_note" text DEFAULT 'Not all products are available in all countries.' NOT NULL,
	"how_it_works" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"in_practice" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"action_links" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"action_note" text,
	"webinar_cta_enabled" boolean DEFAULT true NOT NULL,
	"closing_title" text,
	"closing_body" text,
	"regulatory_md" text DEFAULT '' NOT NULL,
	"references_md" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "team_members" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"title" text NOT NULL,
	"long_title" text DEFAULT '' NOT NULL,
	"bio_md" text DEFAULT '' NOT NULL,
	"photo_url" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"status" "status" DEFAULT 'published' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "team_members_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"password_hash" text NOT NULL,
	"role" "user_role" DEFAULT 'editor' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_login_at" timestamp with time zone,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "webinars" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"speaker" text DEFAULT '' NOT NULL,
	"event" text DEFAULT '' NOT NULL,
	"held_on" timestamp,
	"video_url" text,
	"image_url" text,
	"product_id" integer,
	"regions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"status" "status" DEFAULT 'published' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "publications" ADD CONSTRAINT "publications_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "solutions" ADD CONSTRAINT "solutions_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webinars" ADD CONSTRAINT "webinars_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "news_date" ON "news_items" USING btree ("published_on");--> statement-breakpoint
CREATE UNIQUE INDEX "pages_slug_region" ON "pages" USING btree ("slug","region");--> statement-breakpoint
CREATE INDEX "publications_date" ON "publications" USING btree ("published_on");--> statement-breakpoint
CREATE UNIQUE INDEX "solutions_slug_region" ON "solutions" USING btree ("slug","region");