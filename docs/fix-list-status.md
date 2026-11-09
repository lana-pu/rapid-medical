# Website Fix List (Oct 2026) — status in the new build

Source: `Website_Fix_List_master.xlsx`, `Website_Updates_List_Oct_2026.docx`, `Edits_Oct_2026.pptx` (client, reviewed Oct 13/15 2026).
The list was written for Duda + a Webflow migration; this repository *is* the migration, so bucket C is handled here directly.

Legend: **Done** = in the content seeds / code · **Done\*** = done, needs MLR/CEO confirmation as the list says · **Blocked** = needs material from Rapid Medical · **Decision** = Marketing decision pending.

## A. High priority

| # | Item | Status | Where / note |
|---|---|---|---|
| A.1 | Product spec tables (US LVO, OUS LVO/MVO, US Access) | **Done** (tables) / **Blocked** (handle image) | Tables are now data (`specs`), taken from the deck: US LVO 6 rows incl. 13 Micro & 17 ULTRA, OUS LVO 5 rows w/o vessel column, OUS MVO 3 rows, US DRIVEWIRE 24 + 35 with "Effective length", fluoro column removed. US Drivewire indications text replaced. Contraindication sentence complete, labels bold. **Missing:** device image showing black *and* white handle (deck slide 2 is a placeholder — asset + model availability text needed). |
| A.2 | Access card on Therapies home | **Done** (text) / **Blocked** (2nd button) | US card: heading "Access", new copy, button "DRIVEWIRE™"; "HYPERDRIVE™" button is added when A.3 exists. OUS unchanged (DRIVEWIRE only). |
| A.3 | New HYPERDRIVE page (US) | **Blocked** | Needs content (hero, benefits, specs, IFU) from Marketing. Page type exists — a therapy page with product `hyperdrive`, 30 min once the copy arrives. |
| A.4 | Home: 40K → 50K+ patients | **Done** | `home.stats` |
| A.5 | Evidence: 85+ publications | **Done** | Structured counter (`evidence.statValue`), no image |
| A.6 | Remove UK office (text + map) | **Done** | Office removed from `contact.offices`; the map draws offices from the same list |
| A.7 | US Aneurysm links to OUS site | **Done** | All links are region-relative: `/us/evidence`, `/us/webinars`, `/us/success-study-final-results` |
| A.8 | US Aneurysm uses OUS specs/overview | **Blocked** | COMANECI table is structured, but the *US-approved* version was not supplied — currently the OUS/APAC values with a note; features/diagram are text now. Need the US table. |

## B. Quick fixes

| # | Item | Status | Note |
|---|---|---|---|
| B.1 | Contact links to juuced.co staging | **Done** | No staging links exist in the new build (checked in content audit) |
| B.2 | Aneurysm links to `/us` 404 | **Done** | US → `/us/see-the-comparison`, OUS → `/ous/success-study-final-results` |
| B.3 | DOI `10.3389/fneur2022.1032307` | **Done** | `10.3389/fneur.2022.1032307` in `publications.json` |
| B.4 | Hero labels "Our solutions / …" | **Done** | All breadcrumbs → "THERAPIES / …" |
| B.5 | "…and stroke solutions." → "…and devices." | **Done\*** | Questions band on all pages (MLR owner per list) |
| B.6 | Evidence intro "our solutions" → "technologies" | **Done\*** | MLR to approve |
| B.7 | US titles & descriptions | **Done\*** | Product pages: `metaTitle/metaDescription`; landing, Evidence, Webinars, Contact: settings → *Google titles & descriptions*. Used verbatim (no template suffix). CEO confirmation pending per the doc. |
| B.8 | OUS titles & descriptions | **Done\*** | Same; Contact = Yokneam, Israel |
| B.9 | Share images | **Done** | `shareImageUrl` per product page (device photo), falls back to hero image; editable in admin → SEO |
| B.10 | "Gain active control" animation starts blank | **Done** (poster) | Video posters are now taken from the *last* frame (`media:process` regenerates). Trimming the blank frames themselves needs the source video re-exported by the client. |

## C. With the migration (= this build)

| # | Item | Status | Note |
|---|---|---|---|
| C.1 | Menu structure with HYPERDRIVE | **Decision** | Dropdown lists therapy pages per region; product names can be shown as sub-labels. Final labels depend on C.17 (MLR). HYPERDRIVE appears when A.3 exists. |
| C.2 | Regional home = Therapies landing, retitled | **Done** (structure) / **Decision** (title) | `/us`, `/ous`, `/apac` land on the Therapies page; title now "Therapies" — "Rapid Medical US" or other wording is Marketing's call (editable). |
| C.3 | Hidden duplicate "Vascular access" | **Done** | Not migrated |
| C.4 | Regional routing | **Done** | Global site = About/News/Careers/chooser; region suggested by IP (banner + cookie), never forced; switcher in header; hreflang (`en-US`, `en`, `en-AU`, x-default) added to all regional pages |
| C.5 | PDFs in OUS Duda storage | **Done** | All PDFs in our media library (`/uploads/duda/…`), links rewritten |
| C.6 | Wix PDF for "TICI 3" case (US LVO) | **Blocked** | Link left empty; needs the PDF from Rapid Medical (open since the first audit) |
| C.7 | Privacy link with `?_gl=` | **Done** | Plain `/privacy-statement` |
| C.8 | One H1 per page | **Done** | Every template renders exactly one `<h1>` |
| C.9 / C.10 | Alt text | **Partly** | Alt lives on the media record (one place, all pages). Most migrated files have no alt yet — Marketing task in Admin → Media (filter "missing alt" to be added). |
| C.12 | Carry titles/descriptions, 301s | **Done** | Redirect table seeded (legacy paths + subdomains), SEO fields per page |
| C.13 | "Our Therapies" → "Therapies" | **Done** | Menu, landing title, home CTA |
| C.14 | Audience definition, copy review | **Decision** | Marketing; no code impact |
| C.15 | "Neurovascular" vs "endovascular" | **Decision** | Marketing/MLR; titles already use "Endovascular" where the client's table does |
| C.16 | OUS: combine LVO + MVO into one thrombectomy page | **Decision** | Marketing. Technically: one therapy page with two benefit groups + redirects, ~half a day once decided |
| C.17 | Menu labels by procedure | **Decision** | MLR review; labels are plain fields (`navLabel`) |
| C.18 | `/access` → dedicated DRIVEWIRE page | **Done** | Slug is now `drivewire` on all regions; `/<region>/access` and `/<region>/therapies/access` 301 → `/<region>/therapies/drivewire`. HYPERDRIVE gets its own page under A.3. |

## Still needed from Rapid Medical

1. Device image with black + white handle, and the model-availability text (A.1).
2. US-approved COMANECI specification table and overview (A.8).
3. HYPERDRIVE page content (A.3) — then the second button (A.2) and menu entry (C.1) follow.
4. "TICI 3 case" PDF (C.6).
5. Source video of the force/expansion animation without the blank lead-in (B.10, optional — poster fix already hides the problem).
6. MLR/CEO sign-off on B.5, B.6, B.7, B.8 wording (all entered as drafts of record; editable in admin).
