# Tigertriever training platform research: UX patterns, architecture and MVP plan

Research synthesis prepared for the UX designer / product lead who will proceed to wireframing and implementation planning. Research date of the underlying notes: 2026-10-16. Citations are given as [n] and resolve to the numbered Sources list in Section 12. Every screenshot or video URL carries the evidence label assigned by the researcher who found it; see Section 12 for what each label actually means (several "verified screenshot" labels were confirmed from page captions, not by opening the image).

---

## 1. Executive summary

**UX direction.** No manufacturer ships a compact, offline stent-retriever training app, so the Tigertriever app has no like-for-like competitor and should be assembled from proven fragments: Touch Surgery's in-stage player (n/N counter, media pane above a text sheet, ⓘ for detail) [1], Incision Assist's fixed protocol skeleton with a "Standard protocol ▾" variant selector [6], Thrombectomy EVT's persistent per-stage tab strip and colour-typed warning boxes [20], EVT Navigator's vessel → model selector [21], and Rapid Medical's own picture-in-picture handle+vessel animations and Penetrate/Adjust/Relax vocabulary [8]. Recommended direction: **"Stage Player"** — a random-access 8-stage overview per device that launches a linear in-stage player with a persistent configuration chip ("Tiger 17 · Handle B · EU").

**Architecture.** Build a **custom React admin on Supabase Pro ($25/mo), media in Cloudflare R2 (≈$0–1/mo, free egress), release zips built by GitHub Actions (free tier)** [87][127][140]. No CMS examined natively models device × handle × region variants with whitelist applicability or per-variant approval, so the editorial logic must be custom regardless; Payload CMS 3 (MIT, self-hosted ≈$9–15/mo) is the runner-up if the team prefers built-in versions/diff and accepts Next.js [57][108].

**Content model.** Taxonomy tables (device, handle config, region, valid variants) → program → 8 lesson slots → append-only lesson versions with section-level overrides keyed by an applicability whitelist, resolved most-specific-first; approval rows per (version, variant); immutable releases that pin version IDs and SHA-256 media hashes [192][209][208]. One rigid lesson template for v1; a closed set of six block types for v2.

**Offline package.** A zip containing a single-file HTML shell (Vite + vite-plugin-singlefile, hash routing, classic script), `content/content.js`, and content-addressed H.264 MP4 media. No code signing, no Gatekeeper/SmartScreen executable prompts; works double-clicked on Windows (Edge/Chrome) and macOS (Safari/Chrome); iPad is out of scope for file:// delivery [144][160][166].

**MVP scope.** Taxonomy + one program + rigid lesson editor + draft/approve + preview iframe + release builder + offline shell. Defer blocks, quizzes, desktop wrapper, delta packages, e-signatures.

**Cost.** Recurring ≈ $25–36/month. Development effort ESTIMATE 270–460 hours total. The $950 budget realistically covers 12 months of hosting plus AI tooling and a cross-OS test spike; it does not buy contractor hours, so the build must be in-house, AI-assisted.

---

## 2. Part 1 — End-user training interface benchmarks

Fifteen products are profiled (merged from the medical and technical-manual benchmark notes). Access and interaction claims come from App Store listings, vendor help pages and fetched product pages; UI not inspected is flagged as such. Several of the medical App Store screenshot sets were visually inspected by the researcher; for the technical-manual products no image was visually opened and labels derive from page context (see Section 12).

### 2.1 Touch Surgery (Digital Surgery Ltd / Medtronic)

- **Product & maker:** Touch Surgery: Surgical Videos — Digital Surgery Ltd (Medtronic). Step-by-step simulations plus surgical video library; "over 150 free procedures", "integrated into over 100 residency programs in the US" [1].
- **Link:** https://apps.apple.com/us/app/id509740792 [1]; ecosystem page [2].
- **Visual evidence:**
  - https://is1-ssl.mzstatic.com/image/thumb/PurpleSource112/v4/00/fa/00/00fa002d-d0f0-5a4e-7d1c-749674be4ff3/af9d8ee3-08b4-4c72-92ae-51537c1c7d00_2_App_store_rebrand_visuals_iPhone-5.8_inch.png/600x0w.png — verified screenshot (step player "1/15", progress bar, 3D render top ~65%, drag-up text sheet with share and ⓘ icons).
  - https://is1-ssl.mzstatic.com/image/thumb/PurpleSource112/v4/02/e6/dc/02e6dccf-7495-c8f2-1894-a8e99f8047ec/b17b4b77-d26a-4839-9535-eef3a2899d2e_5_App_store_rebrand_visuals_iPhone-5.8_inch.png/600x0w.png — verified screenshot (same player on the "EV-ICD Implant" device module).
  - https://is1-ssl.mzstatic.com/image/thumb/PurpleSource112/v4/66/74/8c/66748cfc-9d69-20ac-a266-49f3b4b6b5c0/71fb63b6-1e3b-47c4-ad7b-faa710969d3e_6_App_store_rebrand_visuals_iPhone-5.8_inch.png/600x0w.png — verified screenshot (video step "36/40", white callout labels on real video, inset schematic, instruction + rationale text).
  - https://is1-ssl.mzstatic.com/image/thumb/PurpleSource122/v4/09/f2/40/09f24065-9ccb-b228-bd10-c2e9884f554a/55879064-1033-4e7b-899e-97f6906dfc08_4_App_store_rebrand_visuals_iPhone-5.8_inch.png/600x0w.png — verified screenshot (Library: Procedures | Specialties tabs).
  - https://is1-ssl.mzstatic.com/image/thumb/PurpleSource122/v4/cd/b0/98/cdb098fa-e393-589c-6a7f-fd67992b1ebd/4a05d5a5-7a7c-40b9-907b-ed69166b7951_1_App_store_rebrand_visuals_iPhone-5.8_inch.png/600x0w.png — verified screenshot (Home: "Assigned to you", rows tagged "Simulation | 3 Phases").
  - https://is1-ssl.mzstatic.com/image/thumb/PurpleSource112/v4/ca/91/5d/ca915d8c-44e1-6ff4-121e-100de5395c12/5b3fe279-3bb5-4047-9b14-29356d0a69c6_3_App_store_rebrand_visuals_iPhone-5.8_inch.png/600x0w.png — inferred-not-seen (download failed).
  - https://www.imedicalapps.com/wp-content/uploads/2014/10/image_1.jpeg (and image_3 … image_7.jpeg) — inferred-not-seen (2014 reviewer screenshots, pre-rebrand, not inspected) [3][4].
- **Access:** login required (free account); modules downloaded individually, long procedures split into parts [3].
- **Interaction patterns:** persistent n/N counter + thin progress bar; two-line title (module in accent colour over parent in caps); ▶▶ skip and ✕ exit; media pane never covered by text; instruction sentence followed by rationale sentence; learn mode vs test mode (answer questions or perform the step); gesture-driven simulation [3].
- **Strengths:** one player handles 3D, video and device-implant modules identically; phase chunking ("3 Phases"); in-frame annotation of real video.
- **Weaknesses:** "Does not allow for deviation from linear app design structure"; "Only illustrates one technique for each procedure"; downloads "time-consuming" [4]; no thrombectomy module visible (inferred-not-seen).
- **Applicability to Tigertriever:** the step player is the direct template for the 8 stages; "Simulation | N Phases" tags become stage-count badges on model cards; the EV-ICD example proves device-implant training expressed in procedure-step vocabulary.

### 2.2 Incision Assist (INCISION Group BV)

- **Product & maker:** Incision Assist — OR support app: protocols, surgeon-specific preferences, 3D OR setup [5].
- **Link:** https://apps.apple.com/us/app/incision-assist-or-support/id1576658816 [5]; support article [6]. Incision Academy page returned 404.
- **Visual evidence:**
  - https://is1-ssl.mzstatic.com/image/thumb/PurpleSource126/v4/b4/38/50/b43850a9-341c-d741-6eb5-0482b36b7f84/51e12da9-ef0a-43e3-989d-78d3f15c92a5_iOS_App_Store_Screen_1__U0028English_U002c_5.5_inch_U0029.png/392x696bb.png — verified screenshot (Browse: search, specialists, recently viewed).
  - https://is1-ssl.mzstatic.com/image/thumb/PurpleSource126/v4/b8/50/86/b8508617-236c-fcc1-d773-37ec6e2e0a67/093218ae-bc7f-4c71-80d5-6e3319e8a489_iOS_App_Store_Screen_2__U0028English_U002c_5.5_inch_U0029.png/392x696bb.png — verified screenshot (Updates feed, 3D OR with "Left side ▾").
  - https://s3-eu-central-1.amazonaws.com/euc-cdn.freshdesk.com/data/helpdesk/attachments/production/103278731958/original/MYa4RveO6_2wdTr20EzPW_W7quAA3ffSDA.png?1767623965 — verified screenshot (protocol overview: "Ankle Fracture / Standard protocol ▾ / Updated On: 10/28/2025", nine fixed sections).
  - https://s3-eu-central-1.amazonaws.com/euc-cdn.freshdesk.com/data/helpdesk/attachments/production/103278733919/original/JWnzAZE-TVFyctS55V9JOdMRQ1ShFQDieg.png?1767624193 — verified screenshot (Materials with "Hold" and "Document/Video" badges).
  - https://s3-eu-central-1.amazonaws.com/euc-cdn.freshdesk.com/data/helpdesk/attachments/production/103278734710/original/4vGzPZ09wj8zNzeNpjZxlKYFMQi98w8e9Q.png?1767624264 — verified screenshot (Surgical Steps: scrolling photo + bullet page).
  - Side selection (…103278732406…), Navigate in 3D (…103278732698…), Patient view (…103278733380…), Draping (…103278734312…), Suggest Improvement (…103278735303…), 3D OR setup video https://drive.google.com/file/d/10nKx06L5b2Apzjf_1RzLUhM866ctBABh/view?usp=sharing — inferred-not-seen (listed in article, not inspected) [6].
- **Access:** institutional licence; live app could not be inspected (inferred-not-seen).
- **Interaction patterns:** "Each protocol has the same sections, in this order" (My Notes, General Information, Anesthesia, OR Setup & Positioning, Materials, Draping, Surgical Steps, Additional Information, Postoperative Instructions); "An orange dot marks a specialist's preference that differs from the standard protocol"; left/right side selector; Materials sortable by Default / Category / Hold [6].
- **Strengths:** users learn one map for every procedure; explicit variant dropdown under the title; deviation marker; item-level optionality badge; typed attachment badges instead of inline players.
- **Weaknesses:** Surgical Steps is a scrolling document, not a paced player; dense ALL-CAPS lists; team-feed features irrelevant offline.
- **Applicability:** protocol overview → Tigertriever model page with fixed 8-stage list; "Standard protocol ▾" → handle-type / region selector; orange dot and "Hold" → "regional" and "optional" badges on steps and materials.

### 2.3 Philips IGT Learning (Philips)

- **Product & maker:** Philips IGT Learning — "How do I" videos, documents, clinical cases for interventional labs [7].
- **Link:** https://apps.apple.com/us/app/philips-igt-learning/id6739526084 [7].
- **Visual evidence (all verified screenshot, App Store set, inspected):** https://is1-ssl.mzstatic.com/image/thumb/PurpleSource211/v4/3b/25/39/3b253916-f019-48c8-47b2-c378e7432c54/IGT-LearningApp-iPhoneScreen1-En-V01-w-MAT0033.jpg/320x480bb.jpg (Home: Featured carousel, "Daily" tiles Safety / Image Quality / Azurion / Allura); …/df/4c/58/df4c5862-823f-41f2-0fd5-f30ba1cf98ef/IGT-LearningApp-iPhoneScreen2-En-V01-w-MAT0033.jpg (Search grouped by breadcrumb with Videos/Documents groups, durations "~5 min"); …/82/0a/42/820a4212-dd8a-5f7e-4690-b33e37c38a0e/IGT-LearningApp-iPhoneScreen3-En-V01-w-MAT0033.jpg (Safety section, version-specific leaflet "Azurion R3 and higher"); …/9a/31/8d/9a318d6b-c3b3-8607-8480-e53654cea0d0/IGT-LearningApp-iPhoneScreen4-En-V01-w-MAT0033.jpg (Save/Share sheet); …/ea/87/f3/ea87f328-3ef6-2b9b-9ed8-88e0a3797aa9/IGT-LearningApp-iPhoneScreen5-En-V01-w-MAT0033.jpg (Applications grid); …/7b/fb/d9/7bfbd94d-f225-d54b-ea89-0da5bb0b2bca/IGT-LearningApp-iPhoneScreen6-En-V01-w-MAT0033.jpg (Leaflet viewer).
- **Access:** not stated; could not inspect (inferred-not-seen whether registration is needed).
- **Interaction patterns:** dual organisation by topic and by system; every video card shows duration; documents prefixed by type ("Leaflet:", "Quick Reference Card:", "Addendum:"); Saved tab; tab bar Home / Search / Saved / Settings [7].
- **Strengths:** system tiles and topic tiles at the same level; version-specific documents named as such; durations visible before opening.
- **Weaknesses:** browse/search library of discrete assets, no staged walkthrough or progress; small-type tables on phone.
- **Applicability:** model for the *supplementary* layer: versioned leaflets, quick-reference cards and duration-stamped micro-videos behind the stage player.

### 2.4 Rapid Medical — current Tigertriever materials

- **Product & maker:** Rapid Medical web product pages (US and OUS), animations, specifications diagram; no app exists [8][9][10].
- **Link:** https://us.rapid-medical.com/lvo [8]; https://ous.rapid-medical.com/ [9]; https://www.rapid-medical.com/ [10]; https://tigertriever.com/ — could not inspect (proxy 502 / blocked).
- **Visual evidence:**
  - https://vid.cdn-website.com/9d0280ee/videos/067J7P1fRCGyilO6KPCe_HowTo_1-v.mp4, …/0saPDx9aSyyoIoj5zk9d_HowTo_2-v.mp4, …/sjIQ67SJQYupyII8PBjC_HowTo_3-v.mp4 — marketing illustration (3D How-To animations; one frame of HowTo_1 inspected: vessel cross-section with cage in clot and a circular PiP inset of a gloved hand with thumb on the orange slider).
  - https://irp.cdn-website.com/9d0280ee/dms3rep/multi/opt/Specifications-Resized-1920w.jpg — marketing illustration (labelled device diagram: radiopaque distal tip, distal/proximal markers, cage length, fluoro markers, slider, handle).
  - https://irp.cdn-website.com/9d0280ee/dms3rep/multi/opt/US-LVO-Product-Overview-1920w.jpg — marketing illustration (four feature blocks incl. microcatheter compatibility 0.013" / 0.0165" / 0.021").
  - https://irp.cdn-website.com/9d0280ee/dms3rep/multi/3666+TT13+Expand+-+Compress+Dynamic+V3_HIGHRES-b756d993.gif — marketing illustration (expand/compress loop).
  - Graph animations …/Ysj0VQoCRIS60VWmLvzj_Tiger+Stair+graph_animated-v.mp4, …/j4Uo8taSRCv4Ch0EW7r1_TIGER+graph_website-v.mp4; logo loop …/i7x3QkN4SCmElyjtyiDA_RAPID-MEDICAL_01_TIGERTRIEVER-LOGO_720_LOOP-v.mp4 — marketing illustration.
  - YouTube https://www.youtube.com/embed/ja2bTvMJRLs ("Tigertriever - Better Grip On The Clot"), https://www.youtube.com/watch?v=kdIcJW-QDL4, https://youtu.be/ZCslloX6Ei0 — marketing illustration / physician talks (titles confirmed via oEmbed, videos not viewed).
- **Access:** product pages public; webinars "submit a request"; IFU "Request an IFU"; no public eIFU found [8].
- **Interaction patterns:** tabbed page (Product overview | How it works | In-Practice | Clinical evidence); "HOW IT WORKS 1. PENETRATE … 2. ADJUST … 3. RELAX"; HTML comment reveals an OUS accordion variant with "vertical mobile videos" [8].
- **Strengths:** a 3-verb mental model; hand-and-vessel PiP; labelled device anatomy; regional split already exists (OUS nav adds "Medium vessel stroke" and "Vasospasm") [9].
- **Weaknesses:** marketing-shaped, no stage list, no per-model differentiation beyond microcatheter size, no offline component, key material gated.
- **Applicability:** reuse the PiP convention, the labelled diagram as a "device anatomy" card, and Penetrate/Adjust/Relax as labels for the clot-interaction stages; the US/OUS split is the precedent for a region switch.

### 2.5 Mentice Neurovascular Essentials (Mentice, VIST simulator)

- **Product & maker:** Mentice VIST G7/G7+ software — the only thrombectomy / stent-retriever trainer found with inspectable UI [11].
- **Link:** https://www.mentice.com/software/neurovascular-essentials [11].
- **Visual evidence (verified screenshot, vendor captures, inspected):** https://cdn.prod.website-files.com/6284c87224663b7c31a96d70/62c431415498435921b14ec1_Image%20from%20E-learning%20course.png (angiogram with ~8 hotspots; card with ‹ › arrows); https://cdn.prod.website-files.com/6284c87224663b7c31a96d70/62c43e857f638b7c833f5161_Challenge%20Results%20-%20Suboptimal%20results.png (Summary modal with event penalties and Fair/Good/Excellent gradient, "Your score 46%"); https://cdn.prod.website-files.com/6284c87224663b7c31a96d70/62c4313b1fdf423aaa01a966_Additional%20Picture%201%20-%20Distal%20Access%20Guidance.png (biplane fluoro with roadmap "Mask 50%", target icons, dose panel); https://cdn.prod.website-files.com/6284c87224663b7c31a96d70/62c6a725c8996b2291e06b18_Simmons%20femoral.PNG (single fluoro view). Hero …/62c431139b8cbc9e48d0b7ab_Main%20image%20-%20no%20Border%20-%20Carotid%20Access%20from%20Radial.png and hardware …/6ac78904b032b5ce928b8633_VIST%20G7%20Main.jpg — marketing illustration.
- **Access:** institutional hardware; contact form; could not inspect beyond page captures.
- **Interaction patterns:** "Fully-guided maneuvre and full procedure training" → "Challenge mode"; "4 easily selected clot locations for every anatomy"; "Direct Aspiration or Stentriever available in all cases"; metric scoring with named penalties ("Vessel scraping −2000", "Tool movement without fluoro −500", "Tool moved without support −500") [11].
- **Strengths:** named-hazard feedback; guided → challenge gating; clot location and technique as case parameters.
- **Weaknesses:** haptic hardware; not portable; generic stentriever, no Tigertriever slider behaviour.
- **Applicability:** the penalty vocabulary is ready-made warning content for deployment/retrieval stages; the gradient bar is a compact self-check; the 4-locations × 2-techniques matrix hints at how to present "subsequent passes" and vessel-size choices.

### 2.6 Stryker — SKILL e-Lab (web) and Mako Training (app)

- **Product & maker:** Stryker Neurovascular SKILL e-Lab; Stryker Mako Training app [12][13][14].
- **Link:** https://www.stryker.com/us/en/training-and-education/neurotechnology/neurovascular/skill/e-lab.html [12]; https://apps.apple.com/us/app/mako-training/id6743401898 [14].
- **Visual evidence:** e-Lab — none (no screenshots on public page; inferred-not-seen). Mako — https://is1-ssl.mzstatic.com/image/thumb/PurpleSource221/v4/73/10/08/73100899-8b62-460f-3987-db72aad1d932/i1.png/320x480bb.jpg — verified screenshot (sign-in launch screen, v2.0); https://is1-ssl.mzstatic.com/image/thumb/PurpleSource211/v4/8e/42/c3/8e42c33b-37e9-012d-68bf-76a90f1886e4/i2.png/320x480bb.jpg — verified screenshot ("Mako cases" list with configuration micro-grid).
- **Access:** e-Lab rep-provisioned ("Contact your local representative") — could not inspect; Mako login required (sign-in is the first screenshot) [12][14].
- **Interaction patterns:** e-Lab promises "learning pathways", "knowledge checks and tracking … through training history reports" [12]; Mako case card = "Case 1 – Right Knee, 5.5° varus | 4° flexion | Mechanical" + "Mako Total Knee / Triathlon CS Primary (PCL Protect) / F:3 T:4 P:9 / Right knee" + 3D thumbnail [14].
- **Strengths:** configuration legible before opening; dark high-contrast UI.
- **Weaknesses:** login wall; orthopaedic; e-Lab unseen.
- **Applicability:** the case-card micro-grid → a Tigertriever model/config card ("Tiger 17 · Handle B · EU · 8 stages").

### 2.7 Medtronic — Medtronic Academy (web) and AS TAVR Education (app)

- **Product & maker:** Medtronic Academy; AS TAVR Education AR explainer [15][16].
- **Link:** https://www.medtronic.com/en-us/healthcare-professionals/medtronic-academy.html [15]; https://apps.apple.com/us/app/as-tavr-education/id1534608851 [16].
- **Visual evidence:** Academy — none (bot wall "Incorrect Browser"; inferred-not-seen). AS TAVR — https://is1-ssl.mzstatic.com/image/thumb/PurpleSource114/v4/26/94/18/269418b9-2107-c056-4cc7-c2cb9c6b5988/f136eb7a-bb5a-420c-9069-35675c471502_IMG_7198.png/392x696bb.png and https://is1-ssl.mzstatic.com/image/thumb/PurpleSource124/v4/d4/c8/e9/d4c8e924-7250-9da8-ceb1-d43af00bbefa/a8202939-778a-4ff8-80b5-713aa27f1f4e_IMG_7207.png/392x696bb.png — verified screenshot (AR valves side by side; persistent "AR On/Off | AS Severity | Evolut™ TAVR | Reset" controls; subtitle bar).
- **Access:** Academy — could not inspect; AS TAVR — no login visible (inferred-not-seen).
- **Interaction patterns:** persistent two-button module switch; AR toggle and Reset always in the same place; narration mirrored in a subtitle bar [16].
- **Strengths:** readable with sound off; stable control positions.
- **Weaknesses:** explainer, no procedural stages.
- **Applicability:** a persistent model switch for comparing Tiger 13/17/21/25 cage sizes side by side; subtitle bar for IFU-worded narration.

### 2.8 Osso VR (Osso VR / Osso Health)

- **Product & maker:** VR procedural training; Osso Loop web platform; Osso Health on Apple Vision Pro [17][18][19].
- **Link:** https://www.ossovr.com/ [17]; training modes article [18]; press release [19]; App Store https://apps.apple.com/us/app/osso-health/id6475324153 (iTunes Lookup returned 0 results — possibly removed).
- **Visual evidence:** https://cdn.prod.website-files.com/60c079a900a87db2d13e7134%2F68de5c9db02b18ee2643b051_Hero%20Video%20Sequence-transcode.mp4; https://cdn.prod.website-files.com/60c079a900a87db2d13e7134/68d99780ee8e329fe016fbc5_Debrief%20feature%20graphic%20plain.jpg; https://cdn.prod.website-files.com/60d3ce09b96d1ef6905bfed5/6616fa4b9d96bf589d130ccd_Vision%20OS%20Release%20Social.png — all marketing illustration (not inspected as UI).
- **Access:** enterprise ("Request pricing", Osso Loop login); in-headset UI could not be inspected.
- **Interaction patterns:** Practice Mode "step-by-step support"; Test Mode "removes step-by-step procedural guidance … Access hints if needed by pressing Y"; Collaborative mode; pre-brief/debrief wrapper [18][17].
- **Strengths:** clean three-mode ladder; hint-on-demand.
- **Weaknesses:** headset-bound; no neuro module found.
- **Applicability:** replicate the ladder in 2D cheaply: show step text / hide step text with tap-to-reveal hint.

### 2.9 Thrombectomy (ATIF ELNIL) — offline 8-step LVO pathway

- **Product & maker:** Independent clinical reference app, "rapid clinical reference for the complete mechanical thrombectomy pathway… An 8-step LVO pathway" [20].
- **Link:** https://apps.apple.com/us/app/thrombectomy/id6761347262 [20].
- **Visual evidence (verified screenshot, inspected):** https://is1-ssl.mzstatic.com/image/thumb/PurpleSource221/v4/fb/82/af/fb82af69-7094-1489-8c61-ccdb35ce70c7/Simulator_Screenshot_-_IPhone_11_Promax_-_2026-05-04_at_23.32.29.png/320x480bb.jpg (dark home: persistent header with stopwatch, "A− 75% A+" text size, "EVT" badge; stat chips; numbered colour-coded step list); https://is1-ssl.mzstatic.com/image/thumb/PurpleSource211/v4/ba/d7/f9/bad7f964-84c4-d448-f649-0e98236e3c9f/Simulator_Screenshot_-_IPhone_11_Promax_-_2026-05-04_at_23.32.38.png/320x480bb.jpg (step page: red critical-rule box tagged "HERMES 2016", blue decision box, checklists, inline calculators; bottom tab bar with one icon per step; paywall "£14.99 … Works offline").
- **Access:** no login; one-time purchase; offline [20].
- **Interaction patterns:** home list → step page with "‹ Back / Step 1 — LVO Activation"; colour-typed callout boxes with source tags; per-stage bottom tab bar so any stage is one tap away; adjustable text size [20].
- **Strengths:** proof that an offline, stage-tabbed, callout-typed thrombectomy reference works on a phone; essentials free, depth paid.
- **Weaknesses:** text-dense; no video or illustration; no device-handling steps.
- **Applicability:** the persistent stage strip and the critical/decision/checklist/evidence callout taxonomy transfer directly; the install-once offline model matches the brief.

### 2.10 EVT Navigator (Cassidy Werner)

- **Product & maker:** Independent app: patient/imaging filters → trial evidence → device browser [21].
- **Link:** https://apps.apple.com/us/app/evt-navigator/id6761737668 [21].
- **Visual evidence (verified screenshot, inspected):** https://is1-ssl.mzstatic.com/image/thumb/PurpleSource211/v4/39/85/56/39855697-b2bf-caf2-ed9f-29cab5c68f13/Simulator_Screenshot_-_iPhone_17_Pro_Max_-_2026-04-06_at_17.24.19.png/320x480bb.jpg (eligibility form → "Show Trials"); https://is1-ssl.mzstatic.com/image/thumb/PurpleSource221/v4/f7/34/d6/f734d6ca-b3b4-9cc5-cb7a-f8a3d6fdf136/Simulator_Screenshot_-_iPhone_17_Pro_Max_-_2026-04-06_at_17.24.30.png/320x480bb.jpg (pinned "Selected vessel: M1 — Literature diameter: 2.5 ± 0.4 mm" card above Manufacturer › Family › Model accordion with uniform spec table).
- **Access:** no login.
- **Interaction patterns:** context card pinned above a 3-level accordion; one-line model summary ("access only · 0.086 in ID · fits 8F sheath") expanding to a spec table [21].
- **Strengths:** vessel → device logic made visible; uniform spec table.
- **Weaknesses:** text only; no handling instructions.
- **Applicability:** the exact pattern for choosing Tiger 13/17/21/25 by target vessel diameter on the Home screen.

### 2.11 iFixit repair guides / Dozuki viewer (iFixit; Dozuki)

- **Product & maker:** iFixit public repair guides; Dozuki industrial work instructions (same engine) [30][35].
- **Link:** https://www.ifixit.com/Guide/MacBook+Pro+13-Inch+Retina+Display+Early+2015+Battery+Replacement/45137 [30]; help pages [31][32][33][34]; Dozuki app https://apps.apple.com/ec/app/dozuki/id517173580 [35].
- **Visual evidence (labels from page context; images not visually opened):** https://d17kynu4zpq5hy.cloudfront.net/igi/dozuki/E1vQGmZD6jdfOewV.medium (bullet picker), …/TKXxDnQNXHfoBStZ.medium (bullet types), …/251ICRsnfxf5lWcN.medium, …/cVhWOPyH2Iyy5vOM.medium, …/mFXnhVenHBR5ooFT.medium (step editor), …/DEXLLXlk5k2wj1Nc.medium (marker overview), …/QgXnIoyEQuJD5vYk.medium (markers screen), …/FmXHX5RLlxIugvms.standard and …/EIhHlBTWdy6DqMAi.standard (marker sizes), …/vQKxlUKHtpGEGUkH.medium (PDF link), …/uZYVPvqlE3PcscWk.medium (example PDF) — verified screenshot (help-article captures) [31][32][33]; guide photos https://guide-images.cdn.ifixit.com/igi/ovJZXaUhKXaROGSa.medium, https://guide-images.cdn.ifixit.com/igi/LeHZGQqOmJ5HNBPs.medium, hero https://guide-images.cdn.ifixit.com/igi/Y26GEg4MNSyZSgvE.large — verified screenshot (live guide) [30]. Dozuki app: only an OG placeholder (`…/Placeholder.mill/1200x630wa.jpg`) — inferred-not-seen [35].
- **Access:** iFixit guides public (account only for "Mark complete", favourites); Dozuki workspace login; "workers only see the latest approved standard" [30][35].
- **Interaction patterns:** header with "Time Required", "Difficulty", "Completed: 814"; "Each step may have up to three images"; bullets coloured to match circle/rectangle markers (red → orange → yellow order); Caution / Note / Reminder icon bullets; conclusion "follow the above steps in reverse order"; PDF export "periodically regenerated" with date stamp [30][31][32][33][34]. Dozuki declares "Differentiate Without Color Alone" accessibility [35].
- **Strengths:** the most explicit step grammar found; marker↔bullet colour coupling; three-tier callouts; metadata header.
- **Weaknesses:** single long scrolling page (only "Go to step 1 ↓"); offline = PDF only; commerce clutter; Dozuki offline mechanics undocumented (help.dozuki.com blocked).
- **Applicability:** adopt ≤3 images per step, numbered/coloured markers matched to bullets (never colour alone), Warning > Caution > Note tiers mapped to IFU wording, and a stage header with stage count, time and variant. Keep stage-per-screen rather than long scroll.

### 2.12 SwipeGuide (L2L / Leading2Lean)

- **Product & maker:** SwipeGuide work-instruction platform, now part of L2L; customer-branded viewer apps (e.g., "Barilla SwipeGuide — Effortless work instructions offline") [36][37][38].
- **Link:** https://support.leading2lean.com/articles/8677672874-swipeguide-features-add-ons [36]; offline native app article [37].
- **Visual evidence:** none in the KB articles; L2L marketing video https://www.l2l.com/hubfs/L2L%20Product%20Video%202026%20-%20Web-Compressed%20-%20Sub%20-%201080p%20-%201920x1080%20-%2025%20fps.mp4 — marketing illustration (unrelated MOM visuals) [38].
- **Access:** login required ("workspace password, or an email and password"); SSO add-on [36].
- **Interaction patterns:** open app → choose workspace → "OPEN PLATFORM" → "Tap the download icon on any guide" → loading circle ("can take up to a few minutes") → "Offline Available" section above "All Guides" [37]; features include Guide Versioning (each publish = restorable version), Approval Workflow, Checklists, Sign-Off mini forms [36]. Step presentation itself ("swipe") is inferred-not-seen.
- **Strengths:** clearest documented per-guide download → offline shelf pattern.
- **Weaknesses:** no primary description of the step UI; gated; brand absorbed into L2L.
- **Applicability:** "download icon → progress ring → Offline Available shelf" for optional per-model media packs if a single bundle gets too large.

### 2.13 LEGO Builder: 3D Instructions (LEGO System A/S)

- **Product & maker:** LEGO Builder — step-by-step 3D building instructions [39][40].
- **Link:** https://apps.apple.com/app/id1486159728 [39]; https://play.google.com/store/apps/details?id=com.lego.legobuildinginstructions [40].
- **Visual evidence (verified screenshot per Play Store listing; not visually opened):** https://play-lh.googleusercontent.com/hK2Dlxlu6Jx8o2MNOXwjgusFmLCfbbrnQ29z1aGZuo3fPvgMOKmqcQ967R40sHGKAu3PiFjq91BlAkRNG0hy=w526-h296; https://play-lh.googleusercontent.com/_i-Uxir_Oby0Fem12ZjdWwcivDLotqrbPZqwWrPqU3R0Of6vZ3Cuat9zWVmKDEoqMn4gZZVqnLaWxgxDlvPYHQ=w526-h296; https://play-lh.googleusercontent.com/zTlj9oJKrREm1qxUd_zC4RfJ8QuIGrbjKzmCo1gWpNDgvqpYRrZSsiLQ1_qXjIFB40HS3wkSfIMUUYAM1rHiww=w526-h296; https://play-lh.googleusercontent.com/xKkgSY7T_p_TeKDqYdgE16O8rzUa_qLXvgm_6J3ABoXsDP4v8HgiAnTRPcREVHVlkH4mdPM6JibRzhfaUX1OTqM=w526-h296; https://play-lh.googleusercontent.com/IrnPTkBzLUsQxFLWoIij9D9vVBl3I3sxwBvtIICCPhzzrOSJDSQDqBkhugaHRenBLx8QWNAxXnRvw4nERUvJBA=w526-h296; https://play-lh.googleusercontent.com/U6hPc_VyJcIiVbOfUcR9aedlyQW-3pGjeUG5TaIHlG95beqN9uRgQnOHyyXe5aTmvUkaSByEImndrqhWSZnqGA=w526-h296; https://play-lh.googleusercontent.com/Cx0jqvz03DxhkU27jtXA5ZhmArHLzRjKv4UBda0YzyPdak0Y1rwF8eZ0AmNKX6KW6AQF28OGkl2jwOjkEOHx_Vw=w526-h296; https://play-lh.googleusercontent.com/kaQDp-PWu-bjbo8UMMe8R-NTizZrBsjyWLZMBjWxy8VCc2mVnZ-3rqY-a-OXl03CwlRtnpJ3T6ULcm263V9d3g=w526-h296 [40].
- **Access:** optional LEGO account for progress; "a stable internet connection is required" — not offline [40].
- **Interaction patterns:** one step per screen; "zoom, rotate, and view LEGO® sets from every angle"; find a set by name/number or scan the QR code in the printed manual; progress saved; "Build Together" PIN mode [40]. Ratings 4.8/5 (~288K) App Store; size 276.4 MB [39].
- **Strengths:** gold-standard one-step-per-screen with 3D rotate/zoom; catalogue → set → guide entry; QR lookup.
- **Weaknesses:** online-only; VoiceOver buttons unlabelled per a blind reviewer [39]; 276 MB.
- **Applicability:** set number ≈ Tiger model; QR on device packaging → guide; zoomable illustration per stage. Tigertriever must add what LEGO lacks: offline and labelled controls.

### 2.14 Cortona3D RapidManual / Viewer (ParallelGraphics) and Flatirons Pinpoint

- **Product & maker:** Cortona3D RapidManual authoring + Cortona3D Viewer (iOS, $2.99); Cortona3D Solo integrated into Flatirons Pinpoint [41][42][43].
- **Link:** https://www.cortona3d.com/rapidmanual [41]; https://apps.apple.com/us/app/cortona3d-viewer/id471275514 [42]; S1000D demo https://demo.cortona3d.com/demoset/AIRPLANE__MAINTENANCE_PM_S1000D4_1_PM_EN/html/C3DAIRPLANE-00010-AMM01-00.htm (JS app; returned empty to fetch — could not inspect).
- **Visual evidence:** https://img.youtube.com/vi/sk5ApUEoWY8/maxresdefault.jpg, https://img.youtube.com/vi/ZRcgNu5zEJE/maxresdefault.jpg — marketing illustration (video stills); App Store image is a placeholder — inferred-not-seen [41][42].
- **Access:** demos appear open (not verified); Viewer is paid, no account [42].
- **Interaction patterns:** "Synchronize the step description with the corresponding animation step"; play/pause; "add interactive notes, warnings, and cautions to procedure steps"; procedure inversion; magnifiers, cross-sections; Viewer: "Step-by-step instructions as a text overlay, plus playback or scrubbing of animated install/remove sequences", navigation cube, predefined views, files via iCloud / "Open in…" [41][42]; Pinpoint uses the 3D model "as an alternative to traditional Table of Contents" [43].
- **Strengths:** text ↔ animation sync; scrubbable animation; warnings attached to steps; local files = de facto offline.
- **Weaknesses:** aerospace-grade complexity; 3.0/5 rating from 4 ratings [42]; UI not verified.
- **Applicability:** each stage = looping/scrubbable animation synced to numbered text with attached warnings — exactly the Tigertriever stage composition.

### 2.15 S1000D IETP viewers — R&S IETDView (Rohde & Schwarz) and ADAM Viewer (4D Concept)

- **Product & maker:** R&S IETDView (Bundeswehr BESTD viewer); ADAM Viewer HTML5 IETP [44][45][46].
- **Link:** https://www.rohde-schwarz.com/us/products/aerospace-defense-security/rs-ietdview_334293.html [44]; demo login https://ietdview.rohde-schwarz.com/rsiv/ [45]; https://adam.4dconcept.fr/viewer/?lang=en [46].
- **Visual evidence:** R&S (verified screenshot per vendor labelling, 1024×576, not visually opened): https://assets.rohde-schwarz.com/public/image/products/aerospace-defense-security/software-for-integrated-logistics//software-for-integrated-logistics-screenshot-rohde-schwarz_200_62573_1024_576_1.jpg (login); same prefix …_62574_ (overview), …_62576_ (data modules), …_62575_ (search), …_62577_ (bookmarks) [44]. ADAM: https://adam.4dconcept.fr/wp-content/uploads/sites/2/2024/11/VIEW-003_1000x720px.png, https://adam.4dconcept.fr/wp-content/uploads/sites/2/2023/05/visuel_adam_viewer_flying_whales-e1766064887165.png — marketing illustration [46].
- **Access:** R&S login required (demo `Gast`/`Gast`, some functions unavailable); ADAM "protected by login and password", demo via contact form [44][46].
- **Interaction patterns:** R&S: "Intelligent links: every link has an internal return mark"; context-sensitive history; bookmarks saved server-side; one-click PDF of chapters; "Autark" standalone editions; Publish licence from USD 16,350/yr [44]. ADAM: synchronized TOC/text/3D; "installed as an autonomous, standalone version directly onto a tablet"; bright and dark modes [46].
- **Strengths:** return-mark navigation; standalone tablet install accepted in regulated documentation; dark mode.
- **Weaknesses:** gated, defence-grade, expensive, server-centric.
- **Applicability:** "return to stage" affordance for any cross-reference to a warning/glossary page; evidence that a self-contained HTML5 viewer on a device is an accepted delivery form.

### 2.16 Other products checked (brief)

- **Articulate Rise 360 web export** — "download a Rise course as a web package, extract the zip file, then launch the index.html file"; works in desktop Chrome/Firefox/Safari; an Android Chrome user got "a white screen"; block types include labeled graphic, process, accordion [47][48]. Images https://www.articulate.com/wp-content/uploads/2024/09/rise-course-desktop-and-mobile-views-1024x651.png etc. — marketing illustration.
- **Apple iPhone User Guide** — public; "Select version:" control re-renders the page in place; nested TOC; figures https://ipcdn-web.apple.com/assets/v2/web/0dc5a238-b5e2-4605-bc87-433780a3036b etc. — verified screenshot (guide figures) [49].
- **Microsoft Learn** — modules of "5 to 7 steps (also called units)", time per unit, non-punitive knowledge checks; 2018 images https://learn.microsoft.com/en-us/archive/teamblog/media/microsoft-learn-feature-tour/learn-module.png etc. — verified screenshot (2018) [50].
- **Scribe / Tango** — Tango "Pins and Nuggets" tip callouts; low relevance (software capture) [51].
- **Team Consulting eIFU guidance** — Norditropin: "Users confirm their product, then follow a menu-driven, animated walkthrough"; "Essential content (safety steps, warnings) should appear at the point of use… Supplementary material… can sit in secondary layers"; images https://assets.team-consulting.com/wp-content/uploads/2024/05/16165321/1.png, …/16165512/2.png, …/16165606/3.png, …/16165637/4.png — marketing illustration [28].
- **Could not inspect:** Boston Scientific EDUCARE (registration required; intro video https://player.vimeo.com/video/129014217) [22]; J&J Institute (redirect loop / robots) [23]; Level Ex (historical; divisions sold to Relevate Health and Snke) [24][25]; Penumbra (animation https://www.youtube.com/watch?v=fxvvQmonlXM — marketing illustration, not viewed) [26]; Ask Terumo Neuro calculator (verified screenshot exists, e.g. https://is1-ssl.mzstatic.com/image/thumb/PurpleSource211/v4/51/96/7f/51967fbe-791e-24fc-4a02-d2a983c296fa/74db444b-37cc-4363-9761-9519f3853fe0_Simulator_Screenshot_-_iPhone_8_Plus_-_2023-08-09_at_11.22.36.png/392x696bb.png, not inspected; not a trainer) [27]; Proximie, VirtaMed, Orsi Academy, Inmedius, WalkMe — not reached.

### 2.17 Synthesis — answers to the seven end-user research questions

**Q1. How do products organise content for multiple devices/models/configurations?** Three recurring patterns: (a) device tiles at the same level as topic tiles (Philips: Safety / Image Quality / Azurion / Allura) [7]; (b) a configuration micro-grid on each card so the configuration is legible before opening (Mako) [14]; (c) a pinned clinical context card above a Manufacturer › Family › Model accordion (EVT Navigator) [21]. Variants of one procedure are handled by a dropdown under the title plus a deviation marker (Incision) [6]; Apple's version selector re-renders the current page in place [49]; LEGO looks up a model by number or QR [40]. Rapid Medical presents the family only as microcatheter sizes and splits regions into separate sites [8][9]. No product handles *handle-type* variants of one device — a design gap with no benchmark. Recommended hierarchy: **Region → Model (13/17/21/25, chosen by target vessel) → Handle type → 8 stages**, with region/handle held in a persistent chip rather than duplicated libraries.

**Q2. Linear vs random access?** Instruction players are linear with escape hatches (Touch Surgery n/N, ▶▶, ✕) and are criticised for exactly that rigidity [4]; reference apps are random access (Incision section list, Thrombectomy EVT per-stage tab bar, Norditropin menu) [6][20][28]; simulators gate progression (Mentice guided → challenge; Osso Practice → Test) [11][18]; LEGO and Cortona3D are linear with saved position / scrubbing [40][42]. Best fit: a random-access stage overview launching a linear in-stage player with an n/N counter, plus a persistent stage strip for lateral jumps, plus resume-where-left-off. No usability data (task time, errors) exists for any pattern in the sources reached.

**Q3. Combining video, illustration, annotation, text and warnings in one step?** Dominant layout: media top, text in a drag-up sheet (Touch Surgery), callouts drawn on the frame, inset schematic for orientation, instruction + rationale as two short paragraphs [1]. Warnings as colour-coded callout boxes with a source tag (Thrombectomy EVT) [20]; named-hazard events (Mentice) [11]; iFixit's Caution/Note/Reminder tiers with markers colour-matched to bullets [32][33]; Cortona3D attaches warnings to animation steps [41]. Rapid's own animation uses PiP for hand + vessel [8]. Gap: no inspected product shows a warning box *inside* a video player step, and all benchmarks use one media type per step — the combination is inferred.

**Q4. Showing current device/config/stage?** Stage: n/N + progress bar + two-line title (Touch Surgery) [1]. Configuration: dropdown under the title + "Updated On" date (Incision) [6]; pinned context card (EVT Navigator) [21]; persistent two-button switch (AS TAVR) [16]; thin always-on header strip with timer/text-size/badge (Thrombectomy EVT) [20]; version state surfaced (Dozuki "latest approved standard", iFixit date-stamped PDFs) [35][34]. Proposed fusion: a tappable chip "Tiger 17 · Handle B · EU ▾" over "Stage 4/8 — Deployment" with a progress bar and a footer showing the content version. Gap: no product shows a device-silhouette indicator (which marker band is in play).

**Q5. Patterns that simplify complex procedures?** Fixed repeated skeleton (Incision's 9 sections) [6]; phase chunking ("3 Phases") [1]; a 3-verb mental model (Penetrate / Adjust / Relax) [8]; colour-typed callouts with source tags [20]; side/variant selector hiding irrelevant content [6]; "Hold" optionality badges [6]; named-penalty feedback and Fair/Good/Excellent thresholds [11]; guided → unguided → hints ladder [18]; duration-stamped micro-videos [7]; one step per screen with zoom/rotate (LEGO) [40]; scrubbable animation synced to text (Cortona3D) [42]; return marks on cross-links (R&S) [44]; dark mode (ADAM) [46]. For Tigertriever: wrap the 8 stages into three macro-phases (Prepare → Deploy & Engage → Retrieve & Repeat) so the strip reads 3/3/2, not 8 flat items.

**Q6. Essential vs supplementary?** Layering: short step text with ⓘ for more (Touch Surgery) [1]; typed "Document/Video" badges opened on demand and "Hold" optional items (Incision) [6]; Saved tab and typed documents (Philips) [7]; indentation and collapsibles (iFixit sub-bullets, Rise accordion) [30][47]; explicit eIFU guidance that essentials appear at point of use and supplementary material sits in secondary layers [28]; paywall-tiered depth (Thrombectomy EVT) [20]. Rule for Tigertriever: essentials = IFU-worded action + Warning/Caution per stage, always expanded and offline; supplementary = rationale, evidence, physician videos, spec tables behind ⓘ / a References tab. Never collapse Warnings or Cautions. Gap: no example of IFU-verbatim text being visually distinguished from editorial text inside an app.

**Q7. What fits Tigertriever best?** A hybrid: Incision-style configuration header and fixed stage skeleton; Touch Surgery-style in-stage player; Rapid's PiP animations and labelled diagram as media; Thrombectomy EVT's stage strip, colour-typed warnings and install-once offline model; EVT Navigator's vessel → model selector; Mentice's named-hazard list as warning content; Osso's hide-text/hint toggle as a cheap self-test; iFixit's marker↔bullet coupling and callout tiers for illustrations. Avoid login-gated academies, LMS dashboards, headset dependence, and scrolling-document steps.

---

## 3. Part 2 — Admin interface and content editor benchmarks

Ten product groups are profiled. Evidence labels in this part: "verified screenshot" means the image URL and its caption/context were confirmed on an official docs page; the image file itself was not visually opened. Sanity's in-body screenshots render as "Loading…" placeholders, so none could be verified.

### 3.1 Sanity Studio (Sanity.io)

- **Product & maker:** Sanity Studio (open-source studio, hosted content lake).
- **Link:** https://sanity.io/docs/studio/structure-introduction [52]; Content Releases [53]; Localization [54]; Presentation tool [55].
- **Visual evidence:** none verifiable; OG image https://www.sanity.io/docs/api/open-graph/491080d2-6287-4718-b170-6a9caf77f751 — marketing illustration [53].
- **Access:** account/project required; no public read-only demo found.
- **Interaction patterns:** nested panes ("a child pane opens to the right of its parent"), document lists GROQ-filtered with infinite scroll (max 2,000 docs) [52]; releases typed ASAP / At time / Undecided; a chip per version (Published, Draft, per release) in the document header; status glyphs (outlined ring = draft exists, filled circle = published); Releases screen "shows warnings when validation errors exist" [53]; Presentation tool = preview iframe beside editor, viewport toggle, Global perspective dropdown (drafts / release / published), "Used on N pages" banner, click-to-edit overlays [55]; field-level vs document-level localization with `coalesce()` fallback [54].
- **Strengths:** most refined hierarchy navigation and release/perspective model.
- **Weaknesses:** Content Releases are Enterprise/add-on; hosted-only data; preview overlays require an instrumented front end.
- **Applicability:** copy the pane layout (3–4 column master/detail), version chips and perspective dropdown; skip click-to-edit overlays.

### 3.2 Payload CMS 3 (Payload, MIT)

- **Product & maker:** Payload 3 — code-first, Next.js-native headless CMS.
- **Link:** Drafts [56]; Versions [57]; Live Preview [58]; Localization [59]; Blocks [60].
- **Visual evidence:** https://payloadcms.com/images/docs/fields/blocks.png — verified screenshot ("Admin Panel screenshot of add Blocks drawer view") [60]; https://payloadcms.com/images/docs/versions-v3.jpg — verified screenshot ("Comparing an old version to a newer version of a document") [57]; https://payloadcms.com/images/docs/autosave-drafts.jpg — verified screenshot ("Drafts Enabled") [56]; https://payloadcms.com/api/og?topic=live-preview&title=Live%20Preview — marketing illustration.
- **Access:** self-hosted; hosted demo credentials — inferred-not-seen.
- **Interaction patterns:** three-state status Draft / Published / **Changed**; sidebar Unpublish and Revert to published; drafts skip required-field validation; `schedulePublish` needs a Jobs queue [56]; full-copy versions with diff and restore, `maxPerDoc` 100 [57]; Live Preview button, iframe, named breakpoints (e.g., Mobile 375×667), Responsive/Custom, pop-out, `postMessage` of unsaved data [58]; per-field `localized: true`, per-locale `fallbackLocale`, `filterAvailableLocales` [59]; "Add Block" drawer with grouped thumbnails, collapsible/sortable rows, Duplicate below [60].
- **Strengths:** the exact pattern set (blocks + drafts/versions + locale fallback + breakpoint preview) in one MIT codebase.
- **Weaknesses:** Next.js/Node lock-in; heavy to adopt wholesale on a $950 build.
- **Applicability:** copy the status pill, Add-block drawer and breakpoint toolbar even if Payload itself is not adopted.

### 3.3 Directus (Monospace Inc.)

- **Product & maker:** Directus — database-first headless CMS/data platform.
- **Link:** https://directus.com/docs/guides/content/content-versioning [61].
- **Visual evidence (verified screenshot, filenames indicative, captions not given):** https://directus.com/docs/img/versioning-draft.png; https://directus.com/docs/img/versions-example.png; https://directus.com/docs/img/versioning_update.png; https://directus.com/docs/img/versions-example-comparison.png; https://directus.com/docs/img/revisions.png; https://directus.com/docs/img/revisions-comparison.png; https://directus.com/docs/img/revisions-comparison-2.png; https://directus.com/docs/img/revisions-comparison-toggle.png; https://directus.com/docs/img/revisions-latest.png; https://directus.com/docs/img/revisions-group-1.png; https://directus.com/docs/img/revisions-group-2.png; https://directus.com/docs/img/26a59b99-55e9-4185-83f3-f8945ace589e.webp [61].
- **Access:** no public demo surfaced; self-host via Docker.
- **Interaction patterns:** version dropdown at top of item (Published / Draft / named versions); published view read-only, "Edit" starts a draft; required fields enforced only at publish; Publish opens a comparison modal highlighting differing fields where you "accept or reject individual field changes"; revisions sidebar with compare vs previous or latest and "Apply" [61].
- **Strengths:** cleanest "draft vs published, field-by-field accept on approve" UI found.
- **Weaknesses:** database-admin feel; non-OSI licence and seat-limited Core tier (Section 9).
- **Applicability:** the field-diff-on-approve modal is the highest-value medium-cost component for regulated content.

### 3.4 Strapi 5 (Strapi)

- **Product & maker:** Strapi 5 — headless CMS; Releases on paid plans.
- **Link:** https://docs.strapi.io/cms/features/releases [62].
- **Visual evidence (verified screenshot; light/dark pairs):** https://docs.strapi.io/img/assets/releases/release-settings.png; https://docs.strapi.io/img/assets/releases/new-release.png; https://docs.strapi.io/img/assets/releases/releases-cm-list-view.png; https://docs.strapi.io/img/assets/releases/release-scheduling.png; https://docs.strapi.io/img/assets/releases/publish-release.png (each also `_DARK.png`) [62].
- **Access:** self-host; hosted demo by request — inferred-not-seen.
- **Interaction patterns:** New Release → name + optional schedule; entries added from edit view or bulk from list; release stores a *reference* to the draft; release badge **Empty / Blocked / Ready / Done**; per-entry "Ready to publish" / "Not ready to publish"; Blocked release must be fixed and refreshed; published release immutable [62].
- **Strengths:** the readiness badge + per-entry readiness column is a directly copyable pre-release checklist.
- **Weaknesses:** Releases paywalled (Growth $45/mo); reference-only releases "publish whatever the draft is now" and cannot pin older versions [62].
- **Applicability:** readiness panel vocabulary; a cautionary tale against reference-only releases.

### 3.5 Storyblok (Storyblok GmbH)

- **Product & maker:** Storyblok visual-editor SaaS.
- **Link:** Visual Editor manual [63]; concept [64]; branches & releases [65]; release preview [66].
- **Visual evidence (verified screenshot, 3024×1714 editor captures):** https://a.storyblok.com/f/212319/3024x1714/71b699f173/editor-preview.png; https://a.storyblok.com/f/212319/3024x1714/69778df445/visual-editor-form.png; https://a.storyblok.com/f/212319/3024x1714/e8502403aa/visual-editor-blocks.png; https://a.storyblok.com/f/212319/2999x1370/34630156b2/theme-switcher-rte.png; https://a.storyblok.com/f/212319/3024x1714/c1533e65c8/visual-editor-comments.png; https://a.storyblok.com/f/212319/2880x1604/0a36e1786f/content-section-story-status.png [63]. Branches-and-releases page listed two captioned images but exposed no URLs.
- **Access:** account required; Releases/branches Premium only [65].
- **Interaction patterns:** preview left / editing sidebar right; Form/Visual toggle; Desktop / Mobile / Full-width preview sizes; four statuses unpublished (gray dashes) / published (solid green) / changed (green dashes) / scheduled (blue) next to Save; presets = admin pre-filled blocks; `_storyblok_release` param previews a release [63][64][66].
- **Strengths:** status-dot vocabulary and preview-size toggle are trivial to copy.
- **Weaknesses:** SaaS; releases Premium; `Blocks` fields not field-translatable [190].
- **Applicability:** status dots; one-way "click block → scroll preview" via `postMessage`.

### 3.6 Contentful (Contentful GmbH) — plus Decap CMS

- **Product & maker:** Contentful SaaS; Decap (Git-backed, open source).
- **Link:** https://contentful.com/developers/docs/tutorials/general/setting-locales [67]; https://decapcms.org/features/ [68].
- **Visual evidence:** none on fetched pages (logo/OG only) — marketing illustration.
- **Access:** Contentful account (free tier, inferred); Decap editorial-workflow board and demo.decapcms.org — inferred-not-seen.
- **Interaction patterns:** per-field `localized: true`; fallback chains per locale (`de-CH → de-AT → de-DE`), `fallbackCode: null` stops a chain, cycles forbidden; "Allow empty fields for this locale"; locales can be hidden in the editor without affecting delivery [67]; Contentful later added icons/tooltips so editors can see when a field shows fallback content [187]. Decap: content "can move through clear statuses before publication", instant React preview templates, media library, Git backends [68].
- **Strengths:** the best-specified fallback-chain model; cheap to copy as device/region pseudo-locales.
- **Weaknesses:** silent fallback is the wrong default for regulated instructions (Section 8); Git-backed CMSs cannot hold 10–200 MB videos (Section 9).
- **Applicability:** per-field "override for this variant" toggle with the inherited value greyed-out; fallback indicator tooltip.

### 3.7 Articulate Rise 360 / Storyline 360 (Articulate)

- **Product & maker:** Rise block-based lessons; Storyline SCORM publisher.
- **Link:** Rise block types [69]; Storyline publish walkthrough (MIC Limerick) [70].
- **Visual evidence:** Rise block icons at https://cdn.articulate.com/assets/kb/360/rise-blocks/*.png and https://cdn.articulate.com/assets/kb/360/Rise_Labeled_Graphics.jpg — marketing illustration (block-type icons, not UI) [69]; Storyline: https://lead.mic.ul.ie/desk/file/19447798/blob (Publish button), https://lead.mic.ul.ie/desk/file/19447807/blob (Publish window, LMS/LRS tab, SCORM 1.2), https://lead.mic.ul.ie/desk/file/19447813/blob ("Publish Successful" with Zip button) — verified screenshot (third-party host) [70].
- **Access:** subscription; trial inferred.
- **Interaction patterns:** lessons = stacked blocks in families (Text, Statement A–D + Note, Quote, List, Image, Gallery, Multimedia, Interactive incl. labeled graphic / process / accordion, Knowledge check, Chart, Divider); block templates reusable across lessons [69]; Storyline Publish dialog → local folder → "Publish Successful" → **Zip** [70].
- **Strengths:** a small block vocabulary and a clean "publish → zip" end state.
- **Weaknesses:** subscription; web export fails on mobile file:// [48].
- **Applicability:** ~8-type block vocabulary (v2) and the "Build successful → Download zip" end state.

### 3.8 Dozuki admin (Dozuki / iFixit) — steps, version control, approvals

- **Product & maker:** Dozuki / iFixit guide editor, Version Control and Approval Processes.
- **Link:** Guide Steps [71]; Guide Details [72]; Version Control [73]; Approvals [74].
- **Visual evidence (verified screenshot; signed CloudFront URLs expire):** https://d3oclxqyu4vq52.cloudfront.net/igi/dozuki/cVhWOPyH2Iyy5vOM.medium (bullets), …/mFXnhVenHBR5ooFT.medium (Caution/Note/Reminder), …/IPNYYuvNxIc64wMV.medium (+ Add Step), …/rNUArUdnILtcJ3yH.medium (+ Insert Step), …/hZFRoDJVwSoEAIhn.medium (editing steps), …/1HTKhFRBZVRVRPsy.medium (step icons), …/ZtDJIInAIBWZRnpE.medium (rearranging) [71]; …/hihAXDlSeOKMufmM.medium (details), …/CGEcYAneY3mLULOS.medium (prerequisites), …/KBdQZyYOuC6TWYAA.medium and …/w4NEvN2gmeVcEWnE.medium (Bulk Step Creator) [72]; https://d17kynu4zpq5hy.cloudfront.net/igi/dozuki/aJ6ZqGRAhPhG1NTc.medium, …/pvXBoZJGnmFakqKy.medium, …/bVVXiYOYxJhtSCdk.medium (version control) [73]; 22 approval images e.g. https://d17kynu4zpq5hy.cloudfront.net/igi/dozuki/rEZEHxtGrBuBVylm.medium … /TnGuhVA1CUprngUb.medium [74].
- **Access:** Dozuki licensed; iFixit editing after free sign-up (inferred); help pages public.
- **Interaction patterns:** bullets coloured to match image markers; caution/note/reminder bullets; up to three images per step; "+ Add Step" / "+ Insert Step"; drag thumbnails to rearrange; Bulk Step Creator from plain text; prerequisite guides embedded as a sequential prefix (`guideid:77`) [71][72]; working copy = "Head"; grey dropdown selects Head vs V.1/V.2; "Publish Version" asks Title, Publish Date, **Release Notes**, **Major/Minor**; History → "Revert to this version"; a management page shows guides up to date / with unreleased changes / unpublished [73]; Approval Processes = ordered stages (≤10) with signature counts, email + on-site notification, Approve/Reject with required fields, live when all signatures collected [74].
- **Strengths:** closest domain analogue: regulated step instructions with images, warnings, reuse, versioned release with approvals.
- **Weaknesses:** dated UI; licensed; prerequisites cannot be interleaved.
- **Applicability:** callout bullet types, 3-image step, Head-vs-published dropdown, release notes + major/minor, "unreleased changes" list, one-stage approval.

### 3.9 React-admin (Marmelab) and Refine (refine.dev)

- **Product & maker:** React-admin (MIT core + Enterprise Edition); Refine (MIT, headless).
- **Link:** https://marmelab.com/react-admin/Demos.html [75]; https://refine.dev/core/templates/react-admin-panel-ant-design/ [76]; live demo https://example.admin.refine.dev.
- **Visual evidence:** https://marmelab.com/react-admin/img/demo-ecommerce-oss.png; https://marmelab.com/react-admin/img/demo-CRM.png; https://marmelab.com/react-admin/img/demo-help-desk.png; https://marmelab.com/react-admin/img/writers-delight.png; https://marmelab.com/react-admin/img/blog_demo.png; https://marmelab.com/react-admin/img/team-wiki.jpg; https://marmelab.com/react-admin/img/kanban-board.png — marketing illustration / demo captures [75]; https://refine-web.imgix.net/templates/detail-finefoods-ant-design.png?fm=webp&auto=format — marketing illustration [76].
- **Access:** demos public; credentials not listed (react-admin demo historically demo/demo — inferred).
- **Interaction patterns:** Team Wiki demo exercises "navigation, history, markdown, search, tree"; Help Desk "real-time notifications, locks, site search"; Writer's Delight "autosave, offline-first data provider" [75]; Refine FineFoods: Vite + Ant Design + REST + auth provider, dashboard, filtered orders [76]. React-admin is MUI-only and paywalls RBAC/real-time/audit log/`ra-history`; Refine is headless with Supabase/Appwrite/Strapi providers [100][101].
- **Strengths:** highest feasibility — CRUD admin over Supabase in days; Atomic CRM / Team Wiki repos are copyable starts.
- **Weaknesses:** revision/diff paywalled in react-admin; no editorial features out of the box.
- **Applicability:** the admin shell for approach B; choose Refine for headless UI freedom and Supabase provider.

### 3.10 Frappe Learning (frappe/lms) and Open edX Studio

- **Product & maker:** Frappe Learning (AGPL); Open edX Studio (AGPL).
- **Link:** https://github.com/frappe/lms [77]; lesson docs [78]; Open edX manage units [79]; outline [80].
- **Visual evidence:** https://docs.frappe.io/files/Screenshot%202026-02-23%20at%2012.26.55%E2%80%AFPM.png (Course Settings), https://docs.frappe.io/files/Screenshot%202026-02-23%20at%2012.30.45%E2%80%AFPM.png (Lesson Editor) — verified screenshot [78]; README images https://github.com/frappe/lms/raw/develop/.github/hero.png?v=5, …/batch.png, …/quiz.png, …/certificate.png — marketing illustration [77]. Open edX (relative paths, prefix https://docs.openedx.org/en/ulmo/): /_images/educator_how_tos/unit_components.png, unit_location.png, unit-edit-icon.png, unit-drag-selected.png, unit-drag-moved.png, unit-delete.png, outline-publish-icon-unit.png, discard_draft_changes.png; /_images/educator_references/outline-expand-collapse.png, outline-with-units.png — verified screenshot paths [79][80].
- **Access:** Frappe Docker dev `Administrator`/`admin`, no public demo [77]; Open edX requires an instance, no public Studio sandbox.
- **Interaction patterns:** Frappe Course → Chapter → Lesson; hover "+" opens a block menu; Upload and Video Hosting blocks; role-restricted "Instructor Notes" [78]; Open edX Section → Subsection → Unit → Component; publish states Draft (Never Published) / Draft (Unpublished Changes) / Published and Live / Published Not Yet Released; status panel with Publish and Discard Changes; **Preview** (draft) vs **View Live Version** (published, disabled if never published) [79][80].
- **Strengths:** the four-state publish vocabulary and Preview/View Live pair map exactly onto draft vs approved lessons; "instructor notes" → reviewer notes.
- **Weaknesses:** heavy LMS stacks; no variants.
- **Applicability:** vocabulary and the dual preview buttons only.

### 3.11 Release-UX references — GitHub Releases, Vercel, Figma branch review, Craft CMS

- **GitHub Releases** [81] — https://docs.github.com/assets/cb-90524/images/help/releases/release-link.png, https://docs.github.com/assets/cb-37212/images/help/releases/releases-tag-previous-release.png, https://docs.github.com/assets/cb-33857/images/help/releases/edit-release-pencil.png, https://docs.github.com/assets/cb-33811/images/help/releases/delete-release-trash.png — verified screenshot. Patterns: "Draft a new release" → tag → target → previous tag → title/description with "Generate release notes" → attach binaries → pre-release / latest flags → "Save draft" vs "Publish release"; immutable releases freeze assets.
- **Vercel** [82][83] — https://7nyt0uhk7sse4zvn.public.blob.vercel-storage.com/docs-assets/static/docs/concepts/deployments/logs/buttons-light.png, …/log-link-light.png — verified screenshot. Patterns: "Build Logs" button on the deployment tile; warnings yellow, errors red; secrets `[REDACTED]`; timestamp click → `#L6` permalink; Instant Rollback, promote.
- **Figma branch review** [84] — https://help.figma.com/hc/article_attachments/6008580195223, …/6008252022295 (side-by-side), …/6000887833239 (Approve), …/6000801957399 (Suggest changes), …/6008611061655 (Approved panel) — verified screenshot. Patterns: changes grouped by page, side-by-side vs overlay, Approve / Suggest changes, all-or-nothing review.
- **Craft CMS 5** [85] — https://craftcms.com/docs/assets/img/drafts-revisions-provisional.dd9acaeb.png, https://craftcms.com/docs/assets/img/drafts-revisions-menu.b4116170.png — verified screenshot. Patterns: autosaving provisional draft with "unsaved changes" banner (Save / Discard / Create draft), "Edited" badge, revisions menu in breadcrumbs, "Revert content from this revision".

### 3.12 Reusable UI components and interaction patterns

| Component | Seen in | What it does | How to recreate it in a small custom app |
|---|---|---|---|
| Nested master/detail panes | Sanity Structure [52] | Child list opens to the right of its parent; collapsible | 3–4 CSS grid columns; collapse to breadcrumbs below ~1,200 px |
| Outline tree with inline status | Open edX outline [80], Frappe [78] | Section → unit rows with expand/collapse and per-row actions | Tree component from the admin kit; status dot per row |
| Status pill / dots | Payload Draft/Published/Changed [56]; Storyblok gray-dash/green/green-dash/blue [63]; Sanity ring vs filled [53] | Shows publish state in lists and header | Enum → colour + icon token; never colour alone (Dozuki accessibility) [35] |
| Head-vs-version dropdown | Dozuki [73]; Directus [61]; Craft breadcrumb menu [85] | Switch working draft vs approved vN in place | Select bound to `lesson_version_id`; read-only mode for approved |
| Field-level diff with per-field accept | Directus publish modal [61]; Figma side-by-side/overlay [84] | Highlights changed fields before approval | JSON diff of two version snapshots; checkbox per field; medium cost |
| Release-notes + major/minor on publish | Dozuki [73]; GitHub [81] | Captures intent and version semantics at approval | Modal with required note, radio major/minor, auto-suggested semver |
| Approval stages with signatures | Dozuki Approvals [74] | Ordered approvers, Approve/Reject with required fields | Single stage in MVP: approver role + required meaning + timestamp |
| "Unreleased changes" management list | Dozuki Version Control page [73]; Craft "Edited" badge [85] | Lists guides up to date / changed / unpublished | Dashboard query over versions; filter chips device × region |
| Add-block drawer with grouped thumbnails | Payload Blocks [60]; Frappe "+" menu [78]; Rise block families [69] | Insert typed blocks; collapse, sort, duplicate | v2 only: Editor.js/Tiptap/BlockNote with a closed block set |
| Caution/Note/Reminder bullets; marker↔bullet colour | Dozuki/iFixit [71][32][33] | Severity-typed callouts; image markers matched to text | Callout component with severity enum; numbered markers on images |
| Prerequisite / shared guide reference | Dozuki [72]; Sanity "Used on N pages" [55] | Reuse a unit across parents; show usage | `program_lessons` join table; "Used in N programs" badge |
| Locale fallback + "optional locale" + fallback indicator | Contentful [67][187]; Payload [59] | Inherit values with visible provenance | Per-field override toggle; greyed inherited value; tooltip "from base" |
| Live preview iframe + breakpoint toolbar + perspective | Payload [58]; Storyblok [63]; Sanity [55]; Open edX Preview/View Live [79] | Exact-experience preview per device size and draft/approved | Render the shipped shell in an iframe; toolbar: size presets, variant picker, draft/approved |
| Release readiness badge | Strapi Empty/Blocked/Ready/Done [62]; Sanity validation warnings [53] | Rolls up per-entry readiness; blocks publish when Blocked | Computed checks per lesson/variant; block Build while Blocked |
| Release form (tag, notes, assets, draft vs publish) | GitHub Releases [81]; Storyline "Publish Successful → Zip" [70] | Create a versioned, downloadable artefact | Form + async job; artifact row with size, SHA-256, Download |
| Build log with colour-coded lines and permalinks | Vercel [82] | Diagnose failed builds without a developer | Persist log per release; yellow/red lines; `#L` anchors |
| Autosave + unsaved-changes banner | Craft [85]; Payload autosave [56] | Prevents data loss | Debounced PATCH to draft version; banner with Save/Discard |
| Role-restricted notes field | Frappe Instructor Notes [78] | Internal reviewer notes hidden from learners | Field with RLS/visibility rule; excluded from package |

### 3.13 Answers to the nine admin research questions

**A1. Navigating a deep hierarchy (family → model → handle → region → program → lesson).** Three idioms recur: nested side-by-side panes (Sanity) [52], an expandable outline tree with inline status (Open edX, Frappe, Dozuki) [80][78][71], and a dropdown/breadcrumb switcher for versions/variants at the top of the item (Directus, Dozuki Head, Craft) [61][73][85]. Recommended: Pane 1 = families/models; Pane 2 = handle configs + regions as filter chips; Pane 3 = programs; Pane 4 = ordered lesson list + editor; beyond three panes collapse to breadcrumbs. Keep the variant/version switcher in the lesson header, not in the tree, so the tree stays one node per lesson.

**A2. Quick find.** Confirmed: GROQ-filtered lists (Sanity) [52], bulk-select in list view (Strapi) [62], a management page filtered by release state (Dozuki) [73], "Mine"/"Pending" approval filters [74], "Edited" badges (Craft) [85]. No fetched page documented a command palette. For 4 models × a few regions × 8 lessons, a status-filtered list plus device/region chips beats full-text search; ⌘K is a nice-to-have.

**A3. Editing a lesson that mixes text, images, video and warnings.** Every lesson tool uses a vertical stack of typed blocks inserted via "+"/drawer with collapse, drag-reorder, duplicate and reusable templates (Rise, Payload, Frappe, Storyblok) [69][60][78][63]; Dozuki adds caution/note/reminder bullets, marker-coloured bullets and a 3-images-per-step cap [71]; Frappe adds role-restricted notes [78]; Craft adds autosave with a failure caution icon [85]. For Tigertriever v1 a rigid template form suffices (Section 8); the block set is v2.

**A4. Creating a new product and reusing materials.** Observed reuse: reference/embed a shared unit (Dozuki prerequisites; Sanity "Used on N pages") [72][55]; saved block templates/presets (Rise, Storyblok) [69][63]; copy a version from another release and duplicate row (Sanity, Payload, Directus "all versions start from published") [53][60][61]. No product offers a "create product from template inheriting lessons" wizard. Recommended: "New device" wizard that lists a source program's 8 lessons with a per-lesson choice **link shared / fork copy**, plus a media library with usage counts.

**A5. Device/region variations without duplicating lessons.** Best-specified model is the locale-with-fallback-chain (Contentful chains + "allow empty"; Payload per-field `localized` + `fallbackLocale`) [67][59]; Sanity offers inline per-language arrays [54]. Applicability toggles per device/region exist natively nowhere. Treat each (device, region) as a variant key; mark which fields are variant-able; show inherited values greyed until overridden; add a lesson-level "applies to" multi-select. Warn before changing a field's variant-ability (Payload's data-loss caveat) [103]. Section 8 argues for whitelist semantics rather than silent fallback.

**A6. Exact-experience preview.** Universally an iframe of the real front end fed with unsaved data, plus a viewport toolbar (Payload named breakpoints; Storyblok Desktop/Mobile/Full-width; Sanity phone icon) and a perspective/variant switch (Sanity global perspective; Payload `locale` in URL; Storyblok `_storyblok_release`; Open edX Preview vs View Live) [58][63][55][66][79]. For an offline package the preview should render the *same static shell that ships in the zip* with toolbar presets (laptop, tablet landscape/portrait, phone), a variant picker and draft/approved perspective. Skip click-to-edit overlays; implement one-way "click block → scroll preview" via `postMessage`.

**A7. Representing drafts / approved / history / unpublished changes.** State models: Payload Draft/Published/Changed [56]; Storyblok four statuses [63]; Open edX four publish states [79]; Sanity ring/filled + version chips [53]; Dozuki Head vs V.n with release notes and major/minor [73]; Directus dropdown + revisions compare/apply [61]; Craft provisional vs named drafts [85]; Figma side-by-side diff + Approved/Changes-suggested badges [84]. Recommended lesson-version states: **Draft → In review → Approved → Superseded/Retired**, with "Changed" derived when an approved version exists and a newer draft is open; header dropdown "Working draft / Approved vN"; on Approve show a field diff, require release-note text + major/minor, record approver with meaning (Section 8).

**A8. Surfacing missing files and incomplete lessons.** Lenient drafts, strict publish (Payload, Directus, Craft) [56][61][85]; per-entry readiness + release badge Empty/Blocked/Ready/Done (Strapi) [62]; required-field errors block the compare modal (Directus) [61]; releases screen shows validation warnings (Sanity) [53]; build logs with yellow warnings / red errors (Vercel) [82]. Implement a release readiness panel computing: missing video/poster/image, empty warning text, lesson count ≠ 8, unresolved override tie, unapproved version for a variant in scope; block Build while Blocked; mirror issues in the build log. Sanity's in-document validation panel UI is inferred-not-seen.

**A9. Initiating and managing downloadable releases.** Combine GitHub Releases' form (tag, title, "Generate release notes", attach binaries, Save draft vs Publish, pre-release/latest, pencil/trash) [81], Vercel's build feedback (Build Logs button, colour-coded log, permalinks, per-deployment URL, promote/rollback) [82][83], Dozuki's semantics (release notes, major/minor, scheduled date, approval gate) [73][74], Storyline's "Publish Successful → Zip" end state [70], and Strapi/Sanity readiness and scheduling [62][53]. Payload's caveat applies: scheduled/background work needs a running job runner — "Without a way to run jobs, scheduled events never execute" [56]. Build asynchronously and persist logs per release.

---

## 4. Comparative analysis of UX patterns

### 4.1 End-user patterns × products × verdict

| Pattern | Touch Surgery | Incision | Philips IGT | Rapid Medical | Mentice | Thrombectomy EVT | EVT Navigator | iFixit/Dozuki | LEGO | Cortona3D | IETP viewers | Verdict for Tigertriever |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Linear in-step player with n/N + progress | ✔ [1] | — | — | — | guided mode [11] | — | — | — | ✔ one step/screen [40] | ✔ scrub [42] | — | **Adopt** for in-stage pacing |
| Random-access stage/section list | — | ✔ 9 fixed sections [6] | library [7] | tabs [8] | hotspots [11] | ✔ list + tab bar [20] | accordion [21] | long scroll [30] | — | TOC [41] | TOC/search [44][46] | **Adopt** as model overview |
| Persistent per-stage tab strip | — | — | — | — | — | ✔ [20] | — | — | — | — | — | **Adopt** (grouped 3/3/2) |
| Variant selector under title | — | ✔ "Standard protocol ▾" [6] | version in doc title [7] | US/OUS sites [8][9] | technique/access params [11] | — | pinned vessel card [21] | — | set number/QR [40] | — | version select (Apple) [49] | **Adopt** as config chip |
| Device/model chosen by clinical context | — | — | — | microcatheter sizes [8] | clot location [11] | — | ✔ vessel → model [21] | — | — | — | — | **Adopt** on Home |
| Media top / text sheet bottom | ✔ [1] | photo + bullets [6] | — | PiP animation [8] | — | text only [20] | text only [21] | ≤3 images + bullets [31] | 3D [40] | overlay text [42] | — | **Adopt** (media never covered) |
| In-frame annotation / callouts | ✔ white labels [1] | — | — | labelled diagram [8] | roadmap targets [11] | — | — | ✔ colour markers ↔ bullets [32] | — | magnifiers [41] | — | **Adopt** numbered markers matched to bullets |
| Instruction + rationale two-sentence text | ✔ [1] | — | — | — | — | — | — | action + nested caution [30] | — | — | — | **Adopt** |
| Colour-typed warning boxes with source tag | — | orange dot [6] | — | — | named penalties [11] | ✔ red/blue boxes [20] | — | ✔ Caution/Note/Reminder [33] | — | ✔ per-step warnings [41] | — | **Adopt**; never collapse Warning/Caution |
| Essential vs supplementary layering | ⓘ icon [1] | Document/Video badges, Hold [6] | Saved tab, typed docs [7] | request forms [8] | — | paywall tiers [20] | spec table expand [21] | Show more… [30] | — | — | PDF per chapter [44] | **Adopt** ⓘ + References tab |
| Duration/time metadata | "N Phases" [1] | "Updated On" [6] | "~5 min" [7] | — | — | — | — | Time/Difficulty [30] | — | — | — | **Adopt** per stage |
| Guided → test/hint ladder | learn/test [3] | — | — | — | guided → challenge [11] | — | — | — | — | — | — | **Later** (hide-text toggle) |
| Scoring / named hazards | test scores [3] | — | — | — | ✔ [11] | calculators [20] | — | — | — | — | — | **Later**; use hazards as warning content now |
| Offline delivery | per-module download [3] | — | Saved tab [7] | — | hardware | ✔ one-time, offline [20] | ✔ | PDF only [34]; Dozuki offline undocumented [35] | ✗ online-only [40] | local files [42] | standalone tablet [46] | **Must**: whole package offline |
| Dark / high-contrast UI | — | — | — | — | fluoro UI [11] | ✔ [20] | — | Dozuki dark mode declared [35] | — | — | ADAM dark mode [46] | **Adopt** as a theme option |
| Return mark on cross-links | — | back arrow [6] | — | — | — | ‹ Back [20] | — | — | — | — | ✔ [44] | **Adopt** for warning/glossary links |
| Login wall | free account [3] | institutional [6] | unknown [7] | gated webinars [8] | institutional [11] | none [20] | none [21] | Dozuki yes [35] | optional [40] | none [42] | yes [44][46] | **Avoid** in the offline app |

### 4.2 Admin patterns × products × verdict

| Pattern | Sanity | Payload | Directus | Strapi | Storyblok | Contentful | Dozuki | Open edX / Frappe | GitHub / Vercel / Figma / Craft | Verdict |
|---|---|---|---|---|---|---|---|---|---|---|
| Nested panes / outline tree | ✔ panes [52] | collection lists | collection lists | lists | blocks sidebar [64] | — | guide → steps [71] | ✔ outline [80]; Course→Chapter→Lesson [78] | — | **Adopt** 3–4 panes + breadcrumbs |
| 3–4 state publish status | ring/filled [53] | Draft/Published/Changed [56] | version dropdown [61] | Draft & Publish | 4 statuses [63] | — | Head vs V.n [73] | 4 states [79] | Craft Edited badge [85] | **Adopt** Draft / In review / Approved / Superseded + derived Changed |
| Version history with diff + restore | releases [53] | ✔ compare + restore [57] | ✔ compare + apply [61] | Growth only (14-day) [115] | — | — | ✔ revert [73] | discard draft [79] | Figma side-by-side [84]; Craft revert [85] | **Adopt** full snapshots + field diff |
| Field-level accept/reject on publish | — | — | ✔ [61] | — | — | — | — | — | — | **Adopt** (medium cost, high value) |
| Approval stages / signatures | — | access-control gated publish [56] | policies | Enterprise Review Workflows [115] | — | — | ✔ stages + signatures [74] | — | Figma Approve/Suggest [84] | **Adopt** single stage with meaning + timestamp |
| Field-level variants with fallback | ✔ arrays [54] | ✔ `localized` + fallback [59] | translations, no fallback [113] | per-locale publish, no fallback [118] | field/folder/space [190] | ✔ chains + optional locale [67] | — | — | — | **Adapt**: per-field override, but **whitelist**, not silent fallback |
| Applicability toggles (show for device X) | — | — | — | — | — | — | — | — | — | **Build**: nothing native anywhere |
| Shared unit reuse / usage badge | "Used on N pages" [55] | — | — | — | presets [63] | — | ✔ prerequisites [72] | — | — | **Adopt** link-shared/fork + usage badge |
| Block editor with drawer | Portable Text | ✔ [60] | — | dynamic zones | ✔ [63] | — | step bullets [71] | ✔ "+" menu [78] | — | **v2** closed block set |
| Live preview iframe + breakpoints + perspective | ✔ [55] | ✔ [58] | — | Growth Preview [115] | ✔ [63] | — | — | Preview vs View Live [79] | — | **Adopt** with shipped shell |
| Release readiness badge | validation warnings [53] | — | required-field block [61] | ✔ Empty/Blocked/Ready/Done [62] | — | — | — | — | — | **Adopt** |
| Releases pin versions (not references) | one version per doc per release [53] | — | — | ✗ references only [62] | — | — | V.n immutable [73] | — | GitHub immutable releases [81] | **Adopt** pinned version IDs |
| Release notes + major/minor | — | — | — | — | — | — | ✔ [73] | — | ✔ GitHub [81] | **Adopt** |
| Build log, artefacts, rollback | — | — | — | — | — | — | — | — | ✔ Vercel [82]; GitHub assets [81] | **Adopt** |
| Autosave + unsaved banner | — | autosave [56] | — | — | — | — | — | — | ✔ Craft [85] | **Adopt** |
| Click-to-edit preview overlays | ✔ [55] | — | — | — | ✔ [64] | — | — | — | — | **Skip** (expensive) |

### 4.3 Cross-cutting observations

The end-user and admin benchmarks converge on a small shared vocabulary: a fixed skeleton (Incision's nine sections; Dozuki's step grammar; DITA `<steps>`), a typed callout tier (Caution/Note/Reminder; red/blue boxes; named penalties), a visible version/variant state (Dozuki "latest approved standard", iFixit dated PDFs, Incision "Updated On", Payload/Storyblok status dots), and a release that becomes a concrete, immutable artefact (Storyline's Zip, GitHub assets). Two items the brief needs are absent from every product examined and must be designed from scratch: (1) simultaneous selection of three variant axes (size × handle × region) in one UI, and (2) whitelist applicability where content is invisible to a variant until positively marked valid and approved. Both are discussed in Sections 5–8.

---

## 5. Three promising UX directions for the Tigertriever training application

All three directions share the same content package and shell constraints (Section 10) and the same macro-grouping of the eight stages into **Prepare (1–3) → Deploy & Engage (4–6) → Retrieve & Repeat (7–8)**. They differ in navigation model and in how a stage is composed.

### 5.1 Direction A — "Stage Player" (player-first, linear within a stage)

- **Concept:** a Touch Surgery-style player is the primary surface. The learner picks a device and configuration once, then runs stages 1–8 as a paced sequence of screens, each with a looping animation or video on top and an IFU-worded action/rationale sheet below. A thin stage rail allows jumps.
- **Screen inventory:** Launch/Region confirm → Home (model picker by target vessel) → Model overview (fixed 8-stage list, grouped 3/3/2, each row with media type, duration, regional badge) → Stage player (one screen per step; stages hold 1–5 steps) → Stage complete card → Pass summary → References (device anatomy diagram, spec table, videos, evidence) → About this package.
- **Navigation model:** overview is random access; inside a stage, strictly next/previous with an n/N counter; a persistent stage rail (8 chips grouped 3/3/2) for lateral jumps; ✕ returns to the overview; resume-where-left-off from `localStorage`.
- **Step screen composition:** header chip "Tiger 17 · Handle B · EU ▾" + "Stage 4/8 — Deployment · step 2/3" + progress bar; media pane (click-to-play H.264 video with poster, or muted looping animation; PiP inset of handle when relevant); drag-up sheet with the action sentence (IFU wording), rationale sentence, Warning/Caution box with source tag, ⓘ for supplementary detail; footer Prev / Next.
- **Device/config/region display:** the header chip is tappable and opens a sheet to switch handle type or region in place (Apple version-selector behaviour); model switch returns to the overview; the footer shows "content 1.4.0 · published 2026-10-16".
- **Pros:** closest to the strongest benchmark [1]; paced; media never covered; easy to validate every step has media + text + warning; supports a hide-text "test mode" cheaply.
- **Cons:** linear rigidity inside stages was the main criticism of Touch Surgery [4]; refresher users who want one fact must click through; more screens to author (one per step).
- **Borrows from:** Touch Surgery player [1]; Incision config dropdown [6]; Thrombectomy EVT stage strip [20]; Rapid PiP animation [8]; LEGO one-step-per-screen [40]; Cortona3D scrubbable animation [42].

### 5.2 Direction B — "Protocol Sheet" (reference-first, fixed skeleton, scroll within stage)

- **Concept:** each device is a protocol page with the same eight sections in the same order (Incision pattern). A stage opens as a scrolling sheet: media gallery at the top, numbered steps with marker-coloured bullets, callouts inline, materials list with Hold/optional badges. Optimised for the rep or clinician who already knows the procedure and needs a fast, scannable refresher.
- **Screen inventory:** Launch/Region → Home (device cards with configuration micro-grid) → Protocol overview (8 chevron rows + "Materials", "Device anatomy", "References") → Stage sheet (scrolling) → Materials → Device anatomy (labelled diagram) → References → About.
- **Navigation model:** random access everywhere; "‹ Back" returns to the overview; a second tap on back returns Home (Incision rule) [6]; cross-links to warnings carry a return mark (R&S) [44]; no forced order.
- **Step screen composition:** one stage = one long page: title + est. time; up to three images or one video per step (Dozuki cap) with numbered markers; step bullets whose leading number/colour matches markers; Warning > Caution > Note callouts stacked under the step they belong to; "Hold"-style badge for optional steps; sticky mini-header with stage name while scrolling.
- **Device/config/region display:** "Standard handle ▾ · EU" dropdown directly under the device title with "Updated On" date; an orange-dot marker on any step that deviates from the base for this variant.
- **Pros:** one map for every device; fastest for lookup; simplest authoring (fits the rigid lesson template exactly); works well on laptop widths.
- **Cons:** scrolling-document steps were a weakness of Incision [6] and iFixit [30]; no pacing or completion feedback; harder to guarantee the learner saw every warning.
- **Borrows from:** Incision Assist [6]; iFixit/Dozuki step grammar [31][32][33]; Philips typed documents [7]; Mako configuration card [14]; Apple in-place version switch [49].

### 5.3 Direction C — "Console" (context-first, persistent strip, dark lab theme)

- **Concept:** a dark, high-contrast interface designed to be glanced at in a cath-lab or during a case review. A persistent bottom strip shows all eight stages at all times; a pinned context card at the top shows target vessel → chosen Tiger model and the active handle/region. Each stage is a dense two-pane layout: media left, action/warnings right (laptop) or stacked (phone). An optional "hide text / reveal hint" toggle gives a self-test.
- **Screen inventory:** Launch/Region → Context setup (vessel diameter → suggested model via EVT Navigator-style accordion) → Console (persistent strip + current stage) → Stage detail overlay (full-screen media with annotations) → Hazards list (Mentice-style named hazards per stage) → Device anatomy → About.
- **Navigation model:** persistent stage strip (one icon per stage, Thrombectomy EVT pattern) [20]; swipe/arrow between stages; strip badges show completion; no overview page — the strip *is* the overview.
- **Step screen composition:** two panes: left = video/animation with scrub bar and PiP handle inset; right = action sentence, rationale, Warning/Caution boxes tagged with source, hazard chips ("vessel scraping", "movement without fluoro") drawn from the Mentice vocabulary [11]; header strip with text-size A−/A+ and a timer (Thrombectomy EVT) [20].
- **Device/config/region display:** pinned context card "Target vessel M1 (2.5 ± 0.4 mm) → Tiger 17 · Handle B · EU" always visible; tap to change.
- **Pros:** fastest lateral movement; strongest sense of "where am I"; dark theme suits the lab; context-first selection reduces wrong-model errors.
- **Cons:** densest screens — hard at phone width; two-pane layout multiplies responsive work; no benchmark combined all these elements, so it is the least proven; risk of looking like a clinical tool rather than training.
- **Borrows from:** Thrombectomy EVT [20]; EVT Navigator [21]; Mentice hazards [11]; Medtronic AS TAVR persistent controls [16]; ADAM dark mode [46]; Osso hint-on-demand [18].

### 5.4 Recommendation

Adopt **Direction A (Stage Player) as the MVP core**, with two borrowings: Direction B's protocol overview as the Model page (so the fixed 8-stage skeleton is the first thing a user sees, and the rigid lesson template maps 1:1 to it), and Direction C's persistent stage strip inside the player (grouped 3/3/2). Defer Direction C's dark theme, vessel-first context setup and hide-text test mode to a later release; they are additive to the same content model. Rationale: A is the only direction with a strong inspected benchmark for the step surface [1]; it guarantees that every warning is presented at the point of use (the eIFU principle [28]); and its screen-per-step structure validates cleanly against the content model in Section 8. B alone repeats the "scrolling document" weakness; C alone is unproven and layout-heavy.

---

## 6. Proposed user journey for the training experience

The journey covers download → first launch → choosing a device → completing one pass of all eight stages. Each screen is described as a text wireframe (regions and contents). Laptop (Windows Edge / macOS Safari) is the primary target; phone widths are secondary; iPad is excluded from the file:// package (Section 10).

### Step 0 — Download page (hosted, online)

```
+------------------------------------------------------------------+
| Header: Rapid Medical logo · "Tigertriever Training" · Sign in?  |
|------------------------------------------------------------------|
| Left column: package cards, one per scope                        |
|  [ Tiger 17 · EU · content 1.4.0 (build 87) · 2.3 GB · Download ]|
|  [ Tiger 13 · EU · content 1.4.0 (build 87) · 2.1 GB · Download ]|
|  [ Full package · all models · 7.8 GB · Download ]               |
|  each card: published date · SHA-256 (copy) · "What's new"       |
| Right column: "How to open" 3 steps: 1 Download zip 2 Extract    |
|  3 Open START_HERE.html — browser badges Edge/Chrome/Safari      |
| Footer: previous versions · support contact                      |
+------------------------------------------------------------------+
```
Scoped packages (one per model/region) are preferred over one monolithic zip for hospital Wi-Fi and the 2 GiB GitHub cap if Releases are ever used [181]; size and checksum shown so IT can verify.

### Step 1 — Extract and open (OS level)

Windows Explorer extraction preserves Mark-of-the-Web but does not block opening `.html` in a browser [160]; macOS opening a local HTML file is not an app launch so Gatekeeper does not apply [163]. `START_HERE.html` is a one-screen launcher:

```
+------------------------------------------------------------------+
| Big title: Tigertriever Training · content 1.4.0 · Tiger 17 · EU |
| [ Open the training ]  (links to index.html#/)                    |
| Small text: "Works in Edge, Chrome or Safari. If anything does   |
|  not display, right-click index.html → Open with → Chrome/Edge." |
| "This package is for offline use. Version and checksum: …"       |
+------------------------------------------------------------------+
```

### Step 2 — First launch: confirm region (and language if applicable)

```
+------------------------------------------------------------------+
| Progress dots (1 of 2)                                            |
| "Confirm your region" — two large cards: [ EU (MDR) ] [ US (FDA) ]|
| Note: "Regulatory wording and indications differ by region."     |
| Only regions present in the package are enabled; a single-region |
| package skips this screen.                                       |
| [ Continue ]                                                      |
+------------------------------------------------------------------+
```
Norditropin's "confirm your product, then follow" pattern [28]; the OUS/US split already exists at Rapid Medical [8][9]. The choice is stored in `localStorage` under a content-version-prefixed key [144].

### Step 3 — Home: choose the device

```
+------------------------------------------------------------------+
| Top bar: logo · region chip "EU ▾" · search (optional) · About   |
|------------------------------------------------------------------|
| Section A "Choose by target vessel" (EVT Navigator pattern)      |
|  slider/segmented: vessel diameter → suggested model highlighted |
| Section B "Choose by model" — 4 cards in a row                   |
|  [ Tiger 13 | 0.013" microcatheter | 8 stages · ~25 min | ▶ ]    |
|  [ Tiger 17 | 0.0165" | 8 stages · ~25 min | Resume stage 4 ]    |
|  [ Tiger 21 ] [ Tiger 25 ]  (greyed if not in this package)      |
|  card micro-grid (Mako pattern): microcatheter · handle types    |
|  available · last updated                                        |
| Section C "Reference": Device anatomy · Spec table · Evidence    |
| Footer: content 1.4.0 (build 87) · published 2026-10-16 ·        |
|  [Update available] banner only if online check succeeds         |
+------------------------------------------------------------------+
```

### Step 4 — Model overview (fixed 8-stage skeleton)

```
+------------------------------------------------------------------+
| ‹ Home   Tiger 17   [ Handle: Standard ▾ ]  [ Region: EU ]        |
| Sub-header: "Updated 2026-10-16 · content 1.4.0" · overall       |
|  progress ring 3/8                                                |
|------------------------------------------------------------------|
| PREPARE                                                           |
|  1 ▸ Patient & access setup        video 2:10 · ✓                 |
|  2 ▸ Device inspection & flush     3 images · ✓                   |
|  3 ▸ Microcatheter positioning     video 1:40 · ✓                 |
| DEPLOY & ENGAGE                                                   |
|  4 ▸ Deployment (Penetrate)        animation · ● regional note    |
|  5 ▸ Adjust (expand/compress)      animation + video              |
|  6 ▸ Relax & dwell                 video 0:50                     |
| RETRIEVE & REPEAT                                                 |
|  7 ▸ Retrieval                     video 1:20 · ⚠ 2 warnings      |
|  8 ▸ Assessment & subsequent pass  3 images                       |
|------------------------------------------------------------------|
| [ Start / Resume pass ]   secondary: Materials · Device anatomy  |
+------------------------------------------------------------------+
```
Rows carry media-type + duration tags (Philips) [7], completion ticks, a regional dot where this variant deviates from base (Incision orange dot) [6], and a warning count. The handle dropdown swaps variant-specific content in place without leaving the page (Apple) [49]; stages not whitelisted for the current variant are hidden, never greyed (Section 8).

### Step 5 — Stage player (repeated for each stage; one screen per step)

```
+------------------------------------------------------------------+
| ✕   Tiger 17 · Standard · EU ▾        Stage 4/8 — Deployment      |
|     step 2 of 3  ▰▰▰▱▱▱▱▱ (thin progress bar)                      |
|------------------------------------------------------------------|
| MEDIA PANE (≈60% height)                                           |
|  looping muted animation OR click-to-play video with poster      |
|  ○ PiP inset: hand on handle, thumb on orange slider              |
|  numbered markers ①② on frame; scrub bar; ⤢ fullscreen; A-/A+    |
|------------------------------------------------------------------|
| TEXT SHEET (drag-up)                                              |
|  ① Action (IFU wording): "Advance the delivery wire until the     |
|     distal marker is ≥ … beyond the clot."                        |
|  ② Rationale: "Positions the cage to penetrate rather than …"     |
|  ⚠ WARNING (red, icon) "Do not …" — source: IFU §7.2              |
|  △ CAUTION (amber, icon) "…" — source: IFU §7.3                    |
|  ⓘ More: evidence, physician video (opens drawer, returns here)   |
|------------------------------------------------------------------|
| STAGE STRIP: [1][2][3] · [4][5][6] · [7][8]  (current highlighted)|
| [ ‹ Previous ]                                 [ Next step › ]    |
+------------------------------------------------------------------+
```
Composition rules: media is never covered by text [1]; action text uses IFU wording and warnings appear at the point of use [28]; markers are numbered *and* coloured so meaning never depends on colour alone [35]; Warning/Caution boxes are never collapsible; ⓘ content is supplementary. Autoplay with sound is never assumed — poster + Play button [158].

### Step 6 — Stage complete card

```
+------------------------------------------------------------------+
| ✓ Stage 4 complete — Deployment                                   |
| Recap: 3 steps · 2 warnings shown                                 |
| Optional self-check (later release): 1–2 knowledge questions,    |
|  non-punitive with explanation (Microsoft Learn pattern) [50]     |
| [ Continue to Stage 5 › ]   [ Back to overview ]                   |
+------------------------------------------------------------------+
```

### Step 7 — Pass summary

```
+------------------------------------------------------------------+
| "Pass complete — Tiger 17 · Standard · EU"                        |
| 8/8 stages · time spent · date                                    |
| Grid of 8 stage tiles with ✓; tap any to revisit                  |
| Warnings reviewed: list of all Warning/Caution items (printable) |
| [ Start another pass ] [ Switch model ] [ Export summary (PDF/   |
|  print) ]                                                         |
| Footer: content 1.4.0 · published 2026-10-16 · SHA-256 …          |
+------------------------------------------------------------------+
```
Progress lives only in `localStorage`; the summary states it is local to this computer. Learner tracking (xAPI/cmi5) is explicitly out of scope for the offline package.

### Step 8 — References and About

```
References: tabs [ Device anatomy | Specifications | Videos | Evidence ]
  Device anatomy: labelled diagram (Rapid specs image) with tappable
   callouts → definition; "return to stage" button if arrived via ⓘ
  Specifications: uniform spec table per model (EVT Navigator)
  Videos: duration-stamped list (Philips) · Evidence: trial list
About this package: content version, shell version, build, published,
  scope, changelog, SHA-256, "Check for updates" (online only)
```

### Update banner (online only)

On startup the shell attempts `fetch(latest.json, {cache:'no-store'})` inside try/catch; if it succeeds and a newer build exists for this scope, a non-blocking banner reads "Version 1.5.0 is available — download from …". If offline or CORS-blocked it silently skips [144].

---

## 7. Proposed editorial workflow for the custom admin panel

The admin is an online React application (Section 9). Roles: **Editor** (create/edit drafts, submit for review, build pre-release packages), **Approver** (approve versions per variant, publish releases), **Admin** (taxonomy, users). Each screen is a text wireframe; state definitions follow.

### 7.1 Login

```
+--------------------------------------------+
| Rapid Medical · Training Admin             |
| Email / Password · [ Sign in ] · SSO later |
| MFA prompt (TOTP) for Approver/Admin       |
+--------------------------------------------+
```
Auth is bought, not built (Supabase Auth with MFA on all plans) [90].

### 7.2 Dashboard — "what needs attention"

```
+------------------------------------------------------------------+
| Left nav: Dashboard · Devices · Programs · Lessons · Media ·      |
|  Releases · Taxonomy · Users                                      |
|------------------------------------------------------------------|
| Filter chips: Device [all ▾] Handle [all ▾] Region [all ▾]        |
| Status tabs: Needs review (3) · Unreleased changes (5) ·          |
|  Blocked releases (1) · Up to date                                |
| Table: Lesson · Program · Variant(s) · Status dot · Last edited · |
|  Approved vN · Action                                             |
| Right rail: "Latest releases" (version, scope, status, Download) |
+------------------------------------------------------------------+
```
Dozuki's Version Control Management page ("up to date / unreleased changes / unpublished") [73] plus Craft's "Edited" badge [85].

### 7.3 Taxonomy

```
Tabs: Device models · Handle configurations · Regions · Variants
Device models table: id · label · family · microcatheter · active
Variants tab: matrix Device × Handle × Region with checkboxes —
  only checked cells are valid variants (an invalid combination cannot
  be selected anywhere else). [ Add device model ] is a data insert.
```
Taxonomy-as-data follows S1000D's ACT/PCT separation [195][197].

### 7.4 New device wizard ("Create Tiger 25")

```
Step 1 Basics: label, microcatheter size, valid handle configs, regions
Step 2 Source program: [ Tigertriever core (Tiger 17) ▾ ]
Step 3 Lessons: table of 8 slots — for each: ○ Link shared  ○ Fork copy
  "Used in N programs" badge beside shared lessons
Step 4 Review → [ Create ] → lands in Program view
```
Dozuki prerequisite reuse [72] and Sanity "Used on N pages" [55].

### 7.5 Program view (8 slots)

```
+------------------------------------------------------------------+
| ‹ Programs   Tigertriever core · Tiger 17   [ Preview ] [ Build ] |
| Variant filter chips: Standard/EU · Standard/US · Extended/US …   |
|------------------------------------------------------------------|
| Slot  Lesson                      Status      Approved for        |
| 1     Patient & access setup      ● Approved  3/3 variants        |
| 2     Device inspection & flush   ◐ Changed   2/3 (US pending)    |
| 3     Microcatheter positioning   ○ Draft     0/3                 |
| …                                                                 |
| Drag handle to reorder (slots fixed at 8 — warn on count ≠ 8)     |
+------------------------------------------------------------------+
```

### 7.6 Lesson editor (rigid template, v1)

```
+------------------------------------------------------------------+
| ‹ Program   Lesson 3 — Microcatheter positioning                  |
| [ Working draft ▾ | Approved v2 ]  status pill: Changed            |
| Effective-content selector: Device [T17] Handle [Std] Region [EU] |
| [ Save ] (autosave on, "unsaved changes" banner) [ Submit review ]|
|------------------------------------------------------------------|
| LEFT (form, scrollable)                 | RIGHT (effective preview)|
|  Applies to (whitelist): ☑T13 ☑T17 ☐T21 |  iframe of shipped shell |
|   ☑Std ☐Ext · ☑EU ☑US                   |  size: [Laptop|Tablet|   |
|  Title ───────────────── [override ▾]   |   Phone]  perspective:   |
|  Objective ────────────── (inherited,   |   [Draft|Approved]       |
|   greyed, "from base" tooltip)          |  provenance badges on    |
|  Steps (ordered)                        |   each block: base /     |
|   Step 1  cmd ─────── media [+]         |   override T17+Ext      |
|     applies to ☑… (defaults from lesson)|  validation list:        |
|     [override for this variant]         |   ⚠ step 2 no poster     |
|   Step 2 … [+ Add step] [⋮ duplicate]   |   ✖ warning w2 empty US  |
|  Warnings (severity Warning/Caution/    |                          |
|   Note; text; source ref; applies to)   |                          |
|  Video (upload/pick from library;       |                          |
|   override per variant)                 |                          |
|  Images (≤3 per step; numbered markers) |                          |
|  Extra materials (PDF)                  |                          |
|  Reviewer notes (approver-only)         |                          |
+------------------------------------------------------------------+
```
Patterns: Head-vs-approved dropdown [73]; Contentful-style inherited value with fallback tooltip [187]; whitelist checkboxes replace fallback; validation list scrolls to the block (Strapi readiness / Sanity warnings) [62][53]; reviewer notes role-restricted (Frappe) [78]; autosave banner (Craft) [85]; media picked from a library with usage counts.

### 7.7 Media library and upload

```
Grid/list: thumbnail · filename · type · duration · size · SHA-256 ·
  used in N lessons · state (Uploading / Transcoding / Ready / Failed)
Upload: drag-drop → resumable (TUS) → transcode job → poster frame →
  Ready. Original kept; derived H.264 MP4 used in packages.
```
Resumable uploads are provided by the backend (Supabase TUS) [88]; transcoding runs in the build worker (Section 10).

### 7.8 Submit for review and approval

```
Approver inbox: Pending (Mine) · table: lesson · version · variants ·
  requested by · when
Approval screen:
  Header: Lesson 3 · draft v3 vs Approved v2 · side-by-side | overlay
  Field diff (Directus): changed fields highlighted; per-field ✓/✗
  Variant checklist: ☑ T17/Std/EU  ☑ T17/Std/US  ☐ T13/Std/EU (not in
   my scope) — approval recorded per checked variant
  Required: release note (text) · Major/Minor · Meaning: "Approval"
  [ Approve selected variants ]  [ Request changes ] (comment)
  Record: printed name · date/time · meaning (21 CFR 11.50 triad)
```
Directus field-level accept [61]; Dozuki release notes + major/minor [73]; Figma Approve/Suggest changes [84]; signature manifestation requirements [209].

### 7.9 Preview

```
Toolbar: Scope [Program ▾] Variant [T17 · Std · EU ▾] Perspective
  [Draft | Approved] Size [Laptop 1280 | Tablet 1024×768 | Phone 390]
  [ Open in new tab ]
Body: iframe running the SAME shell that ships in the zip, fed a
  content.js generated from the selected perspective.
```
Payload breakpoints + Sanity perspective [58][55]; Open edX Preview vs View Live [79].

### 7.10 Releases list

```
Version · Title · Scope chips · Status dot (Draft/Queued/Building/
  Ready/Failed/Published) · Built by/when · Size · [Download] [⋯]
Badges: Latest · Pre-release
```

### 7.11 New release

```
Version: 1.5.0 (auto-suggested) ○ Major ○ Minor
Title · Release notes [ Generate from changes since 1.4.0 ]
Scope: variants multi-select (only valid variants)
Readiness panel (Strapi): per lesson/variant row → Ready / Not ready
  (missing media, unapproved for variant, count ≠ 8, override tie)
  Roll-up badge: Empty / Blocked / Ready
[ Save draft ]   [ Build ] (disabled while Blocked)   ☐ Pre-release
```

### 7.12 Release detail

```
Header: 1.5.0 · Ready · scope · built 2026-10-16 09:12 · by …
Artifacts: TigertrieverTraining-T17-EU-1.5.0.zip · 2.3 GB · SHA-256 ·
  [Download] · latest.json updated ✓
Build log (collapsible): timestamped lines, yellow warnings, red
  errors, line permalinks #L12
Build report: lessons/blocks/media counts, de-dup savings, errors[],
  warnings[]
Actions: [ Publish ] (Approver; immutable afterwards) · [ Set as
  latest ] · [ Roll back to 1.4.0 ] · [ Delete draft ]
```
GitHub Releases + Vercel logs [81][82].

### 7.13 State and status definitions

| Entity | States | Transitions and rules |
|---|---|---|
| Lesson version | **Draft** (never approved) → **In review** → **Approved** → **Superseded** (a newer version approved for the same variant) / **Retired** (withdrawn) | Edits always create a new draft row; approvals are per variant; "Changed" is a derived badge when an Approved version exists and a Draft is open. Approved versions are immutable (Payload full-copy pattern) [57]. |
| Approval record | one row per (version, variant): approver, printed name, timestamp, meaning | Required before a version is visible to that variant in any build (whitelist). Approval time must precede release publish time [211]. |
| Media asset | **Uploading** → **Transcoding** → **Ready** / **Failed**; **Deprecated** when unreferenced | Content-addressed by SHA-256 of the derived file; immutable once Ready. |
| Release | **Draft** → **Queued** → **Building** → **Ready** / **Failed** → **Published** (immutable) → **Superseded** when a newer release is set as latest | Pins `lesson_version_id`s and asset hashes; Blocked readiness prevents Build; only Approver can Publish; rollback = set an older Published release as latest (never edits). |
| Variant | **Active** / **Inactive** | Inactive variants cannot be selected in scope or applicability. |

---

## 8. Recommended scalable content model

### 8.1 Entities and relationships

1. **Taxonomy** (S1000D ACT/PCT pattern: products and states live in tables, content only references them) [195][197]: `product_family`, `device_model` (Tiger 13/17/21/25; microcatheter size), `handle_config`, `region`, and `variant` = the set of *valid* (device, config, region) triples, so impossible combinations cannot be selected.
2. **training_program**: ordered list of 8 lesson slots; `valid_for` whitelist of variants.
3. **lesson**: stable id, slot 1–8, shared across programs by reference (Dozuki prerequisite idea) [72]; `used_in` derived.
4. **lesson_version**: append-only full snapshot of the template (`status`, `created_by/at`, `supersedes`), the Payload full-copy pattern [57].
5. **Overrides** inside a version: per-section `{applies_to, value}` entries keyed by an applicability whitelist and resolved most-specific-first.
6. **approval**: `version_id, variant_id, approver, printed_name, approved_at, meaning, signature_ref`.
7. **media_asset**: immutable, content-addressed by SHA-256; derived MP4/poster; usage count.
8. **release**: immutable after publish; `scope` (variant set); `items[]` pin `lesson_version_id`s; `resources[]` list asset hashes; `manifest_sha256`.
9. **audit_event**: actor, timestamp, entity, before/after pointer for every state change (21 CFR 11.10(e): audit trails that "shall not obscure previously recorded information") [209].

### 8.2 Fields of the v1 lesson template

| Section | Fields | Variant-able | Applicability | Notes |
|---|---|---|---|---|
| Header | title, objective, estimated minutes | title, objective | lesson-level | |
| Steps[] (ordered) | id, cmd (IFU wording), rationale, media refs (≤3 images or 1 video), markers[] (number, colour, x/y, label) | cmd, rationale, media | step-level | Dozuki ≤3 images; numbered markers [31][32] |
| Warnings[] | id, severity (Warning / Caution / Note), text, source ref (IFU section / trial) | text | warning-level | Never collapsible in the viewer |
| Video | asset ref, poster ref | asset | lesson-level | H.264 MP4 + poster (Section 10) |
| Extra materials[] | asset ref (PDF), label | — | material-level | Supplementary layer |
| Reviewer notes | text | — | — | Approver-only; excluded from packages [78] |

### 8.3 Variation, override and whitelist-applicability strategy

- **Override resolution** is fixed and documented, most-specific first: `device+config+region → device+config → device+region → device → region → base`. A tie between two overrides of equal specificity is a **validation error at save time, not a runtime guess** — DITA's "most specific rule wins" and Sanity's left-to-right release stacking are the precedents [192][199].
- **Whitelist, not fallback.** Base content is invisible to a variant unless (a) the section's `applies_to` includes that variant and (b) an approval row exists for the version and variant. Both DITA and S1000D default to *include* — an untagged element reaches every variant [192][195] — and Contentful had to add fallback indicators because editors could not tell inherited from real content [187]. Strapi's per-locale publish ("nothing appears for a locale that has not been published") is the closest off-the-shelf whitelist behaviour [118]. For regulated instructions the whitelist posture is the safe one; the editor therefore offers no "applies to all except…" control, and the shell's `default_visibility` is `exclude`.
- **Effective-content view.** When the editor picks a (device, config, region) triple, the preview renders the resolved lesson and badges each block with provenance (base / which override) and approval state for that triple (Contentful tooltip; Sanity pinned perspective; Oxygen's semi-transparent excluded content) [187][199][191].
- **Where variation goes.** Regions and handle configurations are *not* modelled as CMS locales. Regions behave like locales (wording differs) but need whitelist semantics; handle configurations are relationships that change steps and media. Both live in `applies_to` selectors referencing taxonomy rows, so adding "Tiger 29" or a third region is a data insert.

### 8.4 Approval and version model

- Versions are **append-only full snapshots**; the lesson row holds only pointers. Payload's `_status` plus full-copy versions and `maxPerDoc` (default 100, 0 = keep all) is the reference implementation [57][56]; keep all versions here.
- Approval state belongs to the **version**, recorded **per variant**: `draft → in_review → approved → superseded/retired`. The approval row carries printed name, date/time and meaning — the 21 CFR 11.50 triad — and is linked so it cannot be transferred (11.70) [209].
- "Current for variant X" is a pointer to exactly one approved version per (lesson, variant). Superseded versions stay queryable, flagged, and excluded from learner views (ISO 13485 4.2.4 "prevention of unintended use of obsolete documents", as summarised) [211].
- Approval time must be earlier than release publish time ("approval dates after the document was already in use" is a common audit finding) [211]; the release builder enforces it.
- Whether e-signature controls apply to training content is a compliance decision; the data model costs little to support it.

### 8.5 Release manifest

Structure and resources are separated (IMS CP/SCORM `imsmanifest.xml` pattern: an ordered tree of items with stable identifiers, and resources listing every file) [204][205]; each lesson entry pins a version id plus a hash of its canonical JSON, and each file carries `href`, `bytes`, `mediaType` and `sha256` — the npm lockfile's `resolved` + `integrity` idea, so consumers "install exactly the same" thing [208]. Strapi's reference-only releases are the cautionary case: a release that publishes "whatever the draft is now" cannot prove what was approved [62]. Manifest fields:

`release{id, label, state, created_at, published_at, published_by, scope{variants[]}, program{id, title, lessons[]: {order, lesson_id, lesson_version_id, version_sha256, approvals[]}}, resources[]: {asset_id, href, mediaType, bytes, sha256}, manifest_schema_version, manifest_sha256, generator{shell_version, content_version, build_number, changelog}}`.

### 8.6 Example JSON (from the research notes)

```json
{
  "taxonomy": {
    "device_models": [{"id": "dev.tiger13", "family": "fam.tigertriever", "label": "Tigertriever 13"},
                      {"id": "dev.tiger17", "family": "fam.tigertriever", "label": "Tigertriever 17"}],
    "handle_configs": [{"id": "cfg.std", "label": "Standard handle"}, {"id": "cfg.ext", "label": "Extended handle"}],
    "regions": [{"id": "reg.eu", "label": "EU (MDR)"}, {"id": "reg.us", "label": "US (FDA)"}],
    "variants": [{"id": "var.t13-std-eu", "device": "dev.tiger13", "config": "cfg.std", "region": "reg.eu"},
                 {"id": "var.t17-ext-us", "device": "dev.tiger17", "config": "cfg.ext", "region": "reg.us"}]
  },

  "lesson_version": {
    "id": "lv_01HZX...",
    "lesson_id": "lesson.03-device-prep",
    "program_id": "prog.tigertriever-core",
    "slot": 3,
    "status": "approved",
    "supersedes": "lv_01HZW...",
    "created_by": "user.editor1", "created_at": "2026-09-30T14:02:11Z",
    "content": {
      "title": {"base": "Prepare the device"},
      "objective": {"base": "Learner can unpack, inspect and flush the device."},
      "steps": [
        {"id": "s1", "cmd": {"base": "Inspect packaging for damage."}, "media": [{"base": "asset.sha256:ab12..."}]},
        {"id": "s2",
         "cmd": {"base": "Flush the microcatheter with heparinized saline.",
                 "overrides": [
                   {"applies_to": {"devices": ["dev.tiger17"], "configs": ["cfg.ext"]},
                    "value": "Flush the microcatheter and the extended handle lumen with heparinized saline."}
                 ]}},
        {"id": "s3", "cmd": {"base": "Connect to the handle."},
         "applies_to": {"devices": ["dev.tiger13", "dev.tiger17"], "configs": ["cfg.std"], "regions": ["reg.eu", "reg.us"]}}
      ],
      "warnings": [
        {"id": "w1", "severity": "warning",
         "text": {"base": "Do not use if sterile barrier is breached."},
         "applies_to": {"devices": ["dev.tiger13", "dev.tiger17"], "configs": ["cfg.std", "cfg.ext"], "regions": ["reg.eu", "reg.us"]}},
        {"id": "w2", "severity": "caution",
         "text": {"base": "US: refer to IFU section 7 for MRI conditions."},
         "applies_to": {"devices": ["dev.tiger13", "dev.tiger17"], "configs": ["cfg.std", "cfg.ext"], "regions": ["reg.us"]}}
      ],
      "video": {"base": "asset.sha256:cd34...",
                "overrides": [{"applies_to": {"devices": ["dev.tiger17"]}, "value": "asset.sha256:ef56..."}]},
      "extra_materials": [{"id": "m1", "href_asset": "asset.sha256:0a9f...", "label": "Quick reference card"}]
    },
    "resolution_order": ["device+config+region", "device+config", "device+region", "device", "region", "base"],
    "default_visibility": "exclude"
  },

  "approvals": [
    {"id": "apv_1", "lesson_version_id": "lv_01HZX...", "variant_id": "var.t13-std-eu",
     "approver": {"user_id": "user.qa1", "printed_name": "A. Reviewer"}, "approved_at": "2026-10-02T09:15:00Z",
     "meaning": "approval", "signature_ref": "esig_77a1"},
    {"id": "apv_2", "lesson_version_id": "lv_01HZX...", "variant_id": "var.t17-ext-us",
     "approver": {"user_id": "user.qa2", "printed_name": "B. Reviewer"}, "approved_at": "2026-10-02T10:40:00Z",
     "meaning": "approval", "signature_ref": "esig_77b2"}
  ],

  "release": {
    "id": "rel_2026.10.0",
    "label": "Tigertriever core training 2026.10",
    "state": "published",
    "created_at": "2026-10-10T08:00:00Z", "published_at": "2026-10-12T16:00:00Z",
    "published_by": "user.qa1",
    "scope": {"variants": ["var.t13-std-eu", "var.t17-ext-us"]},
    "program": {"id": "prog.tigertriever-core", "title": "Tigertriever core training",
      "lessons": [
        {"order": 1, "lesson_id": "lesson.01-intro", "lesson_version_id": "lv_01HZA...", "version_sha256": "7d1c..."},
        {"order": 3, "lesson_id": "lesson.03-device-prep", "lesson_version_id": "lv_01HZX...", "version_sha256": "91e0...",
         "approvals": ["apv_1", "apv_2"]}
      ]},
    "resources": [
      {"asset_id": "asset.sha256:cd34...", "href": "media/cd34....mp4", "mediaType": "video/mp4", "bytes": 48213344, "sha256": "cd34..."},
      {"asset_id": "asset.sha256:0a9f...", "href": "materials/0a9f....pdf", "mediaType": "application/pdf", "bytes": 212044, "sha256": "0a9f..."}
    ],
    "manifest_schema_version": "1.0",
    "manifest_sha256": "f00d..."
  }
}
```

Reading rules: a learner on `var.t13-std-eu` sees step `s3` and warning `w1` (both whitelisted) but not `w2` (US only), and sees the base video; a learner on `var.t17-ext-us` sees the overridden `s2` text and the Tiger 17 video, and never sees `s3` (not whitelisted for `cfg.ext`). Neither variant sees anything from `lv_01HZX...` unless an approval row exists for it, and the release only pins versions whose approvals cover every variant in `scope`.

### 8.7 One universal template vs structured blocks — explicit answer

**Use one rigid template for v1, with applicability and approval already modelled at the section/step level; move to a closed block set in v2.** Reasons: eight lessons of identical procedural shape, one product line and strict approval needs favour a fixed structure (DITA `<steps>/<step>/<cmd>`, cmi5 `course/block/au`, OLX's fixed hierarchy all work at scale this way) [192][203][202]; every field has a known type so validation, per-field diff, per-field approval and a flat manifest are straightforward; the UI is one form. The cost is that a new content kind (e.g., a quiz) is a schema change. Blocks fields (Payload Blocks, Storyblok Blocks, Sanity Portable Text) let editors restructure without a developer but weaken variant tooling — Storyblok cannot field-translate `Blocks`, Sanity's array input is "not best suited" to per-language authoring — and block identity across versions complicates diffs and approvals [60][190][186]. The natural v2 set, kept closed (Payload `blockReferences` style) so validation stays generic: `step`, `warning` (severity), `media`, `material`, `reference` (Dozuki prerequisite style), `check` (cmi5 `moveOn`-style completion criterion) [60][203]. Because v1 already stores applicability + approval per section, the v2 move is additive rather than a migration.

---

## 9. Architecture comparison

Three approaches are compared: **A — fully custom** (own API + Postgres on a VPS/Fly machine + R2); **B — custom React/TS frontend + ready-made backend** (Supabase, or PocketBase/Appwrite/Convex); **C — customizable CMS** (Payload 3 self-hosted, Directus, Strapi, Sanity; Git-based CMSs excluded). Every row distinguishes VERIFIED facts (with source) from ESTIMATES (labelled). Project assumptions used throughout: 2–5 editors, media 10–200 MB per file and 2–10 GB total, ≤50 GB/month egress, one small always-on service where needed.

### 9.1 Criteria table

| Criterion | A — Fully custom | B — Custom frontend + ready-made backend | C — Customizable CMS |
|---|---|---|---|
| **1. Development complexity** | Highest: auth, storage ACLs, API, versions, jobs all hand-built. ESTIMATE. | Medium: platform half bought; editorial half (variants, approval, releases) custom. ESTIMATE. | Lowest for generic editing; **but no CMS natively models device × region variants, whitelist applicability or per-variant approval** (VERIFIED absence across all fetched docs, Sections 3–8), so that logic is custom in every approach. |
| **2. Effort** | ESTIMATE 380–560 h. | ESTIMATE 270–460 h (Section 11). | ESTIMATE 250–420 h if the CMS admin UI is accepted as-is; more if a bespoke editor UX is required on top. |
| **3. Hosting / recurring costs** | Fly shared-cpu-4x 1 GB $8.78 + 10 GB volume $1.50 + R2 ≈ **$10/mo**; Hetzner CPX02 €6.49 ($8.09) + R2 ≈ **$8/mo** (VERIFIED prices [134][135][127]; combination ESTIMATE). | **Supabase Pro $25/mo** (100 GB storage, 500 GB max upload, 250+250 GB egress, daily backups, $10 compute credit) [87] + R2 ≈ $0–1 + GitHub Actions free ≈ **$25–36/mo** ESTIMATE. PocketBase on Fly 512 MB $4.39 + volume ≈ **$7/mo** [134]; Appwrite Pro $25 [95]; Convex Pro $25/dev [98]. | Payload self-hosted on Hetzner CPX12 2 GB ($14.09) or Fly 1 GB ($8.78) + R2 ≈ **$9–15/mo** ESTIMATE [135][134]; third-party guide: Hetzner $8–49, Railway/Render/Fly $15–40, Vercel $20–60 [108]. Directus same VPS ≈ $9–15 only under the Open Innovation Grant; Core has a **3-seat hard limit**, Team $499/mo [109]. Strapi Community ≈ $9–15; Growth **$45/mo + $15/user** [115]. Sanity Free $0 (3-day draft retention, 2 roles) or Growth $15/seat [121]. |
| **4. Auth / access control** | Must build sessions, reset, RBAC — the highest-risk item (ESTIMATE). | VERIFIED: Supabase Auth with social OAuth and basic MFA on all plans; SAML SSO 50 connections on Pro then $0.015/MAU (page internally inconsistent) [90]. PocketBase built-in auth [91]. | Payload field-level access functions receive `req.user`, `data`, `doc` [104]; "draft alone does not hide drafts. Access control must do that" [102]. Directus policies; SSO not on Core [109]. Strapi RBAC free; SSO $150/mo add-on [115]. Sanity custom roles Enterprise only [121]. |
| **5. Video / image storage** | R2 $0.015/GB-mo, free egress, 10 GB free; 5 GiB single-part, 10,000 parts [127][128]. B2 $6.95/TB, egress free to 3× storage [129]. | Supabase: TUS resumable + S3 multipart; Free max upload **50 MB** (unusable); Pro up to 500 GB per file [88][89]. Appwrite SDKs chunk >5 MB [96]. Convex Free 1 GB file storage [97]. PocketBase: local FS or S3, no chunked upload documented [92]. | Payload storage adapters S3/Azure/GCS/Vercel Blob/Uploadthing with `clientUploads` (bypasses Vercel's 4.5 MB body cap); S3 adapter `signedDownloads` for video; R2 via S3 API [106]. Sanity Media Library files up to 5 TB but hosted-only [123]. Git-based CMSs excluded: GitHub blocks files >100 MiB; LFS 10 GiB/mo free bandwidth [124]. |
| **6. Structured content** | Full freedom; own schema. | Postgres schema with RLS (Supabase) or collections (PocketBase); Refine/react-admin CRUD scaffolds [100][76]. | Payload collections/blocks [60]; Directus data model UI [61]; Strapi content types; Sanity schemas. All VERIFIED. |
| **7. Relationships / variations** | Custom resolver (Section 8). | Custom resolver; same as A. | Payload per-field `localized` + per-locale `fallbackLocale` arrays [59][103] — a *fallback* model; Contentful chains [67]; Strapi has **no runtime fallback** (feature request open since 2022) [118][119]; Directus translations document no fallback [113]. None provide whitelist applicability (VERIFIED absence). |
| **8. Version history / backups** | Hand-rolled `*_versions` table + diff UI (ESTIMATE: risky). Backups: Fly volume snapshots (first 10 GB free) [134]. | Same hand-rolled versions; Supabase Pro daily backups retained 7 days [87]; PocketBase built-in backup to local/S3, app read-only during backup [93]. React-admin `ra-history` diff is **paid Enterprise** [101]. | Payload full-copy versions, compare and restore, `maxPerDoc` 100 [57]; Directus revisions compare/restore, retention off by default (tables grow unbounded) [61][112]; Strapi Content History Growth-only, **14-day retention** [115]; Sanity Free 3-day draft retention [121]. |
| **9. Approval** | Custom status machine + approval table (Section 8). | Same, enforced by RLS/rules. | Payload: block publish via `update` access [102]; Directus: policies on `directus_versions` [61]; Strapi Review Workflows **Enterprise only**, listed "Coming soon" on one page [115][116]; Dozuki has multi-stage approvals but is licensed [74]. Per-variant approval exists nowhere (VERIFIED absence). |
| **10. Maintainability** | You own every line; no vendor upgrade shocks; largest surface to maintain. ESTIMATE. | Supabase managed; PocketBase pre-1.0: v0.23 upgrade "from 1h to entire weekend", "no easy and automated code upgrade solution" [94][91]. | Payload v4 canary with breaking `overrideAccess` default, Next.js 16.2.6+/Node 24.15+ [107]; Directus licence moving to MSCL with registration keys (final adoption unconfirmed) [111]; Strapi/Directus upgrade history not researched. |
| **11. Scalability** | Trivial at this scale (4 models × few regions × 8 lessons). | Supabase Pro 100,000 MAU, 100 GB storage [87]. | All CMSs far exceed this scale; Directus Core 25 collections [109]. |
| **12. Vendor dependency** | None beyond hosting + R2 (both swappable: S3 API). | Supabase (Postgres — portable); PocketBase (SQLite, single binary); Convex/Appwrite proprietary APIs. | Payload MIT (Figma acquired Payload June 2025; Payload Cloud paused sign-ups) [108]; Directus BSL/MSCL + grant registration [110][111]; Strapi paid tiers for editorial features [115]; Sanity hosted-only data [121][122]. |
| **13. Offline package generation** | Always-on process or GitHub Actions; Fly machine on demand [134][177]. | Supabase Edge Functions **cannot** (150/400 s wall clock, 256 MB, 2 s CPU) [141]; use GitHub Actions `workflow_dispatch` (2,000 free min/mo private; 6 h job cap; 500 MB artifact store so zip goes to R2) [140][174][175]; PocketBase `cronAdd` runs jobs in-process [142]. | Payload Jobs Queue: `autoRun` on dedicated servers only, external cron on serverless [105]; Directus Flows run arbitrary code (admins) [114]; Strapi/Sanity: external worker. |

### 9.2 Serverless and edge limits that rule out "just a function"

| Platform | Memory | Time | Body/response caps | Verdict for a 2–10 GB zip |
|---|---|---|---|---|
| Supabase Edge Functions | 256 MB | 150 s Free / 400 s Paid wall clock; 2 s CPU | bundle 20 MB | ✗ [141] |
| Cloudflare Workers | 128 MB/isolate | 15 min cron; HTTP unlimited while connected | body 100 MB Free/Pro; 50 subrequests Free | ✗ high risk [133][132] |
| Convex actions | — | 30 min / 10 min Node | HTTP response 100 MiB | ✗ [97] |
| Vercel functions | — | 10 s Hobby / 60 s Pro (third-party) | 4.5 MB body (per Payload docs) | ✗ [138][106] |
| GitHub Actions | runner | 6 h/job; 2,000 min/mo free private | artifacts 500 MB → upload zip to R2 | ✔ [175][140] |
| Fly.io machine / Hetzner VPS | 256 MB–2 GB | unlimited | — | ✔ [134][135] |

### 9.3 Candidate stacks with monthly cost

| Stack | Components | Monthly cost | Status of figure |
|---|---|---|---|
| **B1 (recommended)** | Refine or hand-built React/TS admin · Supabase Pro (Postgres, Auth+MFA, TUS storage for admin uploads) · Cloudflare R2 private bucket + presigned URLs for media and packages · GitHub Actions build worker · static admin hosting (Cloudflare Workers static assets, free) | **$25–36** | Supabase $25 VERIFIED [87]; R2 ≈ $0.60 for 50 GB VERIFIED price, ESTIMATE volume [127]; Actions free VERIFIED [140]; total ESTIMATE |
| B2 | Same admin · PocketBase on Fly shared-cpu-2x 512 MB + 15 GB volume · R2 · GitHub Actions | **≈ $7** | Fly prices VERIFIED [134]; total ESTIMATE; pre-1.0 risk VERIFIED [91][94] |
| C1 (runner-up) | Payload 3 self-hosted on Hetzner CPX12 2 GB or Fly 1 GB with Postgres on the same box · R2 via S3 adapter · Payload Jobs for builds | **$9–15** | VPS prices VERIFIED (Hetzner third-party) [135][134]; total ESTIMATE |
| C2 | Directus self-hosted under Open Innovation Grant · same VPS · R2 | **$9–15** (or $499 Team if ineligible) | VERIFIED tiers [109]; eligibility ESTIMATE |
| C3 | Strapi Community · VPS · R2 (no history/releases) / Growth with 5 seats | **$9–15 / $54–90** | VERIFIED licence prices [115]; total ESTIMATE |
| C4 | Sanity Free + static admin | **$0** (3-day draft retention, 2 roles, 100 GB bandwidth) | VERIFIED [121] |
| A1 | Hono/Node API + Postgres on Hetzner CPX02 · R2 · GitHub Actions | **≈ $8** | VERIFIED prices; total ESTIMATE |

Hosting is not the constraint in any approach — even the worst realistic case (Strapi Growth, 5 seats) is ≈ $90/month; the budget is consumed by development time.

### 9.4 Recommendation

**Choose B1: a custom React/TypeScript admin on Supabase Pro, media and packages in Cloudflare R2, releases built by GitHub Actions.** The research shows the dividing line for editorial features is not between "custom" and "CMS" but between generic editing (which every CMS has) and the brief's specific requirements — valid-variant taxonomy, whitelist applicability, per-variant approval records, releases that pin version IDs and media hashes, and an offline package builder — which no examined CMS provides and which would have to be built as plugins/hooks inside a CMS whose admin UI was not designed for them. B1 buys the risky platform layers (auth with MFA, resumable uploads, backups, Postgres with RLS) for $25/month [87][88], keeps full control of the editor UX described in Section 7, and keeps media on an S3-compatible store with free egress [127].

**Runner-up: C1 (Payload 3 self-hosted)** if the implementer already works in Next.js and is willing to accept Payload's admin as the editing surface. It is the only candidate with drafts, full-copy versions with diff/restore, field-level access control, per-field localisation with fallback, a jobs queue and client-direct S3/R2 uploads all in the MIT core [57][102][104][103][105][106]. Its costs: Next.js/Node lock-in; a breaking v4 on the horizon; its localisation is a fallback (blacklist) model, so whitelist applicability and per-variant approval still need custom fields and hooks.

**Rejected:** Git-based CMSs (100 MiB GitHub file cap; LFS quotas) [124]; Supabase/Appwrite/Convex *free* tiers (50 MB upload cap, 1–2 GB storage) [89][95][97]; Strapi for editorial features (Growth/Enterprise paywalls, no locale fallback) [115][118]; Sanity for audit-grade history on Free (3-day retention) [121]; a desktop wrapper as the first delivery (Section 10).

### 9.5 Easy vs risky with AI-assisted coding

**Easy (documented SDKs, well-trodden patterns):** CRUD admin screens and forms (Refine/react-admin scaffolds) [76][100]; relational schema and simple RLS/policy rules; status fields and status pills; presigned-URL upload wiring to R2 with documented SDKs; a GitHub Actions workflow that zips files and uploads to R2; static shell build with Vite; the readiness-check queries.

**Risky (platform constraints an assistant will not surface until production, or logic that is subtly wrong):**
1. Auth/session/password-reset/RBAC from scratch (approach A) — every B/C option provides it, and Payload's docs show access-control footguns even inside a CMS [102].
2. Resumable large-video uploads hand-rolled — use Supabase TUS / Appwrite chunking / Payload `clientUploads` instead [88][96][106].
3. Version storage plus a readable field-level diff and "restore" with relationship integrity — simple to store, easy to get subtly wrong; paywalled in react-admin, free in Payload/Directus [101][57][61].
4. Background jobs on serverless — Supabase 400 s, Workers 128 MB/15 min, Vercel 10–60 s [141][133][138]; Payload: "Without a way to run jobs, scheduled events never execute" [56].
5. Migrations and upgrades — PocketBase v0.23 ("1h to entire weekend") and Payload v4's semantic change to `overrideAccess` are documented cases where generated code silently changes behaviour [94][107].
6. The override-resolution and whitelist logic (Section 8) — not platform-risky but correctness-critical; needs a property-based test suite, not just AI-generated code.

No empirical source on AI-assisted defect rates by feature type was found; this ranking is reasoned from documented platform constraints.

---

## 10. Offline package generation

### 10.1 Viable approaches and trade-offs

| Approach | What it is | Pros (sourced) | Cons (sourced) | Recurring cost |
|---|---|---|---|---|
| **1. Static zip (recommended baseline)** | Single-file HTML shell (Vite + vite-plugin-singlefile, classic script, hash router) + `content/content.js` + content-addressed `media/`, zipped with STORE, built by GitHub Actions, stored in private R2, delivered by presigned URL with `latest.json` | Zero signing cost; opens by double-click on Windows (Edge/Chrome) and macOS (Safari/Chrome); MOTW propagates on extraction but SmartScreen targets executables, not HTML [160]; Gatekeeper does not apply because opening a local HTML file is not an app launch [163]; `localStorage`, relative media and hash routing work on file:// [144]; R2 egress $0 [127] | No `fetch()`/XHR/ES modules/History routing on file:// (design around) [144][147][151][153]; Firefox/Safari treat local files as cross-origin by default [146][148][150]; iPad cannot open a folder-based HTML app from Files/Safari [166][167]; users must extract the zip; updates only as an online banner | ≈ $0–1/mo (R2) |
| **2. Lightweight desktop wrapper (Tauri 2 / Neutralinojs) with the same content layer** | Shell loaded in a Tauri window (custom scheme → real origin) or Neutralinojs embedded static server; `.msi/.exe` + `.dmg` plus content zip | Real origin (modules, fetch, history routing); native updater; Tauri minimal app <600 KB, 57 MB bundle vs Electron 323 MB in one measurement [168][169]; Neutralinojs ≈ 2 MB [171] | Apple Developer $99/yr, notarization required for Developer ID; macOS 15 removed the right-click-Open bypass for unsigned apps [163][164][165]; Windows OV cert $96.75–129/yr plus hardware key (~$379) or Azure Artifact Signing ≈ $9.99/mo with SmartScreen warnings until reputation builds [172][161][162]; per-OS build pipeline; hospital IT more likely to block executables (ESTIMATE) | ≈ $220–260/yr signing (ESTIMATE) + hosting |
| **3. Hosted PWA (iPad complement, not package-compliant)** | Same shell served over HTTPS with a service worker caching lessons | Only realistic iPad path; reuses `content.json` | Service workers require a secure context (HTTPS) [154]; the "package" is the browser cache, not a file; first load online; GB-scale video caching unreliable (ESTIMATE) | Hosting only |

Decision: Approach 1 now; keep the content layer identical so Approach 2 can be added if browser prompts or lack of auto-update become real complaints; Approach 3 only for iPad/online users.

### 10.2 file:// browser limitations

| Capability on `file://` | Chrome / Edge | Firefox | Safari (WebKit) | Workaround used in the package |
|---|---|---|---|---|
| `fetch()` / XHR to local files | ✗ "URL scheme must be "http" or "https" for CORS request"; even with `--allow-file-access-from-files` fetch fails [147] | ✗ since Firefox 68 local files are cross-origin by default (`privacy.file_unique_origin` / `security.fileuri.strict_origin_policy` toggles) [148][149] | ✗ by default; Develop menu "Disable Local File Restrictions" is a developer toggle [150] | Load content via `<script src="content/content.js">` that sets `window.__CONTENT__` (JSONP style) |
| `<script type="module">` | ✗ "Cross origin requests are only supported for protocol schemes: http, data, chrome, https" [151] | ✗ "JavaScript modules aren't allowed (due to a CORS error)" [152] | ✗ (same origin model) ESTIMATE | Single inlined classic-script bundle (`removeViteModuleLoader: true`) [144] |
| `history.pushState` to another path | works in Chromium per vite-plugin-singlefile "History API routing" not supported list [144] — treat as unsupported | — | ✗ SecurityError; spec: "If targetURL's scheme is 'file', and targetURL and documentURL differ in their path component, then return false" [153] | Hash routing `#/model/t17/stage/4` [144] |
| Relative `<img>`, `<video src>`, `<link>` | ✔ relative local requests work [144] | ✔ (classic subresources) ESTIMATE | ✔ ESTIMATE; verify on a Mac before shipping | Relative paths everywhere; no absolute or http(s) URLs |
| `localStorage` | ✔ (Chromium-tested) [144]; cross-file origin semantics unverified | ✔ ESTIMATE | ✔ ESTIMATE | Prefix keys with content version; never store anything the user cannot lose |
| Service workers / PWA install | ✗ secure context only [154] | ✗ | ✗ | None; update check via online `latest.json` |
| Cookies, Worklets | ✗ [144] | ✗ | ✗ | Not used |
| Web fonts from another origin | CORS-governed [146] | same | same | Inline fonts as data URIs or use system fonts |
| Video codec | H.264/AAC MP4 supported Chrome 4+, Edge 12+ [156]; AV1 Edge dropped 116–120 then restored [157] | H.264 35+ (OS decoder on Linux) [156] | H.264 ✔; **AV1 only partial through 27.1** [157] | H.264 High/Main + AAC, `+faststart`, poster + click-to-play; WebM/AV1 optional only |
| Autoplay with sound | ✗ until user interaction; muted autoplay always allowed [158] | similar | similar | Click-to-play; muted looping animations |
| External API call (update check) | works only with CORS headers; `no-cors` gives opaque response [144] | same | same | `fetch(latest.json)` in try/catch; host must send `Access-Control-Allow-Origin: *`; fail silently |

### 10.3 OS-level limitations

| OS / device | Constraint | Source | Consequence for the package |
|---|---|---|---|
| Windows 10/11 | Downloads get `Zone.Identifier` ZoneId=3 (NTFS only); Explorer zip extraction propagates MOTW; 7-Zip ≥22 optional; SmartScreen reputation checks described for executables, not HTML | [160] | Zip-of-HTML opens without a SmartScreen block (ESTIMATE: no source found describing a current Edge/Chrome block on MOTW-tagged local HTML — test on Windows 11) |
| Windows (desktop app only) | New binaries show SmartScreen warnings until reputation accumulates; Azure Artifact Signing ≈ $9.99/mo does not grant instant trust; EV no longer grants immediate reputation since 2024 | [161][162] | Avoid executables in v1 |
| macOS 14/15 | Developer ID + notarization require the $99/yr Program; ad-hoc signing still triggers Privacy & Security approval; macOS 15 removed Control-click Open; Apple Silicon requires signing for internet apps | [163][164][165] | Opening local HTML in Safari/Chrome is not an app launch — no Gatekeeper step for Approach 1 |
| macOS default browser (Safari) | WebKit pushState restriction; AV1 partial; local-file restrictions default-on | [153][157][150] | Hash routing mandatory; H.264 only; no XHR |
| iPadOS | Safari "has no support for opening local web documents"; HTML from Files renders "at a very basic level, skipping the CSS"; workarounds are third-party apps | [166][167] | Exclude iPad from file:// delivery; serve iPad via hosted PWA |
| Hospital IT | Gateways block executables and sometimes `.html` attachments (HTML smuggling concern) | ESTIMATE — no hospital policy document fetched | Distribute via download link, not email attachment; prefer zip of HTML over installers |
| Zip >4 GB | ZIP64 required beyond 4,294,967,295 bytes / 65,535 entries | [143] | Prefer scoped packages ≤ 4 GB; zipper must support ZIP64 for the full package; verify Explorer/Archive Utility handling (ESTIMATE) |

### 10.4 Recommended package structure

```
TigertrieverTraining-T17-EU-v1.4.0+build87/
  START_HERE.html                 # launcher with instructions + link to index.html
  index.html                      # app shell: all JS+CSS inlined (vite-plugin-singlefile),
                                  #   classic script, hash router, inline fonts
  content/
    content.js                    # window.__CONTENT__ = {...}  (read at runtime on file://)
    manifest.json                 # same data as JSON for validators/diff; not read on file://
    build-report.json             # errors[], warnings[], counts, de-dup savings
  media/
    video/<sha256>.mp4            # H.264 High/Main + AAC, yuv420p, +faststart, ≤1080p
    poster/<sha256>.jpg           # one poster per video
    image/<sha256>.jpg|png        # step illustrations with marker coordinates in content
  materials/<sha256>.pdf          # quick-reference cards, leaflets
  VERSION.txt                     # "content 1.4.0 (build 87) · shell 2.1.0 · published 2026-10-16T09:12Z · scope: Tiger 17 / Standard / EU"
  CHECKSUMS.sha256                # one line per file
```
Two version numbers: `shellVersion` (changes only when developers ship UI code) and `contentVersion` (changes on every editor build); an integer `schemaVersion` guards compatibility — the shell refuses content whose schema is newer than it understands and shows "This content package requires a newer viewer" instead of a blank page. The Electron `resources/app.asar` model is the analogue for "fixed shell, swappable payload" [145]. Content-addressing by SHA-256 of the *derived* MP4 means a video reused across Tiger 13/17 ships once and broken references are detectable by set difference.

### 10.5 Build pipeline steps

1. **Trigger:** Approver clicks Build; a Supabase Edge Function (short-lived) validates the release row and calls GitHub `POST /repos/{owner}/{repo}/actions/workflows/{id}/dispatches` with `inputs: {releaseId}` (fine-grained token with Actions: write) [174]. Release state → Queued.
2. **Fetch approved content:** the workflow pulls the pinned `lesson_version`s and approvals for the release scope from the DB; state → Building.
3. **Validate** (Section 10.6) before any bytes are copied; blocking errors fail the build and write `build-report.json`.
4. **Resolve per variant:** apply override resolution (most-specific-first) and whitelist filtering; emit `content.js` and `manifest.json`.
5. **Media:** collect the set of referenced SHA-256 hashes; stream each derived MP4/JPEG/PDF from R2 (free egress) [127]; confirm poster exists; copy once per hash.
6. **Shell:** copy the `index.html` whose supported `schemaVersion` matches; write `START_HERE.html`, `VERSION.txt`.
7. **Zip with STORE** (video and JPEG are already compressed — deflate wastes CPU); use ZIP64-capable zipper for packages >4 GB.
8. **Checksums:** compute SHA-256 of every file and of the zip; write `CHECKSUMS.sha256` and a sidecar `.sha256`.
9. **Upload** zip to R2 at an immutable path `releases/<scope>/<version>+<build>/…zip` via multipart (10,000 parts × up to 5 GiB) [128]; artifacts are not stored in GitHub (500 MB cap) [175].
10. **Publish metadata:** on Publish, write/overwrite `releases/<scope>/latest.json` `{version, build, publishedAt, url, sha256, bytes, changelog}` with `Access-Control-Allow-Origin: *`; record release row (size, checksum, URL, log, report); state → Ready → Published.
11. **Deliver:** admin shows Download (presigned URL from a private bucket; r2.dev is dev-only and rate-limited, use a custom domain) [183].

Transcoding is a separate upload-time job in the same worker: `ffmpeg … -c:v libx264 -profile:v high -pix_fmt yuv420p -c:a aac -movflags +faststart` at ≤1080p (ESTIMATE: CRF 22–24, 4–6 Mbps 1080p / 2–3 Mbps 720p; a 200 MB source typically becomes 40–120 MB); `+faststart` moves the `moov` index to the front [159]. Throughput of GitHub runners zipping 5–10 GB is unmeasured (ESTIMATE: minutes, well inside 2,000 free minutes/month for dozens of builds).

### 10.6 Validation checklist

**Blocking errors (fail the build):**
- Missing required fields: lesson title, ≥1 step, device/config/region tags on every lesson/section.
- Any `mediaId` that does not exist, has no derived MP4/JPEG, or whose storage object fails a HEAD check.
- Any lesson version not Approved for a variant in scope; approval timestamp later than intended publish time.
- Lesson count ≠ 8 per program/variant.
- Override tie (two overrides of equal specificity for the same variant).
- `schemaVersion` mismatch with the available shell.
- Projected entries > 65,535 or size > 4 GiB without ZIP64 [143]; asset > 2 GiB if GitHub Releases is a target [181].

**Warnings (build proceeds, listed in the report):**
- Video without poster; video > 200 MB or > 1080p; image > 4 MB.
- Text containing `http(s)://` links or `<img src="http…">` (will fail offline); CSS/fonts referencing network URLs.
- Unreferenced approved media in scope (dead weight); duplicate step order numbers; empty rationale.

Run the same validator on save in the admin (fast path) and again in the worker (authoritative); mirror issues as yellow/red lines in the build log (Vercel pattern) [82].

### 10.7 Versioning scheme

- `contentVersion` semver (`1.4.0`) + monotonically increasing `buildNumber` (87); `shellVersion` separate (`2.1.0`); `schemaVersion` integer.
- Major = content change affecting safety wording or stage order for any variant; Minor = additions/clarifications; Patch = media or typo fixes (Dozuki Major/Minor extended) [73].
- Immutable per-version URL plus mutable `latest.json` per scope; the shell footer and About screen show `content 1.4.0 (build 87) · shell 2.1.0 · published 2026-10-16T09:12Z · scope …` with a copyable SHA-256.
- Changelog is a required field at build time, stored in the release row and written into the manifest so it displays offline.
- Optional later: delta zips containing only new hashes (ESTIMATE; adds merge UX).

### 10.8 Hosting and distribution cost

| Option | Pricing (VERIFIED) | Project estimate |
|---|---|---|
| **Cloudflare R2 (recommended)** | $0.015/GB-mo, Class A $4.50/M, Class B $0.36/M, **egress free**; 10 GB free; custom domain required for production (r2.dev dev-only) [127][183] | 50 GB of packages ≈ **$0.60/mo**; downloads by any number of reps $0 |
| Backblaze B2 | $6.95/TB-mo; first 10 GB free; egress free up to 3× storage then $0.01/GB; free to Cloudflare/Bunny [129][184] | ≈ $0.35/mo + egress free up to ~150 GB |
| GitHub Releases | $0; per-file < 2 GiB; no bandwidth limit; 1,000 assets/release [181] | Only if content may be public (private repos need a token in the URL) |
| Supabase Storage | Free 50 MB file cap, 5 GB egress; Pro 250 GB egress then $0.09/GB uncached / $0.03 cached [89][185] | 50 reps × 5 GB = 250 GB — quota exhausted immediately; use for admin uploads only |
| Bunny Storage + CDN | $0.01/GB-mo, $1 minimum; CDN from $0.002/GB [130] | ≈ $1.50/mo; viable alternative |
| Cloudflare Pages | 25 MiB per asset [173] | Unsuitable for zips/videos |

Access control: medical-device training content is usually not public — keep the bucket private and issue time-limited presigned URLs from a short Edge Function to authenticated users; Supabase signed URLs "can only be revoked by contacting support" [182], another reason to keep packages on R2.

### 10.9 One-day validation spike (before committing)

Build the single-file shell, drop in one 150 MB H.264 MP4, zip, download on a Windows 11 laptop with Edge default and a macOS Sequoia laptop with Safari default, and confirm: extraction prompt text; video plays and seeks; hash routes survive refresh; `localStorage` persists; `latest.json` check succeeds online and fails silently offline; Safari loads `content.js` from a sibling file.

---

## 11. MVP recommendation

### 11.1 Feature scope

| Feature | Now | Later | Designed-for-later (schema/UI hooks only) |
|---|---|---|---|
| Taxonomy: device models, handle configs, regions, valid-variant matrix | ✔ | | |
| One training program with 8 fixed lesson slots | ✔ | Multiple programs per device | |
| Rigid lesson template editor (title, objective, steps ≤3 images/1 video, warnings with severity + source, materials, reviewer notes) | ✔ | | Closed block set (step/warning/media/material/reference/check) |
| Section-level applicability whitelist + per-variant overrides with most-specific-first resolution | ✔ | | |
| Effective-content preview per variant with provenance badges | ✔ (basic) | Side-by-side variant comparison | |
| Media library: resumable upload, transcode to H.264 + poster, SHA-256, usage count | ✔ | Auto-trim, chapters | |
| Draft → In review → Approved → Superseded versions; field diff on approve; release note + major/minor; approver printed name/time/meaning | ✔ | Multi-stage approvals | e-signature link (11.70) |
| Preview iframe of the shipped shell with size presets + draft/approved | ✔ | Click-block → scroll preview | |
| Releases: scope picker, readiness panel, Build via GitHub Actions, build log, SHA-256, Download, Publish (immutable), latest.json | ✔ | Scheduled publish; delta zips; rollback UI polish | |
| Offline shell: region confirm, Home (model cards), Model overview (8 stages grouped 3/3/2), Stage player, stage strip, References, About, localStorage progress, update banner | ✔ | Vessel-first selector; dark theme; hide-text test mode; stage self-check questions | |
| Audit log of state changes | ✔ (append-only table) | Audit UI | |
| Dashboard with status-filtered list and chips | ✔ | ⌘K palette, full-text search | |
| Login + MFA, Editor/Approver/Admin roles | ✔ (Supabase Auth) | SSO | |
| Desktop wrapper (Tauri), iPad PWA | | ✔ if demanded | Content layer identical |
| Learner tracking (xAPI/cmi5), quizzes with scoring | | ✔ | `check` block type |

### 11.2 Development effort estimate (ESTIMATE — hours)

Assumptions: one experienced full-stack developer (or designer-developer) working with an AI coding assistant; stack B1; design wireframes already produced from Sections 6–7; content authored by Rapid Medical staff, not the developer; no e-signature integration; no iPad. AI-assisted coding compresses boilerplate and scaffolding but **does not remove testing, cross-OS integration, security review or the correctness work on override/whitelist logic**; those items are kept at full weight below.

| Component | Hours (range) | Notes |
|---|---|---|
| Schema, migrations, RLS policies, seed taxonomy | 20–35 | Postgres on Supabase; policies for Editor/Approver |
| Auth, roles, MFA wiring | 8–15 | Bought; wiring and role guards only |
| Admin shell (Refine/react-admin): navigation, dashboard, taxonomy CRUD, program/slots | 30–50 | Scaffolds speed this up |
| Lesson editor: template form, steps/markers, warnings, applicability whitelist, override panel, autosave, validation list | 40–70 | Largest custom UI |
| Media pipeline: TUS upload, GitHub Actions transcode + poster + hash, library UI | 25–45 | ffmpeg in runner; failure handling |
| Versioning + approval: snapshots, field diff, approve modal, states, audit events | 30–50 | Diff UI is the risky part |
| Preview: shipped shell in iframe, size presets, variant/perspective, content.js generation | 10–20 | Reuses shell |
| Release builder: readiness checks, dispatch, worker script, zip/STORE/ZIP64, R2 upload, log, latest.json, download | 30–50 | Platform limits already known |
| Offline shell: single-file build, hash router, screens in Section 6, localStorage, update banner, accessibility (labels, no colour-only) | 50–80 | Includes dark-mode-ready tokens |
| Override/whitelist resolver + property-based tests | 10–20 | Shared by preview, builder and shell |
| Cross-OS validation spike, QA, security review, documentation | 30–50 | Windows/Edge, macOS/Safari, Firefox; penetration checklist |
| **Total** | **≈ 283–485 h** (central ≈ 350–380 h) | Rounded elsewhere to 270–460 h |

### 11.3 Budget fit against $950

- **What the budget buys:** 12 months of B1 hosting (Supabase Pro $25 × 12 = $300 [87]; R2 ≈ $12/yr [127]; GitHub Actions $0 [140]; domain ≈ $15, ESTIMATE) ≈ **$330**; an AI coding assistant subscription for the build period (ESTIMATE $20–200/month depending on tier → $60–600 for 3 months); a Windows 11 + macOS test spike using existing hardware ($0). Total ≈ **$400–950** with no money left for contractors, and none for Apple/Windows signing ($99/yr + ~$100–130/yr), which the static-zip approach avoids [164][172].
- **What it does not buy:** development labour. At typical contract rates the $950 equals roughly 10–25 developer hours (ESTIMATE), against a ≈ 300–480 hour build. The build must therefore be in-house (the product lead/designer plus one developer or a developer-capable designer) with AI assistance; otherwise the scope must shrink to "offline shell + hand-authored content.js" first (≈ 60–100 h) and the admin later.
- **Cheaper hosting variant:** PocketBase on Fly (≈ $7/mo) halves hosting but adds pre-1.0 upgrade labour [94]; not recommended for a regulated workflow in year one.

### 11.4 Top risks and mitigations

| Risk | Likelihood / impact | Mitigation |
|---|---|---|
| file:// behaviour differs across Edge/Safari/Firefox (content.js load, video seek, localStorage) | Medium / high — unverified on Safari | One-day spike (10.9) before building the admin; START_HERE guidance; H.264-only; classic script |
| Package too large for hospital Wi-Fi; Explorer/Archive Utility issues with >4 GB zips | Medium / medium | Scoped packages per model/region; ZIP64; show sizes; transcode to ≤1080p |
| Override/whitelist resolver produces wrong-variant content (safety) | Low–medium / very high | Fixed resolution order; tie = validation error; default exclude; property-based tests; effective-content preview with provenance badges; per-variant approval |
| Version/diff logic subtly wrong (AI-generated) | Medium / high | Full-snapshot versions (simple); diff is display-only; restore creates a new version, never mutates |
| Background build fails or times out | Low / medium | GitHub Actions 6 h cap [175]; STORE zips; retry; persisted logs |
| Vendor changes: Supabase pricing, Payload v4, PocketBase churn | Low / medium | Postgres and S3-compatible storage are portable; avoid proprietary APIs |
| Regulatory expectations (Part 11 signatures, retention) unclear | Medium / medium | Model approvals with name/time/meaning now; confirm with compliance owner whether e-signatures are required [209][210] |
| iPad demand appears | Medium / low | Hosted PWA from the same content.json (later) |
| Media egress costs if packages are hosted on Supabase | High if done / medium | Host packages on R2 (free egress) from day one [127][185] |
| Login-gated competitors already have thrombectomy modules that would change the UX ranking | Unknown | Noted gap; cannot be resolved without rep-provisioned access |

### 11.5 Recommended implementation sequence

**Phase 0 — Validation spike (1–2 days).** Build the single-file shell with one stage and one 150 MB MP4; test on Windows 11/Edge and macOS Sequoia/Safari; confirm the file:// table in 10.2. Decide hash of content.js loading on Safari.

**Phase 1 — Content model and offline shell (weeks 1–4).** Postgres schema, taxonomy, lesson template, override resolver with tests; offline shell screens (Section 6) fed by a hand-written `content.js`; H.264 transcode script. Deliverable: a working offline package for Tiger 17 / Standard / EU built from a script.

**Phase 2 — Admin editing (weeks 4–8).** Supabase Auth + roles; admin shell; taxonomy and program screens; lesson editor with applicability/overrides; media library with TUS upload and transcode job; effective-content preview.

**Phase 3 — Approval and releases (weeks 8–11).** Versions, field diff, approval records; release readiness, GitHub Actions builder, R2 upload, build log, latest.json, download page.

**Phase 4 — Hardening (weeks 11–13).** Cross-OS QA, accessibility pass (labels, no colour-only meaning), security review of RLS and presigned URLs, audit log, documentation, first real content load with Rapid Medical staff.

**Later phases.** Dark theme and vessel-first selector; hide-text test mode and stage self-checks; closed block set (v2); Tauri wrapper if prompts become a support burden; iPad PWA; xAPI tracking.

---

## 12. Sources and verification notes

### 12.1 What was verified vs inferred

- **Verified visually:** App Store screenshot sets for Touch Surgery, Incision Assist, Philips IGT Learning, Mako Training, AS TAVR Education, Thrombectomy (EVT), EVT Navigator; Incision support-doc images; Mentice product-page captures; Rapid Medical specifications and overview graphics and one HowTo_1 frame. These carry the label "verified screenshot" in Section 2 and were inspected as images by the researcher.
- **Verified by page caption only (image not opened):** all technical-manual images in Section 2.11–2.16 (iFixit/Dozuki help captures, LEGO Play Store images, R&S vendor screenshots, Apple guide figures, Microsoft Learn 2018 images) and all admin screenshots in Section 3 (Payload, Directus, Strapi, Storyblok, Dozuki, Frappe, Open edX paths, GitHub, Vercel, Figma, Craft, Storyline via MIC Limerick). The label "verified screenshot" there means the URL and its caption/context were confirmed on an official page.
- **Marketing illustration:** Rapid Medical animations/GIF/YouTube, Osso VR media, Cortona3D video stills, ADAM images, Rise composites and block icons, react-admin/Refine demo images, Frappe README images, Team Consulting eIFU images, Sanity/Payload OG images.
- **Inferred, not seen:** Touch Surgery's current test-mode UI and the failed App Store image; Incision Academy and the uninspected Incision article images; Philips login requirement; Stryker SKILL e-Lab UI; Medtronic Academy UI; Osso in-headset UI; Dozuki app UI and offline mechanics; SwipeGuide's actual step presentation; Cortona3D and R&S demo UIs; Sanity Studio screenshots; Decap editorial-workflow board and demo; Keystatic and TinaCMS entirely; Payload and react-admin demo credentials; Vercel deployment-list row anatomy; GitHub releases-list badges; Sanity validation panel UI.
- **Pricing and limits:** verified on official pages for Supabase, Cloudflare R2/Workers/Pages, Backblaze B2, Bunny, Fly.io, Railway, GitHub, Directus, Strapi licences, Sanity, Convex, Appwrite (blog), PocketHost, Apple Developer Program, SSL.com, Microsoft Azure Artifact Signing. **Third-party only:** Hetzner (with an internal CX23 inconsistency), Render, Vercel, Firebase, Strapi Cloud, Payload hosting ranges, Tauri vs Electron measurements.
- **Estimates (unsourced reasoning, labelled in text):** all hour and total-cost figures; package sizes and transcoding targets; hospital IT behaviour; MOTW behaviour for local HTML on Windows 11; Safari sibling-script loading; GitHub runner throughput; localStorage origin semantics on file://; delta-package UX.
- **Standards:** 21 CFR Part 11 text from eCFR and the FDA scope guidance are primary; ISO 13485 4.2.4, QMSR effective date and MDR document-control statements come from a secondary summary; S1000D applicability details come from vendor/user-forum decks, not the spec.

### 12.2 Products that could not be inspected

Login walls: Stryker SKILL e-Lab (rep-provisioned), Boston Scientific EDUCARE (HCP registration), Mako Training beyond the sign-in and case list, Dozuki admin, SwipeGuide, R&S IETDView (guest demo not entered), ADAM Viewer, Osso Loop, Sanity/Directus/Strapi/Storyblok/Contentful/Open edX/Frappe (no public demos found). Bot walls / fetch failures: Medtronic Academy ("Incorrect Browser"), J&J Institute (redirect loop, robots), tigertriever.com (proxy 502), help.dozuki.com, iFixit and SwipeGuide store listings, Cortona3D demo (JS app), Mazda owner's manuals, Rapid Medical YouTube channel list, MDN `History.pushState`, trac.ffmpeg.org, FDA QMSR page, Contentful Personalization core concepts, Sanity in-body images (lazy-load placeholders). Not researched for budget: VirtaMed, Orsi Academy, Proximie, Inmedius, WalkMe/Userlane, Instructables, iSpring, Pake/Wails, Keystatic/TinaCMS pricing.

### 12.3 Sources

**Part 1 — Medical-device and procedure training interfaces**

1. Touch Surgery: Surgical Videos — App Store. https://apps.apple.com/us/app/id509740792
2. Medtronic — Touch Surgery ecosystem. https://www.medtronic.com/covidien/en-gb/products/touch-surgery/ecosystem.html
3. iMedicalApps — Touch Surgery review, p.1 (2014). https://www.imedicalapps.com/2014/10/surgery-simulation-app-mobile-devices/
4. iMedicalApps — Touch Surgery review, p.2 (2014). https://www.imedicalapps.com/2014/10/surgery-simulation-app-mobile-devices/2/
5. Incision Assist — App Store. https://apps.apple.com/us/app/incision-assist-or-support/id1576658816
6. Incision support — "How to Use Incision Assist: Dive into Protocols". https://support.incision.care/en/support/solutions/articles/103000293331-how-to-use-incision-assist-dive-into-protocols
7. Philips IGT Learning — App Store. https://apps.apple.com/us/app/philips-igt-learning/id6739526084
8. Rapid Medical — US Tigertriever LVO product page. https://us.rapid-medical.com/lvo
9. Rapid Medical — OUS site. https://ous.rapid-medical.com/
10. Rapid Medical — corporate site. https://www.rapid-medical.com/
11. Mentice — Neurovascular Essentials. https://www.mentice.com/software/neurovascular-essentials
12. Stryker — SKILL e-Lab. https://www.stryker.com/us/en/training-and-education/neurotechnology/neurovascular/skill/e-lab.html
13. Stryker — SKILL programme hub. https://www.stryker.com/us/en/training-and-education/neurotechnology/neurovascular/skill.html
14. Mako Training — App Store. https://apps.apple.com/us/app/mako-training/id6743401898
15. Medtronic Academy. https://www.medtronic.com/en-us/healthcare-professionals/medtronic-academy.html
16. AS TAVR Education — App Store. https://apps.apple.com/us/app/as-tavr-education/id1534608851
17. Osso VR — home. https://www.ossovr.com/
18. Osso VR — Training modes in the Osso VR Nursing Series. https://www.ossovr.com/support-articles/training-modes-in-the-osso-vr-nursing-series
19. Osso VR — Osso Health on Apple Vision Pro press release. https://www.ossovr.com/press-releases/osso-health-medical-training-apple-vision-pro
20. Thrombectomy (ATIF ELNIL) — App Store. https://apps.apple.com/us/app/thrombectomy/id6761347262
21. EVT Navigator — App Store. https://apps.apple.com/us/app/evt-navigator/id6761737668
22. Boston Scientific — EDUCARE. https://www.bostonscientific.com/en-US/education.html
23. J&J MedTech — Neurovascular Future Leaders programme. https://www.jnjmedtech.com/en-US/education/learning-programs/future-leaders-programs/neurovascular/
24. Level Ex. https://www.levelex.com/
25. Snke — products and services. https://www.snke.com/products-services/
26. Penumbra — Physician in Training. https://www.penumbrainc.com/physician-in-training/
27. Ask Terumo Neuro — App Store. https://apps.apple.com/us/app/ask-terumo-neuro/id1620014740
28. Team Consulting — The power of digital instructions (eIFU). https://www.team-consulting.com/insights/the-power-of-digital-instructions/
29. Medtronic — Electrophysiology education and training. https://www.medtronic.com/en-us/healthcare-professionals/specialties/electrophysiology/education-training.html

**Part 1 — Technical manuals, IETM viewers and offline instruction apps**

30. iFixit — MacBook Pro 13" Retina Early 2015 Battery Replacement guide. https://www.ifixit.com/Guide/MacBook+Pro+13-Inch+Retina+Display+Early+2015+Battery+Replacement/45137
31. iFixit Help — Guide Steps. https://about.ifixit.com/Help/Guide_Steps
32. iFixit Help — Markers. https://about.ifixit.com/Help/Markers
33. iFixit — How to Format and Use Bullets. https://about.ifixit.com/Guide/How+to+Format+and+Use+Bullets/6434
34. iFixit Help — Embedding and Exporting. https://www.ifixit.com/Help/Embedding_and_Exporting
35. Dozuki — App Store. https://apps.apple.com/ec/app/dozuki/id517173580
36. L2L support — SwipeGuide features and add-ons. https://support.leading2lean.com/articles/8677672874-swipeguide-features-add-ons
37. L2L support — Using your own native app to view guides offline. https://support.leading2lean.com/articles/3807621465-swipeguide-using-your-own-native-app-to-view-your-guides-offline
38. L2L — Platform. https://www.l2l.com/platform
39. LEGO Builder — App Store. https://apps.apple.com/app/id1486159728
40. LEGO Builder — Google Play. https://play.google.com/store/apps/details?id=com.lego.legobuildinginstructions
41. Cortona3D — RapidManual. https://www.cortona3d.com/rapidmanual
42. Cortona3D Viewer — App Store. https://apps.apple.com/us/app/cortona3d-viewer/id471275514
43. Cortona3D — Flatirons Solutions partnership release. https://cortona3d.com/en/flatirons-solutions-and-cortona3d-partner-make-aircraft-maintenance-more-interactive
44. Rohde & Schwarz — R&S IETDView. https://www.rohde-schwarz.com/us/products/aerospace-defense-security/rs-ietdview_334293.html
45. Rohde & Schwarz — IETDView demo login. https://ietdview.rohde-schwarz.com/rsiv/
46. 4D Concept — ADAM Viewer. https://adam.4dconcept.fr/viewer/?lang=en
47. Articulate — Rise 360. https://www.articulate.com/360/rise/
48. Articulate community — View Rise course off-line. https://community.articulate.com/discussions/rise-360/view-rise-course-off-line
49. Apple — iPhone User Guide. https://support.apple.com/guide/iphone/welcome/ios
50. Microsoft — Microsoft Learn feature tour (2018). https://learn.microsoft.com/en-us/teamblog/microsoft-learn-tour
51. Scribe — Scribe vs Tango. https://scribe.com/library/scribe-vs-tango

**Part 2 — Admin interfaces and content editors**

52. Sanity — Structure tool introduction. https://sanity.io/docs/studio/structure-introduction
53. Sanity — Content Releases. https://www.sanity.io/docs/content-releases
54. Sanity — Localization. https://www.sanity.io/docs/localization
55. Sanity — Presentation tool (preview and page building). https://www.sanity.io/docs/visual-editing/preview-and-page-building
56. Payload — Drafts. https://payloadcms.com/docs/versions/drafts
57. Payload — Versions overview. https://payloadcms.com/docs/versions/overview
58. Payload — Live Preview. https://payloadcms.com/docs/live-preview/overview
59. Payload — Localization. https://payloadcms.com/docs/configuration/localization
60. Payload — Blocks field. https://payloadcms.com/docs/fields/blocks
61. Directus — Content versioning. https://directus.com/docs/guides/content/content-versioning
62. Strapi — Releases. https://docs.strapi.io/cms/features/releases
63. Storyblok — Visual Editor manual. https://www.storyblok.com/docs/manuals/visual-editor
64. Storyblok — Visual Editor concept. https://www.storyblok.com/docs/concepts/visual-editor
65. Storyblok — Branches and releases. https://storyblok.com/cl/branches-and-releases
66. Storyblok support — View a release in a preview environment. https://support.storyblok.com/hc/en-us/articles/34750270940049-How-to-view-a-release-in-a-preview-environment
67. Contentful — Setting locales. https://contentful.com/developers/docs/tutorials/general/setting-locales
68. Decap CMS — Features. https://decapcms.org/features/
69. Articulate support — Rise lesson and block types. https://www.articulatesupport.com/article/Rise-Lesson-and-Block-Types
70. MIC Limerick LEAD — Publish a SCORM package in Storyline 360. https://lead.mic.ul.ie/learning-design/how-to-publish-a-scorm-package-in-articulate-storyline-360
71. Dozuki (UMD) — Guide Steps. https://dozuki.umd.edu/Help/Guide_Steps
72. Dozuki (UMD) — Guide Details. https://dozuki.umd.edu/Help/Guide_Details
73. iFixit Help — Version Control. https://www.ifixit.com/Help/Version_Control
74. iFixit Help — Approvals Processes. https://www.ifixit.com/Help/Approvals_Processes
75. Marmelab — React-admin demos. https://marmelab.com/react-admin/Demos.html
76. Refine — React admin panel (Ant Design) template. https://refine.dev/core/templates/react-admin-panel-ant-design/
77. Frappe Learning — GitHub README. https://github.com/frappe/lms
78. Frappe Learning docs — Adding simple content to a lesson. https://docs.frappe.io/learning/course-creation/adding-a-lesson/adding-simple-content
79. Open edX — Manage units (ulmo). https://docs.openedx.org/en/ulmo/_sources/educators/how-tos/course_development/manage_units.rst
80. Open edX — Understanding the course outline (sumac). https://docs.openedx.org/en/open-release-sumac.master/_sources/educators/references/course_development/understanding_course_outline.rst
81. GitHub Docs — Managing releases in a repository. https://docs.github.com/en/enterprise-server@3.22/repositories/releasing-projects-on-github/managing-releases-in-a-repository
82. Vercel — Build logs. https://vercel.com/docs/deployments/logs
83. Vercel — Project dashboard. https://www.vercel.com/docs/projects/project-dashboard
84. Figma Help — Review branch changes. https://help.figma.com/hc/en-us/articles/5693123873687
85. Craft CMS 5 — Drafts and revisions. https://craftcms.com/docs/5.x/system/drafts-revisions
86. Sanity community answer — document action validation (AI-labelled, unverified). https://www.sanity.io/answers/slug-generating-document-action-how-to-invalidate-fields-or-display-an-error

**Part 3 — Architecture, backends, CMS tiers, hosting**

87. Supabase — Pricing. https://supabase.com/pricing
88. Supabase blog — Storage 500 GB uploads and cheaper egress. https://supabase.com/blog/storage-500gb-uploads-cheaper-egress-pricing
89. Supabase docs — Storage file limits. https://supabase.com/docs/guides/storage/uploads/file-limits
90. Supabase — Pricing (markdown). https://supabase.com/pricing.md
91. PocketBase — Docs. https://pocketbase.io/docs
92. PocketBase — JS filesystem. https://pocketbase.io/docs/js-filesystem
93. PocketBase — Going to production (old docs). https://pocketbase.io/old/docs/going-to-production
94. PocketBase — v0.23 JSVM upgrade guide. https://pocketbase.io/v023upgrade/jsvm/
95. Appwrite blog — Introducing Appwrite Cloud Start plan. https://appwrite.io/blog/post/introducing-appwrite-cloud-start-plan.md
96. Appwrite docs — Storage upload/download. https://appwrite.io/docs/products/storage/upload-download.md
97. Convex — Limits. https://docs.convex.dev/production/state/limits
98. Convex — Plans. https://www.convex.dev/plans
99. DEV Community (androve2k) — Spark vs Blaze Firebase pricing guide. https://dev.to/androve2k/spark-vs-blaze-the-firebase-pricing-guide-i-wish-id-read-sooner-onb
100. Refine blog — Refine vs React-admin. https://refine.dev/blog/refine-vs-react-admin/
101. React-admin Enterprise — ra-history. https://react-admin-ee.marmelab.com/documentation/ra-history
102. Payload — Drafts (v3 markdown). https://payloadcms.com/docs/v3/versions/drafts.md
103. Payload — Localization (v3 markdown). https://payloadcms.com/docs/v3/configuration/localization.md
104. Payload — Field-level access control (v4). https://payloadcms.com/docs/v4/access-control/fields.md
105. Payload — Jobs queue (v3). https://payloadcms.com/docs/v3/jobs-queue/overview.md
106. Payload — Storage adapters (v3). https://payloadcms.com/docs/v3/upload/storage-adapters.md
107. buildwithmatija — Payload 4.0. https://www.buildwithmatija.com/blog/md/payload-4-0
108. buildwithmatija — Payload CMS hosting. https://www.buildwithmatija.com/payload-cms-hosting
109. Directus — Pricing. https://directus.com/pricing
110. Directus — Why we are relicensing Directus. https://directus.com/resources/why-we-are-relicensing-directus
111. Directus community — License revision feedback thread. https://community.directus.com/t/directus-license-revision-community-feedback-requested/2125
112. Directus — Logging configuration. https://directus.com/docs/raw/configuration/logging.md
113. Directus — Translations. https://directus.com/docs/raw/guides/content/translations.md
114. Directus — Flows. https://directus.com/docs/guides/flows
115. Strapi — CMS pricing. https://strapi.io/pricing-cms
116. Strapi — Self-hosted pricing. https://strapi.io/pricing-self-hosted
117. Jetadmin — Strapi pricing. https://www.jetadmin.io/blog/strapi-pricing/
118. Strapi docs — Internationalization. https://docs.strapi.io/cms/features/internationalization.md
119. Strapi feedback — Language fallback request. https://feedback.strapi.io/developer-experience/p/language-fallback-when-language-not-yet-maintained
120. Strapi forum — i18n relations. https://forum.strapi.io/t/strapi-i18n-relations/38331
121. Sanity — Pricing. https://www.sanity.io/pricing
122. Sanity — Technical limits. https://www.sanity.io/docs/content-lake/technical-limits
123. Sanity — Media Library limits and usage. https://www.sanity.io/docs/media-library/limits-and-usage
124. fast.io — Git LFS limits. https://fast.io/resources/git-lfs-limit.md
125. wisp.blog — Keystatic vs Decap CMS. https://www.wisp.blog/compare/keystatic/decapcms
126. Decap CMS — Discussion #7419 (Netlify Identity). https://github.com/decaporg/decap-cms/discussions/7419
127. Cloudflare — R2 pricing. https://developers.cloudflare.com/r2/pricing
128. Cloudflare — R2 limits. https://developers.cloudflare.com/r2/platform/limits
129. Backblaze — B2 cloud storage pricing. https://www.backblaze.com/cloud-storage/pricing
130. Bunny — Storage pricing. https://bunny.net/pricing/storage/
131. bitdoze — Bunny Storage vs S3 vs Backblaze. https://www.bitdoze.com/bunny-storage-vs-s3-vs-backblaze/
132. Cloudflare — Workers pricing. https://developers.cloudflare.com/workers/platform/pricing/index.md
133. Cloudflare — Workers limits. https://developers.cloudflare.com/workers/platform/limits/index.md
134. Fly.io — Pricing (markdown). https://fly.io/pricing.md
135. agentdeals — Hetzner pricing 2026 (third-party). https://agentdeals.dev/hetzner-pricing-2026
136. Railway — Pricing plans. https://docs.railway.com/pricing/plans
137. temps.sh — Render pricing 2026 (third-party). https://temps.sh/blog/render-pricing-2026
138. DeployWise — Vercel free tier limits 2026 (third-party). https://deploywise.dev/blog/vercel-free-tier-limits-2026
139. PocketHost — Pricing. https://pockethost.io/pricing
140. GitHub Docs — Managing billing for GitHub Actions. https://docs.github.com/billing/managing-billing-for-your-products/managing-billing-for-github-actions
141. Supabase docs — Edge Functions limits. https://supabase.com/docs/guides/functions/limits.md
142. PocketBase — JS jobs scheduling. https://pocketbase.io/docs/js-jobs-scheduling
143. DEV Community (certosinolab) — Streaming large ZIP archives in the browser. https://dev.to/certosinolab/streaming-large-zip-archives-in-the-browser-with-vue-and-the-file-system-access-api-42ng

**Part 4 — Offline packaging, file:// constraints, OS and distribution**

144. vite-plugin-singlefile — README v2.3.3. https://unpkg.com/vite-plugin-singlefile@2.3.3/README.md
145. Electron — Application distribution. https://www.electronjs.org/docs/latest/tutorial/application-distribution
146. MDN — CORS request not HTTP. https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS/Errors/CORSRequestNotHTTP
147. Stack Overflow 49971575 (Kiwix mirror) — Chrome fetch API cannot load file. https://dev.library.kiwix.org/content/stackoverflow_en_nopic_2021-08/questions/49971575/chrome-fetch-api-cannot-load-file-how-to-workaround
148. Mozilla Discourse — Firefox 68 local files treated as cross-origin. https://discourse.mozilla.org/t/firefox-68-local-files-now-treated-as-cross-origin-1558299/42493/2
149. StatSilk — Running offline JavaScript in Firefox 68. https://www.statsilk.com/support/running-offline-javascript-firefox-68-resolving-cross-origin-request-blocked
150. Apple — Safari Developer Guide: Disable Local File Restrictions. https://support.apple.com/guide/safari-developer/dev39df999c1/mac
151. LG webOS developer forum — Module script loads blocked under file origin. https://forum.webostv.developer.lge.com/t/module-script-loads-blocked-under-file-origin-for-installed-webos-app-no-cors-workaround-found/28351
152. Mozilla Connect — Allow JavaScript modules in the file protocol. https://connect.mozilla.org/t5/ideas/allow-javascript-modules-in-the-file-protocol/m-p/33486
153. Apple Developer Forums — thread 728157 (pushState on file:). https://developer.apple.com/forums/thread/728157
154. MDN (mirror) — Navigator.serviceWorker. https://ligm.univ-eiffel.fr/~forax/MDN/developer.mozilla.org/en-US/docs/Web/API/Navigator/serviceWorker.html
155. Microsoft Open Specifications — MS-WEBSTG localStorage. https://learn.microsoft.com/en-us/openspecs/ie_standards/ms-webstg/c43647d8-d785-4d45-a180-fe0869047828
156. caniuse — MPEG-4/H.264. https://caniuse.com/mpeg4
157. caniuse — AV1. https://caniuse.com/av1
158. Chrome Developers — Autoplay policy. https://developer.chrome.com/blog/autoplay
159. Transloadit — qtfaststart devtip. https://transloadit.com/devtips/optimize-quicktime-streaming-with-go-and-qtfaststart/
160. Eric Lawrence — Downloads and the Mark-of-the-Web. https://textslashplain.com/2016/04/04/downloads-and-the-mark-of-the-web
161. Microsoft Learn — Code signing options. https://learn.microsoft.com/en-us/windows/apps/package-and-deploy/code-signing-options
162. Tauri v2 — Windows code signing. https://v2.tauri.app/distribute/sign/windows/
163. Tauri v2 — macOS code signing. https://v2.tauri.app/distribute/sign/macos/
164. Apple — Compare memberships. https://developer.apple.com/support/compare-memberships/
165. OSnews — macOS 15.1 and unsigned applications. https://www.osnews.com/story/141055/bug-or-intentional-macos-15-1-completely-removes-ability-to-launch-unsigned-applications/
166. MacRumors forums — Testing web pages locally on an iPad. https://forums.macrumors.com/threads/testing-web-pages-locally-on-an-ipad.2422895/
167. Apple Developer Forums — thread 86485 (local HTML on iOS). https://developer.apple.com/forums/thread/86485
168. Tauri v2 — Getting started (zh-cn). https://v2.tauri.app/zh-cn/start
169. Better Stack — Tauri vs Electron vs Deno vs Electrobun. https://betterstack.com/community/guides/scaling-nodejs/tauri-vs-electron-vs-deno-vs-electrobun/
170. DEV Community — Tauri vs Electron vs Neutralino 2026 decision guide. https://dev.to/royce_fabbd83cb268312e928/tauri-vs-electron-vs-neutralino-2026-javascript-desktop-app-decision-guide-2kaf
171. Neutralinojs. https://neutralino.js.org
172. SSL.com — OV code signing. https://www.ssl.com/sv/products/software-integrity/code-signing/ov/
173. Cloudflare — Pages limits. https://developers.cloudflare.com/pages/platform/limits/
174. GitHub REST — Create a workflow dispatch event. https://docs.github.com/en/rest/actions/workflows#create-a-workflow-dispatch-event
175. GitHub Docs — Actions limits. https://docs.github.com/en/actions/reference/limits
176. GitHub Docs — Actions usage limits, billing and administration. https://docs.github.com/en/actions/concepts/overview/usage-limits-billing-and-administration
177. Fly.io docs — Pricing. https://docs.fly.io/about/pricing
178. web.dev — How to save a file. https://web.dev/articles/files/save-a-file
179. fflate — GitHub. https://github.com/101arrowz/fflate
180. JSZip — Limitations. https://stuk.github.io/jszip/documentation/limitations.html
181. GitHub Docs — About releases. https://docs.github.com/en/repositories/releasing-projects-on-github/about-releases
182. Supabase docs — Serving downloads. https://supabase.com/docs/guides/storage/serving/downloads
183. Cloudflare — R2 public buckets. https://developers.cloudflare.com/r2/buckets/public-buckets/
184. Backblaze — B2 pricing (b2 page). https://www.backblaze.com/b2/cloud-storage-pricing.html
185. Supabase docs — Egress. https://supabase.com/docs/guides/platform/manage-your-usage/egress

**Part 5 — Content modelling, applicability standards, manifests, regulation**

186. Sanity — Studio localization. https://www.sanity.io/docs/studio/localization
187. Contentful changelog — Improved transparency for editors on fallback locales. https://www.contentful.com/developers/changelog/improved-transparency-for-editors-on-fallback-locales/
188. Contentful knowledge base — Localization. https://www.contentful.com/r/knowledgebase/localization/
189. Contentful — Personalization: Experiences. https://www.contentful.com/help/personalization/experiences/
190. Storyblok — Internationalization concept. https://www.storyblok.com/docs/concepts/internationalization.md
191. I'd Rather Be Writing — Conditional profiling in DITA. https://idratherbewriting.com/conditional_profiling
192. OASIS DITA 1.3 — Conditional processing (filtering). https://docs.oasis-open.org/dita/dita/v1.3/os/part1-base/archSpec/base/filtering.html
193. OASIS DITA 1.3 — Example: conref redirection with keys. https://docs.oasis-open.org/dita/dita/v1.3/os/part1-base/archSpec/base/example-keys-conref-redirection.html
194. Mike Cook (SDL) — Creating applicability statements that work (S1000D User Forum 2016). https://www.slideshare.net/slideshow/creating-applicability-statements-that-work/64933514
195. Flatirons Solutions — Spec 2300 common and unique design features. https://www.slideshare.net/slideshow/spec-2300-common-and-unique-design-features/37516406
196. S1000D.org — Data module identification and status. https://s1000d.org/?p=101
197. Adobe FrameMaker — S1000D applicability help. https://help.adobe.com/en_US/framemaker/s1000d/WS9ad62b8fb4f8a997-577b0a7d12e234e8c0d-8000.html
198. iFixit Help — Getting started with guides. https://www.ifixit.com/Help/Getting_Started_With_Guides
199. Sanity — Content releases cheat sheet. https://www.sanity.io/docs/apis-and-sdks/content-releases-cheat-sheet
200. Sanity — Content releases user guide. https://www.sanity.io/docs/studio/content-releases
201. Sanity — Content release document flow. https://www.sanity.io/docs/content-lake/content-release-document-flow
202. Open edX — OLX courseware structure. https://docs.openedx.org/en/ulmo/_sources/educators/olx/organizing-course/course-xml-file.rst
203. AICC — cmi5 specification (GitHub). https://github.com/AICC/CMI-5_Spec_Current/blob/818b03a4bf3d217df168796d35f06c2ba83b1b10/cmi5_spec.md
204. Rustici — SCORM content packaging. https://scorm.com/scorm-explained/technical-scorm/content-packaging/
205. Rustici — Manifest structure. https://scorm.com/scorm-explained/technical-scorm/content-packaging/manifest-structure/
206. pyslet — IMS Content Packaging 1.2. https://pyslet.readthedocs.io/en/latest/imscpv1p2.html
207. xAPI.com — cmi5 technical overview. https://xapi.com/cmi5/technical-content-professionals/
208. npm docs — package-lock.json. https://docs.npmjs.com/cli/v10/configuring-npm/package-lock-json
209. eCFR — 21 CFR Part 11. https://www.ecfr.gov/current/title-21/chapter-I/subchapter-A/part-11
210. FDA — Part 11 Scope and Application guidance. https://fda.gov/media/75414/download
211. MedDeviceGuide — Document control for medical devices (secondary summary of ISO 13485 / 820.40 / QMSR / MDR). https://meddeviceguide.com/blog/document-control-medical-devices-guide

## Appendix A — Visual evidence collected (verified screenshots)

All images below are actual screenshots captured from public App Store / Google Play listings, vendor documentation or vendor video frames during this research (October 2026). Each caption states the source type. None are generated concepts. Where a product's interface sits behind a login (Medtronic Academy, J&J Institute, Stryker SKILL e-Lab, Boston Scientific EDUCARE, Osso VR in-headset UI, Incision Academy, Dozuki offline mode) no screenshot is shown, as noted in Part 12.

### A1. Touch Surgery (Medtronic) — App Store listing screenshots (verified)

![Touch Surgery: step player with n/N counter and progress bar, annotated video callouts, text sheet under media, specialty grid, "Simulation · 3 Phases" tags](images/touch_surgery.jpg)

Patterns visible: step counter "1/15" + thin progress bar in the header; media on top with text sheet below; on-video label callouts ("Redundant efferent loop", "Roux limb"); picture-in-picture schematic; procedure cards tagged "Simulation | 3 Phases" / "Video | 3 Phases"; four-tab bottom nav (Home, Library, My Surgeries, Profile).

### A2. Mechanical Thrombectomy EVT (independent app) — App Store screenshots (verified)

![Thrombectomy EVT: 8-step pathway, per-step tab bar, colour-typed callout boxes (red = critical, blue = evidence), checklist rows, references step, paywall](images/thrombectomy_evt.jpg)

Patterns visible: fixed 8-step pathway shown as a bottom tab bar (one icon per stage); each step opens with a red "critical" banner and a blue "evidence" banner; checkbox rows with grey sub-text; a persistent procedure timer; references as a dedicated final step; works offline (paywall for steps 3–8).

### A3. Incision Assist — App Store listing and protocol screens (verified)

![Incision Assist store listing: Browse by specialty/specialist, Updates feed, 3D operating room, materials with specification cards, personal notes](images/incision_assist_store.jpg)

![Incision Assist protocol: fixed 9-section protocol skeleton, "Standard protocol ▾" variant dropdown, Left/Right side selector, "Hold"/"Document"/"Video" badges](images/incision_assist_protocol.jpg)

Patterns visible: a fixed protocol skeleton (General Information → Anesthesia → OR Setup → Materials → Draping → Surgical Steps → Additional → Postoperative) — the closest analogue to a fixed 8-stage lesson template; a variant dropdown ("Standard protocol") and a side selector directly under the title; "Updated On" date shown on the protocol; material rows with "Hold" state and "Document"/"Video" badges.

### A4. Philips IGT Learning app — App Store screenshots (verified)

![Philips IGT Learning: dual organisation by system (Azurion/Allura) and clinical application, duration-stamped videos, typed documents, Saved tab](images/philips_igt_learning.jpg)

Patterns visible: content organised both by system (Azurion, Allura) and by application (Vascular, Neurology…); each video stamped with duration; documents typed (Leaflet, White paper, Quick start guide); breadcrumb-style paths "Applications > Coronary Artery Disease > …" in search results; Save & Share actions.

### A5. Mentice Neurovascular Essentials (simulator) — vendor screenshots (verified, marketing context)

![Mentice: vessel hotspot labels on angiogram, scoring summary with named hazards and Fair/Good/Excellent bar, dual-view fluoro](images/mentice.jpg)

Patterns visible: named hazard events ("Vessel scraping", "Tool movement without fluoro") with penalty points; a graded bar (Fair/Good/Excellent); the only stent-retriever-specific trainer found.

### A6. EVT Navigator (independent app) — App Store screenshots (verified)

![EVT Navigator: patient-parameter form, collapsible trial evidence, device accordion vessel → manufacturer → family → model with spec table](images/evt_navigator.jpg)

Patterns visible: device catalogue as a nested accordion (Access Catheters → Asahi → Branchor → Branchor XF) with a spec table per model — a direct reference for Tiger 13/17/21/25 selection; a context card ("Selected vessel: M1") pinned at the top.

### A7. Stryker Mako Training — App Store screenshots (verified)

![Stryker Mako Training: sign-in gate; case cards with a configuration micro-grid (implant, F/T/P values, side)](images/stryker_mako_training.jpg)

Patterns visible: a login wall (version number shown bottom-left); case cards summarising the configuration in a compact micro-grid — a reference for showing device + handle + region on a card.

### A8. Medtronic Aortic Stenosis / Evolut TAVR AR app — App Store screenshots (verified)

![Medtronic AS TAVR: persistent two-module switch (AS Severity / Evolut TAVR), AR toggle, subtitle bar on animation](images/medtronic_tavr_ar.jpg)

Patterns visible: a persistent module switch at the bottom; AR on/off toggle; subtitle bar over the animation.

### A9. Edwards Lifesciences education app — Google Play screenshots (verified)

![Edwards education app: course catalog cards with NEW / IN PROGRESS / NOT STARTED badges, type labels (E-Learning, ILT, Learning Plan), course page with Overview/Content tabs and 0/6 lessons completed](images/edwards_education.jpg)

Patterns visible: a typical LMS catalog — status badges and content-type labels on cards, course Overview/Content tabs with lesson progress "0/6". Useful mainly as a counter-example (catalog-heavy, device-light).

### A10. Scrub Up (surgical prep app) — App Store screenshots (verified)

![Scrub Up: specialty download picker ("Select Specialties to Download"), numbered checklist with vertical timeline, instrument list with categories](images/scrub_up.jpg)

Patterns visible: per-specialty offline download picker; numbered vertical-timeline checklist; checklist/images tabs within a step.

### A11. Ask MicroVention (Terumo) — App Store screenshots (verified)

![Ask MicroVention: device specification table with Distal/Proximal ID/OD columns, device filter by name/type, unit converter, compatibility builder](images/ask_microvention.jpg)

Patterns visible: device spec table with filters; "TAP TO SELECT" compatibility builder across guide/sheath → intracranial catheter → microcatheter → guidewire — a reference for a device-compatibility selector.

### A12. Rapid Medical's current Tigertriever materials — website graphic and How-To animation frame (verified; marketing material)

![Rapid Medical Tigertriever overview graphic: four feature callouts with icons (distal protection, visibility, active technology, microcatheter compatibility)](images/rapid_tigertriever_overview.jpg)

![Rapid Medical How-To animation frame: picture-in-picture hand on the handle plus vessel/clot view](images/rapid_howto_animation_frame.jpg)

Patterns visible: the existing visual language (grey device renders, green accent, feature callouts); the How-To animations already use a picture-in-picture composition (hand on handle + vessel view) that maps directly to a step screen's media area.