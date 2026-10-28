# Rapid Medical — website + admin

Custom replacement for the three Duda sites (`www.`, `us.`, `ous.rapid-medical.com`), merged into one Next.js app with a built-in content admin.

**Stack:** Next.js 16 (App Router) · React 19 · TypeScript · Tailwind 4 · Drizzle ORM · PostgreSQL 16

## Quick start

```bash
cp .env.example .env            # set DATABASE_URL and AUTH_SECRET
docker compose up -d            # local Postgres (or point DATABASE_URL at your own)
npm install
npm run db:migrate              # apply SQL migrations
ADMIN_EMAIL=you@rapid-medical.com ADMIN_PASSWORD='long-password' npm run db:seed
npm run duda:media              # pull all images/PDFs off the Duda CDN into public/uploads
npm run dev                     # http://localhost:3000  ·  admin: /admin
```

`npm run setup` runs migrate + seed + media in one go.

## How the site is organised

| URL | Content |
|---|---|
| `/` | Home (hero, stats, featured news) — edited under **Site settings → Home** |
| `/choose-your-location` | Region chooser → `/us/…` or `/ous/…` |
| `/us/therapies`, `/ous/therapies` | Therapy index for the region |
| `/us/therapies/lvo` … | Therapy pages — one row per *(slug, region)*, so US and OUS regulatory copy are edited separately. "Copy to OUS/US" button in the admin. |
| `/us/evidence`, `/ous/evidence` | Publications, filtered by region, grouped by product |
| `/us/webinars`, `/ous/webinars` | Webinar list + request form |
| `/news-events` | External news links |
| `/about-us`, `/team/[slug]` | About + leadership profiles |
| `/careers`, `/open-positions`, `/open-positions/[slug]` | Careers + jobs |
| `/contact-us` | Contact form (`?region=us&topic=demo` preselects) |
| `/privacy-statement`, `/terms`, … | Generic Markdown pages (global or regional) |

Region is **in the path**, not in a cookie, so Google indexes US and OUS regulatory text separately. The last-visited region is remembered in a cookie only to pick the right "Our Therapies" menu.

### Legacy URLs

`src/proxy.ts` 301-redirects `us.rapid-medical.com/*` → `/us/*` and `ous.` → `/ous/*`. Other old paths (`/welcome_d`, `/ronen`, …) live in the **Redirects** table and are checked before a 404 is returned.

## Admin (`/admin`)

Email + password, roles `admin` / `editor`. Content types:

- **Therapies** (structured: hero, benefits, overview, specs, how-it-works, in-practice, actions, regulatory, references)
- **Evidence** (publications with product, region, DOI/PDF)
- **News & Events**, **Webinars**, **Leadership team**, **Open positions**
- **Pages** (Markdown body; global or regional; noindex flag for campaign landing pages)
- **Site settings** (contact, social, home, about, careers, regional notices)
- **Media** (upload; stored locally in `public/uploads`, S3 driver stub in `src/lib/storage.ts`)
- **Form submissions** (contact / webinar / careers, with status)
- **Redirects**, **Users** (admin only)

Everything with a `status` field is only public when `published`. Saving revalidates the affected routes.

Adding a new content type = a table in `src/db/schema.ts` + an entry in `src/admin/resources.ts`. Lists, forms, validation and persistence are generated from that description (`src/admin/engine.ts`).

## Content migration

```
scripts/scrape-duda.ts     crawl all three Duda sites → content/raw/   (HTML + text snapshots + inventory.json)
scripts/extract-duda.ts    raw → content/seed/{news,publications,team,pages}.json
content/seed/solutions.ts  therapy pages, hand-structured from the crawl
content/seed/settings.ts   site settings, products, redirects
scripts/seed.ts            seed/* → database
scripts/migrate-media.ts   download every Duda CDN asset, register in media, rewrite references
```

Current import: 8 therapy pages, 81 publications, 53 news items, 6 team members, 11 pages, 105 media files.

### Known content issues carried over from Duda (need a human decision)

- **US Aneurysm page** embeds OUS overview/spec images and links to `apac.rapid-medical.com` on the live site. Reproduced as-is; flagged in `content/seed/solutions.ts`.
- **Access (Drivewire) pages** have no text at all on the live site — the copy is baked into images. Placeholders left in the admin.
- **Specifications** are screenshots on Duda. The schema has `specImageUrls` for now; replace with a real table once the design is settled.
- "Dr. Rishi Gupta – TICI 3" case on US LVO was a Wix-hosted PDF viewer; link needs a proper PDF.
- Home hero background video (`vid.cdn-website.com`) could not be downloaded — upload it manually via Media.
- TIGERTRIEVER 13 / 25 publications are tagged with the TIGERTRIEVER product; the variant is kept only in titles.

## Forms & email

Submissions are stored in `contact_submissions` and emailed via SMTP (`SMTP_*` in `.env`). Without SMTP they are logged to the console. Honeypot + a small per-IP rate limit are in `src/lib/forms.ts`; add a CAPTCHA if spam becomes a problem.

## Deploying

Any Node host works (Vercel, Railway, Fly, a VPS with PM2). Needs: `DATABASE_URL`, `AUTH_SECRET`, `NEXT_PUBLIC_SITE_URL`, SMTP. For multi-instance hosting switch `STORAGE_DRIVER` to S3 (driver to be implemented in `src/lib/storage.ts`) and move the rate limiter to Redis.

Point `www`, `us` and `ous` DNS at the app; the proxy handles the subdomain redirects.

## Design

Deliberately neutral: layout primitives in `src/components/site/primitives.tsx`, tokens in `src/app/globals.css`. Swap tokens and restyle the primitives when the visual design is ready; page templates don't need to change.
