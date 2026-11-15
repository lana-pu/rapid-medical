CREATE TABLE "request_notes" (
	"id" serial PRIMARY KEY NOT NULL,
	"submission_id" integer NOT NULL,
	"user_id" integer,
	"user_name" text DEFAULT '' NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "contact_submissions" ADD COLUMN "read_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "request_notes" ADD CONSTRAINT "request_notes_submission_id_contact_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."contact_submissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "request_notes" ADD CONSTRAINT "request_notes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "request_notes_submission" ON "request_notes" USING btree ("submission_id");--> statement-breakpoint
-- the former single note becomes the first note of the thread (by whoever last touched the request: unknown — «Team»)
INSERT INTO "request_notes" ("submission_id", "user_name", "body", "created_at") SELECT "id", 'Team', "note", "created_at" FROM "contact_submissions" WHERE "note" <> '';--> statement-breakpoint
-- requests someone already worked on count as read
UPDATE "contact_submissions" SET "read_at" = "created_at" WHERE "status" <> 'new' AND "read_at" IS NULL;
