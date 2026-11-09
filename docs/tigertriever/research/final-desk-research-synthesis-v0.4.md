# Rapid Medical — Tigertriever Training Platform
## Final Desk Research Synthesis & Design Baseline

**Version:** v0.4 · **Date:** 2 November 2026  
**Document owner:** UX / Product Design  
**Status:** Targeted desk-research synthesis complete for the first UX-design cycle. Working UX baseline, **not** a manufacturer-approved medical, regulatory or engineering specification.

> **Research closure statement.** This closes the *targeted secondary desk-research cycle* covering context of use, learning science, comparison design, external interface benchmarking, information architecture, content taxonomy, regional product context and Content Studio workflows. It does **not** mean user research, medical-content approval, offline technical validation, regulatory assessment or implementation estimation are complete. The decisions below supersede conflicting **working UX recommendations** in earlier addenda. Earlier reports remain preserved as source evidence, not competing active specifications.

---

## Executive synthesis

**Product direction.** Deliver one self-contained **offline training experience for physicians**, backed by a separate **online Content Studio** operated by Rapid Medical. Both are organized around explicitly approved, versioned learning content. The learner finds training for a *known* device configuration and either follows the sequence or goes directly to a stage. Contextual **Compare** supports two explicitly eligible configurations without turning the application into a clinical device-recommendation engine. The editorial system manages prepared content and builds a frozen, traceable offline release.

**Recommended learner architecture:** `Open package → resolve market/device/handle context only when needed → Training Overview → shared Stage Player ↔ eligible Compare`. Supplemental diagrams, specifications and references are shown in context, not as mandatory parallel course trees.

**Recommended Content Studio architecture:** `Catalog & Coverage → Program/Stage Editor → Impact Review + Draft vs Released Preview → Approval → Release Center → immutable offline package`, with Media Library, comparison records and release history accessible as supporting destinations.

**Three structural guardrails:**

1. **Content correctness is supplied, reviewed and authorised by Rapid Medical.** The designer owns research, IA, interaction, comparisons, visual presentation and tests. Public site copy, medical findings or old client drafts are **not** automatically approved in-app instructions.
2. **Applicability is exact.** Training is tied to approved model / device variant / handle / market (and source/revision) rather than inferred from a geographic website or an informal product nickname. No automatic fallback between configurations or regions.
3. **Publication is immutable.** A newly saved or approved item is not automatically in an already downloaded offline package. A release pins every included content/media revision; live editing cannot silently change previously exported copies.

**Research confidence.** Learner-paced segmentation, spatial contiguity and attention cues are backed by *general* multimedia-learning evidence; aligned comparisons are grounded in cognitive theory and general UX. Actual navigation patterns are supported by product examples and qualitative tradeoff analysis. **No direct Tigertriever usability test has been performed**; no verified comparator proves that side-by-side procedural video is optimal. Accordingly, detailed layout decisions remain testable hypotheses.

## 1. Scope, source hierarchy and method

### 1.1 Research corpus

The synthesis reconciles the following project sources rather than re-running a broad competitor search:

- **Client material:** Rapid Medical *Tigertriever Interactive Training Webpage* content draft v0.10 (July 2026; marked *FOR REVIEW*), plus the October 2026 interactive HTML wireframe. These indicate intended audience, stage narrative, media status and desired device coverage; they are **not** final medical guidance.
- **Prior desk research:** two foundational UX/architecture reports, context-of-use research, product/region research, content taxonomy, learning/comparison evidence review, visual UX benchmarking (six reference groups), learner IA alternatives study (three approaches), and Admin UX & Content Workflows study (three approaches).
- **External primary/secondary evidence:** peer-reviewed multimedia/cognitive research; official product sites and relevant FDA records for *context only*; public documentation of Touch Surgery, Incision, Siemens ExpertGuidance, iFixit/Dozuki and commercial CMS editors. Existing research notes give source-level citations. Selected original sources were rechecked 2 November 2026.

### 1.2 Evidence vocabulary

| Code | Evidence class | Supports | Does **not** establish |
|---|---|---|---|
| **C** | Client, nonfinal | Intended scope, inventory, operations and draft content structure | Approved clinical facts or final stage naming |
| **R** | Peer-reviewed research | A general learning/cognitive principle within its study population | A tested Tigertriever outcome or optimal screen |
| **O** | Observed official screen/documentation | That a competitor exposes a particular pattern or capability | That the pattern outperforms alternatives |
| **P** | Public product/regulatory context | Need for differentiated models/regions/source provenance | Applicability of a particular IFU inside this app |
| **D** | UX synthesis/tradeoff | A working architecture to prototype | Empirical usability success |
| **T** | Technical assumption/constraint | Need to prototype and test a platform behavior | Guaranteed offline compatibility |

**Method limitation:** This was targeted narrative desk research and heuristic synthesis, **not** a registered systematic review, clinical validation, regulatory audit, moderated user study, or independent source-of-truth check of every statistic repeated in an early research report. Conflicting claim wording is not silently reconciled.

## 2. Consolidated findings and their limits

| Finding | Grounding | UX consequence | Confidence / limit |
|---|---|---|---|
| F01. Audience: physicians; representative-led and direct use | C: July client draft | One learner interface; avoid creating two unrequested modes | High for stated intent, no observed field use |
| F02. Brief text + play/pause instructional clips; no narration planned | C: July draft | Media-first stage, controllable playback, text near relevant media | High for draft direction; final assets unknown |
| F03. Ten-part narrative comprises Opening + eight procedural stages + Closing | C: July and October artefacts | Eight core stage entries; intro/outro as framing sections | High for structural reconciliation; client final titles pending |
| F04. Segmented material can aid general retention/transfer | R: Rey et al. 2019 | Learner-controlled stages and direct stage access | General effect only; no Tigertriever clinical outcome |
| F05. Cues and spatial proximity may support multimedia learning | R: Schneider et al.; Schroeder & Cenkci | Adjacent instructions and approved visual annotations | Does not validate exact positioning/amount of text |
| F06. Structurally aligned items improve noticing of comparable differences | R: Gentner & Markman; O: NN/g tables | Same semantic stage/attribute labels across Compare targets | Indirect inference for two procedural videos |
| F07. Client distinguishes old/new handle media; new T13 clips incomplete in July | C: July asset table | Paired coverage and missing-asset states required | Historic asset status; re-confirm current availability |
| F08. US and international web content diverge; OUS is not identical to EU | P: Rapid Medical sites | Exact approved market applicability, not translated text alone | Website pages are not authorised instructions |
| F09. Device variants and handle mechanisms are not the same data dimension | P: public FDA examples; C: client | Separate model, variant, mechanism, market and source version | Client owns accurate configuration identity |
| F10. Procedural guides use stage/step lists plus associated media | O: iFixit, Siemens, medical-learning references | Overview → stage reader; optional device diagrams | Competitor existence ≠ proven superiority |
| F11. Editorial systems support drafts, diffs and previews | O: Dozuki, Directus, Payload, Storyblok | Draft isolation and precise preview of learner output | Must implement configuration-specific behavior ourselves |
| F12. Release tools expose readiness/blocking states | O: Strapi and Dozuki | Actionable build blockers and preview of the proposed release | CMS 'publish' is not equivalent to exporting a frozen offline ZIP |
| F13. Hospital offline platform remains unspecified | C + T | Mandatory actual-machine/browser/package compatibility spike | Cannot promise file:// operation or automatic updates |

### Design principles derived from the evidence

**P1 — Preserve context.** The current model, device variant, handle, market and package version must be identifiable in every substantive learner view, especially Compare and post-navigation return.

**P2 — Two ways in, one lesson representation.** A training sequence and direct-stage lookup should share the same player and lesson metadata; do not duplicate content in Learn and Reference trees.

**P3 — Information follows the task.** Diagrams, technical specifications and references are available near relevant steps or on the overview, without turning the main navigation into a file-format library.

**P4 — Compare aligned, authored material.** Use exact approved pairings and the same semantic stage; display both complete source contexts and warnings. Never infer medical differences from video length or AI-generated descriptions.

**P5 — Separate editorial states.** The studio must distinguish `Draft`, `In review`, `Approved`, `Included in release vX`, `Built`, and `Distributed`; labels should describe the actual state, not collapse them into `Published`.

**P6 — Make impact visible before commit.** Any shared lesson or asset edit should list the exact configurations, stages and comparison pairs affected before the editor applies it.

**P7 — Make offline distribution inspectable.** A release manifest, build report, contents, checksum and downloadable package should identify exactly what shipped. An old downloaded copy remains unchanged.

**P8 — Avoid a general-purpose CMS in the physician UI.** The admin may store multiple media types, but the learner's primary objects are device configuration, training program and procedural stage.

## 3. Active learner information architecture

### 3.1 Selected baseline: package-aware adaptive entry

Evaluate the release manifest on local launch; **do not detect location automatically**. The visible entry flow depends on the actual approved options in this package:

| Package scope | Entry behavior | Explicit user-facing context |
|---|---|---|
| One market, one configuration/course | Open the course overview directly | Show fixed market/device/handle/version |
| One market, several configurations | Show device/variant catalog, then handle if ambiguous | Show fixed market and each valid choice |
| Multiple markets in one package | Ask for explicitly listed approved market before opening a course | Keep selected market visible; changing it resets eligible context safely |
| A configuration has unfinished/unapproved material | Exclude from released learner catalog | Do not present a broken course or fill gaps from another model |

**Status:** `RECOMMENDED — validate first-click and context comprehension`. Market-first and device-first wizards were compared in the IA study; rigid wizards create unnecessary selections in single-scope packages or obscure market applicability. Adaptive entry is the preferred *design hypothesis*, not a measured preference.

### 3.2 Course and stage map

```text
Package launch / release & intended-market context
  └─ [Only if necessary] choose approved market
      └─ [Only if necessary] choose model/variant/handle
          └─ Training Overview
              ├─ Start training → Opening [if supplied and approved]
              │   └─ Eight procedural stages in approved order
              │       └─ Closing [if supplied and approved]
              ├─ Jump to procedural stage → Shared Stage Player
              ├─ Device overview / approved diagram / specifications [optional]
              ├─ Eligible Compare (model / handle) [conditional]
              └─ About this package / applicable sources & version
```

**Tigertriever source stage inventory:** Device preparation; Positioning; Deployment; Optimising clot interaction; Aspiration & combination technique; Prepare to retrieve; Retrieval; Between passes. These are the **October draft's** eight procedural labels; stage 5 and other naming differ from the July draft. Client supplies approved final wording. Store stable *semantic identifiers* independent of display label or numeric position, and configurable section types (`intro`, `procedure`, `outro`, `resource`). **Do not hard-code eight stages across future device families.**

**Screen allocation:** `L0` package entry/catalog (conditional); `L1` Training Overview; `L2` Stage Player; `L3` Compare; `L4` About Release; `L5` scoped supplementary resource panel (not necessarily a full page). Fixed stage rail on desktop and a well-labeled collapsed stage index on narrow screens are **testable layout candidates**. Full-screen media should not hide essential warning context.

**No separate use modes** for rep-led vs solo: both encounter the same content. If a facilitator requests a different sequence, they can navigate directly to a stage. No credential, trainee account, certification, quiz, device choice recommendation or mandatory progress tracking is required by the brief.

### 3.3 Navigation and return contracts

- Opening a known stage from the overview takes the user directly to it; the current configuration never silently changes.
- The previous/next sequence follows *approved course ordering*, not calendar rollout/development phases.
- Compare enters with the current configuration and optional current semantic-stage ID; exit restores the original configuration and origin stage.
- A missing stage on side B is an explicit unavailable state; no automatic 'nearest' matching.
- Package metadata and source information remain accessible offline and legible without a network connection.

## 4. Active comparison architecture

### 4.1 Compare is an experience, not one global grid

| User | Mode | What aligns | Provisional presentation | Required data |
|---|---|---|---|---|
| Physician | **Handle comparison** | Same model + market, eligible handle/variant pair | Aligned stage A/B, optional approved difference notes | Two exact approved configurations and pair eligibility |
| Physician | **Model comparison** | Approved structured characteristics, same market | Comparison table (attributes as rows) | Comparable client-authored fields; no device recommendation |
| Physician | **Same-stage comparison** | Stable procedural semantic ID across two eligible configurations | Two complete stage views and independent video controls | Approved source lessons, warnings and media on each side |
| Editor | **Draft vs Released** | Same stage/configuration and shipped baseline | Field-level change summary + true learner preview | Last shipped manifest and draft revisions |
| Editor | **Release vs Release** | Manifest inventories and resource revisions | Added / changed / removed summary | Two archived release manifests |
| Editor | **Regional coverage** | Approved configuration and section completeness | Coverage matrix | Explicit market-specific applicability |

**Prototype baseline:** two columns with aligned section headers and each video controlled independently; pin configuration labels; optional `Key differences` provided by Rapid Medical; provide direct access to complete instruction for each side. A narrow-screen A/B switch and stacked alternative must be tested. A purchase-comparison 'hide identical' control **cannot** suppress either side's warnings or required instructions. Never synchronize independent videos by equal playback time; only client-reviewed semantic markers could justify any synchronization in future.

**Source/clinical constraint:** pairing two independently approved lessons is not automatic authorisation for all comparative *claims*. An editor must explicitly enable a pair; narrative difference statements need approved source text. If one member has incomplete content, show not available or exclude the pair from the release (with explicit editorial reason).

**Conflict resolved:** Model Comparison is **part of the product concept** and can be prototyped with synthetic structured attributes, but it becomes learner-facing in a production release **only when approved comparable fields exist**. Do not create invented values or force every pair to be comparable. Comparison of handles and same stage are P0 prototype priorities; production priority is conditional on real paired media.

## 5. Active Content Studio architecture

### 5.1 Editorial work is program-first

```text
Work Queue [optional light entry]
Catalog & Coverage
  └─ Product family / model / exact configuration / program
      └─ Stage Editor (client-authored text, warnings and media)
          ├─ Media Library (reuse only with explicit applicability)
          ├─ Impact Review (configurations + comparison pairs)
          ├─ Draft vs Included-in-Release Preview
          └─ Submit for medical review/approval
Comparisons (explicit eligible pairs and approved difference notes)
Release Center
  ├─ Scope + manifest candidate
  ├─ Validate prerequisites; show actionable blockers
  ├─ Preview exact frozen candidate, including Compare
  ├─ Freeze approved revisions → Build → Verify → Download
  └─ Release History / Distribution status
```

**Status:** `RECOMMENDED — validate with editor tasks`. This blends documented concepts from Dozuki, Payload, Directus, Storyblok and Strapi; the design itself is custom. Do not require the two-person marketing team to administer raw database tables or build arbitrary page layouts.

### 5.2 Content model, minimum viable conceptual contract

`ProductFamily → DeviceModel → DeviceVariant → ExactConfiguration(model, variant, handleMechanism, regulatoryMarket)`; `TrainingProgram → OrderedSection(sectionKind, semanticId)`; `LessonRevision → client-approved content, warnings, resources`; `AssetRevision → file, metadata, provenance`; `ApprovedApplicability(configurationId, lessonRevisionId)`; `ComparisonPair` / `ApprovedComparisonNote`; `ReleaseManifest → exact revision identifiers + market scope + build metadata`.

A program may reference material shared by several configurations, but a shared reference **never implies broad approval**. Separate editorial data from presentation: components expose typed content blocks, not arbitrary HTML or copy/paste from the public site.

**Key content types:** short procedural text, stage media, captions/transcripts when supplied/required, device illustration with approved labels, mechanism explainer, structured specification, required warnings, source/IFU metadata, contextual external references. Opening/Closing, before-you-begin notes and clinical cases are optional and subject to content approval.

### 5.3 Release is not merely CMS publication

An offline release must (a) choose valid scope; (b) validate approved stage/media/applicability/comparison records; (c) preview resolved candidate; (d) freeze immutable exact revisions; (e) build with all local media and dependencies; (f) verify supported browser/OS launch and links; (g) store a retrievable manifest and archive; (h) distinguish `Built` from `Distributed`.

Published content online, approved content, and already installed ZIPs are **different states**. Strapi/other CMS release UIs offer useful readiness patterns but do not automatically guarantee a pinned downloadable application snapshot. No app can withdraw a previously downloaded offline package without an additional distribution/update policy.

### 5.4 Content and experience responsibilities

| Rapid Medical provides / approves | Product / UX designs and verifies |
|---|---|
| Approved instructional text, procedural labels/order, media, captions if needed, source IFUs and warnings | Reader hierarchy, playback, navigation, warnings presentation, stage/overview UX |
| Exact model/variant/handle/market combinations and applicability | Package-aware selection, visible context, unavailable states |
| Source-based device attribute values and approved comparison claims | Compare entry/exit, A/B presentation and comprehension testing |
| Roles, actual approval authority, destination users, OS/browser/IT policy | Task-based editorial UI, traceable workflow, prototype tests, compatibility verification plan |
| Consent/rights/ownership for case or media assets | Media library interaction, impacts and release/error-recovery design |

**Not a client UX questionnaire:** do not ask Rapid Medical to choose whether Compare is two columns, where the stage rail belongs, or what navigation should look like. Those are product-design hypotheses to test.

## 6. Reconciliation log: contradictions and how the active baseline resolves them

| Earlier ambiguity or conflict | Decision for v0.4 | Status / provenance |
|---|---|---|
| July 10 narrative stages vs October 8 stage cards | Opening + 8 *procedural* stages + Closing; section types model the difference | C: structural; final labels/order from client |
| July `Combination Therapy` vs October `Aspiration & combination technique` and other wording | Preserve semantic-stage mapping; **do not** manufacture final medical labels | C: editorial discrepancy open |
| July model inventory includes T17U; October displayed 13/17/21/25 | T17U stays an unconfirmed inventory variant, not a learner-facing release by inference | C/P: client confirmation needed |
| New T13 described as MeVO/distal in July; US public regulatory/website context differs | Never infer globally applicable indication; exact approved market × variant governs content | P: regional fact input remains open |
| 'Ultra' model naming vs handle mechanism | Model/variant and handle mechanism stored separately | P/D: approved naming from client pending |
| One market selector before every course vs pre-scoped ZIP | Package-aware adaptive entry; no redundant market step in single-market ZIP | D: validate |
| Learn mode vs Quick Reference as separate applications | One course representation with sequential and direct stage entry | D: validate |
| Full 10-page guide vs 8-tab interface | 8 core stages are prominent; intro/outro optional framing; future program lengths data-driven | C/D |
| Compare as an aspirational add-on vs first-class capability | Include handle/same-stage comparison in first **prototype**; model comparison when structured facts exist | C/D: production content gate |
| Difference summary as automatic text diff | Differences are client-authored/approved; full instructions remain accessible | D: safety-oriented design invariant |
| `Draft` vs `Published` vs shipped content | Use **Draft vs Included in release vX** for comparison with actual offline baseline | O/D |
| CMS-level release vs static offline ZIP | ReleaseManifest must pin all revisions and media files; online CMS publication alone is insufficient | O/T |
| Reusing an asset automatically across devices/regions | Require exact approved applicability and impact review | D: proposed content safety safeguard |
| Desktop web prototype assumed to run from `file://` | Offline ZIP launch requires real platform spike; browser/local-server/wrapped desktop options remain open | T: not resolved |
| Marketing site `Product overview` pages copied as lesson navigation | Take **content types**, not tab structure, clinical claims or promotional text | P/D |
| Development phase names (T13/17 first; T21/25 later) shown as training steps | Rollout is editorial/development readiness only; not learner procedure navigation | C/D |
| Proof-of-concept scope treated as full product scope | Proof-of-concept slice distinguished from production tooling; obtain explicit scoped estimate for production | Project constraint; no fabricated hours |

## 7. Consolidated priorities and scope gates

| Capability | P0 — Concept + technical proof | P1 — First operational release | P2 — Only if needed |
|---|---|---|---|
| Learner entry, overview, stage reader | Working clickthrough with synthetic/client-approved media | Fully offline, validated target platforms, all released content | Progress/analytics if brief expands |
| Intro/outro and device reference | Include if content provided; contextual blocks | Source-approved and versioned | Rich hot-spot authoring |
| Handle / same-stage Compare | Working A/B with safe sample content | Include only approved eligible pair(s) and both local assets | Semantic video synchronization |
| Model Compare | Structured sample attributes; explicit no-data states | Only approved comparable values in chosen market | Broader comparison catalog |
| Studio | Minimal task-oriented editor and shared preview | Managed drafts, assets, applicability, impact, approvals, export | Generic flexible page builder not planned |
| Release workflow | Demonstrate candidate manifest and local ZIP **feasibility** | Freeze, validate, build, audit, archive and distribute ZIP | Automated update channels |
| Editorial comparisons | Draft vs last released screen | Reliable field impact and shipped-baseline preview | Rich release-to-release visual diffs |
| Governance | Fake/synthetic roles for design experiments | Permission model matched to actual staff and sign-off | Complex approval/signature chains |
| Platform | Test real `file://` and alternative packaging on target OS | Supported offline delivery path with bundled video | More environments only with justification |

**Scope safeguard:** The earlier proposal is not evidence that a full self-service studio, custom content governance, build pipeline and supported offline distribution are included in it. Do not commit to production scope/effort before the technical spike and content audit.

### Candidate implementation slice for the first prototype

1. `L0/L1` package-aware entry and overview (single market, one or two known configurations).
2. `L2` Stage Player (a fixed Tigertriever example with 8 semantic stages, intro/outro slots, media/text/warnings).
3. `L3` Compare for the same semantic stage with two fully labelled sides and independent playback.
4. `S1` Catalog & Coverage; `S2` Lesson Editor; `S3` Impact & Draft-vs-Release Preview; `S4` Release Center.
5. A **minimal offline packaging spike**: test bundled local video, navigation, and both compared configurations on actual target machines.

## 8. Decision register: fixed constraints vs working design choices

| ID | Decision / hypothesis | Class | Evidence | Validation / owner |
|---|---|---|---|---|
| D01 | Rapid Medical owns approved clinical content | Fixed responsibility | C | Client confirms approval contacts |
| D02 | UX team owns IA, UI and evaluations | Fixed responsibility | Brief | Designer executes |
| D03 | No inferred cross-market content substitution | Fixed safety guardrail | C/P/D | Test invalid scope case |
| D04 | Exact configuration and release context is visible | Fixed design requirement | C/P/D | Comprehension task |
| D05 | Adaptive entry using package manifest | Working recommendation | IA alternatives/D | First-click study |
| D06 | One stage renderer: direct + sequential entry | Working recommendation | C/R/O | Find-stage task |
| D07 | Eight Tiger procedure stages with typed intro/outro | Working source interpretation | C | Check approved program source |
| D08 | Stage media and text visually associated | Working recommendation | R/O | Low-fi comprehension test |
| D09 | Desktop stage rail; narrow-screen collapsed index | Working layout hypothesis | O/D | Compare layouts |
| D10 | Compare entry from overview and stage | Working recommendation | C/D | Discovery/return task |
| D11 | Two-column independent-video Compare desktop | Working layout hypothesis | R/O/D | Compare vs guided summary |
| D12 | A/B vs stacked on narrow screens | Unresolved design hypothesis | D | Test alternatives |
| D13 | Compare pair requires explicit eligibility | Fixed content-governance requirement | C/D | Missing B scenario |
| D14 | Model comparison only for approved comparable fields | Fixed data constraint | C/P | Coverage check |
| D15 | Supplemental resources contextual not top-level by format | Working recommendation | P/O/D | Find-reference task |
| D16 | Program-first Content Studio | Working recommendation | C/O/D | 2–4 editor tasks |
| D17 | Impact review before changing shared media | Proposed required workflow safeguard | C/O/D | Replace-video task |
| D18 | Draft, Approved, Released, Distributed separate | Fixed conceptual invariant | O/T | State comprehension |
| D19 | Editor preview uses learner renderer | Working requirement | O/D | Compare actual offline output |
| D20 | Immutable per-release manifest/snapshot | Fixed technical contract | T/O | Deterministic rebuild test |
| D21 | Standalone ZIP packaging path TBD | Open technical decision | T | Compatibility spike |
| D22 | Marketing/site facts not automatic medical guidance | Fixed sourcing boundary | C/P | Content intake audit |
| D23 | Release phases kept out of clinician navigation | Fixed IA principle | C/D | Review stage sitemap |
| D24 | No scope claim from the earlier proposal for production system | Fixed project constraint | Project | Re-estimate after P0 |

## 9. Validation plan: what happens after desk research

**These are primary UX tests or engineering investigations, not more secondary desk research.** Recruit access from Rapid Medical only when needed; the designer writes the tasks and methods.

### 9.1 Learner protocol (suggested 5–8 physicians if accessible; directional, not statistical)

| Task | Candidate comparison | What to observe / possible failure |
|---|---|---|
| L-T1. Locate specified device + market training | Adaptive entry vs fixed market-first | Wrong market/handle selection, first click and confidence |
| L-T2. Find and revisit `Deployment` | Exposed stage rail vs compact index | Backtracks, incorrect stage, time-to-content |
| L-T3. Compare two eligible handle configurations | Parallel full stages vs Differences First | Correctly identifiable *approved* differences, context recall, warnings noticed |
| L-T4. Exit comparison | Overview entry vs Stage entry | Return to original configuration/stage |
| L-T5. Unavailable pair | Explicit unavailable message | False inference of equivalence / incorrect fallback |
| L-T6. Narrow-screen comparison | A/B switch vs stacked | Misattributing text/video to wrong configuration |

### 9.2 Editor protocol (suggested 2–4 actual staff users)

| Task | What to observe / failure |
|---|---|
| E-T1. Replace one `Deployment` video used by multiple configurations | Impact list understood before applying change |
| E-T2. Identify what is currently in released ZIP vs a new approved draft | Status confusion, unintended publication assumption |
| E-T3. Preview a change and compare with shipped version | Correct device, market and lesson in each preview |
| E-T4. Complete missing handle media and enable eligible Compare | Accidental auto-eligibility or source reuse |
| E-T5. Attempt build with an unresolved required item | Understand blocker and recovery path |
| E-T6. Download release and identify its version/contents | Recognize `Built` versus actually `Distributed` |

**Measures:** first click and route, correct target identification, wrong-context errors, successful recall of target model/handle/market, warnings noticed, completion without help, qualitative think-aloud, correct interpretation of release states. Do **not** invent numerical success thresholds without a reasoned severity protocol and stakeholder agreement. Use synthetic clearly marked nonclinical examples or client-authorised materials only.

### 9.3 Technical verification track

- Obtain factual deployment target: Windows/macOS versions, browser(s), hospital IT policy, allowed executable/package types, network and file-download constraints.
- Run exact extracted-ZIP tests for local HTML import/module behavior, page navigation, video playback/codec, captions, media paths, persistent state, and both A/B assets with network disabled.
- If local-file browser constraints block functionality, compare a packaged desktop wrapper and an approved alternative without assuming local server installation is allowed.
- Verify build snapshot reproducibility, missing-media blocking, and checksum/manifest correctness. No claim of compliance is made by this test alone.

### 9.4 Gate to move into design

Desk research supports **beginning low-fidelity concept development now**. It does not support finalizing the interaction design without testing. Before production sign-off, there must be (a) approved content/configuration mapping, (b) task-based comprehension checks for high-risk screens, (c) verified offline packaging on target systems, and (d) credible project scope.

## 10. Information needed from Rapid Medical, without delegating UX decisions

**Factual input only:** current valid device/variant/handle names and relevant SKUs; exact approved regulatory market/country scopes; current IFU/media versions; approved stage names/order; which new-handle footage is now available; whether comparison notes and pairings may be published; approved warnings/specification fields and their provenance; actual editors/reviewers and sign-off; distribution method and hardware/browser constraints; whether the separate short WhatsApp video is an independent deliverable.

**Never ask the client to choose UX patterns** such as sidebar vs stepper, dual video vs A/B, whether the editor has a split preview, or how to label navigation. Design those options, test them, and bring a reasoned recommendation.

## 11. Research closure audit

| Research workstream | State at v0.4 | Remaining work type |
|---|---|---|
| Client context and source comparison | Desk synthesis complete; source conflicts recorded | Current factual confirmations from client |
| Learning science and comparative cognition | Targeted review complete, transferable findings qualified | User study, not another broad literature sweep |
| Visual UX benchmarking | Six groups reviewed at accessible evidence level | Optional authenticated screen recordings |
| Learner IA alternatives | Three architectures compared; one recommended | Tree/first-click tests |
| Compare architecture | Six tasks defined; presentation hypotheses recorded | Prototype/comprehension tests |
| Admin UX workflows | Three architectures compared; program-first recommended | Editor usability tasks |
| Region/product content taxonomy | Model and market dimensions defined conceptually | Approved applicability and specs from client |
| Offline technical feasibility | Risks documented, **not validated** | Device/browser technical spike |
| Production scope and estimate | P0/P1/P2 delineated, **not priced** | Technical scoping and estimate |

**Definition of 'desk research complete':** sufficient secondary evidence exists to justify a first set of UX concepts and explicit validation questions. It is *not* a claim that every ambiguity is resolved or that source material is ready for medical publishing.

## 12. References — APA and source provenance

### Project sources (internal; not clinical approvals)

Rapid Medical. (2026, July). *Tigertriever interactive training webpage: Content draft v0.10* [Internal draft; for review].

Rapid Medical. (2026, October). *Tiger Device Stages: Interactive training wireframe* [Unapproved HTML concept].

Rapid Medical UX/Product Design. (2026, October–November). *Tigertriever training platform: Desk research addenda 01–06; IA alternatives; product definition v0.3.4* [Internal working synthesis].

### Selected external references (verified originals; 2 November 2026)

Directus. (n.d.). *Content versioning*. https://directus.com/docs/guides/content/content-versioning

Dozuki. (n.d.). *Version control management page*. https://apidocs.dozuki.com/Help/Version_Control_Management_Page

Gentner, D., & Markman, A. B. (1994). Structural alignment in comparison: No difference without similarity. *Psychological Science, 5*(3), 152–158. https://doi.org/10.1111/j.1467-9280.1994.tb00652.x

Moran, K., & Dykes, T. (2024, February 9). *Comparison tables for products, services, and features*. Nielsen Norman Group. https://www.nngroup.com/articles/comparison-tables/

Payload. (n.d.). *Drafts*. https://payloadcms.com/docs/versions/drafts

Payload. (n.d.). *Live preview*. https://payloadcms.com/docs/live-preview/overview

Payload. (n.d.). *Versions*. https://payloadcms.com/docs/versions/overview

Rapid Medical. (n.d.). *Large vessel stroke: TIGERTRIEVER* [US product site; marketing/product information, not IFU]. https://us.rapid-medical.com/lvo

Rapid Medical. (n.d.). *Medium vessel stroke* [International site; marketing/product information, not IFU]. https://ous.rapid-medical.com/mvo

Rey, G. D., Beege, M., Nebel, S., Wirzberger, M., Schmitt, T. H., & Schneider, S. (2019). A meta-analysis of the segmenting effect. *Educational Psychology Review, 31*, 389–419. https://doi.org/10.1007/s10648-018-9456-4

Schneider, S., Beege, M., Nebel, S., & Rey, G. D. (2018). A meta-analysis of how signaling affects learning with media. *Educational Research Review, 23*, 1–24. https://doi.org/10.1016/j.edurev.2017.11.001

Strapi. (n.d.). *Releases*. https://docs.strapi.io/cms/features/releases

**Further sources:** The existing Learning & Comparison Evidence, Visual UX Benchmarking and foundational 187 KB research report retain their detailed bibliographies. Findings from those reports are not recast here as independently revalidated evidence unless supported by a linked primary source.