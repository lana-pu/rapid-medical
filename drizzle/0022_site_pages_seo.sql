ALTER TABLE "site_pages" ADD COLUMN "meta_title" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "site_pages" ADD COLUMN "meta_description" text DEFAULT '' NOT NULL;--> statement-breakpoint
-- the texts the site used until now move to the pages themselves (docs/screens/admin-seo.md): nothing changes for Google
UPDATE "site_pages" SET "meta_title" = 'Rapid Medical™ | Neurovascular Therapy Solutions', "meta_description" = 'Purpose-built devices for stroke intervention. Personalized tools for patient anatomy.' WHERE "key" = 'home' AND "meta_title" = '';--> statement-breakpoint
UPDATE "site_pages" SET "meta_title" = 'About Us | Rapid Medical™', "meta_description" = 'Learn about our innovative neurovascular solutions for stroke treatment.' WHERE "key" = 'about' AND "meta_title" = '';--> statement-breakpoint
UPDATE "site_pages" SET "meta_title" = 'Career Opportunities | Rapid Medical™', "meta_description" = 'Explore job opportunities at Rapid Medical. Join us!' WHERE "key" = 'careers' AND "meta_title" = '';--> statement-breakpoint
UPDATE "site_pages" p SET "meta_title" = coalesce(s."value"->>'evidenceTitle', ''), "meta_description" = coalesce(s."value"->>'evidenceDescription', '') FROM "site_settings" s WHERE s."key" = 'seo' AND p."key" = 'evidence' AND p."meta_title" = '';--> statement-breakpoint
UPDATE "site_pages" p SET "meta_title" = coalesce(s."value"->>'metaTitle', ''), "meta_description" = coalesce(s."value"->>'metaDescription', '') FROM "site_settings" s WHERE s."key" = 'therapies:' || p."region"::text AND p."key" = 'therapies' AND p."meta_title" = '';
