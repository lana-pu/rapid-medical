# Rapid Medical — Evidence-Informed JTBD Map

**Version:** 0.1 · **Date:** 2 November 2026  
**Research status:** Initial, evidence-informed JTBD hypotheses; **not validated** by interviews with Tigertriever physicians.  
**Companion:** `Open_Questions_Register_v0.1` is the separate, maintained source-of-truth list of questions, grouped by respondent and owner.

## 1. Purpose, scope and evidence discipline

This document expresses the progress people seek in concrete situations. It does not define buttons or screens as jobs. Use the same causal shape consistently: **When [circumstance], I want [progress], so I can [meaningful outcome]**. Functional, emotional and social motivations can coexist, but subjective motivations are hypotheses until interviewed. No priority here should be read as the measured frequency or importance of a job: P0 means **investigate / support early in the first prototype**.

**Three distinct actors:** (a) physicians learning a named device configuration; (b) Rapid Medical representatives facilitating that learning (secondary stakeholder whose exact interaction with the interface is not yet observed); and (c) Rapid Medical content editors authoring and distributing approved material. Do not combine their jobs into a single persona. We deliberately do not claim that an app should guide live clinical treatment, select devices for patients, certify competence, simulate procedures or replace IFUs.

**Evidence keys:** `C` = explicit but nonfinal client input; `R` = peer-reviewed related research; `P` = public product/regulatory context; `O` = observed competitor capability; `D` = existing project design inference; `T` = technical constraint pending test. A job is only *high confidence* when a source establishes the intended job/guardrail, not because real users have been observed. Related EVT literature (Fugelli et al., 2025; Al-Mufti et al., 2025) supports training/familiarization needs but **cannot validate Tigertriever-specific workflows**. General segmentation research (Rey et al., 2019) supports manageable, selectable chunks—not a particular layout or clinical benefit.

## 2. Three main job clusters

- **Physician — make progress in learning an exact device configuration.** Critical situations: unfamiliar device; changed handle; recall one procedure stage; facilitated lesson; later self-directed review; identifying applicable market/device/version.
- **Representative — deliver and adapt approved education.** Critical situations: physician demonstration; clarification question; uncertain connectivity; post-session follow-up. The client states representative-led use; actual control of the interface needs observation.
- **Content editor — safely change and ship approved learning materials.** Critical situations: media replacement; shared asset; draft approval; frozen release; added configuration; correction of a previously distributed package.

## 3. Candidate JTBD statements, desired outcomes and evidence

### Physician

#### P01 · Orient to an unfamiliar Tigertriever configuration [P0]

**Job story:** When when I have agreed to learn a Tigertriever configuration that I have not used before, I want to build a reliable mental model of the device, its controls and the overall educational sequence, so I can enter guided practical training knowing what will be demonstrated.

**Desired outcomes (proposed observables):** Identify the exact configuration; locate the named components; explain the intended sequence in the approved course without consulting multiple materials.

**Source basis:** `C1; R1; R3`. **Confidence:** Moderate: intended situation + indirect research.

**Next validation:** Ask about last first-use training, current onboarding resources and difficult concepts.

#### P02 · Learn what changes when a handle/device variant changes [P0]

**Job story:** When when I already know one version of Tigertriever and encounter an approved alternative, I want to separate truly changed handling or procedural elements from familiar ones, so I can avoid incorrectly carrying expectations from the old version into the new training.

**Desired outcomes (proposed observables):** Identify client-approved differences without inferring that unchanged/absent sections are equivalent; access both complete approved sources.

**Source basis:** `C1; C2; R3`. **Confidence:** Moderate: real content distinction, untested end-user need.

**Next validation:** Recruit a prior-handle user; ask for a recent version-switch story; test comprehension of two approved sample variants.

#### P03 · Revisit one known stage efficiently [P0]

**Job story:** When when I need to review an aspect of a course I have already been shown, I want to reach the exact stage and its demonstration without replaying the whole sequence, so I can refresh a specific part of my understanding with minimal searching.

**Desired outcomes (proposed observables):** Find a named stage directly; retain configuration context; replay a clip or inspect text without losing place.

**Source basis:** `C1; R2; D1`. **Confidence:** Moderate: supported general learning pattern, frequency unknown.

**Next validation:** Ask about actual revisiting behavior and findability on current materials.

#### P04 · Follow a facilitated device-training session [P0]

**Job story:** When when a Rapid Medical representative is guiding a session, I want to follow explanations at a manageable pace and revisit unclear elements, so I can participate in the training rather than just watch a continuous presentation.

**Desired outcomes (proposed observables):** Pause or revisit a point; keep track of the stage and configuration; resume after discussion.

**Source basis:** `C1; R1; D1`. **Confidence:** Moderate: client reports rep-led usage; actual session behavior unknown.

**Next validation:** Observe a training session and identify who operates the controls and when questions arise.

#### P05 · Trust applicability and provenance of the educational material [P0]

**Job story:** When when I am shown a guide or comparison that could exist in several market and device versions, I want to verify which device, handle, market and release it describes, so I can avoid relying on a mismatched educational resource.

**Desired outcomes (proposed observables):** Correctly identify exact configuration/market/release and locate supplied source or IFU reference; no silent fallback.

**Source basis:** `C2; P1; R4`. **Confidence:** High as product guardrail; desirability of display details untested.

**Next validation:** Use a deliberate wrong-variant selection task; ask which provenance details participants actually inspect.

#### P06 · Inspect a device feature in context [P1]

**Job story:** When when a term or visible device component is unfamiliar during learning, I want to connect the approved component name and appearance to the instruction being shown, so I can understand the explanation without leaving the learning context unnecessarily.

**Desired outcomes (proposed observables):** Locate a relevant approved diagram/annotation and return to the stage; avoid confusion between media and instructions.

**Source basis:** `C2; O1; R2`. **Confidence:** Moderate: content types confirmed, job untested.

**Next validation:** Check which component questions come up during representative training.

#### P07 · Find supporting evidence without confusing it with procedural guidance [P1]

**Job story:** When when I need background on a claim, specification or clinical source used in training, I want to find the relevant reference with its context and status, so I can evaluate the provided material without mistaking research for instructions.

**Desired outcomes (proposed observables):** Locate source/revision; distinguish study/case content from mandatory procedural teaching.

**Source basis:** `C2; P1; D1`. **Confidence:** Low to moderate: public content exists; end-user demand unknown.

**Next validation:** Ask whether and when participants consult studies/IFUs, and which questions prompt this.

#### P08 · Review materials independently after a session [P0]

**Job story:** When when I want to return to a demonstration outside an instructor-led meeting, I want to get back to the same approved course on the available device, so I can continue learning without needing a representative to repeat the lesson.

**Desired outcomes (proposed observables):** Open the supplied package without network dependency; return to named content and identify version.

**Source basis:** `C1; D1; T1`. **Confidence:** Moderate: independent use and offline requested; actual environment unknown.

**Next validation:** Ask for last post-session follow-up and real access constraints; test packaged app on target machines.

#### P09 · Compare two eligible models by the same meaningful attributes [P1]

**Job story:** When when I am explicitly studying differences between two available product configurations, I want to inspect the manufacturer-approved characteristics in a consistent structure, so I can understand the stated distinctions without receiving a treatment recommendation.

**Desired outcomes (proposed observables):** Identify comparable facts, distinguish unavailable fields, and keep both configurations labeled.

**Source basis:** `C2; P1; R5`. **Confidence:** Moderate: Compare requirement; learner use cases remain hypotheses.

**Next validation:** Ask for situations of model comparison and test structured, same-market sample data.

### Rapid Medical representative

#### R01 · Conduct a coherent physician training session [P0]

**Job story:** When when I demonstrate a Tigertriever configuration to a physician or group, I want to navigate a dependable sequence while adapting to discussion, so I can keep teaching aligned with approved content and the audience’s prior familiarity.

**Desired outcomes (proposed observables):** Start course, access a named stage, pause/replay, return to prior point without re-setup.

**Source basis:** `C1; D1`. **Confidence:** Moderate: rep-led context confirmed; workflow details unknown.

**Next validation:** Observe real session or conduct incident-based interview with an in-service rep.

#### R02 · Explain a permitted difference accurately [P0]

**Job story:** When when a physician asks what changed between approved versions, I want to retrieve the right client-approved comparison material, so I can explain a difference consistently without extrapolating unsupported claims.

**Desired outcomes (proposed observables):** Locate eligible pair, show source material, clarify missing content and maintain market context.

**Source basis:** `C1; C2; P1`. **Confidence:** Moderate: comparison requested; actual rep triggers unknown.

**Next validation:** Ask for most recent physician question about two handles and materials used to answer.

#### R03 · Deliver a functioning offline training package [P0]

**Job story:** When when preparing a training session in an environment with uncertain internet access, I want to carry a working current version for the intended audience, so I can avoid session disruption and outdated training materials.

**Desired outcomes (proposed observables):** Identify correct release/package and its scope, open locally, know the escalation route for outdated copies.

**Source basis:** `C1; T1`. **Confidence:** Moderate: offline requirement known; specific operational workflow unknown.

**Next validation:** Walk through last distribution and device setup; observe target hospital machine.

#### R04 · Support follow-up learning [P1]

**Job story:** When when a physician asks to revisit a point after a demonstration, I want to provide access to the relevant approved section or package, so I can enable continued review without manually reconstructing the entire explanation.

**Desired outcomes (proposed observables):** Provide sanctioned version-identified material; avoid wrong-market or obsolete files.

**Source basis:** `C1; D1`. **Confidence:** Low: plausible job, no direct behavior yet.

**Next validation:** Ask about follow-up messages, shared assets and reuse; do not assume export/share feature.

### Rapid Medical content editor

#### E01 · Replace a source asset with known scope [P0]

**Job story:** When when an approved replacement video or text becomes available, I want to find the right lesson and update the draft while seeing every affected configuration, so I can make a controlled update without accidentally changing unrelated training.

**Desired outcomes (proposed observables):** See stage/config IDs, asset usages and impact before committing; preview resolved learner output.

**Source basis:** `C2; O2; D1`. **Confidence:** High for product requirement; exact staff practices unknown.

**Next validation:** Shadow current update process and test the Stage 3 replacement task.

#### E02 · Reuse content without overextending applicability [P0]

**Job story:** When when identical media or text is proposed for multiple models or regions, I want to record precisely where reuse is approved, so I can reduce duplicate maintenance without accidentally spreading an instruction.

**Desired outcomes (proposed observables):** Explicitly select approved configuration IDs; distinguish proposed reuse from medical sign-off.

**Source basis:** `C1; C2; P1`. **Confidence:** High as safety/architecture requirement; workload unknown.

**Next validation:** Ask for recent shared clip and how the team currently decides reusability.

#### E03 · Review changes against what was actually shipped [P0]

**Job story:** When when a new draft is ready for review, I want to inspect before/after content, metadata and the last distributed version, so I can approve the correct changes with a clear audit trail.

**Desired outcomes (proposed observables):** Distinguish Draft/Approved/Built/Distributed; identify changes to text, media, applicability, warnings and comparison pairs.

**Source basis:** `C2; O2; D1`. **Confidence:** High as product workflow; UI pattern untested.

**Next validation:** Run Draft vs Released comprehension task with actual editors.

#### E04 · Publish a complete, traceable offline release [P0]

**Job story:** When when a package is ready for distribution, I want to validate mandatory assets, exact market scope and required approvals, so I can deliver a self-contained, version-identified package that matches the preview.

**Desired outcomes (proposed observables):** Block incomplete source/approval; produce immutable manifest and complete local media; record build and distribution status separately.

**Source basis:** `C2; T1; P1`. **Confidence:** High as agreed system outcome; mechanism unverified.

**Next validation:** Run build-ready vs blocked scenarios; perform technical ZIP spike.

#### E05 · Add a new approved device variant efficiently [P1]

**Job story:** When when Rapid Medical introduces a new handle, model or approved market, I want to extend the training catalogue and attach existing/new approved lessons, so I can avoid rebuilding the interface or manually duplicating entire programs.

**Desired outcomes (proposed observables):** Create coverage entry, map exact stages/assets, see gaps and publish only eligible combinations.

**Source basis:** `C1; C2; P1`. **Confidence:** Moderate: future support required, initial frequency unknown.

**Next validation:** Map one hypothetical new variant with a responsible editor.

#### E06 · Correct previously distributed materials [P1]

**Job story:** When when a published source is withdrawn, corrected or superseded, I want to know which offline releases included it and what update process is possible, so I can limit ongoing use of outdated materials via approved operational steps.

**Desired outcomes (proposed observables):** Trace affected releases, distinguish available new packages from already-distributed copies; have a realistic notification route if required.

**Source basis:** `C2; T1; D1`. **Confidence:** Low: operational process not supplied; important question.

**Next validation:** Ask about actual update/withdrawal policy; do not promise remote revocation.

## 4. Derived user dimensions (not demographic personas)

| Dimension | Why it matters | How to sample / test |
|---|---|---|
| Familiarity with **this exact device/handle** | Medical seniority may not predict knowledge of a new handle | Include new-to-Tiger, old-handle users, and experienced users of the target configuration |
| Training situation | Instructor-led and independent access are both intended | Ask for last training episode and follow-up episode, not abstract preferences |
| Learning intent | First orientation, focused refresh and change comparison imply different information-seeking | Observe selection, stage lookup and A/B tasks separately |
| Market/package scope | Same product name may map to distinct approved resources | Test single-market and multi-market access without inventing indications |
| Editor responsibility | Source preparation, review, and distribution may be different actual people | Trace permissions from real staff, do not assign roles by assumption |

**Do not define a separate novice-vs-expert UI mode or rep mode yet.** We only have a hypothesis that prior *device-specific* familiarity explains differing navigation needs. A single learner view can be tested with both guided and direct lookup paths.

## 5. Desired-outcome framework and interview evidence plan

Outcomes are *candidate observable test indicators*, not clinical endpoints or already validated product KPIs:

| Outcome cluster | Example study observation | Counterexample / warning sign |
|---|---|---|
| Correct configuration | Participant reads back exact model, handle, market and release | Confuses different market/handle with same product brand |
| Retrieval efficiency | Finds a named stage via appropriate navigation and recovers after detour | Replays whole course for one known stage / loses place |
| Comparison comprehension | Explains only authored differences and still accesses complete source on each side | Infers equivalence from absent video; ignores a warning |
| Confidence and provenance | Can identify what material came from Rapid Medical and how current it is | Treats public claims as procedural instructions |
| Editorial impact awareness | Predicts all affected configurations before publishing changed media | Believes a common asset is safe for every market automatically |
| Release traceability | Distinguishes edited draft from distributed ZIP snapshot | Assumes a web edit silently changes an old downloaded ZIP |

**Interview style.** Use neutral critical-incident prompts (“Tell me about the last time…”, “What happened next?”, “What alternatives did you try?”), not “Would you use a Compare button?”. The question register contains an ordered first-contact shortlist. Interview 5–8 physicians spanning relevant **device-familiarity** situations, 2–4 representative-led session facilitators where possible, and 2–4 actual editors; these are **directional qualitative samples**, not statistical estimates. Validate medically sensitive facts with authorised client reviewers, not participant guesses.

### Evidence-to-design boundaries

- Patient outcomes, clinical competence, real-world handling efficacy and any medical indications are not JTBD claims proven by this work. The training tool should not present unsanctioned clinical guidance.
- The existence of a capability in Touch Surgery, Siemens, Dozuki or Payload is benchmarking, not evidence that our target physicians want or can use it.
- Desired outcomes are **behavioral research criteria**; do not set arbitrary pass rates or metrics without observing the tasks.
- Offline usage is a known *product constraint*, but whether and when doctors personally use it remains an open behavioral question.
- Emotional jobs such as “feel reassured” and social jobs such as “appear confident before colleagues” should be **probed**, not asserted. Avoid leading participants toward embarrassment or patient-safety narratives.

## 6. Validation priorities and handoff

**Round 1 — critical incidents and real examples.** Ask PHY-01/02/04/05/06/09 and REP-01/02/03; observe a genuine physician training session if access is granted. Gather asset/approval facts MED-01–06/08 and OPS-01–03 before using real clinical content or promising packaging.

**Round 2 — prototype task evidence.** Use exact approved content or prominently synthetic *nonclinical* stand-ins for: entry selection; stage lookup; handle change comparison; an unavailable comparison; recover-to-origin; editor change-impact review and Draft vs Released; ZIP readiness errors.

**Round 3 — reprioritize JTBD.** For each job record: observed trigger, alternative used, difficulty, frequency estimates *only if actually elicited*, respondent context, and evidence link. Mark **Validated / Revised / Unsupported / Still open**; do not retrofit stories to justify chosen screens.

**Dependency:** the client supplies approved medical content and access to representative users/operational facts where feasible; UX research questions and final interaction decisions remain design-owned.

## References (APA; source provenance)

- **[C1]** Rapid Medical. (2026, July). *Tigertriever interactive training webpage: Content draft v0.10* [Internal working document; FOR REVIEW].  *Relevance/limit:* Internal; not clinically approved.

- **[C2]** Rapid Medical UX Design. (2026, November 2). *Final desk research synthesis and active product baseline v0.4* [Project working documentation].  *Relevance/limit:* Project research/synthesis, not primary participant research.

- **[D1]** Rapid Medical UX Design. (2026, October–November). *Context of use, comparison, information architecture, and Content Studio research addenda* [Project working research].  *Relevance/limit:* Includes design hypotheses and earlier secondary research.

- **[R1]** Fugelli, C. G., Hansen, B. S., Ersdal, H., & Kurz, M. (2025). Unveiling team needs: A qualitative study of simulation training for endovascular cerebral thrombectomy. *BMJ Open Quality, 14*(3), e002981. https://doi.org/10.1136/bmjoq-2024-002981  *Relevance/limit:* Qualitative EVT team setting; not device-specific Tigertriever research.

- **[R2]** Rey, G. D., Beege, M., Nebel, S., Wirzberger, M., Schmitt, T. H., & Schneider, S. (2019). A meta-analysis of the segmenting effect. *Educational Psychology Review, 31*, 389–419. https://doi.org/10.1007/s10648-018-9456-4  *Relevance/limit:* General multimedia learning, not direct physician evidence.

- **[R3]** Al-Mufti, F., et al. (2025). Innovations in thrombectomy training: A systematic review and expert recommendations from the Society of Vascular and Interventional Neurology–Mission Thrombectomy Initiative. *Stroke: Vascular and Interventional Neurology*. https://pubmed.ncbi.nlm.nih.gov/41608732/  *Relevance/limit:* Simulation/hands-on thrombectomy training; does not test a stage/reference app.

- **[R4]** U.S. Food and Drug Administration. (2026). *Human factors considerations*. https://www.fda.gov/medical-devices/human-factors-and-medical-devices/human-factors-considerations  *Relevance/limit:* General device human-factors context; do not assume educational app legal classification.

- **[R5]** Christensen, C. M., Hall, T., Dillon, K., & Duncan, D. S. (2016). Know your customers’ “jobs to be done.” *Harvard Business Review*. https://hbr.org/2016/09/know-your-customers-jobs-to-be-done  *Relevance/limit:* Methodological JTBD framing, not Tigertriever user evidence.

- **[O1]** Siemens Healthineers. (n.d.). *ExpertGuidance*. https://www.siemens-healthineers.com/services/customer-services/upskill-services/equipment-and-clinical-education/individual-education-and-practice/expertguidance  *Relevance/limit:* Official benchmark evidence for labelled equipment education, not user outcome.

- **[O2]** Payload. (n.d.). *Versions*. https://payloadcms.com/docs/versions/overview; Dozuki. (n.d.). *Approval processes*. https://apidocs.dozuki.com/Help/Approval_Processes  *Relevance/limit:* Editor capability reference, not validation of our Content Studio.

- **[P1]** Rapid Medical. (n.d.). *Tigertriever product information for US and international markets*. https://us.rapid-medical.com/lvo ; https://ous.rapid-medical.com/lvo  *Relevance/limit:* Public site is contextual; not a source of approved in-app instructions.

- **[T1]** Mozilla. (n.d.). *CORS and local-file limitations*. https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS  *Relevance/limit:* Browser technology documentation, not actual deployment testing.