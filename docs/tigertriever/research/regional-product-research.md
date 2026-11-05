# Rapid Medical — Regional Sites, Product Variants & Training Architecture

**Desk Research Addendum 02 · 17 October 2026 · v0.1**  
**Owner:** UX / Product Design  
**Status:** Research findings and design implications; not manufacturer-approved regulatory or clinical guidance.

## 0. Scope and responsibility

This review compares Rapid Medical's public US, international/Europe & Middle East, and Asia-Pacific websites with public FDA 510(k) summaries. It supports UX architecture and content-model decisions; it does **not** validate medical content, market availability, indications for use, or product compatibility. Rapid Medical owns and approves those facts and supplies current local IFUs, videos, and approved program content. The UX team determines information architecture, interfaces, comparisons, interaction patterns, and editorial UX independently.

**Evidence levels:** `[SITE]` directly observed published Rapid Medical page or screenshot; `[FDA]` original US regulator document; `[DESIGN]` UX or technical inference; `[OPEN]` requires current source data/approval from Rapid Medical. Site screenshots are promotional product information, **not substitutes for IFUs**.

## 1. Website architecture: the market distinction is not mere localisation

- `[SITE]` Worldwide location chooser explicitly presents **Americas**, **Asia & Pacific**, and **Europe & Middle East**. The international/OUS site should not be treated as a synonym for the legal EU market. [Location chooser](https://www.rapid-medical.com/choose-your-location).
- `[SITE]` US public therapy catalogue centres Tigertriever on **Large Vessel Stroke**: [US therapies](https://us.rapid-medical.com/) and [US LVO](https://us.rapid-medical.com/lvo).
- `[SITE]` The OUS site has both [Large Vessel Stroke](https://ous.rapid-medical.com/lvo) and a dedicated [Medium Vessel Stroke](https://ous.rapid-medical.com/mvo) page featuring Tigertriever 13. The OUS MVO page explicitly states that **Tigertriever 13 is indicated for LVOs in the US**, and directs readers to the IFU for indications.
- `[SITE]` [APAC MVO](https://apac.rapid-medical.com/mvo) also exists with separate evidence/product categories. Public website categories do not establish per-country authorisation.
- `[SITE]` [DISTALS results](https://www.rapid-medical.com/distals-results) includes separate international and US links and warns that Tigertriever 13 is not indicated for DMVO in all markets.
- `[SITE]` US LVO page also provides Canada-specific order contact details, and a [Canada-specific IFU page](https://us.rapid-medical.com/ifu-tigertriever-canada) exists. Thus even one regional website may represent more than one regulatory country.

**[DESIGN] Decision:** model a **regulatory market/country applicability** separately from an initial geographic grouping or language. The offline app can be built for an approved market (no repeated market selector if package is market-specific), or be a multi-market bundle with explicit market selection. Never use automatic geography to infer approved clinical instructions.

## 2. Device family and extensions: public US clearances

| Family member | US source | Confirmed product fact | Training/UX implication |
|---|---|---|---|
| Tigertriever 13 | K220808 (predicate cited in 13 Ultra clearance) | Original Tigertriever 13 | Can appear as a distinct released device variant when approved content exists |
| Tigertriever 13 Ultra | [FDA K260617 PDF](https://www.accessdata.fda.gov/cdrh_docs/pdf26/K260617.pdf), cleared **28 Aug 2026** | Handle uses **rotating knob** instead of predicate 13's **slider**; table lists 1.5–2.5 mm recommended vessel size for both | High-value Handle Comparison; no automatic assumption that client draft's “new T13 handle” is identically labelled in all markets |
| Tigertriever 17 | [FDA K203592](https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfpmn/pmn.cfm?ID=K203592), 2021 | Original Tigertriever 17 | Distinct model/revision from Ultra |
| Tigertriever 17 Ultra | [FDA K251603 PDF](https://www.accessdata.fda.gov/cdrh_docs/pdf25/K251603.pdf), cleared **6 Oct 2025** | Still uses **slider**; mesh length 32 mm vs 23 mm on predicate 17; min microcatheter ID 0.017 in vs 0.0165 in in regulator table | “Ultra” cannot be used as shorthand for a knob-style handle; requires independent model/variant identity |
| Tigertriever 21 | [FDA K230429](https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfpmn/pmn.cfm?ID=K230429), 2023 | Listed in a cleared product grouping alongside 13/17 | Client has deferred its course; clearance is not a training-content availability signal |
| Tigertriever 25 | [FDA K253062](https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfpmn/pmn.cfm?ID=K253062), cleared **12 Mar 2026** | Separately cleared in US | Still not an automatically available approved training course |

**Important regulatory caveat:** A 510(k) clearance should not be described as FDA PMA 'approval'. The cited Tigertriever 13 Ultra US indication in K260617 concerns **large intracranial vessels**; its rotating knob does not itself imply US DMVO indication. Device-family additions cannot be inferred as cleared/available in every country.

## 3. Directly observed divergence in website specification tables

The site's specification tables are **images**, not a machine-readable product API. Open the originals for exact content:

- [US LVO original specifications image](https://irp.cdn-website.com/9d0280ee/dms3rep/multi/opt/ChatGPT%2BImage%2BSep%2B11-%2B2026%2B-%2B08_49_40%2BPM-1920w.png)
- [OUS LVO original specifications image](https://irp.cdn-website.com/8b5f57de/dms3rep/multi/opt/OUS_LVO_Product%2BOverview-1920w.png)
- [OUS MVO original specifications image](https://lirp.cdn-website.com/8b5f57de/dms3rep/multi/opt/OUS_MVO_Product%2BOverview-1920w.png)

| Published image field (illustrative) | US LVO | OUS LVO |
|---|---|---|
| Tigertriever 13 catalogue no. | TRPP7144 | TRPP3144 |
| Tigertriever 17 catalogue no. | TRPP7166 | TRPP3166 |
| Tigertriever 17 minimum microcatheter ID | 0.0165 in | 0.017 in |
| Tigertriever 25 catalogue no. | TRPP7125 | TRPP3125 |
| Tigertriever 17 Ultra included as a separate row | Yes | Not in that table |

**Caution:** This is a **comparison of published images**, not a conclusion about actual technical discrepancies. Table dates, versions, SKU designations, and applicability are not reconciled. Site assets may be stale, reflect different variants or contain errors. Manufacturer-confirmed region/device SKU and current IFU remain the source of truth. Do not silently merge contradictory marketing specifications.

**[DESIGN] Decision:** separate `DeviceFamily`, `Model`, `ProductVariant`, `HandleMechanism`, `Market`, `MarketedSKU`, `ApprovedSpecificationRevision`, `Program`, `LessonRevision`, `Approval/Applicability`, `Release`. A marketed SKU can differ by market while representing the same family; model/variant ↔ handle is a validated relationship, not a guessed naming rule. Do not build UI taxonomy around a fixed list of four model numbers.

## 4. Available Rapid Medical content types and design opportunities

| Source / observation | Implication for UX |
|---|---|
| [US LVO](https://us.rapid-medical.com/lvo), [OUS LVO](https://ous.rapid-medical.com/lvo), [OUS MVO](https://ous.rapid-medical.com/mvo) share a marketing-level **Penetrate / Adjust / Relax** explanatory triad | Candidate mental-model summary on Overview; do **not** replace client-approved eight procedural stages with these slogans |
| Public product diagrams label cage, radiopaque markers, slider, handle; [slider annotated diagram](https://irp.cdn-website.com/9d0280ee/dms3rep/multi/opt/Specifications-Resized-1920w.jpg) | Candidate asset type `labeled_device_anatomy` or optional hotspots; verify approved reusable masters from client, especially for knob handle |
| Separate clinical cases and physician recordings are surfaced on US/OUS LVO and OUS MVO pages | Candidate *Supplementary resources* or *References* category, not automatically an instructional step; client owns rights and approval |
| [OUS Evidence Library](https://ous.rapid-medical.com/evidence), [US Evidence Library](https://us.rapid-medical.com/evidence), [APAC Evidence Library](https://apac.rapid-medical.com/evidence) have different product category trees | Potential `source_type`, `applicable_models`, `market`, `revision` metadata for references; not a requirement to reproduce the site's evidence library |
| [IFU request](https://ous.rapid-medical.com/lvo) is offered by email/contact rather than a public regional structured API | Client-supplied IFU PDFs/revision IDs and source rights are required for production content; website scraping is not an appropriate pipeline |
| Main worldwide site includes other product families **COMANECI** and **DRIVEWIRE** | Architecture can later hold different procedure/program structures without implying those products belong in Tigertriever v1 |

## 5. Core design and editorial recommendations

1. **Market-first content validity, not market-first friction.** Prefer building **market-specific offline releases** when operationally appropriate. If a multi-market package is necessary, make the market explicit and persistent; never silently fall back to other-market clinical content.
2. **Structured comparators.** User selects two approved targets from the *same regulatory market*; side-by-side factual attributes must be versioned, source-labelled and approved. Comparisons must not imply treatment selection.
3. **Separate identity dimensions.** Don't infer handle mechanics from 'Ultra' or from model number. US 13 Ultra is knob; US 17 Ultra remains slider (FDA).
4. **Published preview and comparison.** Content Studio must display the exact Market → Product Variant → Handle → Lesson → Revision relation for content edits and release scope; require explicit applicability checks.
5. **Product-specific media coverage.** Before allowing a release or comparator, require all selected configuration-stage assets and any relevant warning/IFU metadata. A shared asset is only shared by explicit client approval.
6. **Release provenance.** Store market/country scope, product variant SKUs, content revision IDs, source-IFU revisions and assets, approver, build timestamp and export manifest. Offline copy should display version and applicable market.
7. **Marketing / evidence / instructions separation.** Distinguish product storytelling, clinical-study claims, approved instructions, downloadable video, and reference materials in CMS; don't present marketing claims as procedural rules.

## 6. Factual information needed from Rapid Medical (not UX decisions)

- Exact country/market applicability: US vs Canada vs specific European countries vs Asia-Pacific, and official market group names.
- Approved current list of models/variants/handles and marketed SKUs (including whether `T17U` maps to US 17 Ultra, and how `new T13 handle` is officially named per market).
- Current approved IFU versions, applicable warnings/indications, and lesson content per exact market/model/variant.
- Authorised differences eligible for public comparison; availability of handle-specific video and labelled diagrams.
- Source media, regional reuse rights, filenames/revision codes, and content approval contacts.
- Whether users receive one market-specific ZIP or a multi-market ZIP, and target OS/browser/managed-hospital IT constraints (operational inputs, not UX design choices).

## 7. Decision updates / evidence register

| ID | Finding | Strength | Proposed change |
|---|---|---|---|
| R01 | Markets on site: Americas / APAC / Europe & Middle East | Direct site | Don't equate OUS with EU legal market |
| R02 | US LVO vs OUS MVO Tiger 13 distinction | Direct site + FDA | Approved market-specific content and availability |
| R03 | 13 Ultra = rotating knob, US clearance Aug 2026 | Primary FDA | Explicit handle variant; compare mode |
| R04 | 17 Ultra = slider + modified length/catheter compatibility | Primary FDA | Model variant separate from handle |
| R05 | 25 US clearance Mar 2026; 21 included in older FDA filing | Primary FDA | Extensible catalogue, independent training readiness |
| R06 | US vs OUS specification images differ | Direct site image, possible staleness | Market-specific, versioned spec data; unresolved source conflict |
| R07 | Case reports, videos, evidence categorized per site | Direct site | Optional resources; provenance metadata |
| R08 | IFU not uniformly exposed as public product PDF | Site evidence | Client-provided authoritative document mapping |

**Next UX task:** compare two realistic catalogue structures: (A) *Choose approved market → choose device/variant → learning/compare* and (B) *select a known product → select applicable market/context → learning/compare*; evaluate which better minimizes accidental wrong-market selection without forcing extra steps on single-market packages. This UX choice belongs to design, not the client.

## Primary references (accessed 17 October 2026)

1. Rapid Medical. [Choose your location](https://www.rapid-medical.com/choose-your-location).
2. Rapid Medical. [US LVO](https://us.rapid-medical.com/lvo); [OUS LVO](https://ous.rapid-medical.com/lvo); [OUS MVO](https://ous.rapid-medical.com/mvo); [APAC MVO](https://apac.rapid-medical.com/mvo).
3. Rapid Medical. [DISTALS results](https://www.rapid-medical.com/distals-results).
4. Rapid Medical. [US Evidence](https://us.rapid-medical.com/evidence); [OUS Evidence](https://ous.rapid-medical.com/evidence); [APAC Evidence](https://apac.rapid-medical.com/evidence).
5. U.S. FDA. [Tigertriever 13 Ultra 510(k) clearance K260617](https://www.accessdata.fda.gov/cdrh_docs/pdf26/K260617.pdf), August 28, 2026.
6. U.S. FDA. [Tigertriever 17 Ultra 510(k) clearance K251603](https://www.accessdata.fda.gov/cdrh_docs/pdf25/K251603.pdf), October 6, 2025.
7. U.S. FDA. [Tigertriever 25 510(k) K253062](https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfpmn/pmn.cfm?ID=K253062), March 12, 2026.
8. U.S. FDA. [Tigertriever 13/17/21 510(k) K230429](https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfpmn/pmn.cfm?ID=K230429), April 17, 2023.