# Rapid Medical — website + admin

Custom replacement for the four Duda sites (`www.`, `us.`, `ous.`, `apac.rapid-medical.com`), merged into one Next.js app with a built-in content admin.

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
| `/choose-your-location` | Region chooser → `/us/…`, `/ous/…` or `/apac/…` (visitor country suggests one) |
| `/us/therapies`, `/ous/therapies`, `/apac/therapies` | "Our Therapies" landing per region (video hero, Ischemic / Hemorrhagic / Access blocks) — **Site settings → Therapies landing** |
| `/us/therapies/lvo` … | Therapy pages — one row per *(slug, region)*: 3 US, 5 OUS, 5 APAC. Video hero, benefit blocks with video, how-it-works videos, tabs, YouTube closing, region-specific regulatory copy. "Copy to other region" in the admin. |
| `/us/evidence`, `/ous/evidence`, `/apac/evidence` | Publications, filtered by region, tabs per product variant (OUS/APAC: T13 · T · T25&XL · COMANECI · DRIVEWIRE/COLUMBUS; US: 3 tabs) |
| `/us/webinars`, `/ous/webinars` | Webinar list + request form |
| `/news-events` | External news links |
| `/about-us`, `/team/[slug]` | About + leadership + offices + **interactive world map** (hover regions, click → regional contact) |
| `/careers`, `/open-positions`, `/open-positions/[slug]` | Careers + jobs |
| `/contact-us` | Contact form (`?region=us&topic=demo` preselects) |
| `/privacy-statement`, `/terms`, … | Generic Markdown pages (global or regional) |

Region is **in the path**, not in a cookie, so Google indexes US and OUS regulatory text separately. The last-visited region is remembered in a cookie only to pick the right "Our Therapies" menu.

### Legacy URLs

`src/proxy.ts` 301-redirects `us.`/`ous.`/`apac.rapid-medical.com/*` → `/us/*`, `/ous/*`, `/apac/*` (product slugs map to `/therapies/…`). Other old paths (`/welcome_d`, `/ronen`, …) live in the **Redirects** table and are checked before a 404 is returned.

## Admin (`/admin`)

Email + password, roles `admin` / `editor`. Content types:

- **Therapies** (structured: hero, benefits, overview, specs, how-it-works, in-practice, actions, regulatory, references)
- **Evidence** (publications with product, region, DOI/PDF)
- **News & Events**, **Webinars**, **Leadership team**, **Open positions**
- **Pages** (rich-text body; global or regional; noindex flag for campaign landing pages)
- **Products** (families + variants, per-region Evidence tabs, region aliases such as COLUMBUS™ in APAC)
- **Site settings** (contact + office pins, social, branding, integrations, home, about, careers, evidence, therapies landing ×3, regional notices)
- **Media** (upload; stored locally in `public/uploads`, S3 driver stub in `src/lib/storage.ts`)
- **Form submissions** (contact / webinar / careers, with status)
- **Redirects**, **Users** (admin only)

Everything with a `status` field is only public when `published`. Saving revalidates the affected routes.

### Editing experience

- **Rich text** (Tiptap): headings, lists, links, tables, images and videos from the media library, YouTube. Stored as HTML, sanitised on output (`src/lib/html.ts`).
- **Lists of blocks** (benefits, steps, offices, …): drag to reorder, collapse, duplicate; nested lists supported (`Repeater.tsx`).
- **Media library picker** in every image/video field: search, filter by type, upload in place. Library page shows where a file is used and refuses to delete a referenced file.
- **Specification tables**: structured table editor on therapy pages — paste a range from Excel to fill it. Replaces the Duda screenshots.
- **Unsaved-changes guard**: warns before leaving a dirty form and keeps a local backup that can be restored.
- **Lists**: search, filters (status / region / product / featured), column sorting, pagination, bulk publish / unpublish / delete.

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

Current import: 13 therapy pages, 102 publications, 53 news items, 5 webinars, 6 team members, 14 pages, 197 media files (incl. 36 videos, ~260 MB).

### Known content issues carried over from Duda (need a human decision)

- **US Aneurysm page** embeds OUS overview/spec images and links to `apac.rapid-medical.com` on the live site. Reproduced as-is; flagged in `content/seed/solutions.ts`.
- **Access (Drivewire) pages** have no text at all on the live site — the copy is baked into images. Placeholders left in the admin.
- **Specifications** are screenshots on Duda. The schema has `specImageUrls` for now; replace with a real table once the design is settled.
- "Dr. Rishi Gupta – TICI 3" case on US LVO was a Wix-hosted PDF viewer; link needs a proper PDF.
- Form recipient addresses are set server-side on Duda and not visible in the HTML — configure `MAIL_TO` (and per-form routing if needed in `src/lib/forms.ts`).
- APAC MVO "Comfort of control" and a few APAC blocks use OUS imagery where APAC had none.

## Media & videos

The site uses ~36 background / explainer videos (hero loops, animated graphs, how-it-works steps). They are stored like any other upload and set via the same "image" field in the admin (paste a `.mp4` URL or upload). Rich-text fields accept videos and YouTube embeds from the toolbar.

## Integrations (Site settings → Integrations)

GA4 (`G-FB4LNFSBSR` on the live site), UserWay accessibility widget (`cDW2354yK3`), region suggestion by visitor country (reads `x-vercel-ip-country` / `cf-ipcountry`; Duda did a hard geo-redirect, we only suggest).

## Forms & email

Submissions are stored in `contact_submissions` and emailed via SMTP (`SMTP_*` in `.env`). Without SMTP they are logged to the console. Honeypot + a small per-IP rate limit are in `src/lib/forms.ts`; add a CAPTCHA if spam becomes a problem.

## Deploying

Any Node host works (Vercel, Railway, Fly, a VPS with PM2). Needs: `DATABASE_URL`, `AUTH_SECRET`, `NEXT_PUBLIC_SITE_URL`, SMTP. For multi-instance hosting switch `STORAGE_DRIVER` to S3 (driver to be implemented in `src/lib/storage.ts`) and move the rate limiter to Redis.

Point `www`, `us` and `ous` DNS at the app; the proxy handles the subdomain redirects.

## Design

Deliberately neutral: layout primitives in `src/components/site/primitives.tsx`, tokens in `src/app/globals.css`. Swap tokens and restyle the primitives when the visual design is ready; page templates don't need to change.
