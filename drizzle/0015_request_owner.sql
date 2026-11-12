ALTER TABLE "contact_submissions" ADD COLUMN "assigned_to_id" integer;--> statement-breakpoint
ALTER TABLE "contact_submissions" ADD COLUMN "note" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "contact_submissions" ADD CONSTRAINT "contact_submissions_assigned_to_id_users_id_fk" FOREIGN KEY ("assigned_to_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;