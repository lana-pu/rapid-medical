# Rapid Medical · Active Product & UX Baseline
## v0.4 — 2 November 2026

**Authority:** This short active baseline and the full `01_Final_Desk_Research_Synthesis_v0.4.md` govern **current UX design choices**. The full v0.3.6 source report preserves earlier research and alternatives, some of which are historical or superseded. **No medical facts or procedural instructions have been signed off in this document.**

### What we are building

- **Learner:** an offline, downloadable reference/training interface for physicians, with approved pre-scoped device configurations, a procedural course and contextual comparison.
- **Editor:** online, task-oriented Content Studio for client-supplied medical text and video, approval, preview, impact review and versioned offline export.
- **Design responsibilities:** UX research, IA, user flows, navigation, Compare UX, Content Studio UX, usability and accessibility testing.
- **Rapid Medical responsibilities:** clinical/regulatory source and approval, current product/market/handle eligibility, media, warnings, sourcing, rights and distribution constraints.

### Current learner sitemap

`Package → [market if needed] → [device/variant/handle if needed] → Overview → Stage Player ↔ eligible Compare`; `About Release` and contextual resources accessible throughout. Tigertriever source draft: eight procedural stages, with Opening/Closing as framing if approved. No distinct guided/self-service modes, no model-selection advice.

### Current content model

`Family → Model → Variant → Configuration(market, handle) → Program → Sections/semantic stages → Approved lesson & asset revisions → Immutable release manifest`. Comparison pairs are approved explicitly. Regions are not synonyms for public website domains.

### Current Compare types

Learner: Handle A/B, Model attribute comparison, Same Procedural Stage. Editor: Draft vs **last included in release**, Release vs Release, Regional Coverage. Two complete, unambiguously labelled sets of source content; no inferred differences, no automatic synchronization and no hidden mandatory warnings. Model-specific comparisons require actual approved comparable fields.

### Current studio sitemap

`Catalog & Coverage → Lesson Editor → Impact Review / true learner preview → Approval → Release Center → History`. Media and Comparisons as secondary destinations. A shipped ZIP is a frozen snapshot; `Draft`, `Approved`, `Built` and `Distributed` are distinct.

### Status of major choices

| Item | Status |
|---|---|
| Responsible parties and medically sourced material only | Fixed product constraint |
| Strict approved market/device/handle context; no fallback | Fixed product constraint |
| Package-aware adaptive entry | Working recommendation; test |
| Same reader for sequential and direct access | Working recommendation; test |
| Eight core procedure stages plus framing intro/outro | Working source interpretation; confirm final titles |
| Compare first class; desktop parallel and mobile alternatives | Working design hypothesis; test |
| Program-first studio with impact review | Working recommendation; test |
| Frozen release snapshot and offline self-contained media | Technical contract; verify in spike |
| Packaging implementation and complete production estimate | Unresolved; do not promise |

### Immediate UX handoff

1. Prepare low-fidelity concept variants for **Overview, Stage Player, Compare**.
2. Prepare **Catalog/Coverage, Lesson Editor, Impact/Preview, Release Center** concept screens.
3. Validate selection/context, stage lookup, compare correctness and editor effect understanding with task-based studies.
4. Test the extracted offline bundle on client-authorized target OS/browser machines before choosing packaging architecture.

### Factual inputs only

Approved models, market/handle applicability, content/revision IDs, stage names, required media and warnings, sanctioned compare pairs, actual distribution environment, approver roles and delivery scope. The client does not need to design the UX.