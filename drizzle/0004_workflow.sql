CREATE TYPE "public"."review_status" AS ENUM('editing', 'in_review', 'changes_requested', 'approved');--> statement-breakpoint
ALTER TYPE "public"."user_role" ADD VALUE 'approver' BEFORE 'editor';--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"user_name" text DEFAULT '' NOT NULL,
	"action" text NOT NULL,
	"resource" text,
	"record_id" text,
	"label" text DEFAULT '' NOT NULL,
	"meta" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"ip" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "drafts" (
	"id" serial PRIMARY KEY NOT NULL,
	"resource" text NOT NULL,
	"record_id" integer NOT NULL,
	"data" jsonb,
	"review_status" "review_status" DEFAULT 'editing' NOT NULL,
	"review_note" text DEFAULT '' NOT NULL,
	"publish_at" timestamp with time zone,
	"updated_by_id" integer,
	"updated_by_name" text DEFAULT '' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "revisions" (
	"id" serial PRIMARY KEY NOT NULL,
	"resource" text NOT NULL,
	"record_id" integer NOT NULL,
	"kind" text NOT NULL,
	"data" jsonb NOT NULL,
	"user_id" integer,
	"user_name" text DEFAULT '' NOT NULL,
	"note" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "drafts" ADD CONSTRAINT "drafts_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "revisions" ADD CONSTRAINT "revisions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_created" ON "audit_log" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "drafts_resource_record" ON "drafts" USING btree ("resource","record_id");--> statement-breakpoint
CREATE INDEX "revisions_record" ON "revisions" USING btree ("resource","record_id","created_at");