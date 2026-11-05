# Rapid Medical · Tigertriever Training Platform
## Desk Research Addendum 04 — Learning Experience & Comparison UX

**17 October 2026 · v0.1 · Research synthesis, NOT a final design or clinically approved guide**  
**Owners:** UX / Product Design  
**Source truth:** Rapid Medical creates and approves all device facts, procedural directions, warnings, comparisons and video. UX design owns navigation, lesson presentation, comparison interaction, hierarchy, design hypotheses and user testing. The July content draft and October HTML are not binding UX layouts.

---

## 0. Executive synthesis

This targeted review builds on the previous benchmark, product-definition and comparison documents. It does **not** repeat broad competitor discovery, does **not** claim a systematic search, and is **not** usability testing with Tigertriever physicians.

**Supported by research:** coherent segmentation, visibility of relevant visual-text links, and visual signaling have favorable learning outcomes in general multimedia research; a small surgical training experiment specifically reported lower *perceived extraneous cognitive load* after segmented video, but not better overall surgical performance. Comparing *structurally aligned* items helps expose differences in experimental psychology, and tailored comparative cases aided medical-student radiograph learning.

**Not established:** that any specific Stage Player layout improves real Tigertriever technique; that a pair of autoplaying videos is superior to a toggle; that the ideal number of video segments is eight; that automatic highlighting correctly interprets clinical differences; that this training intervention improves physician behavior or patient outcomes.

**Design implications now:** build a strong stage index with seek/pause/replay; pair approved text and the corresponding video element near each other; support client-provided pointers/labels or stills; make comparison align the same **semantic** stage and common attributes, not elapsed seconds; retain each column's configuration, source and mandatory safety content; independently play videos; reserve A/B switch, stacked view and side-by-side as alternatives for design-led testing.

**Research status:** focused evidence expansion completed for these questions; visual UX audit, end-to-end IA evaluation, editorial UX research, and offline technical POC remain outstanding. The **full desk research is not yet closed**.

---

## 1. Questions and methodology

Research questions:

- **LE1:** Does segmented rather than continuous presentation help learn complex procedures? What is the strength of the medical evidence?
- **LE2:** Does spatially coordinating visual media with corresponding words and annotations help comprehension? How should accessibility work for silent procedural videos?
- **CX1:** Does comparing structurally equivalent information help users notice differences? What evidence comes from medical training?
- **CX2:** How should device, handle and same-stage comparisons be represented? What may not be hidden or inferred?
- **UX1:** What design choices are sufficiently defensible to take into low-fidelity experiments, versus requiring user testing or client factual approval?

Approach: targeted literature and primary-source lookup of peer-reviewed meta-analyses, a surgical experiment, a radiology experiment, comparative-visualization taxonomies, a professional UX research source, Cochrane, and W3C guidance. Original article/publisher abstracts, PubMed records, accessible full text or primary research project pages were preferred over secondary paraphrases. Cross-check against prior Tigertriever research and our v0.3.2 documents.

Search themes used: `meta-analysis multimedia segmentation`, `surgical video step by step vs continuous cognitive load`, `signaling multimedia meta-analysis`, `spatial contiguity text pictures meta-analysis`, `case comparisons radiology learning`, `structural alignment difference detection`, `visual comparison juxtaposition superposition explicit encoding`, `comparison feature scanning user tests`, `WCAG video-only silent training`, `e-learning healthcare professionals Cochrane`. Exact database-wide hit counts, screening exclusions, and duplicate counts have not been recorded; do **not** describe this as PRISMA or a systematic review.

Evidence type key: **M** peer-reviewed meta-analysis/systematic review; **E** experiment in a specific context; **F** conceptual framework or visualization survey; **UX** reported usability research in adjacent markets; **STD** published accessibility standard/guidance; **CLIENT** Rapid Medical draft, descriptive only; **H** our hypothesis/inference. Confidence assessments refer to transferability to *design direction*, not clinical effectiveness.

---

## 2. Learning experience — findings and boundaries

### LE-01 — Meaningful segmentation and learner pacing [M]

**Rey et al. 2019**, *A Meta-analysis of the Segmenting Effect*: 56 investigations, 88 pairwise comparisons. In general multimedia-learning tasks, segmentation showed small-to-medium positive effects on retention and transfer, reduced cognitive load and increased learning time. Their moderator analysis also found greater retention benefit among participants with high prior knowledge than those with less; hence do **not** assume this pattern benefits novices exclusively. [1]

**Implication [H]:** separate the eight client-supplied core procedural stages into independently accessible lessons; allow pause/replay/seek; permit direct access without a mandatory linear progress gate. *Do not* assert that exactly eight chunks is scientifically optimal. The eight arise from client content structure, not research on memory span.

### LE-02 — Segmented surgical video, real but limited evidence [E]

**Nazari et al. 2020**, prospective randomized comparison, **43 medical students** in simulated open inguinal hernia repair (23 stepwise video, 20 continuous). Perceived extraneous cognitive load: 2.92 vs 3.91 on the measure used (`p = .030`). The **overall surgical performance difference was not statistically significant**. Fewer errors occurred in a selected 1–2-hour preparation subgroup; this should not be presented as the trial's main-outcome improvement. [2]

**Implication [H]:** prefer structured controllable clips over a long uninterrupted film for initial exploration, while acknowledging different task, novices and simulation context. A physician should be able to scan the sequence and immediately replay one stage.

### LE-03 — Video-supported surgical education is promising, not independently sufficient [M]

**Youssef et al. 2023**, systematic review of **22 studies**. Fourteen reported significant improvement in knowledge/skills; **none** satisfied every assessment-validity parameter examined and studies did not establish effects on patient outcomes. [3]

**Counterweight:** **Cochrane**, e-learning vs traditional learning among qualified healthcare professionals (16 studies, 5,679 participants), found little or no difference in some outcomes and **very uncertain** evidence for certain clinical-skills effects. This is a different intervention comparison and population, but prevents the overclaim that any digital training is categorically better. [4]

**Implication [H]:** our product is an accessible manufacturer educational reference, not an evidence-proven substitute for instructor-led training or approved IFU. Avoid badges or language implying mastery, clinical competency, or outcomes without validation.

### LE-04 — Spatial contiguity: connect captions and the relevant visual [M]

**Schroeder & Cenkci 2018** meta-analysis: 58 independent comparisons, `n = 2,426`, overall effect `g = 0.63` favoring integrated text/diagram arrangements (general educational settings, not specifically surgical video). [5]

**Implication [H]:** keep the instructional label, annotated view, and corresponding action together on stage pages; avoid splitting related information into distant panels requiring frequent gaze shifts. A long text sheet below a full-screen video is **not automatically optimal**. Test a side-by-side desktop arrangement against a video-first arrangement with adjacent text and clear markers.

### LE-05 — Signaling relevant visual elements [M]

**Schneider et al. 2018** meta-analysis of 103 studies, `n = 12,201`: positive signaling effects on retention (`g = 0.53`) and transfer (`g = 0.33`); visual cues also supported relevant attention and lowered cognitive-load measures. [6]

**Implication [H]:** support client-provided labels, pointers, hotspot overlays (if unambiguously connected to approved source), focus frames, and numbered correspondence between instruction bullets and parts of a diagram. This is a content **capability**, not a mandate for editorial staff to create new medical annotations; all medical meaning remains with Rapid Medical. Never replace textual identifier by color-only coding.

### LE-06 — Media accessibility when draft videos have no narration [STD]

Client July draft specifies short on-screen text and play/pause clips without voice narration. Under WCAG **1.2.1**, prerecorded **video-only** information should have an equivalent text or audio alternative unless already clearly offered as a media alternative for text. WCAG **1.2.2** addresses captions for **prerecorded audio** in synchronized media; it should not be incorrectly framed as requiring captions for a truly silent-only video. Provide operable player controls, text alternatives for instructional motion, and accurate visible instructions from supplied/approved content. [7][8]

WCAG **2.2.2** defines conditions for giving users pause/stop/hide control over automatically moving information; **1.4.1** prohibits color as the only means of conveying meaning. [9][10]

**Implication [H]:** accessible text/callout slots are first-class; controls have visible labels/focus; videos don't start simultaneously; warnings are not distinguished only by red. Accessibility conformance still requires an end-to-end audit and agreed WCAG target.

---

## 3. Comparison UX — findings and boundaries

### CX-01 — Structural alignment before highlighting differences [E/F]

**Gentner & Markman 1994** experimentally supported structural alignment in identifying differences among comparable word pairs: the common structure helps identify *alignable* differences. This is general cognitive psychology, not clinical-skill evidence. [11]

**Kok et al. 2015**, 84 medical students randomized into radiograph-comparison approaches; certain comparison groupings improved test efficiency. Eye tracking showed learners frequently compared *normal anatomy*, rather than necessarily the relevant pathological region. This suggests comparison goals and attentional direction matter. It does **not** establish that side-by-side handle videos outperform other UI for physicians. [12]

**Implication [H]:** Align the same stage ID and attribute rows with explicit captions, then optionally show a *client-authored* `Key differences` summary to direct attention. Do not automatically infer that an identical stage title means identical instructions.

### CX-02 — Three families of visual comparison, not just two columns [F]

**Gleicher et al. 2011**, survey/taxonomy of visualization designs: **juxtaposition** (side by side), **superposition** (overlay) and **explicit encoding** (show difference in a dedicated representation). Later reviews also treat **interchangeable** views (switching) as a relevant approach in certain visual domains. [13][14]

Transfer to this product [H]:

1. **Juxtaposition — desktop Side-by-side.** Persistent A and B configuration headings; the same semantic stage selected for both; independent media players and both complete instructions/warnings. Strong for direct inspection but potentially dense and reduces video size.
2. **Interchangeable — A/B switch.** One large video and full associated instructions; clearly labeled active variant, with stage retained on toggle. Suitable narrow-width *candidate*, but requires remembering the previous visual.
3. **Explicit encoding — curated differences-first summary.** Small shared comparison table/summary preceding paired lessons; category, stage and media provenance. Valuable for scanning, but **cannot replace** complete approved instructions.
4. **Superposition — overlay.** Possibly useful for exact diagram geometry if the assets and alignment are verified by Rapid Medical; **not recommended for primary procedural video in v1**, because differing camera angle/time can create misleading differences. No direct evidence of benefit for Tigertriever.

These are a framework for exploration, not measured winner/loser outcomes in this domain.

### CX-03 — Product comparison usability can inform scan patterns, not clinical decision support [UX]

**Baymard 2022** reported observation-based patterns in spec-heavy e-commerce comparison: hide identical noncritical attributes, group by category, keep column headers visible, and use row styling for scanability. [15]

**Safe translation [H]:** use common row labels, fixed A/B headers and grouping in **approved factual device specifications**. An `Only differences` filter may hide *nonessential comparable facts* but **never** an approved instruction, warning/caution, source/revision, market, or an unavailable-data disclosure. Omission of a value must not be interpreted as a match. No therapy or product recommendation UI.

### CX-04 — Semantic alignment is more defensible than timestamp synchronization [H]

Two clips with equal `00:30` offsets need not depict the same act. No retrieved study validates synchronizing different-handle training videos by wall-clock time.

**MVP interaction hypothesis:** a **shared stage selector** + independent clip transport controls. Optional event correspondence/semantic markers are future content metadata Rapid Medical would have to supply and approve. If side B lacks a comparable approved stage or media, show **Unavailable in this release** or an approved alternative media type; do not create a synthetic comparison from snippets.

### CX-05 — Current lesson and Compare are distinct modes [H]

The learner has one currently selected known device/handle/market. Opening Compare must not silently change that **primary context**. Enter from overview or lesson, choose an approved comparison target, exit exactly back to originating context. Market normally remains fixed for learner comparisons. Any editorial regional comparison belongs to Content Studio, where different jurisdictional content can be inspected deliberately.

---

## 4. Research-to-design evidence matrix

| ID | Evidence and strength | Design opportunity | Limitation / validation |
|---|---|---|---|
| LE01 | Meta-analysis, general multimedia; strong for segmentation [1] | Stage index; next/previous; user-paced replay | Optimal number/length of chunks unknown |
| LE02 | Medical procedural experiment n=43 [2] | Segmented surgical demonstration | Overall task performance not significant; different procedure |
| LE03 | Surgical video review + Cochrane healthcare review [3][4] | Video as supportive educational medium | No claim of superior clinical outcomes or replacing instruction |
| LE04 | Integrated words/images meta-analysis n=2,426 [5] | Visual/text contiguity, focus on relevant action | Direct responsive page layout remains untested |
| LE05 | Signaling meta-analysis n=12,201 [6] | Clear pointers, labels, related visual identifiers | Must use approved content, avoid gratuitous highlights |
| LE06 | WCAG guidance [7]–[10] | Text alternative, playback control, color-independent callouts | Formal compliance requires audit of implementation and source assets |
| CX01 | Alignment experiment + radiology experiment [11][12] | Same-stage A/B, aligned attribute names | Not direct proof for hand-operated device learners |
| CX02 | Comparison taxonomy survey [13][14] | Side-by-side vs A/B switch vs explicit differences | No ranking across layouts for our task |
| CX03 | Baymard UX research, other market [15] | Sticky headers, row groups, facts-only differences filter | E-commerce observation is not clinical safety evidence |
| CX04 | Analytical inference | Independent play; no time sync without semantic markers | Test comprehension and task time |
| CX05 | Product design hypothesis from client goals | Stable primary context / reversible Compare | Needs prototype task validation |

**Evidence tiers:** directional confidence in principle ≠ certainty of the resulting product UX. Client materials establish **intended content** (not approved clinical accuracy). No clinical terminology or instructions are authored here.

---

## 5. Concrete interaction alternatives to prototype

### Prototype A — Media-first Stage Player

- Stage title and context at top; central media; concise approved instruction immediately adjacent (desktop) or directly below (narrow width); always-visible warning; 8-step direct index; controls pause, seek and repeat.
- **Potential strength:** supports paced learning and visual priority.
- **Risk:** long video may push text away or warnings below the fold; media/text coordination may suffer.

### Prototype B — Aligned desktop Compare

- Same semantic stage title shared across A/B; persistent A and B config labels; each has its own media, instruction and warnings; optional approved differences summary; no autoplay; independent scrub.
- **Potential strength:** less memory needed to identify visible A/B differences.
- **Risk:** narrow videos and increased visual density; unclear correspondence if source footage is different perspectives.

### Prototype C — Narrow-width A/B Compare

- Persistent two-option A/B control and selected stage; only one fully labeled content pane visible at a time; explicit switching; playback paused/reset on switch; full warning retained per variant.
- **Potential strength:** one large readable video.
- **Risk:** user may forget first variant or believe toggle changes main course.

**Challenge alternative:** show two vertically stacked media+text cards at a time on smaller screens, especially if A/B cognitive switch cost dominates. Another option is **Differences First → Open full A/B lesson**. We have **no direct controlled study** ranking these for this project.

---

## 6. Evaluation design — UX team owns

### Participants

Seek 5–8 physicians familiar with device/procedural training for directional moderated usability work; ideally vary prior Tigertriever familiarity. If 5–8 is not feasible, start with design-team heuristic and synthetic walkthroughs, and explicitly state the evidence limits. Rapid Medical may facilitate recruiting and provide approved neutral practice assets, but **does not decide the UX**.

### Tasks (approved learning or synthetic nonclinical examples)

- **T1 Find and orient:** Given a known product/handle/market, open a named stage and report precisely which content variant is visible.
- **T2 Learn/review:** Watch a prescribed short clip, locate the explanation associated with a highlighted device part, replay that segment, and return to the stage list.
- **T3 Compare handles:** In A/B stage example, locate two *explicitly provided* differences; state whose instructions they belong to. Do not evaluate medical correctness from invented content.
- **T4 Compare missing data:** One variant has no approved video/summary; check whether users infer a false equivalence.
- **T5 Preserve context:** From stage enter Compare, switch comparison stage, exit; name main course currently selected.
- **T6 Narrow layout:** Compare A/B switch vs stacked view on mobile-sized screen; notice which is active and which warning applies.

### Measurements

Observe completion (with and without assistance), navigation path, wrong-variant selections, incorrectly attributed differences, missed warnings, comprehension of absence, time to retrieve known stage, required replays, subjective certainty and participant explanation. Compare alternative layouts on identical **nonclinical** content with task order counterbalanced if possible. Define clinical/user-acceptance criteria with the project team; do not invent thresholds or claim a powered statistical trial from five participants.

### Content and editorial dependencies, **not UX questions to client**

Client supplies: approved models/handles/markets, final stage content, correct captions/alternatives, valid comparison pairs, videos and source versions, warning text, authorized comparison summary if desired. Designers decide: whether comparison overview is separate, layout alternatives, entry hierarchy, spotlighting, controls and testing protocol.

---

## 7. Immediate updates to Product Definition and Comparison Spec

Treat these as **design hypotheses and requirements for evaluation**, not fixed visual mockups:

1. **Keep:** 8 core stage IDs as the current client taxonomy; Opening and Closing as separate framing materials. Neither eight nor ten is justified by the cited learning science; content source determines taxonomy.
2. **Prefer:** stage-first navigation with direct access and controllable media over progress-gated linear learning.
3. **Add explicit information relationship:** `approved instruction bullet ↔ relevant approved media/annotation` as a possible field, supporting signaling while avoiding design-generated clinical labels.
4. **Preserve:** each comparison side's exact config and applicable warnings; only approved comparable factual attributes can participate in differences-only filtering.
5. **Investigate:** diagram overlays only where source assets align; do not introduce medical-media auto-diff or video time alignment.
6. **Specify:** browser/keyboard-friendly media controls, silent-video text equivalents, labeled focus and color-independent warnings; exact WCAG level and audit scope pending.
7. **No premature feature expansion:** don't add guided test scoring, quizzes, clinical device selection, clinical decision support, or inferred equivalence.

---

## 8. Research work still open

- **Deep visual benchmark:** open and annotate actual learner and editorial screenshots, verify captured images and publication dates, map patterns to task structure rather than marketing visuals. Existing benchmark reports contain screenshots only validated from captions, not always directly opened.
- **IA comparison:** market-first vs model-first for single-market and multi-market offline packages; discoverability of stage and compare entry points.
- **Editorial UX:** actual replacement, approval, variant coverage and release workflow patterns; realistic task-based test of visual editing vs form-first editing.
- **Technical:** offline `file://` packaging and cross-OS browser POC with actual media, plus testing of compare bundle size.
- **Validation:** physician task tests for content scanning, comparison comprehension, warnings and navigation; approvals by Rapid Medical for clinical wording.
- **Documentation governance:** merge source matrix into final main desk-research synthesis; log duplicated sources and incompatible assumptions.

---

## 9. Primary sources and exact claims

1. Rey, G. D., et al. (2019). *A Meta-analysis of the Segmenting Effect*. Educational Psychology Review. 56 investigations, 88 comparisons; retention/transfer, cognitive load and learning time. https://doi.org/10.1007/s10648-018-9456-4
2. Nazari, T., et al. (2020). *One Step at a Time: Step by Step Versus Continuous Video-Based Learning to Prepare Medical Students for Performing Surgical Procedures*. Journal of Surgical Education. Randomized 43 students; lower perceived extraneous load; **overall performance difference nonsignificant**. https://pubmed.ncbi.nlm.nih.gov/32171749/
3. Youssef, S. C., et al. (2023). *Learning Surgical Skills Through Video-Based Education: A Systematic Review*. Surgical Innovation. 22 studies, 14 significant reported improvements; validity weaknesses and no patient outcomes. https://pmc.ncbi.nlm.nih.gov/articles/PMC10280671/
4. Cochrane (2018). *Is e-learning more effective than traditional learning for health professionals?* 16 studies, 5,679 participants; little/no differences for some outcomes, uncertain skills evidence. https://www.cochrane.org/evidence/CD011736_e-learning-more-effective-traditional-learning-health-professionals
5. Schroeder, N. L., & Cenkci, A. T. (2018). *Spatial Contiguity and Spatial Split-Attention Effects in Multimedia Learning Environments: A Meta-Analysis*. Educational Psychology Review. 58 comparisons, n=2,426; `g = 0.63`. https://eric.ed.gov/?id=EJ1186641
6. Schneider, S., Beege, M., Nebel, S., & Rey, G. D. (2018). *A meta-analysis of how signaling affects learning with media*. Educational Research Review. 103 studies, n=12,201; retention and transfer effects. https://www.sciencedirect.com/science/article/pii/S1747938X17300581
7. W3C WAI. *Understanding WCAG 2.2 Success Criterion 1.2.1: Audio-only and Video-only (Prerecorded).* https://www.w3.org/WAI/WCAG22/Understanding/audio-only-and-video-only-prerecorded
8. W3C WAI. *Understanding WCAG 2.2 Success Criterion 1.2.2: Captions (Prerecorded).* https://www.w3.org/WAI/WCAG22/Understanding/captions-prerecorded
9. W3C WAI. *Understanding WCAG 2.2 Success Criterion 2.2.2: Pause, Stop, Hide.* https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide
10. W3C WAI. *Understanding WCAG 2.2 Success Criterion 1.4.1: Use of Color.* https://www.w3.org/WAI/WCAG22/Understanding/use-of-color
11. Gentner, D., & Markman, A. B. (1994). *Structural Alignment in Comparison: No Difference Without Similarity*. Psychological Science. Comparison experiments with word pairs. https://doi.org/10.1111/j.1467-9280.1994.tb00652.x
12. Kok, E. M., et al. (2015). *Case Comparisons: An Efficient Way of Learning Radiology*. Academic Radiology. 84 medical students randomized to comparison approaches; eye tracking. https://pubmed.ncbi.nlm.nih.gov/26254543/
13. Gleicher, M., et al. (2011). *Visual comparison for information visualization*. Information Visualization. Comparison taxonomy: juxtaposition, superposition, explicit encoding. https://doi.org/10.1177/1473871611416549
14. Survey of 3D/4D comparison approaches (2017). *Comparison techniques utilized in spatial 3D and 4D data visualizations: A survey and future directions*. Includes interchangeable views in its taxonomy. https://www.sciencedirect.com/science/article/pii/S0097849317300481
15. Baymard Institute (2022). *4 Ways to Optimize the Comparison Feature for Scanning*. Observational UX findings from retail/spec comparisons. https://baymard.com/blog/user-friendly-comparison-tools