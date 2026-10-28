/**
 * Therapy pages, hand-structured from the Duda crawl (content/raw/*).
 * One entry per (slug, region). Image URLs still point at the Duda CDN;
 * run scripts/migrate-media.ts after seeding to pull them into our storage.
 */
import type { Region, Benefit, Step, InPracticeItem, ActionLink } from "../../src/db/schema";

export type SolutionSeed = {
  slug: string;
  region: Region;
  product: "tigertriever" | "comaneci" | "drivewire";
  sortOrder: number;
  navLabel: string;
  breadcrumb: string;
  metaTitle: string;
  metaDescription: string;
  heroTitle: string;
  heroBody: string;
  heroImageUrl?: string;
  heroCta?: ActionLink;
  introTitle?: string;
  introBody?: string;
  benefits: Benefit[];
  overviewBody: string;
  overviewImageUrl?: string;
  specImageUrls: string[];
  howItWorks: Step[];
  inPractice: InPracticeItem[];
  actionLinks: ActionLink[];
  actionNote?: string;
  closingTitle?: string;
  closingBody?: string;
  regulatoryMd: string;
  referencesMd: string;
};

const CDN_US = "https://irp.cdn-website.com/9d0280ee/dms3rep/multi";
const CDN_OUS = "https://irp.cdn-website.com/8b5f57de/dms3rep/multi";
const FILES_OUS = "https://irp.cdn-website.com/8b5f57de/files/uploaded";
const FILES_US = "https://irp.cdn-website.com/9d0280ee/files/uploaded";

const TIGER_BENEFITS: Benefit[] = [
  {
    title: "Gain active control",
    body: "Unlike conventional stent retrievers, active thrombectomy can improve clot penetration¹ and facilitate smooth retrieval with adjustable radial force.",
  },
  {
    eyebrow: "Accelerate",
    title: "thrombectomy",
    body: "Two million brain cells die every minute. TIGERTRIEVER™ saves minutes when removing the clot – with reported procedure times faster than the leading competitors.",
    footnote: "Speed matters – TIGER Trial showed quicker time to reperfusion than using aspiration alone.",
  },
  {
    eyebrow: "The 1st pass",
    title: "should be the last",
    body: "Adjustability handles patient variability in real-time. TIGERTRIEVER™ has high first-pass success (FPE) and low emboli to new territory (ENT), outperforming competitors in challenging procedures involving stenosis, hard clot, and tortuosity in patients with intracranial atherosclerosis (ICAD).",
    imageUrl: `${CDN_US}/opt/Screenshot+2025-05-08+at+12.39.08-PM-1920w.png`,
  },
];

const TIGER_STEPS: Step[] = [
  { title: "PENETRATE the clot with active integration" },
  { title: "ADJUST with complete visibility" },
  { title: "RELAX to relieve vessel traction" },
];

const TIGER_REFERENCES = `1. Sadasivan C, Dashti N, Gopal M, Serna RJ, Fiorella D. The effect of actuation frequency on clot integration with the Tigertriever device: A preliminary in vitro study. Interv Neuroradiol. Published online April 17, 2024. doi:10.1177/15910199241247886
2. Gupta, Rishi et al. "New Class of Radially Adjustable Stentrievers for Acute Ischemic Stroke: Primary Results of the Multicenter TIGER Trial." Stroke vol. 52,5 (2021): 1534-1544. doi:10.1161/STROKEAHA.121.034436
3. Turk AS, Siddiqui A, Fifi JT, et al. Aspiration thrombectomy versus stent retriever thrombectomy as first-line approach for large vessel occlusion (COMPASS): a multicentre, randomised, open label, blinded outcome, non-inferiority trial. Lancet. 2019;393:998-1008. doi:10.1016/S0140-6736(19)30297-1
4. Lapergue B, Blanc R, Gory B, et al. Effect of Endovascular Contact Aspiration vs Stent Retriever on Revascularization in Patients With Acute Ischemic Stroke and Large Vessel Occlusion: The ASTER Randomized Clinical Trial. JAMA. 2017;318(5):443-452. doi:10.1001/jama.2017.9644
5. Ojeda DJ, Ghannam M, Sanchez S, et al. Tigertriever in the treatment of acute ischemic stroke with underlying intracranial atherosclerotic disease. J Neurointerv Surg. 2024;16(11):1083-1087. doi:10.1136/jnis-2023-020796
6. Yi HJ, Sung JH, Lee DH, Song SY. Effectiveness and Technical Considerations of Solitaire Platinum 4×40 mm Stent Retriever in Mechanical Thrombectomy with Solumbra Technique. J Korean Neurosurg Soc. 2021;64(1):30-38. doi:10.3340/jkns.2020.0046
7. Kabbasch C, Mpotsaris A, Chang DH, et al. Mechanical thrombectomy with the Trevo ProVue device in ischemic stroke patients: does improved visibility translate into a clinical benefit? J Neurointerv Surg. 2016;8(8):778-782. doi:10.1136/neurintsurg-2015-011861
8. Haussen DC, Al-Bayati AR, Grossberg JA, et al. Longer stent retrievers enhance thrombectomy performance in acute stroke. J Neurointerv Surg. 2019;11(1):6-8. doi:10.1136/neurintsurg-2018-013918`;

const TIGER_IFU_US = `**Indications for Use.** The Tigertriever Revascularization Device is intended to restore blood flow by removing thrombus from a large intracranial vessel in patients experiencing ischemic stroke within 8 hours of symptom onset. Patients who are ineligible for thrombolytic drug therapy or who failed thrombolytic drug therapy are candidates for treatment.

**Contraindications.** Use of the Tigertriever Revascularization Device is contraindicated under these conditions: Patients with known hypersensitivity to nickel-titanium. Patients with stenosis and/or pre-existing stent proximal to the thrombus site that may preclude safe recovery of the Tigertriever Revascularization Device. Patients with angiographic evidence of carotid dissection. Refer to the Instructions for Use for complete indications, contraindications, warnings and precautions.`;

const COMANECI_BENEFITS: Benefit[] = [
  {
    eyebrow: "Stability doesn't",
    title: "require implants",
    body: "The temporary deployment of COMANECI™ provides the long-term support of a stent, achieving high packing density and 85% immediate complete occlusion compared to 79% with stent-assisted coiling.¹",
    footnote: "Avoiding implants like stents is preferable to allow the brain to heal naturally and minimize long-term stroke risks and bleeding complications.",
  },
  {
    eyebrow: "Continuous",
    title: "blood supply",
    body: "Unlike balloons, COMANECI™ provides support without blocking blood flow to the brain. Clinicians can focus on accurate placement rather than the countdown to an ischemic event. COMANECI™ demonstrates the highest complete occlusion and lowest complication rates.",
  },
  {
    eyebrow: "Leaves no trace —",
    title: "except SUCCESS",
    body: "95% successful long-term occlusion and 1% retreatment rates show the lasting durability of treatment with COMANECI in both ruptured and unruptured wide-neck aneurysms.²",
    imageUrl: `${CDN_US}/opt/chart-image-1920w.png`,
  },
];

const COMANECI_STEPS: Step[] = [
  { title: "DEPLOY", body: "After positioning the catheters, deploy the 1st coil loop; then deploy COMANECI." },
  { title: "CONTINUE COILING", body: "Close and re-expand COMANECI before detaching each coil." },
  { title: "REMOVE", body: "Remove the coiling catheter with COMANECI expanded. Remove COMANECI." },
];

const COMANECI_REFERENCES = `\\*90 consecutive patients in the U.S.

1. Lim, Jaims et al. "Coiling Variations for Treatment of Ruptured Intracranial Aneurysms: A Meta-Analytical Comparison of Comaneci-, Stent-, and Balloon-Coiling Assistance Techniques." World neurosurgery vol. 175 (2023): e1324-e1340. doi:10.1016/j.wneu.2023.05.008
2. Jason M. Davies et al. Final Results of the SUCCESS Study presented at the ESMINT Congress; September 5, 2024; Marseille, France.
3. Comparison with a Balt Eclipse 6x7 mm`;

const DRIVEWIRE_IFU = `**Indications for Use.** The Drivewire 24 Guidewire is intended for general intravascular use, including the neuro and peripheral vasculature. The Drivewire is intended to facilitate the selective placement of diagnostic or therapeutic catheters. This device is not intended for use in the coronary arteries.

**Contraindications.** Drivewire™ 24 Guidewire is contraindicated for patients with known hypersensitivity to nickel-titanium and patients with stenosis and/or pre-existing stent proximal to the target site that may preclude safe navigation of the device.`;

const US_ACTIONS: ActionLink[] = [
  { label: "Place an order", href: "mailto:orders.inc@rapid-medical.com?subject=Order%20inquiry" },
  { label: "Ask a product question", href: "/contact-us?region=us&topic=support" },
  { label: "Request an IFU", href: "mailto:orders.inc@rapid-medical.com?subject=IFU%20request" },
];
const OUS_ACTIONS: ActionLink[] = [
  { label: "Place an order", href: "mailto:customerservice@rapid-medical.com?subject=Order%20inquiry" },
  { label: "Ask a product question", href: "/contact-us?region=ous&topic=support" },
  { label: "Request an IFU", href: "mailto:customerservice@rapid-medical.com?subject=IFU%20request" },
];

export const SOLUTIONS: SolutionSeed[] = [
  /* ============================== US ============================== */
  {
    slug: "lvo",
    region: "us",
    product: "tigertriever",
    sortOrder: 1,
    navLabel: "Large vessel stroke",
    breadcrumb: "OUR SOLUTIONS / LARGE VESSEL STROKE",
    metaTitle: "Neurovascular Therapy | Rapid Medical™ | US",
    metaDescription: "Learn about the TIGERTRIEVER™, an advanced thrombectomy device for stroke treatment. Contact us to improve patient outcomes today!",
    heroTitle: "A patient-centric approach to AIS",
    heroBody: "TIGERTRIEVER™ is the only active thrombectomy device – it is engineered to adapt to patient anatomy. Accelerate clot integration and reduce stress on the brain during mechanical thrombectomy procedures.",
    heroCta: { label: "Request a demo", href: "/contact-us?region=us&topic=demo" },
    benefits: TIGER_BENEFITS,
    overviewBody: "The world's first and only adjustable stent retriever, TIGERTRIEVER™ is designed with active, responsive technology for patient-specific procedures.",
    overviewImageUrl: `${CDN_US}/opt/US-LVO-Product-Overview-1920w.jpg`,
    specImageUrls: [`${CDN_US}/opt/Specifications-Resized-1920w.jpg`, `${CDN_US}/opt/ChatGPT+Image+Sep+11-+2026-+08_49_40+PM-1920w.png`],
    howItWorks: TIGER_STEPS,
    inPractice: [
      { kind: "testimonial", title: "TIGERTRIEVER – A “next generation device”", person: "Dr. Shahram Majidi", location: "New York, NY", linkUrl: "https://youtu.be/ZCslloX6Ei0", imageUrl: `${CDN_US}/opt/DrMajidi-1920w.png` },
      { kind: "case", title: "First-pass TICI 3 following treatment with TIGERTRIEVER™", person: "Dr. Rishi Gupta", location: "Marietta, GA", linkUrl: "https://www.rapid-medical.com/", imageUrl: `${CDN_US}/opt/Clot-1920w.png` },
      { kind: "recording", title: "TIGERTRIEVER™ in the treatment of acute ischemic stroke with underlying ICAD", person: "Dr. Edgar Samaniego", location: "SNIS Annual Meeting (2024)", linkUrl: "https://www.youtube.com/watch?v=kdIcJW-QDL4", imageUrl: `${CDN_US}/opt/DrSamaniego-1920w.png` },
    ],
    actionLinks: US_ACTIONS,
    actionNote: "Canada: orders.canada@rapid-medical.com",
    closingTitle: "Active thrombectomy tailors the procedure to the patient.",
    closingBody: "Questions? Reach out to learn more about our company and stroke solutions.",
    regulatoryMd: TIGER_IFU_US,
    referencesMd: TIGER_REFERENCES,
  },
  {
    slug: "aneurysm",
    region: "us",
    product: "comaneci",
    sortOrder: 2,
    navLabel: "Aneurysm",
    breadcrumb: "OUR SOLUTIONS / ANEURYSM",
    metaTitle: "Aneurysm Treatment | COMANECI™ | Rapid Medical™ | US",
    metaDescription: "COMANECI™ is the only non-occlusive and temporary assist device for wide-neck aneurysm treatment.",
    heroTitle: "Bridging the gap in assist devices",
    heroBody: "COMANECI™ is the only non-occlusive and temporary device for wide-neck aneurysm treatment.",
    heroImageUrl: `${CDN_US}/3670-Rapid-Medical-COMANECI-Expand---Compress-Dynamic-V1_HIGHRES_Transparent.gif`,
    heroCta: { label: "Request a demo", href: "/contact-us?region=us&topic=demo" },
    introBody: "Minimize the risk and disruption to patients' lives with lasting results. COMANECI™ is the first active assist device – its added user control overcomes the limitations of conventional balloons and stents.",
    benefits: [
      { ...COMANECI_BENEFITS[0], imageUrl: `${CDN_US}/2_COMANECI+Aneurism-Stability.gif` },
      { ...COMANECI_BENEFITS[1], footnote: "See the comparison: /us/see-the-comparison" },
      { ...COMANECI_BENEFITS[2], footnote: "Unlock SUCCESS – the prospective study data: /us/success-study-final-results" },
    ],
    overviewBody: "COMANECI™ is designed with active, responsive technology to enable non-occlusive coil embolization procedures.",
    // NOTE: the live US page embeds OUS overview/spec images – reproduced as-is, flagged for review.
    overviewImageUrl: `${CDN_OUS}/opt/OUS-Aneurysm-Product-Overview-1920w.jpg`,
    specImageUrls: [`${CDN_OUS}/opt/OUS-Aneurysm-Specifications-1920w.jpg`, `${CDN_OUS}/opt/OUS_APAC_Product+Overview_chart-1920w.png`],
    howItWorks: COMANECI_STEPS,
    inPractice: [
      { kind: "case", title: "COMANECI case summary", person: "Dr. Josh Abecassis", linkUrl: `${FILES_US}/Abecassis_case+summary+1+.pdf`, imageUrl: `${CDN_US}/opt/COMANECI-testimonial-1-1920w.jpg` },
      { kind: "case", title: "Y-Stent technique using dual COMANECI devices", linkUrl: "https://pubmed.ncbi.nlm.nih.gov/38578712/", imageUrl: `${CDN_US}/opt/COMANECI-testimonial-2-1920w.png` },
      { kind: "testimonial", title: "COMANECI in practice", linkUrl: "/us/success-study-final-results", imageUrl: `${CDN_US}/opt/COMANECI-testimonial-3-1920w.png` },
    ],
    actionLinks: US_ACTIONS,
    actionNote: "Canada: orders.canada@rapid-medical.com",
    closingBody: "Questions? Reach out to learn more about our company and aneurysm solutions.",
    regulatoryMd: "",
    referencesMd: COMANECI_REFERENCES,
  },
  {
    slug: "access",
    region: "us",
    product: "drivewire",
    sortOrder: 3,
    navLabel: "Access",
    breadcrumb: "OUR SOLUTIONS / ACCESS",
    metaTitle: "Active Access | DRIVEWIRE™ Steerable Guidewire | Rapid Medical™ | US",
    metaDescription: "DRIVEWIRE™ – the world's first steerable neurovascular guidewire.",
    heroTitle: "Active access",
    heroBody: "DRIVEWIRE™ is a steerable guidewire with a deflectable tip, designed to connect with a variety of catheters and provide direct access to intravascular locations.",
    heroImageUrl: `${CDN_US}/opt/RM_Drivewire-Ad_Graphic-V2-1920w.png`,
    heroCta: { label: "Request a demo", href: "/contact-us?region=us&topic=demo" },
    benefits: [
      // The live page is image-only; copy to be written by Rapid Medical.
      { title: "Steer with precision", body: "", imageUrl: `${CDN_US}/opt/Drivewire_middle-diagram-1920w.png` },
    ],
    overviewBody: "",
    specImageUrls: [`${CDN_US}/opt/Drivewire-Chart-1920w.png`],
    howItWorks: [],
    inPractice: [],
    actionLinks: US_ACTIONS,
    actionNote: "Canada: orders.canada@rapid-medical.com",
    regulatoryMd: DRIVEWIRE_IFU,
    referencesMd: "",
  },

  /* ============================== OUS ============================= */
  {
    slug: "lvo",
    region: "ous",
    product: "tigertriever",
    sortOrder: 1,
    navLabel: "Large vessel stroke",
    breadcrumb: "OUR SOLUTIONS / LARGE VESSEL STROKE",
    metaTitle: "Neurovascular Therapy | Rapid Medical™ | OUS",
    metaDescription: "Learn about the TIGERTRIEVER™, an advanced thrombectomy device for stroke treatment.",
    heroTitle: "A patient-centric approach to AIS",
    heroBody: "TIGERTRIEVER™ is the only active thrombectomy device – it is engineered to adapt to patient anatomy. Accelerate clot integration and reduce stress on the brain during mechanical thrombectomy procedures.",
    heroCta: { label: "Request a demo", href: "/contact-us?region=ous&topic=demo" },
    benefits: TIGER_BENEFITS.map((b, i) => (i === 2 ? { ...b, imageUrl: `${CDN_OUS}/opt/Screenshot+2025-05-08+at+12.39.08-PM-1920w.png` } : b)),
    overviewBody: "The world's first and only adjustable stent retriever, TIGERTRIEVER™ is designed with active, responsive technology for patient-specific procedures.",
    overviewImageUrl: `${CDN_OUS}/opt/OUS-LVO-Product-Overview-1920w.jpg`,
    specImageUrls: [`${CDN_OUS}/opt/Specifications-1920w.jpg`, `${CDN_OUS}/opt/OUS_LVO_Product+Overview-1920w.png`],
    howItWorks: TIGER_STEPS,
    inPractice: [
      { kind: "case", title: "Double TIGER case", linkUrl: `${FILES_OUS}/Marie_DoubleTIGER_Case.pdf`, imageUrl: `${CDN_OUS}/opt/Solutions-OUS-1-1920w.png` },
      { kind: "case", title: "TIGERTRIEVER™ 25 first case", linkUrl: `${FILES_OUS}/Meirovitch_T25_first+case.pdf`, imageUrl: `${CDN_OUS}/opt/Solutions-OUS-2-1920w.png` },
      { kind: "recording", title: "TIGERTRIEVER™ in the treatment of acute ischemic stroke with underlying ICAD", person: "Dr. Edgar Samaniego", location: "SNIS Annual Meeting (2024)", linkUrl: "https://www.youtube.com/watch?v=kdIcJW-QDL4", imageUrl: `${CDN_OUS}/opt/Solutions-OUS-3-1920w.png` },
    ],
    actionLinks: OUS_ACTIONS,
    closingTitle: "Active thrombectomy tailors the procedure to the patient.",
    closingBody: "Questions? Reach out to learn more about our company and stroke solutions.",
    regulatoryMd: "",
    referencesMd: TIGER_REFERENCES,
  },
  {
    slug: "mvo",
    region: "ous",
    product: "tigertriever",
    sortOrder: 2,
    navLabel: "Medium vessel stroke",
    breadcrumb: "OUR SOLUTIONS / MEDIUM VESSEL STROKE",
    metaTitle: "Medium Vessel Stroke | TIGERTRIEVER™ 13 | Rapid Medical™ | OUS",
    metaDescription: "TIGERTRIEVER™ 13 goes further in the brain to be tough on clots and gentle on the vessels.",
    heroTitle: "The only device designed for distals",
    heroBody: "TIGERTRIEVER™ 13 goes further in the brain to be tough on clots and gentle on the vessels.",
    heroCta: { label: "Request a demo", href: "/contact-us?region=ous&topic=demo" },
    introBody: "Strokes in smaller arteries can still cause disabling deficits, and clot-dissolving drugs work less than half the time.¹˒²˒³ Yet, these vessels are at increased risk for hemorrhage during treatment.",
    benefits: [
      { title: "Protect the vessel with TIGERTRIEVER™ 13", body: "Most complications occur during retrieval, as tension can cause vessel stretching, pain, and injury. TIGERTRIEVER™ is the only device that can remove force before and during retrieval to reduce the potential for injury." },
      { eyebrow: "The comfort", title: "of control", body: "Traditional 3 mm stent retrievers exert higher forces as vessels narrow. Active thrombectomy with TIGERTRIEVER™ 13 adjusts to meet the constraints of the anatomy.", footnote: "Adjust to the anatomy with TIGER 13. Deliver and retrieve with the lowest forces.⁴˒⁵" },
      { title: "Go the distals", body: "Simplify distal reach and tortuous paths with 30% lower delivery profile & delivery force than other 3 mm retrievers.⁴", imageUrl: `${CDN_OUS}/opt/go-the-distals-graohic-1920w_f-1920w.webp` },
      { eyebrow: "Advancing the field of stroke", title: "The DISTALS Trial", body: "Rapid Medical™ has pioneered a new frontier in MVO treatment with randomized evidence demonstrating that TIGERTRIEVER™ 13 significantly improves blood flow to the brain with a strong safety profile compared with medical management. The DISTALS Trial brings long-needed clarity to an underserved market representing nearly half of ischemic strokes.", footnote: "View the results: /distals-results", imageUrl: `${CDN_OUS}/opt/RM_Distals_Tigertriever_Logo_Green-White-2-1920w.png` },
    ],
    overviewBody: "The world's first and only adjustable stent retriever, TIGERTRIEVER™ is designed with active, responsive technology for patient-specific procedures.",
    overviewImageUrl: `${CDN_OUS}/opt/OUS-MVO-Product-Overview-1920w.jpg`,
    specImageUrls: [`${CDN_OUS}/opt/Specifications-Resized-1920w.jpg`, `${CDN_OUS}/opt/OUS_MVO_Product+Overview-1920w.png`],
    howItWorks: TIGER_STEPS,
    inPractice: [
      { kind: "case", title: "First-pass case report", person: "Dr. Solich", linkUrl: `${FILES_OUS}/Solich_T13_case.pdf`, imageUrl: `${CDN_OUS}/opt/First-pass-1920w.png` },
      { kind: "case", title: "First-pass case report", person: "Dr. Brauner", linkUrl: `${FILES_OUS}/Brauner_T13_case.pdf`, imageUrl: `${CDN_OUS}/opt/First-pass-3-1920w.png` },
    ],
    actionLinks: OUS_ACTIONS,
    regulatoryMd: "\\*TIGERTRIEVER™ 13 is indicated for LVOs in the US. Refer to Instructions for Use for detailed indications.",
    referencesMd: `1. Waqas M, Kuo CC, Dossani RH, et al. Mechanical thrombectomy versus intravenous thrombolysis for distal large-vessel occlusion: a systematic review and meta-analysis of observational studies. Neurosurg Focus. 2021;51(1):E5. doi:10.3171/2021.4.FOCUS21139
2. Ospel JM, Menon BK, Demchuk AM, et al. Clinical Course of Acute Ischemic Stroke Due to Medium Vessel Occlusion With and Without Intravenous Alteplase Treatment. Stroke. 2020;51(11):3232-3240. doi:10.1161/STROKEAHA.120.030227
3. Seners P, Turc G, Maier B, Mas JL, Oppenheim C, Baron JC. Incidence and predictors of early recanalization after intravenous thrombolysis: a systematic review and meta-analysis. Stroke. 2016;47:2409-2412.
4-5. Data on file
6. Wang, Maud, et al. "The Anch'Or Harpoon Technique With a Manually Expandable Stentretriever (Tigertriever 13), a Technical Note." Frontiers in Neurology, vol. 13, 2022, p. 934690. doi:10.3389/fneur.2022.934690`,
  },
  {
    slug: "aneurysm",
    region: "ous",
    product: "comaneci",
    sortOrder: 3,
    navLabel: "Aneurysm",
    breadcrumb: "OUR SOLUTIONS / ANEURYSM",
    metaTitle: "Aneurysm Treatment | COMANECI™ | Rapid Medical™ | OUS",
    metaDescription: "COMANECI™ is the only non-occlusive and temporary assist device for wide-neck aneurysm treatment.",
    heroTitle: "Bridging the gap in assist devices",
    heroBody: "COMANECI™ is the only non-occlusive and temporary device for wide-neck aneurysm treatment.",
    heroImageUrl: `${CDN_OUS}/3670-Rapid-Medical-COMANECI-Expand---Compress-Dynamic-V1_HIGHRES_Transparent.gif`,
    heroCta: { label: "Request a demo", href: "/contact-us?region=ous&topic=demo" },
    introBody: "Minimize the risk and disruption to patients' lives with lasting results. COMANECI™ is the first active assist device – its added user control overcomes the limitations of conventional balloons and stents.",
    benefits: [
      { ...COMANECI_BENEFITS[0], imageUrl: `${CDN_OUS}/2_COMANECI+Aneurism-Stability.gif` },
      { ...COMANECI_BENEFITS[1], footnote: "See the comparison: /ous/comparison-video" },
      { ...COMANECI_BENEFITS[2], imageUrl: `${CDN_OUS}/opt/chart-image-1920w.png`, footnote: "Unlock SUCCESS – the prospective study data: /ous/success-study-final-results" },
    ],
    overviewBody: "COMANECI™ is designed with active, responsive technology to enable non-occlusive coil embolization procedures.",
    overviewImageUrl: `${CDN_OUS}/opt/OUS-Aneurysm-Product-Overview-1920w.jpg`,
    specImageUrls: [`${CDN_OUS}/opt/OUS-Aneurysm-Specifications-1920w.jpg`, `${CDN_OUS}/opt/OUS_APAC_Product+Overview_chart-1920w.png`],
    howItWorks: COMANECI_STEPS,
    inPractice: [
      { kind: "case", title: "COMANECI case report – giant ICA aneurysm", person: "Dr. Patankar", linkUrl: `${FILES_OUS}/Patankar_COMANECI+case+report_giant+ICA+AN.pdf`, imageUrl: `${CDN_OUS}/opt/Aneurysym+slider-1-1920w.png` },
      { kind: "case", title: "Y-Stent technique using dual COMANECI devices", linkUrl: "https://pubmed.ncbi.nlm.nih.gov/38578712/", imageUrl: `${CDN_OUS}/opt/Aneurysym+slider-2-1920w.png` },
      { kind: "case", title: "COMANECI spinal case", person: "Dr. Patankar", linkUrl: "/ous/comaneci-spinal-case-patankar", imageUrl: `${CDN_OUS}/opt/Aneurysym+slider-3-1920w.png` },
      { kind: "testimonial", title: "COMANECI in practice", linkUrl: "/ous/success-study-final-results", imageUrl: `${CDN_OUS}/opt/Aneurysym+slider-4-1920w.png` },
    ],
    actionLinks: OUS_ACTIONS,
    closingBody: "Questions? Reach out to learn more about our company and aneurysm solutions.",
    regulatoryMd: "",
    referencesMd: COMANECI_REFERENCES,
  },
  {
    slug: "vasospasm",
    region: "ous",
    product: "comaneci",
    sortOrder: 4,
    navLabel: "Vasospasm",
    breadcrumb: "OUR SOLUTIONS / VASOSPASM",
    metaTitle: "Vasospasm Treatment | COMANECI™ | Rapid Medical™ | OUS",
    metaDescription: "COMANECI™ is the only active assist device with the versatility to treat wide-neck aneurysms and restore arteries in vasospasm.",
    heroTitle: "Take command in vasospasm",
    heroBody: "COMANECI™ is the only active assist device with the versatility to treat wide-neck aneurysms and restore arteries in vasospasm, providing results without permanent implants.",
    heroCta: { label: "Request a demo", href: "/contact-us?region=ous&topic=demo" },
    introBody: "Cerebral vasospasm is an orphan disease, and leading cause of death and disability following subarachnoid haemorrhage (SAH)¹˒², yet lacks a defined treatment strategy. COMANECI is the first device to receive FDA breakthrough designation to provide options for these patients.",
    benefits: [
      { title: "Restore the flow with active control", body: "Unlike other angioplasty devices, COMANECI's active technology offers precise control over vessel dilation with full visibility, potentially reducing the risk of vessel injury.¹˒²", footnote: "Gradual expansion can achieve similar results as high-impact balloons – with less damage to the vessel.³", imageUrl: `${CDN_OUS}/opt/Com+VS+radial+force+comp-1920w.png` },
      { title: "Continuous blood supply", body: "Unlike balloons, COMANECI provides support without blocking blood flow to the brain. Clinicians can focus on accurate placement rather than the countdown to an ischemic event. COMANECI demonstrates the highest complete occlusion and lowest complication rates.", footnote: "See the comparison: /ous/comparison-video" },
      { eyebrow: "Enable", title: "combination therapy", body: "The patent design of COMANECI allows dual treatment — mechanical dilation plus the concurrent infusion of vasodilators. Synergistic action may enhance efficacy compared to a single treatment." },
      { eyebrow: "The proof is in", title: "the patients", body: "In a multicenter study, severe vessel constriction improved significantly, with 52% of patients achieving favorable outcomes at 6 months.²", footnote: "Unlock the data: https://jnis.bmj.com/content/15/9/864", imageUrl: `${CDN_OUS}/opt/vasospasm-stats-1920w.jpg` },
    ],
    overviewBody: "COMANECI™ is designed with active, responsive technology to enable non-occlusive coil embolization procedures.",
    overviewImageUrl: `${CDN_OUS}/opt/OUS-Vasospasm-Product-Overview-D2-d9c9896b-1920w.jpg`,
    specImageUrls: [`${CDN_OUS}/opt/COMANEC-Specs-1920w.jpg`, `${CDN_OUS}/opt/Vasospasm+chart-1920w.png`],
    howItWorks: [
      { title: "TREAT distal → proximal", imageUrl: `${CDN_OUS}/opt/Step+1_vaso-1920w.png` },
      { title: "Gradually EXPAND COMANECI™", imageUrl: `${CDN_OUS}/opt/Step+2_vaso-1920w.png` },
      { title: "WAIT for dilation", body: "On average 2.5 minutes (range 30 sec – 5 min).⁵", imageUrl: `${CDN_OUS}/opt/Step+3_vaso-1920w.png` },
    ],
    inPractice: [
      { kind: "case", title: "COMANECI for vasospasm", person: "Dr. Tufail", linkUrl: "/ous/comaneci-for-vasospasm", imageUrl: `${CDN_OUS}/opt/dr+tufail-1920w.png` },
      { kind: "testimonial", title: "COMANECI for vasospasm", person: "Dr. Svetlana", linkUrl: "/ous/comaneci-for-vasospasm", imageUrl: `${CDN_OUS}/opt/DrSVETLANA-1920w.png` },
    ],
    actionLinks: OUS_ACTIONS,
    closingBody: "Questions? Reach out to learn more about our company and vasospasm solutions.",
    regulatoryMd: "",
    referencesMd: `1. Kassell NF, Sasaki T, Colohan AR, Nazar G. Cerebral vasospasm following aneurysmal subarachnoid hemorrhage. Stroke. 1985;16(4):562-572. doi:10.1161/01.str.16.4.562
2. Salem MM, Khalife J, Desai S, et al. COManeci MechANical Dilation for vasospasm (COMMAND): multicenter experience. J Neurointerv Surg. 2023;15(9):864-870. doi:10.1136/jnis-2022-019272
3. Bhogal P, Pederzani G, Grytsan A, et al. The unexplained success of stentplasty vasospasm treatment: Insights using Mechanistic Mathematical Modeling. Clin Neuroradiol. 2019;29(4):763-774. doi:10.1007/s00062-019-00776-2
4. Data on file
5. Hensler J, Larsen N, Wodarg F, et al. P099 Multi-center study to assess effectiveness of the comaneci device in the treatment of symptomatic cerebral vasospasm following aneurysmal subarachnoid hemorrhage (SAH) – interim results. Journal of NeuroInterventional Surgery 2024;16:A88.`,
  },
  {
    slug: "access",
    region: "ous",
    product: "drivewire",
    sortOrder: 5,
    navLabel: "Access",
    breadcrumb: "OUR SOLUTIONS / ACCESS",
    metaTitle: "Active Access | DRIVEWIRE™ Steerable Guidewire | Rapid Medical™ | OUS",
    metaDescription: "DRIVEWIRE™ – the world's first steerable neurovascular guidewire.",
    heroTitle: "Active access",
    heroBody: "DRIVEWIRE™ is a steerable guidewire with a deflectable tip, designed to connect with a variety of catheters and provide direct access to intravascular locations.",
    heroImageUrl: `${CDN_OUS}/opt/RM_Drivewire-Ad_Graphic-V2-1920w.png`,
    heroCta: { label: "Request a demo", href: "/contact-us?region=ous&topic=demo" },
    benefits: [{ title: "Steer with precision", body: "", imageUrl: `${CDN_OUS}/opt/Drivewire_middle+diagram-5944d55f-1920w.png` }],
    overviewBody: "",
    specImageUrls: [`${CDN_OUS}/opt/OUS_Drivewire+chart_Product+Overview-1920w.jpg`],
    howItWorks: [],
    inPractice: [],
    actionLinks: OUS_ACTIONS,
    regulatoryMd: DRIVEWIRE_IFU,
    referencesMd: "",
  },
];
