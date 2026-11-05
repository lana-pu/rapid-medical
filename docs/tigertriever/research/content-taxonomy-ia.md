# Rapid Medical · Content Taxonomy & Information Architecture Implications

**Addendum 03 · 17 October 2026 · v0.1**  
**Status:** UX information inventory; not a source of clinically approved teaching content.  
**Purpose:** extract reusable **content structures** from Rapid Medical's public US and international sites, without importing their medical copy, UI, claims or navigation into Tigertriever Training.

## 1. Source boundary & division of responsibility

- Rapid Medical owns and supplies **all** procedural text, videos, images, specifications, medical claims, case materials, intended use, source IFUs, market applicability and approval decisions. The site shows what types of material exist, not what is authorised to ship.
- UX/product design owns how this information is **grouped, prioritised, presented, navigated, compared and edited**. The website's tab layout and sales-first emphasis are not binding.
- This addendum does **not** propose copying images/videos from public URLs or auto-scraping medical information. Use client files with appropriate rights and confirmed versions.
- `[SITE]` = observed marketing/product-site structure; `[DESIGN]` = proposal to support content in the interface; `[INPUT]` = supplied/approved source needed from client; `[OPTION]` = nonessential capability.

## 2. What the actual websites reveal

| Website observation | Evidence and example | What we can take for UX | Not implied |
|---|---|---|---|
| Product overview with device depiction | Tigertriever US/OUS LVO pages have **Product overview**, pictured device and specifications | `[DESIGN]` optional compact introduction and diagram for each available device | No requirement for a standalone introductory page for every model |
| Structured product specifications | US/OUS pages show published specification graphics and caution not all devices available in all countries | `[DESIGN]` editable **approved fact fields** by market/variant; standardized facts for Model Comparison | Do not import current graphic figures as approved in-app values |
| Short explanation of mechanism | LVO/MVO pages present `Penetrate · Adjust · Relax` and short device visuals | `[DESIGN]` allow a **mechanism explainer**: animation, caption or static image in overview or linked from stage | These three marketing terms do not replace eight procedural training stages |
| Video/case material in context | US/OUS include In-Practice cases, practitioner recordings and case reports | `[DESIGN]` optional supporting resources, with type, context, provenance and predictable navigation back | Not all case studies are essential training; no implicit clinical applicability |
| Clinical evidence & references | Evidence links and papers are separated from product material | `[DESIGN]` distinguish *reference/evidence* from *approved procedural instructions* in the content model | Never blend claims into warnings or procedural directions |
| Different therapeutic families | The US catalogue includes Tigertriever, Comaneci and Drivewire; OUS adds MVO and vasospasm categories | `[DESIGN]` allow product families with **distinct program structures**, template extensibility | No need to ship Comaneci/Drivewire content now or reuse Tigertriever's eight named stages |
| US versus OUS content organisation | OUS features Tiger 13 MVO, while US site centres LVO; OUS page notes US-use distinction | `[DESIGN]` accurate market/variant tags and release scopes, independent of navigation decisions | OUS ≠ EU regulation, and different webpages alone do not prove approved instructions differ |

Sources: [US Tigertriever LVO](https://us.rapid-medical.com/lvo), [International Tigertriever LVO](https://ous.rapid-medical.com/lvo), [International Tigertriever MVO](https://ous.rapid-medical.com/mvo), [US therapies catalog](https://us.rapid-medical.com/), [International therapies catalog](https://ous.rapid-medical.com/), [US Comaneci](https://us.rapid-medical.com/aneurysm), [US Drivewire](https://us.rapid-medical.com/access). Reviewed 17 October 2026.

## 3. What an individual device may contain (content inventory)

**Core, if training is published:**

- `Identity & context`: exact device/variant, handle when applicable, approved market, version.
- `Training program`: client's supplied sequence of approved stage headings, media, instruction text and warnings, with intro/outro when provided.

**Optional enrichment, only when client supplies it:**

- `Device at a glance`: short approved overview, 2D product illustration.
- `Device anatomy`: static diagram with already-labelled parts (e.g., device structure and handle). Interactive hotspots **not required**.
- `Technical facts`: same-schema facts/units for an approved comparison or a compact spec drawer.
- `How it works`: short, stand-alone mechanism video or animation (not automatically equivalent to a procedural stage).
- `Further resources`: client-approved cases, evidence documents, technical references and IFU-linked references, with revision/source metadata.

The site presents these as tabs for prospective customers. A training-focused application **should not copy those tabs**. Put the procedural stage index first; optional supporting material can appear within overview, as contextual `About this device` / `More detail`, or a modest `Resources` destination **when content volume justifies it**.

## 4. Proposed minimal information architecture

```text
Published market-specific training package
  ├── Catalog / selected device (skip if package scope fixes it)
  └── Device training overview
       ├── Optional: About this device / labelled anatomy diagram
       ├── Start training (Opening → 8 procedural stages → Closing when published)
       ├── Direct access to any procedural stage
       │     └── Video/still/animation + instructions + safety info
       │           └── Optional contextual illustration or reference
       ├── Compare (when eligible and approved)
       │     ├── Handle differences
       │     ├── Two models using comparable approved facts
       │     └── Same-stage procedural material, both approved
       └── Optional: More resources (cases / evidence / documents)
```

**Principles:** primary training is never displaced by a marketing narrative; no unnecessary extra choice for users; no forced general `Specs` / `Evidence` tabs; unsupported items are absent or explicitly unavailable; section labels reflect actual client-supplied content. Content quantity determines whether secondary information needs its own navigation destination.

## 5. Comparison uses structured inputs, not parallel marketing pages

- `Handle`: relevant client-supplied device/handle depictions, interface controls, media differences and approved comparison statements; no automatically invented procedure differences.
- `Device model`: shared typed fact fields (same definitions/units), exact market applicability, optional labelled anatomy diagrams. Incomplete values show `Not provided` or unavailable; **never** imply equal/clinically interchangeable devices.
- `Same stage`: two source-approved media/instruction sets aligned by semantic stage key, playback independent unless real mappings supplied. Technical facts are secondary, not a substitute for procedural content.
- `Regional differences`: a coverage/asset-audit **for editors**, not a public learning recommendation.

UI components already proposed in the comparison specification are sufficient; no extra comparison mode is necessary.

## 6. Minimal Content Studio implications

| Editor area | Required handling | Complexity control |
|---|---|---|
| Device configuration | Stable device / variant / handle / market identity | Explicit applicable combinations; no implicit defaults |
| Stage content | Title, approved text, video/image/animation and warnings | One predictable lesson template in MVP |
| Media library | Type, description, filename, version, source, usage and approval state | No video editing or annotation production inside CMS |
| Technical facts | Client-supplied labelled fields and unit where needed | Narrow, repeatable fact types rather than a page builder |
| Optional resources | Title, resource type, file/link, applicability and approval | Add only if resources actually arrive |
| Publish/check | Valid media and sources for chosen release scope, both sides of compare packaged | No automatic import of site content, no network-required teaching material |

The same UI for editing a lesson should let staff **attach** an approved asset from a library and see where it is used. The CMS is not responsible for creating the asset.

## 7. Priorities and what we will NOT add now

**MVP content support:** one main approved video/still per stage, structured short text, warnings, intro/outro, exact configuration tags, two-config comparison, approved media picker, release provenance. Optional *single* device diagram or overview asset is a sensible low-cost enhancement if supplied.

**Next phase if source content justifies:** editable structured model facts, case/publication resource collection, multiple media assets per lesson, annotated schematic hotspots, version-specific resource groupings.

**Not required:** importing public marketing pages, rewriting client medical language, editing client video, building a full media production suite, mandatory 3D, medical device recommendation engine, replicating website tabs, default support for all Rapid Medical product families in the first package.

## 8. UX decisions we still own

- Where optional device anatomy belongs: compact overview, expandable side-panel or linked dedicated view.
- How dense model fact tables should be and how to handle absence of comparable attributes.
- Whether small numbers of references should be contextual links or warrant a dedicated Resources view.
- Whether a media-illustration hotspot adds learning value enough to warrant implementation and testing.
- Which available supporting materials deserve first-class prominence based on observed tasks, without overriding medical content supplied by client.

**No request to Rapid Medical to design these interfaces.** Only request delivered assets plus their confirmed type, applicable device/handle/market, status and source if missing.