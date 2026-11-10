# Tigertriever Training Tool — UX research & prototypes

**Status:** design exploration · **Updated:** 2026-11-08 · **Product:** independent offline physician training app + online Content Studio.

This folder contains the UX work for the **Tigertriever interactive learning tool**. The learner tool stays a separate product from the **Rapid Medical website** in `src/`, but both live in this repository because their users overlap and they will share one admin (entry point, then a choice of website or training tool). No website app code, deployment configuration or existing GitHub Pages files have been changed by this contribution.

> **Not clinically approved.** Prototype copy is illustrative. Rapid Medical owns and approves all training instructions, procedural media, device facts, regional applicability, comparative content, and clinical/regulatory statements. Layouts, navigation and comparison interactions are UX hypotheses pending testing.

## Start here

| What | File |
|---|---|
| Content Studio prototype (editor side, v0.1, updated 2026-11-08) | [prototypes/content-studio-v0.1.html](prototypes/content-studio-v0.1.html) · content model: `../spec.md → Инструмент Tigertriever` · what the client specified: `../memory/findings/client-brief-lesson-content.md` |
| Latest learner prototype (v0.5: programme panel and resume, text follows the clip, compare mode with play-both and point-aligned slider) | [prototypes/training-app-v0.5.html](prototypes/training-app-v0.5.html) |
| Previous learner prototype (v0.4) | [prototypes/training-app-v0.4.html](prototypes/training-app-v0.4.html) |
| Previous learner prototype (v0.3) | [prototypes/training-app-v0.3.html](prototypes/training-app-v0.3.html) |
| Previous learner prototype (v0.2) | [prototypes/training-app-v0.2.html](prototypes/training-app-v0.2.html) |
| First learner prototype (v0.1) | [prototypes/training-app-v0.1.html](prototypes/training-app-v0.1.html) |
| Current product/UX baseline | [product/active-product-ux-baseline-v0.4.md](product/active-product-ux-baseline-v0.4.md) |
| MVP definition | [product/mvp-definition-v0.7.md](product/mvp-definition-v0.7.md) |
| 57-feature inventory (Excel export) | [tables/feature-inventory.csv](tables/feature-inventory.csv) |
| 19 JTBD + their coverage | [research/jtbd-map-v0.1.md](research/jtbd-map-v0.1.md) · [tables/jtbd-coverage.csv](tables/jtbd-coverage.csv) |
| 63 open questions | [product/open-questions-register-v0.3.csv](product/open-questions-register-v0.3.csv) |
| Client-request audit | [tables/client-request-audit.csv](tables/client-request-audit.csv) |
| UX flow/screen map | [design/ux-flows-v0.1.md](design/ux-flows-v0.1.md) · [design/screen-map-v0.1.md](design/screen-map-v0.1.md) |
| Mobbin flow / v0.2 UX audit | [design/mobbin-flow-audit-v0.2.md](design/mobbin-flow-audit-v0.2.md) |
| Research synthesis | [research/final-desk-research-synthesis-v0.4.md](research/final-desk-research-synthesis-v0.4.md) |
| Full platform research notes | [research/platform-research-full.md](research/platform-research-full.md) |

The `tables/` folder contains **CSV exports of the worksheets** from *JTBD → Features → MVP v0.7*; the question register lives in `product/open-questions-register-v0.3.csv`. CSV files are suitable for tracking changes in Git but lack the styling of the original Excel workbook.

## Main flows covered in the learner prototype

1. Choose an eligible device / handle configuration.
2. Review the training outline; begin the full program or jump directly to one of the eight procedural stages.
3. View short video / image placeholders alongside on-screen instructional placeholders; navigate between stages.
4. Compare handles or equivalent stage material where content is explicitly available, including unavailable-media states, and return to the original lesson.
5. View the responsive narrow-screen compare mode.

**Implementation note:** These HTML prototypes are **standalone design demonstrations**, not a production offline package, a validated medical device training program, or a functioning Content Studio backend. An offline compatibility spike and clinician usability testing remain necessary.

## Client communication / research limitations

- Only the Rapid Medical marketing team is presently available for direct discovery; ask them for factual scope, current training workflow, media readiness, device applicability, workflow owners, regulatory review and distribution constraints.
- Clinician questions are kept in the questions register for **later task-based prototype evaluation**.
- UX decisions belong to the design team; marketing is not expected to design navigation, layouts or interactions.

## Public repository note

The repository is **currently public**. This upload contains our authored working UX materials and prototype placeholders; **raw internal Rapid Medical content drafts, original unapproved clinical instructions, source filming, and other unpublished client assets are intentionally not included**. Please review visibility before adding any of those source assets.

## Next steps

Review the v0.2 learner flow, test alternate Compare designs, prototype Content Studio and its release workflow, resolve client scope and media facts with marketing, and evaluate offline execution constraints on target hospital machines.
