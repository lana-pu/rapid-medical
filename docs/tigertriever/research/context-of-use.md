# Rapid Medical — Context of Use & Learning Workflow Research

**Desk Research Addendum 02 · 17 October 2026 · Version 0.1**  
**Product:** Tigertriever Training Platform  
**Research status:** Secondary evidence and analysis. Not a usability study; no clinician interviews; no clinical or regulatory approval.  
**Related working documents:** Product Definition v0.2; Desk Research Addendum 01; Rapid Medical HTML wireframe (14 October 2026); *Tigertriever Training Webpage Content Draft v0.10* (July 2026, FOR REVIEW).

## 1. Executive findings

1. The **client's July content draft** gives considerably more precise user information than the initial HTML wireframe: **physicians** are the audience, both **rep-led** and **direct physician use** are intended, the on-screen content is **short text + play/pause clips with no narration**, a **short WhatsApp video** is also contemplated, and there are **10 programme sections** (Opening + eight core procedural stages + Closing). The October wireframe presents the eight central stages, not necessarily a contradictory procedure. The two source documents have not been reconciled with the client.
2. There are **two evidence-supported learning needs worth testing**: (a) structured familiarisation with a device alongside a facilitator or practical training, and (b) short self-directed review of a known technique. Research in thrombectomy training, other device training and just-in-time procedural review supports exploring both, but does **not** prove this specific app improves physician competence or patient outcomes.
3. The **new/legacy handle comparison** is no longer merely a speculative feature. The July draft identifies an old ratchet-slider handle across several models (including **T17U**) and a new **T13 precision-knob** handle, distinguishes shared versus differentiated sections, and marks several new-handle videos as unfilmed. The requested comparison interface requires *paired, approved assets* and must explicitly handle missing video, not automatically claim equivalence.
4. The **eight-stage index and full ten-part learning narrative** may coexist: show Opening / the eight steps / Closing in Learn, and put the eight procedural steps at the centre of the direct-reference navigation. Confirm the final editorial structure before treating this as a specification.
5. The **distribution environment** is not yet established. Limited hospital internet and mobile use are credible general contextual factors, but the exact machine/browser, network policies, active-procedure use, and standalone-file permission must be determined with Rapid Medical. **WhatsApp video** is a potentially separate publishing output, not automatically part of the offline HTML app.

## 2. Research question and method

**RQ:** Who uses Tigertriever educational material, for which tasks, at what moments, with which constraints, and what implications follow for navigation, comparison, media, content authoring, and offline distribution?

**Method:** Desk synthesis of two Rapid Medical client artifacts, existing research reports, peer-reviewed clinical/educational studies, professional training guidance, and FDA human-factors guidance. Sources are labelled:

- **CLIENT:** Direct but non-final information supplied by Rapid Medical. Strong evidence of *intended* functionality, not clinical validity.
- **PUBLISHED STUDY:** Direct evidence within the study's sample, procedure and outcome measure. Transfer to Tigertriever is uncertain.
- **PROFESSIONAL / REGULATORY GUIDANCE:** Contextual consideration, not necessarily legally binding on this educational product.
- **INFERENCE:** Proposed segment, behaviour or design decision for validation.
- **OPEN:** Not resolved by source material.

This is **not** a systematic review: searches were targeted, the coverage is incomplete, and no pooled effect size or clinical safety conclusion is asserted.

## 3. What the client has already specified

**Primary document:** *Tigertriever Training Webpage Content Draft v0.10* (July 2026), pp. 1–2, 13–14. Marked **FOR REVIEW — Internal Draft**.

| Topic | Client document states | Product implication | Open issue |
|---|---|---|---|
| Audience | Physicians | Physician-facing terminology and targeted tasks; avoid general-public educational framing | Specialty, degree of experience, first-use versus experienced users |
| Delivery | Rep-led **and** direct physician use | Both facilitator-led and independent entry points | Whether rep needs a presentation/presenter mode, and on what device |
| Format | Brief headline/bullets displayed beside play/pause clips; **no audio narration** | Media-first steps with legible text, silent operation | Captions or transcriptions for any supplied spoken clips; clip orientation/resolution |
| Course scope | 10 sections: Opening, eight procedure sections, Closing | Allow narrative framing + eight-step procedural index | What is the final authoritative course sequence? |
| Handle variants | Old ratchet-slider vs new T13 precision-knob; some stages identical, some different | Explicit content applicability; structured comparisons | Approved market/model/handle compatibility and comparative claims |
| Model list | T13 / T17 / **T17U** / T21 / T25 appear in old-handle grouping | Preserve T17U in source inventory; do not silently drop it | October HTML shows only T13/T17/T21/T25 — is T17U excluded, grouped or retired? |
| Media readiness | Existing old-handle clips; several new-handle T13 shots pending (especially stages 4, 7, 8) | Media coverage matrix; publication validation; comparison unavailable where assets incomplete | Which assets and filming are approved and scheduled? |
| Secondary output | “One short video that can be sent via WhatsApp” | Investigate short shareable video as a distinct deliverable | Is it a requirement, who generates it, length, markets, approvals? |

**Full July 2026 programme hierarchy** (labels are client source labels, not independently checked procedures):

| Course position | Source label | Proposed IA role |
|---|---|---|
| 1 | Opening | Intro / orientation |
| 2 | Device Preparation | Procedure stage 1 of 8 |
| 3 | Positioning | Procedure stage 2 of 8 |
| 4 | Deployment | Procedure stage 3 of 8 |
| 5 | Optimising Clot Interaction | Procedure stage 4 of 8 |
| 6 | Combination Therapy | Procedure stage 5 of 8 |
| 7 | Prepare to Retrieve | Procedure stage 6 of 8 |
| 8 | Retrieval | Procedure stage 7 of 8 |
| 9 | Between Passes | Procedure stage 8 of 8 |
| 10 | Closing | Summary / completion |

The October HTML calls core step 5 **“Aspiration & combination technique”**, while the July document calls it **“Combination Therapy”**. These should be treated as different working labels, not normalized without approval. The October HTML additionally has a conditional Anesthesia placeholder for Europe/Tiger 13. The July content draft does not establish its content or status.

**Do not publish procedural statements, safety advice, performance outcomes or trial statistics from this draft directly.** It is explicitly under review and must be checked against the approved market-specific IFU and clinical/regulatory sign-off.

## 4. Evidence from medical training and learning literature

### 4.1 Specialist foundational training is broader than our app

International multi-society recommendations for endovascular stroke intervention describe dedicated supervised neurointerventional training that includes stroke devices, catheter navigation, complication management and practical skill acquisition [S1]. **Implication:** Tigertriever Training Tool should act as device-specific *supplementary education*, not claim to qualify a physician for thrombectomy. Experience levels may still vary from fellows to established operators.

### 4.2 Hands-on training and facilitation cannot be substituted by video alone

A 2023 paper studying e-learning to operate a **syringe pump**, with two experiments among students, found improvement from certain structured combinations of digital and hands-on activity, while simple repetition did not uniformly improve performance [S2]. It supports offering usable pause/review points during trainer-led demonstrations; it does **not** prove identical effects for experienced neurointerventional physicians or intravascular devices. An endovascular-thrombectomy simulation systematic review also reports beneficial simulator-training results across a small, heterogeneous evidence base (eight included studies; three in meta-analysis) [S3]. Such simulation evidence must not be conflated with evidence for an informational video guide.

### 4.3 Targeted just-in-time refreshers can serve experienced clinicians

In a randomized simulation trial of a **transvenous pacemaker** placement aid, experienced emergency physicians with access to a portable just-in-time guide achieved better procedural checklist performance and fewer omissions in simulation; the guide included a brief video and stepwise checklist navigated with an assistant [S4]. This supports testing a concise quick-reference path alongside full instruction, without assuming active-case use or transfer to Tigertriever. Other just-in-time video studies in emergency procedures report similar proof-of-concept benefits for targeted reviews [S5].

### 4.4 Physician mobile use is real; the exact device environment remains uncertain

A 2023 systematic review reported increasing medical smartphone use, particularly among junior physicians [S6]. A 2023 scoping review found medical education and training among documented app uses and noted limited internet connectivity and privacy concerns as recurrent barriers [S7]. Neither establishes that Rapid Medical users want a smartphone ZIP, nor that offline local HTML works on managed devices. The July client request for a WhatsApp video is an indication of a *short mobile-distributable educational asset*, not direct evidence of a mobile-app requirement.

### 4.5 Context affects use error risk

FDA human-factors materials emphasise users, environments and interfaces, with examples of distractions, lighting, unfamiliar device versions, and workload [S8]. This is useful to frame observations (visibility of model/handle, context labels, warnings and revision state). The product's regulatory status remains **OPEN** and requires Rapid Medical regulatory review; do not extrapolate device legal obligations automatically to an external training website.

### 4.6 Compare mode should align like with like

Kok and colleagues' study with 84 medical students showed learning benefits of selected radiographic comparisons when aligned with the learning goal [S9]. This is evidence for studying structured A/B training materials — **not** direct evidence that two Tigertriever handle videos side-by-side improve performance. For Tigertriever, compare **the same confirmed stage in each approved configuration**, preferably with matched view and meaningful editorial differences. A/B video synchronization should not be assumed if footage has different timing or perspectives.

## 5. Evidence-informed audience and use scenarios

Do not present the following as validated personas; these are *role/task hypotheses* derived from the client brief and related clinical research.

| User / role | Hypothesised trigger | Task to test | Most valuable workflow | Evidence and uncertainty |
|---|---|---|---|---|
| Physician — first experience with a Tigertriever variant | Introduction to an unfamiliar model or handle | Learn how approved components/stages fit together | **Learn**: Opening → eight stages → Closing; replay key clips | CLIENT intended audience; experience level OPEN |
| Physician — already familiar with device family | Needs to revisit one step, new handle or variation | Locate a precise approved instruction rapidly | **Quick reference**: model → stage → media + instructions | JIT literature suggests value, Tigertriever-specific need OPEN |
| Rapid Medical clinical/field educator (rep) | Onboarding or demonstration with physician(s) | Present stages, repeat/reorder clips, explain approved handle differences | Same player, clearly navigable stage index, **Compare handles** | CLIENT explicitly says rep-led; rep identity, content rights and device OPEN |
| Content editor / product training staff | Revised video, updated product coverage | Edit, preview and package approved content | Online content studio; draft vs published preview | Supported by project brief, job role/workflow OPEN |
| Clinical/regulatory reviewer | Ready-for-publication material | Check exact variant, claims, warnings and version | Preview exact resolved content, approval log | Recommended control, required sign-off policy OPEN |

### Scenario A — Rep-led introduction (strong client intent)

1. A representative opens the predownloaded package or online equivalent on an approved device.
2. Selects market, model and handle explicitly; sees content version.
3. Introduces course, jumps to a chosen procedure stage, pauses/repeats the demonstration media while discussing the material.
4. If two approved handle variants are available, opens a **same-stage Compare** view to clarify published differences; two independent players, not auto-sync.
5. Returns to the same origin stage; ends with Closing and an optional link to the approved standalone package.

**Open:** Is there any need for group presentation / large monitor / screen sharing? Are field reps allowed to share files? Does rep need to annotate or bookmark? No evidence yet.

### Scenario B — Independent physician review (strong client intent; details to test)

1. Physician launches locally, confirms market/model/handle in a compact persistent header.
2. Chooses either Start Learning or a particular one of eight procedural stages.
3. Opens stage media with its short, approved text and always-visible applicable warnings.
4. Replays/reviews relevant portion; returns to stage index. Can check source/revision.

**Open:** Typical session length, how and when materials are accessed, device/browser, whether a full-course viewing happens independently.

### Scenario C — Compare New vs Legacy Handle (confirmed product direction; missing content)

1. Physician or rep chooses **Tiger 13** and a supported market; Compare appears only if both variants have approved published training in that package.
2. Comparison overview shows labelled handle images/specifications and a **curated difference summary** only when approved.
3. Stage selection stays aligned across both columns (e.g., Deployment), but the videos have independent play/pause.
4. Different statuses are explicit: **Same approved guidance**, **Approved difference**, **Unreviewed**, **Not available in this release**; none are inferred by string comparison.
5. Always-visible warnings and exact configurations; Exit compare returns to original stage.

**Important:** The July material identifies sections intended to be shared but is itself under review. No “same clinical technique” claim should be published automatically.

### Scenario D — Short WhatsApp video (client idea, not confirmed release requirement)

1. Editor identifies approved key messaging and supporting media for a short, self-contained video.
2. A clinical/regulatory reviewer approves the exact text/claims for the intended market.
3. The output is an MP4 with readable titles (given no narration), suitable for mobile messaging when dimensions/length/size requirements are confirmed.

**OPEN:** Is this produced manually by video editor, or by the content platform? Do not scope automated video export until the client decides.

## 6. Research → UX requirements matrix (proposed, not final)

| ID | Evidence | Proposed requirement / experiment | Confidence |
|---|---|---|---|
| U01 | CLIENT: rep-led + direct physician use | One navigation model supporting both guided sequences and direct stage access | **High client intent**, UX efficacy untested |
| U02 | CLIENT: short copy + play/pause + no narration | Media-first lesson with on-screen written instruction readable without audio | High client intent |
| U03 | CLIENT: 10 narrative sections, eight core stages | Narrative course for Learn; eight-step direct reference index | Design inference; confirm client |
| U04 | CLIENT: old/new T13 with differentiated media | Compare Handle A/B and single-stage side-by-side; approved summaries | High intent; content/asset readiness open |
| U05 | CLIENT: old/new asset status | Editorial media matrix and “Not ready” gate before packaging | Direct operational implication |
| U06 | CLIENT: WhatsApp video | Include as separately tracked potential deliverable | Explicit mention; product scope unknown |
| U07 | S1–S3: supervised procedural training and blended learning | Avoid certification/simulator claims; allow trainer-controlled media | Moderate transfer, qualitative |
| U08 | S4–S5: JIT simulation and video findings | Test “find stage quickly” vs complete learning path | Indirect clinical evidence |
| U09 | S6–S7: mobile apps and connectivity barriers | Test narrow view, mobile distribution requirements; offline compatibility spike | General evidence, exact environment unverified |
| U10 | S8: user/environment/interface | Show context labels and version; never hide safety content in comparison | Safety-related design proposal |
| U11 | S9: comparing matched radiology cases | Study matched comparison layouts and explicit difference summaries | Indirect experimental evidence |
| U12 | CLIENT source conflict: T17U and step label variants | Stable IDs separate from human-readable labels; confirm scope | Strong discrepancy; client decision needed |
| U13 | REGULATORY OPEN | Do not claim performance, treat IFU/clinical approvals as source of truth | Risk control, review by client |

## 7. Content and research reconciliation: questions that cannot be silently resolved

1. **Why does the July draft list 10 parts, while October HTML presents eight?** Proposed explanation = Opening/Closing plus eight procedural stages, but ask explicitly.
2. **Is T17U in scope?** It is in July's older-handle list, but absent from October's four-model wireframe.
3. **Which version of section 5 is definitive?** July “Combination Therapy” vs October “Aspiration & combination technique”.
4. **What is the role of Anesthesia?** The October HTML presents a conditional placeholder; July draft does not supply approved instruction.
5. **Which configuration and region combinations are available and which can be compared?** No validated matrix.
6. **Is the short WhatsApp MP4 a separate required deliverable?** Its inclusion in the July draft is explicit, but later wireframe does not address it.
7. **Are the existing handle videos usable together?** Some new T13 shots are marked unfilmed; do not enable Compare before both sides are approved or transparently unavailable.
8. **Who will use the package on what hardware?** Physician laptop, rep laptop, hospital desktop, tablet or phone? What exactly is expected from offline?
9. **Is any intended use during active clinical treatment?** Do not design for this as an assumption.
10. **Who signs off medical text, trial claims, allowed markets and video footage?** What is the release withdrawal/update policy for circulated offline copies?

## 8. Recommended validation plan before wireframe sign-off

### Rapid Medical stakeholder interviews — 30 min each

**A. Product / clinical education lead:** 10-vs-8 chapters, real audiences, scenarios, original workflow, region/model/handle matrix, shareable WhatsApp video, learning objectives and clinical approval process.

**B. Representative / field trainer:** how a typical training session runs; whether they skip or replay stages; which configuration comparisons they are asked to make; where device/media is displayed; how material is distributed after a session; barriers of offline use.

**C. Content editor / reviewer:** source-of-truth documents; how videos are managed; who can approve; which sections are reused; release turnaround; how they recognise a missing asset or out-of-date material.

### Prototype studies — indicative recruitment

Recruit if possible **4–6 physicians** at varied levels of experience, **2 field trainers** and **2 content editors/reviewers** for formative, not statistically representative feedback. Do not present these sample sizes as regulatory validation or a substitute for clinical usability verification.

**Learner tasks (synthetic, non-clinical content):**

- **T1.** Given a written market/model/handle, open the correct guide. Observe wrong-variant selection and context recognition.
- **T2.** Locate “Deployment” without watching earlier sections. Measure navigation and mistaken stages.
- **T3.** Start at Opening and move through stages in a facilitated demo; observe presenter needs and interruptibility.
- **T4.** Compare the *same* fictional stage across two illustrative handle configurations; identify two labelled nonmedical differences and explain which version they belong to.
- **T5.** Compare where one clip is missing; evaluate whether “Not available” is understood as missing evidence, **not identical procedure**.
- **T6.** Find revision/date and exit Compare back to the originating step.

**Editorial tasks:** replace illustrative video, inspect affected configurations, preview published vs draft, attempt a build with a missing required asset, review release readiness.

**Suggested measures:** task completion (correct configuration), critical errors and false equivalence, path/backtracking, source/market/handle awareness, time-to-find, qualitative think-aloud, confidence and any confusion about approved content. Qualitative measures are descriptive; set safety-critical pass thresholds only with Rapid Medical reviewers.

### One-week technical proof of concept (parallel)

On actual intended platforms, extract a ZIP and test opening `index.html`, offline playback of multiple local media files, deep link / stage navigation, two-clip Compare, printable/accessible text, and presence of correct build version. Do **not** use `file://` success on the developer's machine as a substitute for managed hospital environment validation.

## 9. Near-term decisions

- **Include in v0.3 documentation now:** explicit physicians and rep-led/direct contexts; ten-part narrative plus eight-stage index *as tentative IA*; T17U discrepancy; media coverage state; independently controlled Compare; WhatsApp output as out-of-scope-until-confirmed.
- **Keep as hypotheses:** quick-reference frequency; dedicated presenter mode; on-device mobile offline app; amount of clinical-context assistance; approved content reuse.
- **Avoid:** inventing clinical steps, claiming suitability for intraprocedural decision support, automatic handling-equivalence inference, replacing approved IFU or clinical training, or building performance scoring into the first release.

---

## 10. References (APA-style, selected)

**Client sources**
- Rapid Medical. (2026, July). *Tigertriever: Interactive training webpage / need offline version too / short WhatsApp version. Content Draft v0.10* [Internal draft for review].
- Rapid Medical. (2026, October 14). *Tiger Device Stages* [HTML wireframe].

**External evidence**
- [S1] International neurointerventional societies. (2016). *Training guidelines for endovascular ischemic stroke intervention: An international multi-society consensus document*. https://pmc.ncbi.nlm.nih.gov/articles/PMC7960155/
- [S2] Grundgeiger, T., Ertle, F., Diethei, D., Mengelkamp, C., & Held, V. (2023). Improving procedural skills acquisition of students during medical device training: Experiments on e-Learning vs. e-Learning with hands-on. *Advances in Health Sciences Education, 28*, 127–146. https://doi.org/10.1007/s10459-022-10148-0
- [S3] *Innovations in thrombectomy training: A systematic review and expert recommendations from the Society of Vascular and Interventional Neurology–Mission Thrombectomy Initiative*. (2025). *Stroke: Vascular and Interventional Neurology*. https://pmc.ncbi.nlm.nih.gov/articles/PMC12697599/ (Study reviewed eight trials; simulation results should not be treated as online-video evidence.)
- [S4] Branzetti, J. B., et al. (2017). Randomised controlled trial to assess the effect of a Just-in-Time training on procedural performance: A proof-of-concept study to address procedural skill decay. *BMJ Quality & Safety, 26*, 881–891. https://qualitysafety.bmj.com/content/26/11/881
- [S5] *Just-in-time clinical video review improves successful placement of Sengstaken–Blakemore tube by emergency medicine resident physicians: A randomized control simulation-based study*. (2021). https://pmc.ncbi.nlm.nih.gov/articles/PMC8171783/
- [S6] Kraushaar, J., & Bohnet-Joschko, S. (2023). Prevalence and patterns of mobile device usage among physicians in clinical practice: A systematic review. https://pubmed.ncbi.nlm.nih.gov/37063054/
- [S7] *Smartphone and mobile app use among physicians in clinical practice: Scoping review*. (2023). https://pubmed.ncbi.nlm.nih.gov/37000498/
- [S8] U.S. Food and Drug Administration. (2026). *Human factors considerations*. https://www.fda.gov/medical-devices/human-factors-and-medical-devices/human-factors-considerations
- [S9] Kok, E. M., de Bruin, A. B. H., Leppink, J., van Merriënboer, J. J. G., & Robben, S. G. F. (2015). Case comparisons: An efficient way of learning radiology. *Academic Radiology, 22*(10), 1226–1235. https://doi.org/10.1016/j.acra.2015.04.012

*External research claims are tied to studies only within the study population, method and outcome. The application-specific UX proposals above remain unvalidated hypotheses.*