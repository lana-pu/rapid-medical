-- MVO and vasospasm are not in the Americas: their old Duda addresses there led to a page that does not exist
-- (site-ia, question 1). They go to the Americas therapies overview. Only rows still pointing at the old target change.
UPDATE "redirects" SET "to" = '/us/therapies' WHERE "from" = '/us/vasospasm' AND "to" = '/us/therapies/vasospasm';--> statement-breakpoint
UPDATE "redirects" SET "to" = '/us/therapies' WHERE "from" = '/us/mvo' AND "to" = '/us/therapies/mvo';
