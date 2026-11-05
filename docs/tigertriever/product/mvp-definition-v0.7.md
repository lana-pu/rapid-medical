# Rapid Medical — JTBD-to-Feature Traceability & MVP Definition

**Version:** 0.7 · **Date:** 5 November 2026  
**Status:** UX/product-design recommendation, not a signed scope, regulatory approval, development estimate or clinician-validated requirements.

## Executive summary

We audited **57 feature entries** from *Feature Inventory Audited v0.6.1* against **19 evidence-informed JTBD** from *JTBD Map v0.1*. Every job currently has at least one feature mapping (**19/19 coverage**), but mapping is not proof of actual user value. Product features were scoped into **UX prototype**, **operational release**, **follow-on** and **commercially unresolved** decisions.

**Recommendation:** Design and test two connected *vertical slices*: (1) a small physician-facing offline learner journey including a single approved legacy/new handle comparison and quick stage lookup; (2) an editor journey updating one shared video, inspecting impact, previewing draft vs released, and seeing release readiness. Verify offline technical feasibility before promising the architecture.

The **operational MVP** is different: a robust downloadable guide and usable Content Studio that can publish complete, approved, versioned offline bundles. The two-environment product should not be silently redefined as a static microsite. Neither the full 57-feature inventory nor the minimum production platform can be presumed included in the historical proposal.

## 1. Evidence and ownership

* **Client source:** July 2026 Tigertriever content draft is marked FOR REVIEW. It records physician audience, representative-led and direct use, 10 narrative sections (Opening + 8 procedural stages + Closing), short text plus play/pause video without audio narration, handle variants, material readiness, and a proposed short WhatsApp video.
* **Client source:** October 2026 wireframe contains eight procedural stage labels, market/device/handle concepts, Tiger 13/17 then 21/25 rollout, and a conditional Europe/Tiger 13 prerequisite placeholder; it is **not** a binding UX design or clinically approved guide.
* **Scope:** Option #3 Interactive Learning Tool was selected in correspondence. Its itemized, final approved implementation scope is **not available** to this audit; Quick Reference and interactive knob behavior must be checked against that document.
* **UX ownership:** we define IA, flows, comparison layouts, editorial interface and testing. Rapid Medical supplies and approves medical text/media, market applicability and scope facts. Marketing is the only direct stakeholder contact currently available, and is a proxy for user context, **not physician validation**.

## 2. JTBD coverage assessment

The **initial** feature map lacked explicit links for representative jobs R01 and R02. These were repaired by connecting them to existing stage-learning and Compare capabilities; no extra feature was invented. The **revised** feature map contains no completely unmapped job. Its core reliance is not uniform: some candidate jobs (e.g., supporting evidence discovery or broader model comparisons) map mainly to enhancements. No job's frequency, importance, success threshold or scenario has been measured with Tigertriever physicians.

| JTBD | Actor | Job | First prototype features | Other mapped features |
|---|---|---|---|---|
| P01 | Physician | Orient to an unfamiliar Tigertriever configuration | L-03, L-04, L-06, L-07, L-09, L-10, L-22, L-24 | X-02, X-03 |
| P02 | Physician | Learn what changes when a handle/device variant changes | C-01, C-02, C-03, C-05, C-06, C-08, C-09 | C-07, L-23 |
| P03 | Physician | Revisit one known stage efficiently | L-06, L-08, L-10, L-21 | L-19, L-20 |
| P04 | Physician | Follow a facilitated device-training session | L-08, L-09, L-21 | L-14, L-20 |
| P05 | Physician | Trust applicability and provenance of the educational material | L-02, L-03, L-04, L-05, L-11, L-12, L-13, C-09, L-22 | — |
| P06 | Physician | Inspect a device feature in context | — | L-15, L-17, L-23 |
| P07 | Physician | Find supporting evidence without confusing it with procedural guidance | — | L-16, L-18 |
| P08 | Physician | Review materials independently after a session | L-01, L-24 | L-14, L-19 |
| P09 | Physician | Compare two eligible models by the same meaningful attributes | C-01 | L-16, C-04 |
| R01 | Representative | Conduct a coherent physician training session | L-06, L-08, L-09, L-10, L-21 | — |
| R02 | Representative | Explain a permitted difference accurately | C-03, C-05, C-06, C-09 | — |
| R03 | Representative | Deliver a functioning offline training package | L-01, L-02 | X-03 |
| R04 | Representative | Support follow-up learning | L-01, L-21 | X-01 |
| E01 | Content editor | Replace a source asset with known scope | A-02, A-03, A-05, A-20, A-21 | A-19 |
| E02 | Content editor | Reuse content without overextending applicability | A-01, A-04, A-05, A-14 | — |
| E03 | Content editor | Review changes against what was actually shipped | A-06, A-07, A-08, A-09, A-14, A-16 | A-18 |
| E04 | Content editor | Publish a complete, traceable offline release | A-08, A-09, A-10, A-11, A-12, A-16 | A-13 |
| E05 | Content editor | Add a new approved device variant efficiently | A-01, A-20, A-21 | A-15 |
| E06 | Content editor | Correct previously distributed materials | — | A-13, A-17, A-18 |

## 3. MVP is a sequence, not one oversized feature list

| Slice | What it tests / delivers | Exit criterion |
|---|---|---|
| **S0 — Technical feasibility spike** | One bundled page with text/video and one compare pair; opens fully offline on actual target device. One simple admin data-to-bundle build. | Offline ZIP opens after extraction, no remote requests, media works, two side files available. |
| **S1 — Learner concept prototype** | Single-market sample: two Tiger 13 handle configurations; Training Overview; named stages; independent video; Quick Reference direct stage access; same-stage comparison; unavailable state. | Physician/rep can identify exact config, reach stage, navigate A/B safely and return to origin. |
| **S2 — Editor concept prototype** | Update one shared Stage video, see affected configurations, draft vs released preview, validation blockers, Release Center states. | Editor can identify affected variants, see what changed and why export is blocked. |
| **S3 — Operational MVP candidate** | Real offline learner for agreed configurations plus authenticated Content Studio with explicit approval, immutable release and download; limited compare pairs. | Exported package works independently of admin, approved media resolved by exact config, old releases unchanged. |
| **S4 — Extensions** | Broader model compare facts, optional explainer, evidence resources, auto release diff, extended roles, hosted learner, WhatsApp artifact if commissioned. | Defined separately if scope confirmed; no implied commitment. |

**Design prototype boundary:** Low-fidelity and/or clickable flow with plausible placeholder data and one expressly illustrative device pair. It demonstrates behavioral rules; it is not medical training software and cannot be distributed to physicians as approved content.

**Operational release boundary:** Hosted authenticated Content Studio, content status/approval, usable media editing and preview, explicit applicability, release readiness, frozen release manifest, and a tested ZIP containing full offline videos and approved comparison resources. This is an engineering scope requiring its own estimate and distribution validation. The eventual first release should only contain models, markets, comparisons and assets Rapid Medical can approve.

## 4. Feature decisions that must remain visible

| Feature / issue | Decision | Boundary |
|---|---|---|
| Quick Reference | **Keep as core job.** One-tap access to any stage is sufficient for the first prototype; a separate mode is not currently warranted. | Check wording in Option #3. |
| Handle Compare | **Core**, supported by client concept. Start with one explicitly approved pair. | No inferred clinical differences, no unreviewed fallback media. |
| Same-stage compare entry | **Show** in UX prototype as design-derived extension. | Not claim as separately signed client scope. |
| Model vs model specification compare | **Follow-on candidate**, unless client needs it in first contracted release. | Client-approved comparable facts by market required. |
| Interactive T13 precision-knob control | **Commercial scope question.** | Passive animation does not satisfy interactive behavior. |
| Eight procedural stages + framing | **Core IA.** | Opening/Closing are framing, not extra procedure steps. |
| Regional prerequisite content | **Conditional on clinical approval.** | Do not publish anesthesia placeholder as actual instruction. |
| Responsive design | **Core UX principle** on agreed target screens. | Hospital environment and device matrix still need confirmation. |
| WhatsApp video and hosted learner webpage | **Separate unresolved deliverables.** | Neither silently included nor silently removed from client brief. |
| Content Studio self-service & frozen offline export | **Core operational product**, complex to implement. | Needs separately planned development, not assumed within original PO. |
| Tiger 17U and Tiger 21/25 | **Explicit coverage tracker / expansion**. | Data readiness and rollout distinct from learner stage navigation. |

## 5. Feature specifications and testable examples

### FS-01 · Offline learner boot (L-01)

**Jobs:** P08; R03. **Expected behavior:** Open extracted approved course without runtime internet  
**Acceptance example:** Start package on agreed hospital target machine, disconnect Wi-Fi, reopen; all required media + compare work  
**Dependency / boundary:** Target OS/browser matrix still unknown  
**Questions:** OPS-01; OPS-02; OPS-03.

### FS-02 · Exact configuration and market context (L-04/L-05)

**Jobs:** P01; P05. **Expected behavior:** Present only eligible model/handle/market choices, and keep current context visible  
**Acceptance example:** No unapproved configuration or silent other-market fallback; user can identify scope on every lesson  
**Dependency / boundary:** Client supplies approved configuration matrix  
**Questions:** MED-01; MED-02.

### FS-03 · Overview + Quick Reference (L-06/L-08/L-21)

**Jobs:** P01; P03; P04. **Expected behavior:** One overview supports Start Training and direct jump to named stage  
**Acceptance example:** Choose Deployment directly, arrive at correct variant and return to overview  
**Dependency / boundary:** Separate Quick Reference mode not required  
**Questions:** SCOPE-02; UX-02.

### FS-04 · Stage Player & accessible media (L-09/L-10/L-14)

**Jobs:** P01; P03; P04. **Expected behavior:** Video/illustration beside brief, approved instruction; play/pause/replay; captions when supplied  
**Acceptance example:** Stage correct media plays locally; controls work with keyboard; no unrequested clinical voiceover  
**Dependency / boundary:** Client provides appropriate clips, captions, text  
**Questions:** OPS-06; MED-06.

### FS-05 · Safe lesson context (L-11/L-12/L-13)

**Jobs:** P05. **Expected behavior:** Display context + applicable required warnings; no-asset states explicit  
**Acceptance example:** When media unavailable, do not substitute or imply equivalence; warnings remain visible  
**Dependency / boundary:** Medical approval needed for text and source warnings  
**Questions:** MED-04; MED-06; UX-07.

### FS-06 · Legacy/new handle Compare (C-03/C-05/C-06/C-09)

**Jobs:** P02; R02. **Expected behavior:** Two approved target configs aligned to same stage; separate controls; source labels  
**Acceptance example:** User can distinguish both variants, independently replay clips and see missing-pair blocker  
**Dependency / boundary:** One approved compare pair and two approved stage videos  
**Questions:** SCOPE-01; MED-05; MED-06.

### FS-07 · Contextual Compare entry (C-01/C-02)

**Jobs:** P02. **Expected behavior:** Enter from overview or the current stage; return to origin after exit  
**Acceptance example:** Compare opens the same semantic stage; exit returns to same model/stage context  
**Dependency / boundary:** Same-stage entry is design extension, not independently signed scope  
**Questions:** MED-05; UX-03.

### FS-08 · Structured lesson/media editing (A-02/A-03)

**Jobs:** E01. **Expected behavior:** Editor modifies text/media via bounded form, not page builder  
**Acceptance example:** Editor replaces a stage clip and previews same UI as learner  
**Dependency / boundary:** Editor training access and media rights from marketing  
**Questions:** ED-01; ED-07.

### FS-09 · Applicability + impact review (A-04/A-05)

**Jobs:** E01; E02. **Expected behavior:** Show explicit config reuse and affected lessons before applying shared change  
**Acceptance example:** Changing shared video displays exact impacted configs, with no automatic propagation to unapproved config  
**Dependency / boundary:** Client confirms media reusability applicability  
**Questions:** ED-02; ED-03; MED-02.

### FS-10 · Preview and draft/released review (A-06/A-07)

**Jobs:** E03. **Expected behavior:** Preview draft exactly in learner renderer against published snapshot  
**Acceptance example:** A changed clip visible in draft, old released snapshot unchanged; comparison clear  
**Dependency / boundary:** Automated textual diff can be deferred  
**Questions:** ED-05; UX-06.

### FS-11 · Review/approval states (A-08/A-09)

**Jobs:** E03; E04. **Expected behavior:** Saved/Draft, In Review, Approved, Released must be semantically distinct  
**Acceptance example:** An unapproved lesson never appears in exported release  
**Dependency / boundary:** Approval roles/process require marketing confirmation  
**Questions:** MED-08; ED-04.

### FS-12 · Release validation and immutable package (A-10/A-11/A-12)

**Jobs:** E04. **Expected behavior:** Block invalid bundle; build and download versioned offline package  
**Acceptance example:** With missing paired clip export is blocked; approved snapshot is frozen and works offline  
**Dependency / boundary:** Do not treat ZIP generation as included in the original PO  
**Questions:** OPS-05; ED-06; MED-08.

### FS-13 · Catalog extensibility and filming readiness (A-20/A-21)

**Jobs:** E05; E01. **Expected behavior:** Add new device without hardcoding stage count; show stage asset readiness  
**Acceptance example:** A new variant can be created without silently reusing unsupported content; missing footage shown  
**Dependency / boundary:** Initially Tiger 13/17; later 21/25 stated in client concept; 17U uncertain  
**Questions:** SCOPE-07; SCOPE-08.

### FS-14 · Responsive learning and comparison (L-24/C-08)

**Jobs:** P01; P02; P08. **Expected behavior:** Usable stage player and explicit A/B labels on approved target widths  
**Acceptance example:** No hidden warnings at narrower widths; focus and active variant obvious  
**Dependency / boundary:** Do not assert phones required until client confirms targets  
**Questions:** SCOPE-05; UX-03.

### FS-15 · Conditional prerequisite content (L-22)

**Jobs:** P01; P05. **Expected behavior:** Optional pre-stage content available only for approved configuration/market  
**Acceptance example:** Prerequisite does not appear for other configurations; no clinical claims from placeholder  
**Dependency / boundary:** Client must approve anesthesia precursor content  
**Questions:** SCOPE-06.

### FS-16 · Interactive knob demonstration (conditional) (L-23)

**Jobs:** P02; P06. **Expected behavior:** Controllable demonstration if explicitly commissioned and client supplies correct movement/content  
**Acceptance example:** Prototyped separately from passive video; no simulated clinical action claimed  
**Dependency / boundary:** Commercial scope/animation assets unresolved  
**Questions:** SCOPE-01.

### FS-17 · Separate hosted learner / WhatsApp outputs (conditional) (X-01/X-03)

**Jobs:** P08; R04. **Expected behavior:** Track as distinct distribution outputs, not silently part of offline package  
**Acceptance example:** Separate contract and acceptance path if needed  
**Dependency / boundary:** Not in signed scope based on available evidence  
**Questions:** SCOPE-03; SCOPE-04.

## 6. Marketing meeting — only questions they can answer or route to an authority

1. **SCOPE-09** — Can you share the exact Option #3 accepted proposal/PO scope and exclusions? *Why:* Must distinguish accepted concept from contracted deliverables.
2. **SCOPE-07** — Which models, handle variants and markets must ship first, and is 17U included? *Why:* Limits first release and comparison pairs.
3. **SCOPE-08** — Which videos are available, pending review or still to be filmed for each stage/configuration? *Why:* Determines playable and comparable stages.
4. **SCOPE-02** — What was promised by Quick Reference — direct stage access, separate export, or separate mode? *Why:* Ensures functional client request is preserved.
5. **SCOPE-01** — Does approved Option #3 include an interactive T13 knob mechanism demonstration, or is it optional? *Why:* Interaction is different from a passive explainer.
6. **SCOPE-03** — Is short WhatsApp video a separate delivery expectation or outside this phase? *Why:* Explicit July brief, unclear final contract.
7. **SCOPE-04** — Is there also a hosted learner-facing webpage or only offline learner + online admin? *Why:* Changes hosting and distribution architecture.
8. **SCOPE-05** — Which target devices/browsers matter for the first release (hospital desktops, tablets, phones)? *Why:* Needed for offline spike/responsive scope.
9. **MED-05** — Who supplies and clinically approves precise compare-ready media/pair differences? *Why:* Safe comparison must not infer medical equivalence.
10. **MED-08** — Who can approve training content and authorize a new downloadable release? *Why:* Defines status/permission workflow.

## 7. What can start without waiting

- Prepare learner UX prototype: choose eligible product/market, overview, direct stage access, media-first instruction, explicit warnings/status, same-stage handle comparison.
- Prepare editor UX prototype: update a source video, see all affected configurations, approve/preview, validate and simulate a frozen export.
- Document an offline technical test on real hospital machine/browser constraints; do not assume local `file://` works.
- Ask marketing for facts/source files and the signed scope; keep physician jobs marked unvalidated until usability testing after design.

## 8. Sources and references (APA-style)

Rapid Medical. (2026, July). *Tigertriever Training Webpage Content Draft* (v0.10, FOR REVIEW) [Internal client draft].

Rapid Medical. (2026, October 14). *Tiger Device Stages* [Client HTML wireframe].

Rapid Medical. (2026, October 9). *Interactive Learning Tool, Option #3* [Approval context reported in project correspondence; final approved line-item scope not available].

Rapid Medical UX Research. (2026, November 2). *Evidence-Informed JTBD Map* (v0.1) [Internal research synthesis].

Rapid Medical UX Research. (2026, November 2). *Feature Inventory & Client Request Audit* (v0.6.1) [Internal working workbook].

Rapid Medical UX Research. (2026, November 2). *Final Research Synthesis* (v0.4) [Internal research report].