# Rapid Medical · Tigertriever Training Platform
## Desk Research 06 — Admin UX, Content Workflows & Offline Release

**Date:** 2 November 2026  
**Version:** 0.1 — research synthesis and design recommendation  
**Status:** Working UX research; not an approved clinical, regulatory or technical implementation specification.  
**Builds on:** Project documentation v0.3.5, the July 2026 client content draft, the October client wireframe, two foundational research reports, the learning/comparison research and the IA alternatives study.

### Executive summary

The Content Studio should act as a **task-oriented editorial workspace for a small marketing/training team**, not as an unmodified headless-CMS database explorer and not as a free-form page builder. It has one central editorial question: **“What is changing, where will this approved material appear, and what exactly will ship?”**

**Recommended IA:** `Catalog & Coverage → Program/Stage Editor → Preview & Change Review → Release Center`, with a reusable Media Library, a Comparison Content section, and a lightweight Review Queue when required. A compact home screen can show outstanding drafts and blockers, but should not become a dashboard full of unrelated metrics. A release is a distinct operation from approving a lesson: the export must include a frozen set of exact content and media revisions, not pointers to whichever draft happens to be latest.

**Three essential design principles:** (1) preview actual learner output using the same lesson renderer; (2) reveal the precise configurations and approved comparison pairs affected *before* updating a shared media or lesson; (3) separate **Draft**, **Approved**, **Included in release**, and **Released** states. These are proposed safeguards, not independently validated guarantees that medical content is correct.

**Division of responsibility:** Rapid Medical produces, owns, and clinically approves medical text, videos, source materials, model/handle/market applicability and any curated comparison claims. Product/UX design owns the editor's IA, controls, layouts, terminology, preview behavior, error prevention, and usability testing. Ask the client for factual content and operational constraints, never for UX choices.

---

## 1. Questions, method, evidence standards

**RQ1.** What are the minimum mental-model objects for a nontechnical editor to update one procedure stage and understand reuse across variants?  
**RQ2.** How do existing editors separate draft, review, publication, and historical versions?  
**RQ3.** Which visual-preview and change-comparison patterns help users see the impact of edits without inspecting technical data structures?  
**RQ4.** How can a small team identify missing, wrong-market or wrong-handle assets before generating an offline ZIP?  
**RQ5.** What could be delivered as a compact initial product, and what should remain future functionality?

**Method.** Targeted desk research of current vendor documentation and accessible procedural-authoring help pages, interpreted against documented Rapid Medical content structure and two previous product research reports. This is **not** a field observation, comparative usability study, source-code evaluation, regulatory compliance audit, or systematic literature review. We did not access authenticated editor sessions for all products.

**Evidence key.** `[P]` = primary vendor documentation of a feature; `[C]` = client-supplied non-final content/requirements; `[H]` = UX design hypothesis; `[T]` = technical feasibility assumption requiring a prototype; `[OPEN]` = unknown operational fact. A vendor feature existing does not prove that its UI improves editor performance or that it fits our budget.

---

## 2. Focused editorial benchmarks

| Product / evidence | Observed or documented editorial pattern | Transfer to Rapid Medical | Boundary / limitation |
|---|---|---|---|
| **Dozuki** [P1, P2] | Version Control Management categorizes guides as `Never Released`, `Unreleased Changes`, `Current Release`; editors publish the `Head` version with release notes, and older versions can be restored. Dozuki approvals can require reviewer sign-off for guide releases. | A coverage screen that distinguishes absent training from current and changed content; release notes; explicit review before use. | Dozuki is a larger industrial platform; signatures, multi-stage approvals and training logs are not automatically needed in our MVP. |
| **Directus** [P3] | Published version is read-only; Edit switches to a draft. It retains revisions and supports previewing versioned content. | Strong distinction between already published material and working changes; reduce accidental edits to live versions. | Its data-oriented collection/item IA is less appropriate for a small nontechnical training editor without customization. |
| **Payload CMS** [P4, P5, P6] | Drafts and version history support diff, restore and access control; live preview renders the real frontend inside an iframe and can reflect unsaved changes. | One shared learner renderer; side-by-side published/draft comparison; save drafts without changing shipped packages. | Preview itself is not the same thing as validated offline `file://` output. Custom configuration and release logic remain. |
| **Storyblok** [P7] | Visual Editor toggles between form/preview, shows status of changed vs published, offers preview dimensions and field comments. | Structured fields alongside result preview; prominent change-state chips; simple responsive preview controls. | Free-form page blocks and page-oriented IA would add complexity not required for fixed training lessons. |
| **Strapi** [P8] | Release readiness includes `Empty`, `Blocked`, `Ready`, `Done`, with item-level repair; the release references content, not a pinned snapshot. | A concrete blocker list with direct links to missing stages/assets; Ready/Blocked wording. | **Do not inherit its reference-based snapshot behavior**: changing draft content after adding it to a batch changes what will publish. An offline package needs pinned versions before build. |
| **Sanity** [P9] | Releases can group documents, validate and preview their composed output; release previews can select perspectives. | Preview a *specific proposed release*, not just whichever lesson happens to be open. | Enterprise-plan capabilities; layered perspectives are too technical for initial Rapid Medical studio. |

**Benchmark synthesis [H]:** the studio should combine Dozuki's clear procedural documentation and release-status mental model, Directus/Payload's draft isolation and history, Storyblok's editor-preview spatial relationship, and Strapi's blocker-first release checking. These are patterns to evaluate, not an endorsement of any commercial CMS. The vendor evidence describes what the tools offer, not comparative usability results.

---

## 3. The editor's mental model: four questions, not seven database tables

The editor should always be able to answer:

1. **Where am I?** `Tigertriever → Tiger 13 → Europe → New Handle → Deployment`, plus whether looking at a shared lesson or a configuration-specific version.
2. **What is current?** Which content and media revisions are **already included in the last released ZIP**, as opposed to merely approved online.
3. **What will be affected?** Exact configuration-stage combinations and comparison views using this lesson or asset; which released packages remain unchanged.
4. **What prevents publication?** Missing approvals, unfinished media, invalid applicability, unavailable comparison side, absent local asset or unresolved reviewer feedback.

**Top-level editorial navigation [H]**

```text
Content Studio
├── Work queue             Recent drafts / needs review / blocked builds
├── Catalog & coverage     Product family → model → valid configuration → program
├── Media library          Client-uploaded videos, diagrams, images, documents
├── Comparisons            Approved A/B pairings, attributes and comparison notes
├── Release Center         Create → validate → preview → build → distribute
└── Release history        Manifest, files, change summary and status
```

**The primary work path is through Catalog → Program → Stage.** Media and Comparisons are contextual destinations with links back to the relevant lesson, not parallel separate training systems. Work queue is optional in the first slice; if it exists, show actionable items only (e.g. `3 drafts need review`, `1 release blocked`) instead of engagement dashboards.

**Navigation model [H]:** content hierarchy in a left rail; selected program/stage in the centre; lesson editor and preview in an adjustable split, with configuration/approval context in a compact right-side panel or collapsible section. Keep a persistent breadcrumb and a source/version badge. Do not show ten nested metadata selectors when the current context is fixed.

---

## 4. Workflow A — update one video without editing the clinical content

**Scenario:** Rapid Medical supplies an updated video for `Deployment`. It may be referenced by one or several exact model–handle–market configurations. The video itself is client-produced, not created in the studio.

```text
Catalog / search
   ↓ Select exact program and Stage 3
Stage editor (Published read-only → Create draft)
   ↓ Upload / choose client-provided media revision
Impact check BEFORE replacement
   ├─ Affect current lesson revision only
   ├─ Update shared material in specified configurations
   └─ Make configuration-specific copy if reuse no longer applies
   ↓ Save draft
Preview exact target config + preview Compare if affected
   ↓ Compare Draft vs Released + inspect changes
Submit for Rapid Medical content approval
   ↓ Approved revision ready for a release
Release Center → validate scope → freeze snapshot → build ZIP
   ↓ Download, offline test, archive/distribute
```

**Critical distinction [H]:** `Replace media in the draft` should produce a new asset revision. It must **not overwrite** the old binary already referenced by released packages or silently update every lesson that referenced an earlier version. If two configurations explicitly shared an approved lesson revision, the editor chooses the intended applicability of the new revision, which must be reviewed accordingly.

**Impact panel fields:** list of exact affected configurations, source lesson IDs, staged comparison pairs, current released media revision, new draft revision, and whether each entry is `Affected`, `Unchanged`, or `Requires separate approval`. This should be human-readable; no SQL, raw IDs or JSON diffs are required in the primary editor UI.

**Important:** the editor can initiate a draft using an uploaded asset that has not yet been medically approved. Such a draft stays visually marked as `Not approved` and **cannot** be included in the final release under the proposed controls. Preview is not approval.

---

## 5. Workflow B — add a new model/handle/market configuration

**Scenario:** another Tigertriever variant becomes content-ready. Public availability or a product's regulatory clearance is *not* sufficient evidence to publish training for it.

1. **Define source configuration:** choose family/model/variant/handle/approved market from client-provided facts. Do not infer `Ultra` always means a particular mechanism; product name, model variant and handle are distinct.
2. **Create program structure:** reuse the programme template (Opening/8 procedural stages/Closing where approved) without inheriting medical instructions by default.
3. **Attach approved content:** select existing lesson revisions only for configurations explicitly approved to reuse them. Otherwise create separate drafts. Show coverage at every stage.
4. **Inspect resources:** confirm media, captions where required, approved warnings, references and regions; show what is pending from client production.
5. **Compare eligibility:** a new configuration does not automatically become a comparison target. Comparison pairs require approved content for both sides and, where applicable, reviewed comparison claims.
6. **Release:** build only when all compulsory material for the chosen scope is present and approved. A partial model can be visible in the *editor* as a draft, but it must never appear as an available complete training programme in the learner package.

**Coverage matrix [H]:** rows = Opening, each semantic procedural stage, Closing and required resources; columns = exact configurations, optionally grouped by model. Cell states: `Not started`, `Draft`, `Awaiting approval`, `Approved`, `Released`; clicking a cell opens the corresponding lesson. A summary pill like `6/8 stages approved` is editorial readiness information, not physician progress.

---

## 6. Workflow C — draft, approval, release and offline distribution

### 6.1 Separate lifecycle states

| Object | Distinct states | Why separation matters |
|---|---|---|
| **Lesson/asset revision** | Draft → In review → Approved / Changes requested | Content can be edited and previewed without affecting a released package. |
| **Comparison pairing / note** | Draft → In review → Approved | Two individually approved lessons do not automatically establish every cross-device medical comparison claim. |
| **Release preparation** | Draft → Validating → Blocked / Ready → Building → Built → Distributed / Archived | A build includes a frozen source snapshot; `Built` doesn't prove users have received it. |
| **Existing offline copy** | Released version N, independently retained | Future revisions cannot replace already downloaded files without re-distribution. |

An organisation may use one person for editing and approval or multiple reviewers; this is a factual staffing/permissions question, not a UX-design decision. Do not assume mandatory digital-signature regulation or prescribe an approval chain without requirements.

### 6.2 Release Center screen and behavior [H]

**Step 1 · Define scope.** Show market/country applicability, exact configurations, programme version, included comparison pairings and estimated package/media size. When a single-market package is selected, all included comparisons must be valid for that market.

**Step 2 · Validate readiness.** List checks grouped by `Content`, `Applicability`, `Comparisons`, `Media`, `Packaging`, each with counts and direct action links. Show a blocker near the offending item, not a generic error toast.

**Step 3 · Preview release.** Use the **same lesson renderer as the offline app** and a **pinned manifest candidate**; preview exact configuration and same-stage comparison. Mark `Preview of release candidate — not distributed`. No clinical sign-off is inferred from preview.

**Step 4 · Freeze & build.** Create immutable manifest with exact lesson, warning, media, comparison and market applicability revision IDs; build the ZIP with only the approved selected assets. If edited after validation, mark validation stale and require re-validation or freeze the validated candidate consistently.

**Step 5 · Verify & distribute.** Display build date, version, scope, file size, checksum, download, change summary and explicit manual offline test instructions. `Built` and `Distributed` should not be conflated. A prior exported ZIP remains addressable and unchanged.

### 6.3 Blocking cases

| Blocker | Editorial feedback (proposed wording) | Recovery affordance |
|---|---|---|
| Stage has no approved required media | “Deployment is missing approved video for Tiger 13 · New Handle · Europe.” | `Open stage` / `View available assets` |
| Asset referenced but not packaged | “The selected video is not available in the offline build.” | `Open media record` |
| Source revision not approved for target | “Lesson is approved for US, not Europe.” | `Review applicability` |
| Comparison pair incomplete | “Cannot include Handle Comparison: approved Stage 3 content is missing for side B.” | `Open comparison` / `Exclude comparison` |
| Candidate changed after validation | “This release changed since the last check.” | `Validate again` |
| Unsourced difference note | “The comparison note has not been approved.” | `Open comparison note` |
| Failed packaging test | “The offline package could not be verified.” | `Review build details` / `Retry build` |

The exact warning text will be tested, but **do not auto-fix** wrong-device/market mapping with a different model's content. The editor may exclude an optional comparison if the rest of a valid release can still ship, with that exclusion reflected in the manifest and learner UI.

---

## 7. Editorial comparison: two distinct jobs

**Draft vs Released [P4/P6 → H]:** side-by-side same-stage preview using same viewport and exact model/handle/market. Show changed video thumbnail/duration, changed text, warnings, related assets and precise affected configuration list. Highlight modified fields, but do not present a generic raw diff as the primary experience. Label baseline **“Included in release vX”** when looking at actual offline shipped content; the most recently approved record is not necessarily the last shipped record.

**Release vs Release [P1/P8 → H]:** a human-readable summary of `Added / Removed / Changed` programmes, configuration scope, stage revisions, assets, comparison pairings, plus linked manifests and archived ZIPs. A row can expand into a stage preview. The baseline is a concrete archived ZIP manifest, not the live editor database.

**Safety invariants:** draft material may be previewed but never inserted into a distributed package without approval; comparing two versions does not approve either; essential warnings are visible in both variants; changing media for one configuration does not implicitly change the second. Cross-market differences are for editorial audit, not a default learner-facing comparison.

---

## 8. Three studio IA alternatives: comparative assessment

**A. Database-first CMS.** Top-level `Models`, `Configurations`, `Lessons`, `Assets`, `Approvals`, `Releases` correspond to tables. Benefits: conventional to developers, fast to scaffold. Costs: editors must reconstruct which resources belong to one stage; difficulty understanding the impact of a media change. **Not recommended as the primary editor surface.**

**B. Program-first studio (recommended).** Top-level Catalog/Coverage; choose configuration and program; stage opens structured editor with media and preview; release is a separate task with strong readiness checking. Benefits: closely reflects client's supplied eight-stage narrative, low navigation burden, and visible reuse. Costs: more custom UI implementation. **Best fit for small editorial team.**

**C. Release-first studio.** Work organised into release projects, with all content edits nested inside the planned next ZIP. Benefits: clear package scope; good for infrequent, coordinated batch launches. Costs: changing a single video becomes unnecessarily bureaucratic; risk of editing the wrong release context. **Useful as a separate Release Center, not as the whole app.**

| Evaluation criterion | A — Database first | B — Program first | C — Release first |
|---|---|---|---|
| Find a known stage | Indirect | Direct | Indirect |
| Understand configuration applicability | Requires joins/filters | Visible in context | Visible only inside release scope |
| Replace one media asset | Simple technically, impact unclear | Guided + impact check | Overly coupled to release |
| Preview exact learner screen | Add-on | Central | Usually at release level |
| Release readiness | Requires separate UI | Separate focused center | Naturally central |
| Implementation effort | Lower initial UI effort | Medium | Medium–high |
| **Research recommendation** | Do not lead with it | **Prototype first** | Use selectively |

This is a **qualitative design tradeoff matrix, not usability test data**. Implementation-cost ranks are relative hypotheses and must not be treated as detailed hour estimates.

---

## 9. First interface concepts to prototype

### S1 — Catalog & Coverage

- Filter/switch product family; scan models; see which exact market/handle programmes have draft, approved or released training.
- Main preview task: open `Tiger 13 → Europe → New Handle → Deployment` without inspecting raw technical data.
- Stage coverage grid uses status text/icon, never status color alone.

### S2 — Lesson Editor

```text
┌───────────────────────────────────────────────────────────────────┐
│ Tigertriever / Tiger 13 / Europe / New Handle / Deployment       │
│ Released: v1.2  • Working: Draft  • Affects: 1 configuration      │
├──────────────┬─────────────────────────────┬──────────────────────┤
│ PROGRAM      │ APPROVED CONTENT FIELDS     │ LIVE LESSON PREVIEW  │
│ 0 Opening    │ Title, short instruction     │ Actual media + text  │
│ 1 Prep       │ Required warnings            │ Warnings remain seen │
│ 2 Position   │ Video / asset revision       │ Model/market badge   │
│ 3 Deployment │ Supplementary resources      │ Desktop / mobile     │
│ 4 Clot       │ Applicability & impact        │ Draft watermark      │
│ ...          │ Source/reviewer metadata     │ Compare preview link │
├──────────────┴─────────────────────────────┴──────────────────────┤
│ Save draft           Preview changes       Submit for review      │
└───────────────────────────────────────────────────────────────────┘
```

- On narrower viewports stack form and preview with a persistent toggle. Do not force three cramped columns at tablet widths.
- The editor is a *fixed template* (the UX team determines layout), with bounded optional resource fields, not a content-block marketplace. Uploads are from Rapid Medical; editors do not generate medical text or videos inside the product.

### S3 — Impact Review / Draft vs Released

- Human-readable title: `This edit affects 2 training configurations and 1 comparison pair` (example data only).
- Show affected exact combinations; explicit checkbox/options to revise only one configuration or keep shared applicability *subject to source approval*.
- Same stage in both columns: `Released v1.2` and `Draft v1.3`, with media changed and accompanying instructions visible.

### S4 — Release Center

- Scope summary at top; readiness states `Blocked / Ready / Building / Built`; blockers sorted by actionable type.
- CTA changes with state: `Fix 3 issues` → `Build package` → `Download and test` → `Mark distributed`.
- Build's offline preview must resolve from the frozen candidate, not arbitrary draft or newest asset URL.

---

## 10. Test plan: what research cannot yet establish

**Participants (future UX testing):** 2–4 employees who will actually maintain Rapid Medical content, if available; experts can review realistic workflows, but this does not replace engineering validation. No need to ask the client which UI to design. Obtain non-sensitive sample assets if source content is restricted.

| Task | Observable success/failure | Hypothesis tested |
|---|---|---|
| E1. Find a known stage for the correct market/handle | Correct configuration chosen, number of detours | Program-first hierarchy is understandable |
| E2. Replace one shared video for one target only | Editor notices other affected configurations before save | Impact-before-edit prevents unintended cross-variant edits |
| E3. Find differences between shipped and draft stage | Can identify changed video/text/applicability; does not confuse approved with released | Side-by-side comparison reduces release uncertainty |
| E4. Attempt a build with one missing comparator video | Finds specific blocker and repair destination; knows what will be excluded | Blocker-first validation is actionable |
| E5. Review a release candidate with comparison content | Correctly identifies included markets/models/pairs and package version | Scope preview is understandable |
| E6. Archive a built package | Finds ZIP, version, checksum and change summary | Distribution artifacts are traceable |

**Observations:** wrong-market/handle selections, forgotten impact, whether draft is mistaken for shipped, inability to find a blocker, uncertainty about which ZIP was sent, navigation loops, and task completion. Do not invent a numerical pass threshold before testing.

**Engineering check (independent):** exercise one full vertical slice with client-safe sample video, two approved fictional configurations, one comparison stage and a locally opened ZIP; confirm no runtime network use and exact snapshot IDs, media and state. Do not treat an iframe preview as proof of standalone package compatibility.

### Explicit gaps

- Number of editors and actual role/approval rules; number of product and market variants to maintain.
- Quantity, format, dimensions and size of source videos; need for captions/transcripts supplied by client.
- Real cadence of content changes, package download/distribution and support policies for superseded offline files.
- Whether standalone browser-opened ZIP is allowed on managed hospital computers; OS/browser matrix.
- Frequency of partial releases and whether release scopes are single-country, multi-market or device-specific.
- No authenticated Dozuki/Directus/Payload editorial usability trials were performed; documentation covers feature behavior only.

---

## 11. Scope boundary and staged implementation

**P0 — coherent demonstration / prototype:** one catalog path; exact sample configuration; fixed eight-stage structure; a lesson form for uploaded text/video; preview with shared renderer; visible draft vs released status; one synthetic comparison example; manual/developer-assisted local ZIP build may be acceptable. Keep source content separate and marked nonclinical.

**P1 — operational Content Studio:** reusable media revisions, exact multi-configuration applicability and impact checking, real approval states, curated comparison pairs, release validation and ZIP generation, release history/manifest, authentication and basic permissions, supported cross-platform testing. Do not claim this complete production system fits the earlier $950 budget without a new scoped estimate.

**P2 — conditional advanced features:** granular field-level diff, workflow routing and notifications, controlled parallel localisation, release-to-release visual diff, bulk editing, automatic update distribution, complex inheritance, LMS assessments, training analytics, advanced asset transcoding. These are not required merely because commercial CMS products offer them.

**Key next step:** incorporate the studio mental model and acceptance tasks into final cross-report synthesis; then prototype screens S1–S4 and validate with editor task tests.

---

## 12. References (APA style; verified official documentation, accessed 2 November 2026)

[P1] Dozuki. (n.d.). *Version control management page*. Dozuki API Documentation. https://apidocs.dozuki.com/Help/Version_Control_Management_Page

[P2] Dozuki. (n.d.). *Approval processes*. Voron Design / Dozuki Help. https://voron.dozuki.com/Help/Approvals_Processes

[P3] Directus. (n.d.). *Content versioning*. https://directus.com/docs/guides/content/content-versioning

[P4] Payload. (n.d.). *Versions*. https://payloadcms.com/docs/versions/overview

[P5] Payload. (n.d.). *Drafts*. https://payloadcms.com/docs/versions/drafts

[P6] Payload. (n.d.). *Live preview*. https://payloadcms.com/docs/live-preview/overview

[P7] Storyblok. (2026, October 14). *Visual editor*. https://www.storyblok.com/docs/manuals/visual-editor

[P8] Strapi. (n.d.). *Releases*. https://docs.strapi.io/cms/features/releases

[P9] Sanity. (n.d.). *Content releases user guide*. https://www.sanity.io/docs/user-guides/content-releases

[Client] Rapid Medical. (2026, July). *Tigertriever interactive training webpage: Content draft v0.10*. Internal, preliminary client material.

[Project] Rapid Medical UX documentation team. (2026, October 18). *Tigertriever Training Platform: Complete UX research & documentation v0.3.5*. Internal synthesis, research and product design.