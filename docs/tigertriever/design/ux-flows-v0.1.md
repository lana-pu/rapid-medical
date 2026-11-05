# Rapid Medical — Training App UX Flows and Test Script v0.1
Date: 2026-11-05 | Status: first design concept

## F01 — First encounter with a known device (P01, R01)
**Trigger:** Physician follows a representative's training session or opens an offline program. Device is known before opening.  
**Path:** Package opens → if one approved config, go straight to Course Overview; otherwise choose exact market/config → read exact config → Start training → Stage 1 → Next stage → Overview.  
**Critical state:** Persist selected device, handle and market. Opening and Closing are optional framing, not numbered procedural stages.  
**Test observation:** wrong-config selections; orientation; recognizing stage index; returning to overview.  
**No clinical testing claim:** The exercise checks navigation, not medical competence.

## F02 — New versus legacy handle (P02, R02)
**Trigger:** Someone with prior Tiger 13 exposure explores a distinct handle variant.  
**Path:** Catalogue / Overview / Stage Player → Compare handles → select a common stage → inspect two clearly labeled panels → independently control media → browse another stage → Exit to exact origin.  
**Failure branch:** Comparison pair not explicitly eligible → explain unavailable, not recommend another pair. One side's approved media absent → blocker/no substitution; both safety areas still show placeholders.  
**Critical state:** Compare opens to *same semantic stage* when invoked from stage; on Exit the previous config and stage are restored.
**Test observation:** ability to distinguish A/B; noticing variant and missing content; unwarranted inferred equivalence; return-to-origin.

## F03 — Quick stage retrieval (P03, P08)
**Trigger:** User wants a known training step and not the full sequence.  
**Path:** Overview / Stage / navigation → Quick Reference → type part of stage name → open exact Stage Player → optionally back to overview.  
**Critical state:** No duplicate library; output is the same lesson/same warnings as guided path. Keyboard Esc closes overlay.  
**Test observation:** number of actions to access stage; error rate; confusion between stage names.

## Alternate entry paths
- Single-course package: bypass catalogue; show Overview.
- Multiple configurations: show catalogue; preserve exact config throughout.
- Multiple regulatory markets: show explicit market selection only when multiple approved market scopes actually exist. Demo uses fictional Market A/B and is not an example of clinical jurisdiction handling.
- Tiger 17 demonstration config: no approved paired handle in sample; show unavailable Compare state.
- Prototype missing media: Stage 7 new-handle video is intentionally missing to test fallback expectations; this is a *mock test fixture*, not a clinical content assertion.

## Prototype evaluation script (not a medical skills test)
1. **T1.** Start in Multiple configurations. Locate the Tiger 13 new-handle course, open Device preparation, go to Deployment and return to overview. Ask: which model/handle is active?
2. **T2.** From Stage 3 open Compare. Identify configuration A and B, pause each independently, change shared stage selector to Retrieval (Stage 7), interpret missing material, then exit. Ask: what does missing mean?
3. **T3.** From Overview use Quick Reference and search “Retrieval.” Observe whether user can navigate without starting at Stage 1.
4. **T4.** Change demo package to Single course. Observe whether skipping the catalogue is understood.
5. **T5.** Narrow the viewport to mobile width and try the two-panel Compare. Record readability and lost-context errors.

## Heuristic acceptance checks for this concept
- No route from learner screens recommends a device for a patient/anatomy.
- Current model/handle/market remains visible in Overview, Stage and Compare.
- One shared Stage Player is reached by guided and quick routes.
- Compare is context-preserving, with independent media controls, explicit labels and no silent fallback.
- Mandatory warning area is part of full stage and each compare side; future design must contain approved text.
- Opening/Closing do not appear among eight procedural-stage numbers.
- Unavailable media clearly says “not provided” rather than “equivalent.”

## Out-of-scope next slice
- Content Studio screens: Catalogue/Coverage → Lesson Editor → Impact Review/Draft vs Released → Release Center.
- All interactions with authentic client media and release files.
- Production responsive/accessibility review and hospital offline launch spike.

## Open questions for marketing or content owners (not UX design delegation)
- SCOPE-01: Exact final Option #3 commitments for interactive new-handle demonstration and Quick Reference wording.
- MED-02: First approved device/handle/market pairing matrix and permission to compare.
- MED-05: Which differences may appear as approved learner-facing comparison summaries?
- MED-06: Which stage videos, warnings and captions will be supplied for each configuration, and availability schedule?
- OPS-01/02: Target hospital OS/browser and exact distribution/opening workflow.
- SCOPE-03: Whether Opening/Closing and separate WhatsApp output are part of the contracted deliverables.

## Source inventory
- Rapid Medical. (2026, July). *Tigertriever Training Webpage Content Draft v0.10* [Internal draft, FOR REVIEW].
- Rapid Medical. (2026, October 14). *Tiger Device Stages* [Concept HTML wireframe].
- Rapid Medical UX/Product Design. (2026, November 5). *MVP Definition v0.7; Final Research Synthesis v0.4; JTBD Map v0.1* [Internal working documents].