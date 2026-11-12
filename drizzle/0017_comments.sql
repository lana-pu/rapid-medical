CREATE TABLE "comments" (
	"id" serial PRIMARY KEY NOT NULL,
	"resource" text NOT NULL,
	"record_id" integer NOT NULL,
	"anchor" text,
	"parent_id" integer,
	"body" text NOT NULL,
	"author_id" integer,
	"author_name" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"resolved_at" timestamp with time zone,
	"resolved_by_name" text
);
--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "comments_page" ON "comments" USING btree ("resource","record_id");