# Rapid Medical — UX Audit, Mobbin Pattern Review & Flow Redesign

**Date:** 5 November 2026  
**Prototype audited:** `RapidMedical_UX_Prototype_v01.html`  
**Revised concept:** `RapidMedical_UX_Prototype_v02.html`  
**Stage:** Exploratory heuristic audit / comparative pattern scan. **No physician usability testing.**

## Executive assessment

**The v0.1 issue is not missing features; it is the wrong information hierarchy.** The prototype exposes a generic application shell and repeats affordances across the global menu, top-level overview, stage index and Quick Reference overlay. The learner's cognitive task—recognize the device, find the procedure stage, consume the media+instruction pair and compare handles—gets diluted by redundant interface structure.

The revised concept v0.2 simplifies the interface into a deliberately task-focused flow:

`Choose device → Select handle (only when relevant) → Overview → Stage viewer → Compare current stage → Return to the exact source stage`

Quick lookup operates from the global Find Stage button without becoming a second content library; opening a stage from the overview uses the same viewer. The mobile comparison displays one pinned A/B configuration at a time rather than two long stacked lessons.

**Evidence boundary:** Mobbin results are generic learning, product comparison and navigation examples, not validated medical-device comparisons. The Mobbin connector supplied canonical screen and flow links and previews in its app gallery; complete authenticated interactions could not be independently tested. Cross-domain transfer remains a **UX hypothesis**. Our own v0.1/v0.2 artifacts were inspected in desktop/mobile browser screenshots and tested for key transitions.

## Reference scan: what to borrow and not to borrow

| Pattern question | Mobbin reference | Transfer to Rapid Medical | Explicit non-transfer |
|---|---|---|---|
| How does a user enter a course and orient? | [SuperHi — Starting a course](https://mobbin.com/flows/80c1b317-2806-4e4a-b2a5-b5b652a2db6f) | One clear program entry; learner sees sequence and can enter it | Enrolment/paywall or generic learning analytics |
| How is the learning sequence kept accessible? | [Uxcel — Starting a lesson](https://mobbin.com/flows/2eedd9fc-eec6-444c-820e-f8e2e53df6f9); [Uxcel — Lesson detail](https://mobbin.com/flows/dfc9a583-d2ba-4bc1-a71d-e33a5b73e04c) | Explicit local stage navigation, clear current step and continuity | Points, badges, quiz requirements |
| How does video relate to curriculum? | [MasterClass — Starting a class](https://mobbin.com/flows/a6ebdb04-3a0e-4ff4-90af-af6b7ab53090); [Skillshare lesson screen](https://mobbin.com/screens/296cbc25-e43d-4a14-959d-ef91e20a46a5) | Give media the main visual area and put concise contextual material nearby | Autoplay and entertainment-style related videos |
| How are two alternatives explicitly identified? | [Apple Store — Comparing iPhone](https://mobbin.com/flows/023156de-ebb3-42d8-a96d-9c3f1eb08560); [Best Buy — Comparing products](https://mobbin.com/flows/d0eb0f71-211c-43f2-b007-74f94c80da33) | Shared comparison dimension and stable A/B identities | Price filters, purchase decision framing, hiding critical full instructions |
| How are comparison choices entered? | [Target — Comparing items](https://mobbin.com/flows/8b4bc165-6ace-41eb-ab0d-41f48896bee1) | Consider where a compare action is discoverable and how the origin can be recovered | Product-selection basket or shopping shortlist |
| How can a shortcut bypass a hierarchy? | [Superhuman Mail — Search/command screen](https://mobbin.com/screens/85dc5994-9360-428d-9092-7425e070ed7f) | Scoped stage search is an auxiliary route to the same stage page | Advanced command language and multiple overlapping navigation layers |

Relevant general-source guidance: Nielsen Norman Group, [Local Navigation Is a Valuable Orientation and Wayfinding Aid](https://www.nngroup.com/articles/local-navigation/), [Progressive Disclosure](https://www.nngroup.com/articles/progressive-disclosure/), [Breadcrumbs](https://www.nngroup.com/articles/breadcrumbs/). These support rationale, not a physician-specific usability claim.

## Screen-by-screen audit of v0.1 and v0.2 response

| Screen / state | Defect in v0.1 | Severity | v0.2 direction | Remaining validation |
|---|---|---|---|---|
| Catalogue | Tiger 13 new and legacy shown as independent peer cards; same model repeated; roadmap card competes with usable courses | High | Group by device model, expose exact handle options inside each model; defer roadmap | Are actual model names sufficient for recognition? |
| Overview | Three equal-level CTAs, giant repetitive Open list; Opening/Closing as a separate side panel creates fragmented reading | High | Primary Start, clearly secondary Compare, compact direct stage map; Opening/Closing editorial context only | Preferred grouping/order for intro and closing once assets arrive |
| Stage Player | App-wide sidebar duplicates local 8-step navigation; media compressed; high chrome-to-instruction ratio | High | Remove global sidebar; compact local stage rail + large video region + adjacent instruction | Does a persistent rail distract on hospital laptop sizes? |
| Quick Reference | A separate left-nav label suggests another library, when it is merely stage navigation | High | Scoped Find Stage accessible from header; opens exactly same stage viewer | Is search useful for just eight stages, or should cards alone suffice? |
| Compare | Two independent long lessons; lack of aligned difference structure; no clear first comparison target | Critical | Shared stage selector, difference matrix above media, stable A/B panels, independently supplied instructions | What *specific* differences should clinician focus on? Client supplies content, UX defines format |
| Compare on mobile | Stacked long videos make spatial comparison costly; A/B identity can scroll out of view | High | One active A/B panel at a time; paired stage remains fixed | Test A/B toggle vs short stacked aligned cards with users |
| Missing media | Prior prototype provided fake playback affordances for absent footage | High | Explicit media slot and missing-media message; do not simulate clinical playback | Ensure users distinguish asset unavailable from equivalent instructions |
| User return path | Exit Compare coded but not prominent enough to express exact return destination | Medium | Return to Step X / Overview label tied to origin | Confirm after multiple comparison-stage changes |
| Metadata / safety | Oversized mockup disclaimer competes visually with content; unsafe to omit entirely | Medium | Compact consistent demo disclaimer; production should show only real release/market applicability | Client to approve legal/medical text |
| Prototype tools | Test scenarios and package toggles placed in user-facing global navigation | Medium | Put scenario presets in small explicitly prototype-only footer | Remove entirely in production |

## Flow audit

### F1: First encounter, known model

**v0.1:** Programs → visually separate Tiger13 knob / Tiger13 slider cards → Overview → Start training → Stage1.  
**v0.2:** Choose model → choose relevant handle → Overview (one principal Start) → Stage1.  
**Why:** Hierarchy matches model → configuration; eliminates selection confusion. No clinical auto-recommendation.

### F2: Experienced user learning handle differences

**v0.1:** Stage3 → Compare Handles → two long independently read lessons → Stage selector → Exit.  
**v0.2:** Stage3 → Compare this step → same semantic step selected → short client-authored difference slots → aligned full A/B source panels → change common step → Return to Step3.  
**Why:** Recognizes job as *discover differences*, not merely *open two articles*. No inferred medical information.

### F3: Quick retrieval / returning to a known step

**v0.1:** Main menu Quick Reference vs same stage index vs Overview cards; competing pathways.  
**v0.2:** Overview stage map **or** Find Stage → same Stage Player and context.  
**Why:** Direct route avoids duplicate content/product modes. The search is optional and scoped.

### F4: Narrow viewport comparison

**v0.1:** Entire A and B stacked sequentially, with labels far apart.  
**v0.2:** A/B tabs show one complete paired source at a time while preserving the common step and difference summary.  
**Trade-off:** Higher recognition clarity vs additional visual-memory demand. Requires moderated comprehension testing.

### F5: Missing media or unsupported variant

**v0.1:** Video placeholder with Play demo, making absence ambiguous; unsupported pair not always clearly explained.  
**v0.2:** Explicit empty state without fake playback; no substitution. Unsupported pair's Compare control disabled with explanatory text.  
**Trade-off:** Do not hide required instructions or warnings when one media asset is unavailable; do not ship incomplete packages as if approved.

## Design decision list

**Adopt for next iteration**: group configurations under model; remove general sidebar; local 8-stage rail; one content renderer for sequential and direct access; sticky contextual device/handle identity; explicit compare origin/return; stage-aligned A/B comparisons; no clinically meaningful generated content.

**Prototype hypotheses**: compare difference summary before complete instructions; persistent stage rail vs compact dropdown; mobile A/B vs stacked; scoped search for eight stages; show exact handle identity on every content view.

**Marketing-only factual questions:** exact first-release model/handle/market matrix; which comparative claims are permitted; which stages have clips for each variant; whether Opening/Closing and WhatsApp output are included; distribution target; original Option #3 commitments. These were already captured in the project questions register; do not ask marketing to choose UX layouts.

## QA performed on v0.2

- Open grouped model and exact handle, enter programme overview, open Stage3: successful.
- Open Compare from Stage3 and verify stage selector starts at Stage3: successful.
- Change comparison to Stage7; verify explicit missing video label: successful.
- Exit Compare after changing stage; returns to original Stage3: successful.
- Use search to open Retrieval directly: successful.
- Mobile A/B focus, one visible comparison source: successful.
- Desktop and mobile horizontal overflow: absent at tested widths (1365px and 390px).
- Browser JavaScript errors in tested flows: none.

**Caveats:** The prototype contains no real video, no offline bundle generator, no approved clinical text and no content administration. This is usability concept exploration, not shipping functionality or validated accessibility.

## References (APA)

Nielsen Norman Group. (2021). *Local navigation is a valuable orientation and wayfinding aid*. https://www.nngroup.com/articles/local-navigation/

Nielsen, J. (2006). *Progressive disclosure*. Nielsen Norman Group. https://www.nngroup.com/articles/progressive-disclosure/

Nielsen Norman Group. (2018). *Breadcrumbs: 11 design guidelines for desktop and mobile*. https://www.nngroup.com/articles/breadcrumbs/

Rapid Medical. (2026). *Tigertriever Training Webpage Content Draft, v0.10* [Internal draft].

Rapid Medical. (2026). *Tiger Device Stages* [Client wireframe].

Mobbin. (n.d.). *SuperHi, Uxcel, MasterClass, Apple Store, Target and Best Buy interaction flow records* [Design reference collection]. Individual canonical screen/flow links in the reference table above.