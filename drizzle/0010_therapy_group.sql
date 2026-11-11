ALTER TABLE "solutions" ADD COLUMN "therapy_group" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "solutions" ADD COLUMN "proof_point" text DEFAULT '' NOT NULL;--> statement-breakpoint
UPDATE "solutions" SET "therapy_group" = CASE
  WHEN "slug" IN ('lvo', 'mvo') THEN 'ischemic'
  WHEN "slug" IN ('aneurysm', 'vasospasm') THEN 'hemorrhagic'
  WHEN "slug" IN ('drivewire', 'hyperdrive', 'access') THEN 'access'
  ELSE '' END;
