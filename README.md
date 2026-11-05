# Rapid Medical — website + admin

Custom replacement for the four Duda sites (`www.`, `us.`, `ous.`, `apac.rapid-medical.com`), merged into one Next.js app with a built-in content admin.

**Stack:** Next.js 16 (App Router) · React 19 · TypeScript · Tailwind 4 · Drizzle ORM · PostgreSQL 16

## Quick start

### Option A — Docker only (nothing else to install)

```bash
docker compose up --build        # first run: builds the image, creates the DB, seeds all content (~3–5 min)
```

Then open **http://localhost:3000** (site) and **http://localhost:3000/admin** (admin, login `admin@rapid-medical.com` / `change-me-now-123` — change it in *Account* or set `ADMIN_EMAIL` / `ADMIN_PASSWORD` in `.env` before the first start). Media is read from `public/uploads`; if that folder is empty the first start downloads everything from the Duda CDN instead. Data persists in the `pgdata` Docker volume; `docker compose down -v` wipes it for a fresh seed. `Ctrl+C` stops, `docker compose up` starts again (no rebuild needed unless the code changed). Ports 3000 / 5432 already taken? Set `APP_PORT` / `DB_PORT` in `.env` (and `DATABASE_URL` accordingly for host-side Node).

### Option B — Node on the host (for development)

```bash
cp .env.example .env            # set DATABASE_URL and AUTH_SECRET
docker compose up -d db         # local Postgres (or point DATABASE_URL at your own)
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

### On-page editor (“Edit site”)

Webflow-Editor-style editing on the live site, for people who should change texts and media without touching structure.

- Enter from the admin sidebar (*Edit site*) or from any record (*Edit on site*); `/api/editor?on=1&redirect=/path` turns it on for the browser (Next draft mode + `rm_edit` cookie, admin session required), `?off=1` turns it off. A bar at the bottom shows who is editing and what is pending on the page.
- Every editable text and media slot is outlined. **Click text** to edit in place (Enter saves, Esc cancels, Shift+Enter = newline). **Click an image/video** for *Replace image / Replace video / Remove video / Clear image* via the media library. **Rich-text blocks** (regulatory, references, page bodies, bios, job descriptions) open the full editor in a panel. **Buttons** open a label + link popover.
- Saves go through the normal workflow: a published record gets a pending draft (visible in the editor and in preview links, invisible to visitors); unpublished records are updated in place; singleton pages (home, about, careers, evidence, therapy landings, location chooser, offices) are stored in site settings and get a `setting_drafts` row. The bar's **Publish** publishes everything pending on the page (respecting *Require approval* — editors get *Submit for review* instead), **Discard** drops it. Pending setting drafts also show on the dashboard and on the Site settings form (where *Save* publishes them).
- Structure (adding/removing blocks, order, tables, slugs, SEO) stays in the admin forms by design.
- Implementation: `src/components/site/editable.tsx` (`<E>` / `<EMedia>` wrappers that render nothing extra outside editor mode), `src/components/editor/EditorOverlay.tsx` (client overlay, loaded only in editor mode), `src/admin/inline.ts` (server actions: field path validation against the resource/settings schemas, save, pending, publish, discard, review), `src/lib/editing.ts`.

### Editorial workflow

- **Live vs pending.** Editing a published record never touches the site: changes are stored as a pending draft until someone clicks *Publish changes*. Unpublished records are edited in place.
- **Preview links.** Every record has a shareable preview URL (valid 7 days) that shows the site with pending changes and draft pages, with a banner and an *Exit preview* link. Built on Next draft mode.
- **Approval** (Site settings → Workflow → *Require approval*). Editors *Submit for review*; approvers/admins *Approve*, *Request changes* and publish. Submissions can notify an email address. Off by default — a one-person team just publishes.
- **Scheduled publishing.** Set a date/time on a record; `/api/cron/publish` publishes due drafts (Vercel cron in `vercel.json`, or any cron hitting the URL with `Authorization: Bearer $CRON_SECRET`).
- **Revision history.** Every save, publish and restore is snapshotted. `…/history` compares any two revisions (or live / pending) field by field with word-level highlighting; any revision can be restored.
- **Activity log** (`/admin/activity`): logins and failed logins, saves, publishes, deletes, restores, reviews, settings and user changes, media uploads — with user, IP and time.

Roles: `admin` (everything, incl. users), `approver` (can approve and publish), `editor` (edits, submits for review; publishes directly only when approval is off).

### Security & operations

- **Sessions** are server-side and revocable: *My account* lists active devices and can sign out the others; a password change or reset signs out everywhere.
- **Login throttling**: 8 failed attempts per email or IP in 15 minutes → locked for the window. Failed logins are in the activity log.
- **Two-factor authentication** (TOTP, any authenticator app) with 8 one-time recovery codes; admins can reset a user's 2FA.
- **Password reset** by emailed link (1 hour, single use).
- **Security headers** (nosniff, frame-options, referrer policy, HSTS in production) from `src/proxy.ts`.
- **Broken links** (`/admin/not-found-log`): public 404s are counted; add a redirect in one click.
- **Form submissions** export as CSV. **`/api/health`** for uptime probes.

### Tests

- `npm test` — unit tests (Vitest): sanitiser, Markdown conversion, region mapping.
- `npm run test:e2e` — Playwright: public pages, redirects, video/tabs/map, contact form, admin login, drafts → preview → publish, approval workflow, scheduling via cron, media pipeline, 2FA, throttling, activity log. Seeds a scratch database first (set `DATABASE_URL`, `AUTH_SECRET` in `.env`).
- `.github/workflows/ci.yml` runs all of it on every push and pull request.

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

The site uses ~36 background / explainer videos (hero loops, animated graphs, how-it-works steps). They are stored like any other upload and set via the same media field in the admin. Rich-text fields accept videos and YouTube embeds from the toolbar.

**Pipeline** (`src/lib/media.ts`, `src/lib/images.ts`): every uploaded raster image gets WebP variants at 480 / 960 / 1600 px (never upscaled) and a 16-px blur placeholder; every video gets a poster frame via ffmpeg. The site's `<Img>` / `<Video>` primitives emit `srcset`/`sizes`, intrinsic dimensions and the poster automatically for library files. `npm run media:process` backfills files imported before the pipeline existed.

**Storage** (`src/lib/storage.ts`): `STORAGE_DRIVER=local` writes to `public/uploads` (single server); `STORAGE_DRIVER=s3` uses any S3-compatible bucket (AWS S3, Cloudflare R2, MinIO) — required on Vercel or with more than one instance. Deleting a library file removes the original, variants and poster from storage; deletion is refused while the file is referenced anywhere.

## Integrations (Site settings → Integrations)

GA4 (`G-FB4LNFSBSR` on the live site), UserWay accessibility widget (`cDW2354yK3`), region suggestion by visitor country (reads `x-vercel-ip-country` / `cf-ipcountry`; Duda did a hard geo-redirect, we only suggest).

## Forms & email

Submissions are stored in `contact_submissions` and emailed via SMTP (`SMTP_*` in `.env`). Without SMTP they are logged to the console. Honeypot + a small per-IP rate limit are in `src/lib/forms.ts`; add a CAPTCHA if spam becomes a problem.

## Deploying

Any Node host works (Vercel, Railway, Fly, a VPS with PM2). Needs: `DATABASE_URL`, `AUTH_SECRET`, `NEXT_PUBLIC_SITE_URL`, SMTP. For multi-instance hosting switch `STORAGE_DRIVER` to S3 (driver to be implemented in `src/lib/storage.ts`) and move the rate limiter to Redis.

Point `www`, `us` and `ous` DNS at the app; the proxy handles the subdomain redirects.

## Design

Deliberately neutral: layout primitives in `src/components/site/primitives.tsx`, tokens in `src/app/globals.css`. Swap tokens and restyle the primitives when the visual design is ready; page templates don't need to change.
