/**
 * Therapy pages, hand-structured from the Duda crawl (content/raw/*).
 * One entry per (slug, region). Media still points at the Duda CDN;
 * scripts/migrate-media.ts pulls everything into our storage and rewrites.
 *
 * Duda site ids:  be427182 = www · 9d0280ee = us · 8b5f57de = ous · 48595db0 = apac
 */
import type { Region, Benefit, Step, InPracticeItem, ActionLink } from "../../src/db/schema";

export type SolutionSeed = {
  slug: string;
  region: Region;
  product: string;
  sortOrder: number;
  navLabel: string;
  breadcrumb: string;
  metaTitle: string;
  metaDescription: string;
  heroTitle: string;
  heroBody: string;
  heroImageUrl?: string;
  heroVideoUrl?: string;
  heroCta?: ActionLink;
  introTitle?: string;
  introBody?: string;
  introImageUrl?: string;
  introVideoUrl?: string;
  benefits: Benefit[];
  overviewBody: string;
  overviewImageUrl?: string;
  specImageUrls: string[];
  specNote?: string;
  howItWorks: Step[];
  inPractice: InPracticeItem[];
  actionLinks: ActionLink[];
  actionNote?: string;
  webinarCtaEnabled?: boolean;
  closingTitle?: string;
  closingBody?: string;
  closingEmbedUrl?: string;
  regulatoryMd: string;
  referencesMd: string;
};

const IMG = (site: string, p: string) => `https://irp.cdn-website.com/${site}/dms3rep/multi/${p}`;
const VID = (site: string, p: string) => `https://vid.cdn-website.com/${site}/videos/${p}`;
const FILE = (site: string, p: string) => `https://irp.cdn-website.com/${site}/files/uploaded/${p}`;
const US = "9d0280ee", OUS = "8b5f57de", APAC = "48595db0";

/* ------------------------------------------------------------------ */
/*  Shared TIGERTRIEVER content                                          */
/* ------------------------------------------------------------------ */

const tigerBenefits = (site: string): Benefit[] => [
  {
    eyebrow: "Gain active",
    title: "control",
    body: "Unlike conventional stent retrievers, active thrombectomy can improve clot penetration¹ and facilitate smooth retrieval with adjustable radial force.",
    videoUrl: VID(site, "i7x3QkN4SCmElyjtyiDA_RAPID-MEDICAL_01_TIGERTRIEVER-LOGO_720_LOOP-v.mp4"),
  },
  {
    eyebrow: "Accelerate",
    title: "thrombectomy",
    body: "Two million brain cells die every minute. TIGERTRIEVER™ saves minutes when removing the clot – with reported procedure times faster than the leading competitors.",
    footnote: "Speed matters – TIGER Trial showed quicker time to reperfusion than using aspiration alone.",
    videoUrl: VID(site, "Ysj0VQoCRIS60VWmLvzj_Tiger+Stair+graph_animated-v.mp4"),
  },
  {
    eyebrow: "The 1st pass",
    title: "should be the last",
    body: "Adjustability handles patient variability in real-time. TIGERTRIEVER™ has high first-pass success (FPE) and low emboli to new territory (ENT), outperforming competitors in challenging procedures involving stenosis, hard clot, and tortuosity in patients with intracranial atherosclerosis (ICAD).",
    imageUrl: IMG(site, "opt/Screenshot+2025-05-08+at+12.39.08-PM-1920w.png"),
    videoUrl: VID(site, site === OUS ? "DDCXTnSRSCmasu6QIGlU_TIGER+graph_website_3-v.mp4" : "j4Uo8taSRCv4Ch0EW7r1_TIGER+graph_website-v.mp4"),
  },
];

const tigerSteps = (site: string): Step[] => [
  { title: "PENETRATE", body: "the clot with active integration", videoUrl: VID(site, "067J7P1fRCGyilO6KPCe_HowTo_1-v.mp4") },
  { title: "ADJUST", body: "with complete visibility", videoUrl: VID(site, "0saPDx9aSyyoIoj5zk9d_HowTo_2-v.mp4") },
  { title: "RELAX", body: "to relieve vessel traction", videoUrl: VID(site, "sjIQ67SJQYupyII8PBjC_HowTo_3-v.mp4") },
];

const TIGER_YOUTUBE = "https://www.youtube.com/embed/ja2bTvMJRLs";

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

const MVO_REFERENCES = `1. Waqas M, Kuo CC, Dossani RH, et al. Mechanical thrombectomy versus intravenous thrombolysis for distal large-vessel occlusion: a systematic review and meta-analysis of observational studies. Neurosurg Focus. 2021;51(1):E5. doi:10.3171/2021.4.FOCUS21139
2. Ospel JM, Menon BK, Demchuk AM, et al. Clinical Course of Acute Ischemic Stroke Due to Medium Vessel Occlusion With and Without Intravenous Alteplase Treatment. Stroke. 2020;51(11):3232-3240. doi:10.1161/STROKEAHA.120.030227
3. Seners P, Turc G, Maier B, Mas JL, Oppenheim C, Baron JC. Incidence and predictors of early recanalization after intravenous thrombolysis: a systematic review and meta-analysis. Stroke. 2016;47:2409-2412.
4-5. Data on file
6. Wang, Maud, et al. "The Anch'Or Harpoon Technique With a Manually Expandable Stentretriever (Tigertriever 13), a Technical Note." Frontiers in Neurology, vol. 13, 2022, p. 934690. doi:10.3389/fneur.2022.934690`;

const mvoBenefits = (site: string, forceVideo: string): Benefit[] => [
  {
    title: "Protect the vessel with TIGERTRIEVER™ 13",
    body: "Most complications occur during retrieval, as tension can cause vessel stretching, pain, and injury. TIGERTRIEVER™ is the only device that can remove force before and during retrieval to reduce the potential for injury.",
    videoUrl: VID(site, "y7kLSI57QYivo26E99wA_Web+-+Vessel+displacement+video+-+edit-v.mp4"),
  },
  {
    eyebrow: "The comfort",
    title: "of control",
    body: "Traditional 3 mm stent retrievers exert higher forces as vessels narrow. Active thrombectomy with TIGERTRIEVER™ 13 adjusts to meet the constraints of the anatomy.",
    footnote: "Adjust to the anatomy with TIGER 13. Deliver and retrieve with the lowest forces.⁴˒⁵",
    videoUrl: VID(site, forceVideo),
    imageUrl: site === APAC ? IMG(APAC, "opt/Comfort_feather-1920w.png") : undefined,
  },
  {
    title: "Go the distals",
    body: "Simplify distal reach and tortuous paths with 30% lower delivery profile & delivery force than other 3 mm retrievers.⁴",
    imageUrl: site === APAC ? IMG(APAC, "opt/go-the-distals-graohic-1920w.png") : IMG(OUS, "opt/go-the-distals-graohic-1920w_f-1920w.webp"),
  },
];

/* ------------------------------------------------------------------ */
/*  Shared COMANECI content                                              */
/* ------------------------------------------------------------------ */

const comaneciBenefits = (site: string, bloodFlowVideo: string, comparisonHref: string, successHref: string): Benefit[] => [
  {
    eyebrow: "Stability doesn't",
    title: "require implants",
    body: "The temporary deployment of COMANECI™ provides the long-term support of a stent, achieving high packing density and 85% immediate complete occlusion compared to 79% with stent-assisted coiling.¹",
    footnote: "Avoiding implants like stents is preferable to allow the brain to heal naturally and minimize long-term stroke risks and bleeding complications.",
    imageUrl: IMG(site, "2_COMANECI+Aneurism-Stability.gif"),
  },
  {
    eyebrow: "Continuous",
    title: "blood supply",
    body: "Unlike balloons, COMANECI™ provides support without blocking blood flow to the brain. Clinicians can focus on accurate placement rather than the countdown to an ischemic event. COMANECI™ demonstrates the highest complete occlusion and lowest complication rates.",
    videoUrl: bloodFlowVideo,
    link: { label: "See the comparison", href: comparisonHref },
  },
  {
    eyebrow: "Leaves no trace —",
    title: "except SUCCESS",
    body: "95% successful long-term occlusion and 1% retreatment rates show the lasting durability of treatment with COMANECI in both ruptured and unruptured wide-neck aneurysms.²",
    imageUrl: IMG(site, "opt/chart-image-1920w.png"),
    link: { label: "Unlock SUCCESS: The prospective study data", href: successHref },
  },
];

const COMANECI_STEPS: Step[] = [
  { title: "DEPLOY", body: "After positioning the catheters, deploy the 1st coil loop; then deploy COMANECI.", videoUrl: VID(APAC, "jLzXBp2RKNRvIZg3kNSw_How+to+1-v.mp4") },
  { title: "CONTINUE COILING", body: "Close and re-expand COMANECI before detaching each coil.", videoUrl: VID(APAC, "F9cU7UdsSGSFNYolsjWT_How+to+2-v.mp4") },
  { title: "REMOVE", body: "Remove the coiling catheter with COMANECI expanded. Remove COMANECI.", videoUrl: VID(APAC, "ExjqBNiTbuoBPClyXqvw_How+to+3-v.mp4") },
];

const COMANECI_REFERENCES = `\\*90 consecutive patients in the U.S.

1. Lim, Jaims et al. "Coiling Variations for Treatment of Ruptured Intracranial Aneurysms: A Meta-Analytical Comparison of Comaneci-, Stent-, and Balloon-Coiling Assistance Techniques." World neurosurgery vol. 175 (2023): e1324-e1340. doi:10.1016/j.wneu.2023.05.008
2. Jason M. Davies et al. Final Results of the SUCCESS Study presented at the ESMINT Congress; September 5, 2024; Marseille, France.
3. Comparison with a Balt Eclipse 6x7 mm`;

const vasoBenefits = (site: string, bloodFlowVideo: string, comparisonHref: string): Benefit[] => [
  {
    eyebrow: "Restore the flow with",
    title: "active control",
    body: "Unlike other angioplasty devices, COMANECI's active technology offers precise control over vessel dilation with full visibility, potentially reducing the risk of vessel injury.¹˒²",
    footnote: "Gradual expansion can achieve similar results as high-impact balloons – with less damage to the vessel.³",
    imageUrl: IMG(site, "opt/Com+VS+radial+force+comp-1920w.png"),
    videoUrl: VID(site, "rRCzwiTS2JXz3BOhSARg_Com+VS+stair+graph+v2-v.mp4"),
  },
  {
    eyebrow: "Continuous",
    title: "blood supply",
    body: "Unlike balloons, COMANECI provides support without blocking blood flow to the brain. Clinicians can focus on accurate placement rather than the countdown to an ischemic event. COMANECI demonstrates the highest complete occlusion and lowest complication rates.",
    videoUrl: bloodFlowVideo,
    link: { label: "See the comparison", href: comparisonHref },
  },
  {
    eyebrow: "Enable",
    title: "combination therapy",
    body: "The patent design of COMANECI allows dual treatment — mechanical dilation plus the concurrent infusion of vasodilators. Synergistic action may enhance efficacy compared to a single treatment.",
  },
  {
    eyebrow: "The proof is in",
    title: "the patients",
    body: "In a multicenter study, severe vessel constriction improved significantly, with 52% of patients achieving favorable outcomes at 6 months.²",
    imageUrl: IMG(site, "opt/vasospasm-stats-1920w.jpg"),
    link: { label: "Unlock the data", href: "https://jnis.bmj.com/content/15/9/864" },
  },
];

const VASO_STEPS: Step[] = [
  { title: "TREAT", body: "distal → proximal", imageUrl: IMG(OUS, "opt/Step+1_vaso-1920w.png") },
  { title: "Gradually EXPAND", body: "COMANECI™", imageUrl: IMG(OUS, "opt/Step+2_vaso-1920w.png") },
  { title: "WAIT", body: "for dilation – on average 2.5 minutes (range 30 sec – 5 min).⁵", imageUrl: IMG(OUS, "opt/Step+3_vaso-1920w.png") },
];

const VASO_REFERENCES = `1. Kassell NF, Sasaki T, Colohan AR, Nazar G. Cerebral vasospasm following aneurysmal subarachnoid hemorrhage. Stroke. 1985;16(4):562-572. doi:10.1161/01.str.16.4.562
2. Salem MM, Khalife J, Desai S, et al. COManeci MechANical Dilation for vasospasm (COMMAND): multicenter experience. J Neurointerv Surg. 2023;15(9):864-870. doi:10.1136/jnis-2022-019272
3. Bhogal P, Pederzani G, Grytsan A, et al. The unexplained success of stentplasty vasospasm treatment: Insights using Mechanistic Mathematical Modeling. Clin Neuroradiol. 2019;29(4):763-774. doi:10.1007/s00062-019-00776-2
4. Data on file
5. Hensler J, Larsen N, Wodarg F, et al. P099 Multi-center study to assess effectiveness of the comaneci device in the treatment of symptomatic cerebral vasospasm following aneurysmal subarachnoid hemorrhage (SAH) – interim results. Journal of NeuroInterventional Surgery 2024;16:A88.`;

const DRIVEWIRE_IFU = `**Indications for Use.** The Drivewire 24 Guidewire is intended for general intravascular use, including the neuro and peripheral vasculature. The Drivewire is intended to facilitate the selective placement of diagnostic or therapeutic catheters. This device is not intended for use in the coronary arteries.

**Contraindications.** Drivewire™ 24 Guidewire is contraindicated for patients with known hypersensitivity to nickel-titanium and patients with stenosis and/or pre-existing stent proximal to the target site that may preclude safe navigation of the device.`;

/* ------------------------------------------------------------------ */
/*  Actions per region                                                   */
/* ------------------------------------------------------------------ */

const ACTIONS: Record<Region, ActionLink[]> = {
  us: [
    { label: "Place an order", href: "mailto:orders.inc@rapid-medical.com?subject=Order%20inquiry" },
    { label: "Ask a product question", href: "/contact-us?region=us&topic=support" },
    { label: "Request an IFU", href: "mailto:customerservice@rapid-medical.com?subject=IFU%20request" },
  ],
  ous: [
    { label: "Place an order", href: "mailto:customerservice@rapid-medical.com?subject=Order%20inquiry" },
    { label: "Ask a product question", href: "/contact-us?region=ous&topic=support" },
    { label: "Request an IFU", href: "mailto:customerservice@rapid-medical.com?subject=IFU%20request" },
  ],
  apac: [
    { label: "Place an order", href: "mailto:customerservice@rapid-medical.com?subject=Order%20inquiry" },
    { label: "Ask a product question", href: "/contact-us?region=apac&topic=support" },
    { label: "Request an IFU", href: "mailto:info@rapid-medical.com?subject=IFU%20request" },
  ],
};

const demo = (r: Region): ActionLink => ({ label: "Request a demo", href: `/contact-us?region=${r}&topic=demo` });
const CLOSING_Q = "Questions? Reach out to learn more about our company and stroke solutions.";

const samaniego = (site: string, img: string): InPracticeItem => ({
  kind: "recording",
  title: "TIGERTRIEVER™ in the treatment of acute ischemic stroke with underlying ICAD",
  person: "Dr. Edgar Samaniego",
  location: "SNIS Annual Meeting (2024)",
  linkUrl: "https://www.youtube.com/watch?v=kdIcJW-QDL4",
  imageUrl: IMG(site, img),
});

/* ================================================================== */
/*  Pages                                                               */
/* ================================================================== */

export const SOLUTIONS: SolutionSeed[] = [
  /* ============================== US ============================== */
  {
    slug: "lvo", region: "us", product: "tigertriever", sortOrder: 1,
    navLabel: "Large vessel stroke", breadcrumb: "OUR SOLUTIONS / LARGE VESSEL STROKE",
    metaTitle: "Neurovascular Therapy | Rapid Medical™ | US",
    metaDescription: "Learn about the TIGERTRIEVER™, an advanced thrombectomy device for stroke treatment. Contact us to improve patient outcomes today!",
    heroTitle: "A patient-centric approach to AIS",
    heroBody: "TIGERTRIEVER™ is the only active thrombectomy device – it is engineered to adapt to patient anatomy. Accelerate clot integration and reduce stress on the brain during mechanical thrombectomy procedures.",
    heroVideoUrl: VID(US, "i7x3QkN4SCmElyjtyiDA_RAPID-MEDICAL_01_TIGERTRIEVER-LOGO_720_LOOP-v.mp4"),
    heroCta: demo("us"),
    benefits: tigerBenefits(US),
    overviewBody: "The world's first and only adjustable stent retriever, TIGERTRIEVER™ is designed with active, responsive technology for patient-specific procedures.",
    overviewImageUrl: IMG(US, "opt/US-LVO-Product-Overview-1920w.jpg"),
    specImageUrls: [IMG(US, "opt/Specifications-Resized-1920w.jpg"), IMG(US, "opt/ChatGPT+Image+Sep+11-+2026-+08_49_40+PM-1920w.png")],
    howItWorks: tigerSteps(US),
    inPractice: [
      { kind: "testimonial", title: "TIGERTRIEVER – A “next generation device”", person: "Dr. Shahram Majidi", location: "New York, NY", linkUrl: "https://youtu.be/ZCslloX6Ei0", imageUrl: IMG(US, "opt/DrMajidi-1920w.png") },
      { kind: "case", title: "First-pass TICI 3 following treatment with TIGERTRIEVER™", person: "Dr. Rishi Gupta", location: "Marietta, GA", linkUrl: "#", imageUrl: IMG(US, "opt/Clot-1920w.png") },
      samaniego(US, "opt/DrSamaniego-1920w.png"),
    ],
    actionLinks: ACTIONS.us,
    actionNote: "Canada: orders.canada@rapid-medical.com",
    closingTitle: "Active thrombectomy tailors the procedure to the patient.",
    closingBody: CLOSING_Q,
    closingEmbedUrl: TIGER_YOUTUBE,
    regulatoryMd: TIGER_IFU_US,
    referencesMd: TIGER_REFERENCES,
  },
  {
    slug: "aneurysm", region: "us", product: "comaneci", sortOrder: 2,
    navLabel: "Aneurysm", breadcrumb: "OUR SOLUTIONS / ANEURYSM",
    metaTitle: "Neurovascular Therapy for Aneurysms | Rapid Medical™ | US",
    metaDescription: "COMANECI™ is the only non-occlusive and temporary assist device for wide-neck aneurysm treatment.",
    heroTitle: "Bridging the gap in assist devices",
    heroBody: "COMANECI™ is the only non-occlusive and temporary device for wide-neck aneurysm treatment.",
    heroImageUrl: IMG(US, "3670-Rapid-Medical-COMANECI-Expand---Compress-Dynamic-V1_HIGHRES_Transparent.gif"),
    heroCta: demo("us"),
    introBody: "Minimize the risk and disruption to patients' lives with lasting results. COMANECI™ is the first active assist device – its added user control overcomes the limitations of conventional balloons and stents.",
    benefits: comaneciBenefits(US, VID(US, "xTssjdbXR6QAyB451i8m_Comaneci+Blood+Flow-v.mp4"), "/us/see-the-comparison", "/us/success-study-final-results"),
    overviewBody: "COMANECI™ is designed with active, responsive technology to enable non-occlusive coil embolization procedures.",
    // NOTE: live US page embeds OUS overview/spec images – reproduced as-is, flagged in README.
    overviewImageUrl: IMG(OUS, "opt/OUS-Aneurysm-Product-Overview-1920w.jpg"),
    specImageUrls: [IMG(OUS, "opt/OUS-Aneurysm-Specifications-1920w.jpg"), IMG(OUS, "opt/OUS_APAC_Product+Overview_chart-1920w.png")],
    howItWorks: COMANECI_STEPS,
    inPractice: [
      { kind: "case", title: "COMANECI case summary", person: "Dr. Josh Abecassis", linkUrl: FILE(US, "Abecassis_case+summary+1+.pdf"), imageUrl: IMG(US, "opt/COMANECI-testimonial-1-1920w.jpg") },
      { kind: "case", title: "Y-Stent technique using dual COMANECI devices", linkUrl: "https://pubmed.ncbi.nlm.nih.gov/38578712/", imageUrl: IMG(US, "opt/COMANECI-testimonial-2-1920w.png") },
      { kind: "testimonial", title: "COMANECI in practice", linkUrl: "/us/success-study-final-results", imageUrl: IMG(US, "opt/COMANECI-testimonial-3-1920w.png") },
    ],
    actionLinks: [
      { label: "Place an order", href: "mailto:orders.inc@rapid-medical.com" },
      { label: "Ask a product question", href: "/contact-us?region=us&topic=support" },
      { label: "Request an IFU", href: "mailto:info@rapid-medical.com?subject=IFU%20request" },
    ],
    closingBody: CLOSING_Q,
    regulatoryMd: "",
    referencesMd: COMANECI_REFERENCES,
  },
  {
    slug: "access", region: "us", product: "drivewire", sortOrder: 3,
    navLabel: "Access", breadcrumb: "OUR SOLUTIONS / ACCESS",
    metaTitle: "Active Access | DRIVEWIRE™ Steerable Guidewire | Rapid Medical™ | US",
    metaDescription: "DRIVEWIRE™ – the world's first steerable neurovascular guidewire.",
    heroTitle: "Active access",
    heroBody: "DRIVEWIRE™ redefines access. Active technology enables distal steering to select vessels and navigate a large range of catheters with ease.",
    heroImageUrl: IMG(US, "opt/RM_Drivewire-Ad_Graphic-V2-1920w.png"),
    heroCta: demo("us"),
    benefits: [{ title: "Steer with precision", body: "", imageUrl: IMG(US, "opt/Drivewire_middle-diagram-1920w.png") }],
    overviewBody: "",
    specImageUrls: [IMG(US, "opt/Drivewire-Chart-1920w.png")],
    howItWorks: [], inPractice: [],
    actionLinks: ACTIONS.us, actionNote: "Canada: orders.canada@rapid-medical.com",
    webinarCtaEnabled: false,
    regulatoryMd: DRIVEWIRE_IFU, referencesMd: "",
  },

  /* ============================== OUS ============================= */
  {
    slug: "lvo", region: "ous", product: "tigertriever", sortOrder: 1,
    navLabel: "Large vessel stroke", breadcrumb: "OUR SOLUTIONS / LARGE VESSEL STROKE",
    metaTitle: "Neurovascular Therapy | Rapid Medical™ | OUS",
    metaDescription: "Learn about the TIGERTRIEVER™, an advanced thrombectomy device for stroke treatment.",
    heroTitle: "A patient-centric approach to AIS",
    heroBody: "TIGERTRIEVER™ is the only active thrombectomy device – it is engineered to adapt to patient anatomy. Accelerate clot integration and reduce stress on the brain during mechanical thrombectomy procedures.",
    heroVideoUrl: VID(OUS, "636q06j9Tiq4QNRHY6i7_tigerface+wide-v.mp4"),
    heroCta: demo("ous"),
    benefits: tigerBenefits(OUS),
    overviewBody: "The world's first and only adjustable stent retriever, TIGERTRIEVER™ is designed with active, responsive technology for patient-specific procedures.",
    overviewImageUrl: IMG(OUS, "opt/OUS-LVO-Product-Overview-1920w.jpg"),
    specImageUrls: [IMG(OUS, "opt/Specifications-1920w.jpg"), IMG(OUS, "opt/OUS_LVO_Product+Overview-1920w.png")],
    howItWorks: tigerSteps(OUS),
    inPractice: [
      { kind: "case", title: "Double TIGER case", linkUrl: FILE(OUS, "Marie_DoubleTIGER_Case.pdf"), imageUrl: IMG(OUS, "opt/Solutions-OUS-1-1920w.png") },
      { kind: "case", title: "TIGERTRIEVER™ 25 first case", linkUrl: FILE(OUS, "Meirovitch_T25_first+case.pdf"), imageUrl: IMG(OUS, "opt/Solutions-OUS-2-1920w.png") },
      samaniego(OUS, "opt/Solutions-OUS-3-1920w.png"),
    ],
    actionLinks: ACTIONS.ous,
    closingTitle: "Active thrombectomy tailors the procedure to the patient.",
    closingBody: CLOSING_Q,
    closingEmbedUrl: TIGER_YOUTUBE,
    regulatoryMd: "", referencesMd: TIGER_REFERENCES,
  },
  {
    slug: "mvo", region: "ous", product: "tigertriever-13", sortOrder: 2,
    navLabel: "Medium vessel stroke", breadcrumb: "OUR SOLUTIONS / MEDIUM VESSEL STROKE",
    metaTitle: "Medium Vessel Stroke | TIGERTRIEVER™ 13 | Rapid Medical™ | OUS",
    metaDescription: "TIGERTRIEVER™ 13 goes further in the brain to be tough on clots and gentle on the vessels.",
    heroTitle: "The only device designed for distals",
    heroBody: "TIGERTRIEVER™ 13 goes further in the brain to be tough on clots and gentle on the vessels.",
    heroVideoUrl: VID(OUS, "kyPILWv5TcOjXPybGxxQ_T13+Tiger+wireframe+walk+16x9-v.mp4"),
    heroCta: demo("ous"),
    introBody: "Strokes in smaller arteries can still cause disabling deficits, and clot-dissolving drugs work less than half the time.¹˒²˒³ Yet, these vessels are at increased risk for hemorrhage during treatment.",
    introVideoUrl: VID(OUS, "j8TyZBRvQ6jQsbJILm0Z_tigerwide-v.mp4"),
    benefits: [
      ...mvoBenefits(OUS, "jiIhPkczR4WrQZiiV7dD_Copy+of+Web+-+Force+comps-v.mp4"),
      {
        eyebrow: "Advancing the field of stroke", title: "The DISTALS Trial",
        body: "Rapid Medical™ has pioneered a new frontier in MVO treatment with randomized evidence demonstrating that TIGERTRIEVER™ 13 significantly improves blood flow to the brain with a strong safety profile compared with medical management. The DISTALS Trial brings long-needed clarity to an underserved market representing nearly half of ischemic strokes.",
        imageUrl: IMG(OUS, "opt/RM_Distals_Tigertriever_Logo_Green-White-2-1920w.png"),
        link: { label: "View the results", href: "/distals-results" },
      },
    ],
    overviewBody: "The world's first and only adjustable stent retriever, TIGERTRIEVER™ is designed with active, responsive technology for patient-specific procedures.",
    overviewImageUrl: IMG(OUS, "opt/OUS-MVO-Product-Overview-1920w.jpg"),
    specImageUrls: [IMG(OUS, "opt/Specifications-Resized-1920w.jpg"), IMG(OUS, "opt/OUS_MVO_Product+Overview-1920w.png")],
    howItWorks: tigerSteps(OUS),
    inPractice: [
      { kind: "case", title: "First-pass case report", person: "Dr. Solich", linkUrl: FILE(OUS, "Solich_T13_case.pdf"), imageUrl: IMG(OUS, "opt/First-pass-1920w.png") },
      { kind: "case", title: "First-pass case report", person: "Dr. Brauner", linkUrl: FILE(OUS, "Brauner_T13_case.pdf"), imageUrl: IMG(OUS, "opt/First-pass-3-1920w.png") },
    ],
    actionLinks: ACTIONS.ous,
    closingBody: CLOSING_Q,
    regulatoryMd: "\\*TIGERTRIEVER™ 13 is indicated for LVOs in the US. Refer to Instructions for Use for detailed indications.",
    referencesMd: MVO_REFERENCES,
  },
  {
    slug: "aneurysm", region: "ous", product: "comaneci", sortOrder: 3,
    navLabel: "Aneurysm", breadcrumb: "OUR SOLUTIONS / ANEURYSM",
    metaTitle: "Aneurysm Treatment | Rapid Medical™ | OUS",
    metaDescription: "COMANECI™ is the only non-occlusive and temporary assist device for wide-neck aneurysm treatment.",
    heroTitle: "Bridging the gap in assist devices",
    heroBody: "COMANECI™ is the only non-occlusive and temporary device for wide-neck aneurysm treatment.",
    heroImageUrl: IMG(OUS, "3670-Rapid-Medical-COMANECI-Expand---Compress-Dynamic-V1_HIGHRES_Transparent.gif"),
    heroCta: demo("ous"),
    introBody: "Minimize the risk and disruption to patients' lives with lasting results. COMANECI™ is the first active assist device – its added user control overcomes the limitations of conventional balloons and stents.",
    benefits: comaneciBenefits(OUS, VID(OUS, "YZIbnEVShmzXOfSkqfeP_Comaneci+Blood+Flow-v.mp4"), "/ous/comparison-video", "/ous/success-study-final-results"),
    overviewBody: "COMANECI™ is designed with active, responsive technology to enable non-occlusive coil embolization procedures.",
    overviewImageUrl: IMG(OUS, "opt/OUS-Aneurysm-Product-Overview-1920w.jpg"),
    specImageUrls: [IMG(OUS, "opt/OUS-Aneurysm-Specifications-1920w.jpg"), IMG(OUS, "opt/OUS_APAC_Product+Overview_chart-1920w.png")],
    howItWorks: COMANECI_STEPS,
    inPractice: [
      { kind: "case", title: "COMANECI case report – giant ICA aneurysm", person: "Dr. Patankar", linkUrl: FILE(OUS, "Patankar_COMANECI+case+report_giant+ICA+AN.pdf"), imageUrl: IMG(OUS, "opt/Aneurysym+slider-1-1920w.png") },
      { kind: "case", title: "Y-Stent technique using dual COMANECI devices", linkUrl: "https://pubmed.ncbi.nlm.nih.gov/38578712/", imageUrl: IMG(OUS, "opt/Aneurysym+slider-2-1920w.png") },
      { kind: "case", title: "COMANECI spinal case", person: "Dr. Patankar", linkUrl: "/ous/comaneci-spinal-case-patankar", imageUrl: IMG(OUS, "opt/Aneurysym+slider-3-1920w.png") },
      { kind: "testimonial", title: "COMANECI in practice", linkUrl: "/ous/success-study-final-results", imageUrl: IMG(OUS, "opt/Aneurysym+slider-4-1920w.png") },
    ],
    actionLinks: [
      { label: "Place an order", href: "mailto:info@rapid-medical.com?subject=Order%20inquiry" },
      { label: "Ask a product question", href: "/contact-us?region=ous&topic=support" },
      { label: "Request an IFU", href: "mailto:info@rapid-medical.com?subject=IFU%20request" },
    ],
    closingBody: CLOSING_Q,
    regulatoryMd: "", referencesMd: COMANECI_REFERENCES,
  },
  {
    slug: "vasospasm", region: "ous", product: "comaneci", sortOrder: 4,
    navLabel: "Vasospasm", breadcrumb: "OUR SOLUTIONS / VASOSPASM",
    metaTitle: "Cerebral Vasospasm Therapy | Rapid Medical™ | OUS",
    metaDescription: "COMANECI™ is the only active assist device with the versatility to treat wide-neck aneurysms and restore arteries in vasospasm.",
    heroTitle: "Take command in vasospasm",
    heroBody: "COMANECI™ is the only active assist device with the versatility to treat wide-neck aneurysms and restore arteries in vasospasm, providing results without permanent implants.",
    heroVideoUrl: VID(OUS, "IVrIJ8XYRkCmpOUJNFsI_Hero_vessel+animation-v.mp4"),
    heroCta: demo("ous"),
    introBody: "Cerebral vasospasm is an orphan disease, and leading cause of death and disability following subarachnoid haemorrhage (SAH)¹˒², yet lacks a defined treatment strategy. COMANECI is the first device to receive FDA breakthrough designation to provide options for these patients.",
    benefits: vasoBenefits(OUS, VID(OUS, "GqX322JIQRe3C0ZglhEd_Comaneci+Blood+Flow_VASO+%28OUS+%2B+APAC%29-v.mp4"), "/ous/comparison-video"),
    overviewBody: "COMANECI™ is designed with active, responsive technology to enable non-occlusive coil embolization procedures.",
    overviewImageUrl: IMG(OUS, "opt/OUS-Vasospasm-Product-Overview-D2-d9c9896b-1920w.jpg"),
    specImageUrls: [IMG(OUS, "opt/COMANEC-Specs-1920w.jpg"), IMG(OUS, "opt/Vasospasm+chart-1920w.png")],
    howItWorks: VASO_STEPS,
    inPractice: [
      { kind: "case", title: "COMANECI for vasospasm", person: "Dr. Tufail", linkUrl: "/ous/comaneci-for-vasospasm", imageUrl: IMG(OUS, "opt/dr+tufail-1920w.png") },
      { kind: "testimonial", title: "COMANECI for vasospasm", person: "Dr. Svetlana", linkUrl: "/ous/comaneci-for-vasospasm", imageUrl: IMG(OUS, "opt/DrSVETLANA-1920w.png") },
    ],
    actionLinks: [
      { label: "Place an order", href: "mailto:info@rapid-medical.com?subject=Order%20inquiry" },
      { label: "Ask a product question", href: "/contact-us?region=ous&topic=support" },
      { label: "Request an IFU", href: "mailto:infousa@rapid-medical.com?subject=IFU%20request" },
    ],
    closingBody: CLOSING_Q,
    regulatoryMd: "", referencesMd: VASO_REFERENCES,
  },
  {
    slug: "access", region: "ous", product: "drivewire", sortOrder: 5,
    navLabel: "Access", breadcrumb: "OUR SOLUTIONS / ACCESS",
    metaTitle: "Active Access | DRIVEWIRE™ Steerable Guidewire | Rapid Medical™ | OUS",
    metaDescription: "DRIVEWIRE™ – the world's first steerable neurovascular guidewire.",
    heroTitle: "Active access",
    heroBody: "DRIVEWIRE™ redefines access. Active technology enables distal steering to select vessels and navigate a large range of catheters with ease.",
    heroImageUrl: IMG(OUS, "opt/RM_Drivewire-Ad_Graphic-V2-1920w.png"),
    heroCta: demo("ous"),
    benefits: [{ title: "Steer with precision", body: "", imageUrl: IMG(OUS, "opt/Drivewire_middle+diagram-5944d55f-1920w.png") }],
    overviewBody: "",
    specImageUrls: [IMG(OUS, "opt/OUS_Drivewire+chart_Product+Overview-1920w.jpg")],
    howItWorks: [], inPractice: [],
    actionLinks: ACTIONS.ous, webinarCtaEnabled: false,
    regulatoryMd: DRIVEWIRE_IFU, referencesMd: "",
  },

  /* ============================== APAC ============================ */
  {
    slug: "lvo", region: "apac", product: "tigertriever", sortOrder: 1,
    navLabel: "Large vessel stroke", breadcrumb: "OUR SOLUTIONS / LARGE VESSEL STROKE",
    metaTitle: "Neurovascular Therapy | Rapid Medical™ | APAC",
    metaDescription: "Learn about the TIGERTRIEVER™, an advanced thrombectomy device for stroke treatment.",
    heroTitle: "A patient-centric approach to AIS",
    heroBody: "TIGERTRIEVER™ is the only active thrombectomy device – it is engineered to adapt to patient anatomy. Accelerate clot integration and reduce stress on the brain during mechanical thrombectomy procedures.",
    heroImageUrl: IMG(APAC, "3666+TT13+Expand+-+Compress+Dynamic+V3_HIGHRES.gif"),
    heroCta: demo("apac"),
    introImageUrl: IMG(APAC, "opt/TT_Revised-Base_V4-1920w.png"),
    benefits: tigerBenefits(APAC),
    overviewBody: "The world's first and only adjustable stent retriever, TIGERTRIEVER™ is designed with active, responsive technology for patient-specific procedures.",
    overviewImageUrl: IMG(APAC, "opt/Product-Overview-US-1920w.jpg"),
    specImageUrls: [IMG(APAC, "opt/Specifications-1920w.jpg"), IMG(APAC, "opt/chart-1920w.png")],
    howItWorks: tigerSteps(APAC),
    inPractice: [
      { kind: "case", title: "Double TIGER case", linkUrl: FILE(APAC, "Marie_DoubleTIGER_Case.pdf"), imageUrl: IMG(APAC, "opt/Solutions-OUS-1-1920w.png") },
      { kind: "case", title: "TIGERTRIEVER™ 25 first case", linkUrl: FILE(APAC, "Meirovitch_T25_first+case.pdf"), imageUrl: IMG(APAC, "opt/Solutions-OUS-2-1920w.png") },
      samaniego(APAC, "opt/Solutions-OUS-3-1920w.png"),
    ],
    actionLinks: ACTIONS.apac,
    closingTitle: "Active thrombectomy tailors the procedure to the patient.",
    closingBody: CLOSING_Q,
    closingEmbedUrl: TIGER_YOUTUBE,
    regulatoryMd: "", referencesMd: TIGER_REFERENCES,
  },
  {
    slug: "mvo", region: "apac", product: "tigertriever-13", sortOrder: 2,
    navLabel: "Medium vessel stroke", breadcrumb: "OUR SOLUTIONS / MVO (TIGERTRIEVER™ 13)",
    metaTitle: "Medium Vessel Stroke | TIGERTRIEVER™ 13 | Rapid Medical™ | APAC",
    metaDescription: "TIGERTRIEVER™ 13 goes further in the brain to be tough on clots and gentle on the vessels.",
    heroTitle: "The only device designed for distals",
    heroBody: "TIGERTRIEVER™ 13 goes further in the brain to be tough on clots and gentle on the vessels.",
    heroVideoUrl: VID(APAC, "kyPILWv5TcOjXPybGxxQ_T13+Tiger+wireframe+walk+16x9-v.mp4"),
    heroCta: demo("apac"),
    introBody: "Strokes in smaller arteries can still cause disabling deficits, and clot-dissolving drugs work less than half the time.¹˒²˒³ Yet, these vessels are at increased risk for hemorrhage during treatment.",
    benefits: [
      ...mvoBenefits(APAC, "Fg4CCSs0Th2cG2aEEhR0_Delivery_Retrieveral_Force+comps-v.mp4"),
      {
        eyebrow: "Advancing the field of stroke", title: "The DISTALS Trial",
        body: "Rapid Medical™ is pioneering a new frontier to offer treatment to patients suffering from medium vessel strokes. In addition to engineering devices to the unique requirements of distal vessels, Rapid Medical is sponsoring the DISTALS trial – the first randomized study of thrombectomy in medium vessel occlusions. Together with clinicians, the company is expanding what's possible for the medical field and patients who suffer from this debilitating disease.",
        link: { label: "Learn more", href: "https://clinicaltrials.gov/study/NCT05152524" },
      },
    ],
    overviewBody: "The world's first and only adjustable stent retriever, TIGERTRIEVER™ is designed with active, responsive technology for patient-specific procedures.",
    overviewImageUrl: IMG(APAC, "opt/Product-Overview-US-1920w.jpg"),
    specImageUrls: [IMG(APAC, "opt/Specifications-Resized-1920w.jpg"), IMG(APAC, "opt/chart-1920w.png")],
    howItWorks: tigerSteps(APAC),
    inPractice: [
      { kind: "case", title: "First-pass case report", person: "Dr. Solich", linkUrl: FILE(APAC, "Solich_T13_case.pdf"), imageUrl: IMG(APAC, "opt/First-pass-1920w.png") },
      { kind: "case", title: "First-pass case report", person: "Dr. Brauner", linkUrl: FILE(APAC, "Brauner_T13_case.pdf"), imageUrl: IMG(APAC, "opt/First-pass-3-1920w.png") },
    ],
    actionLinks: [
      { label: "Place an order", href: "mailto:info@rapid-medical.com?subject=Order%20inquiry" },
      { label: "Ask a product question", href: "/contact-us?region=apac&topic=support" },
      { label: "Request an IFU", href: "mailto:info@rapid-medical.com?subject=IFU%20request" },
    ],
    closingBody: CLOSING_Q,
    regulatoryMd: "\\*TIGERTRIEVER™ 13 is indicated for LVOs in the US. Refer to Instructions for Use for detailed indications.",
    referencesMd: MVO_REFERENCES,
  },
  {
    slug: "aneurysm", region: "apac", product: "comaneci", sortOrder: 3,
    navLabel: "Aneurysm", breadcrumb: "OUR SOLUTIONS / ANEURYSM",
    metaTitle: "Aneurysm Treatment | COMANECI™ | Rapid Medical™ | APAC",
    metaDescription: "COMANECI™ is the only non-occlusive and temporary assist device for wide-neck aneurysm treatment.",
    heroTitle: "Bridging the gap in assist devices",
    heroBody: "COMANECI™ is the only non-occlusive and temporary device for wide-neck aneurysm treatment.",
    heroImageUrl: IMG(APAC, "3670-Rapid-Medical-COMANECI-Expand---Compress-Dynamic-V1_HIGHRES_Transparent.gif"),
    heroCta: demo("apac"),
    introBody: "Minimize the risk and disruption to patients' lives with lasting results. COMANECI™ is the first active assist device – its added user control overcomes the limitations of conventional balloons and stents.",
    benefits: comaneciBenefits(APAC, VID(APAC, "PUkQzKDTSRmfvkcm26oF_RAPID-MEDICAL_07_Comaneci-Blood-Flow-v.mp4"), "/apac/see-the-comparison", "/apac/success-study-final-results"),
    overviewBody: "COMANECI™ is designed with active, responsive technology to enable non-occlusive coil embolization procedures.",
    overviewImageUrl: IMG(OUS, "opt/OUS-Aneurysm-Product-Overview-1920w.jpg"),
    specImageUrls: [IMG(OUS, "opt/OUS-Aneurysm-Specifications-1920w.jpg"), IMG(OUS, "opt/OUS_APAC_Product+Overview_chart-1920w.png")],
    howItWorks: COMANECI_STEPS,
    inPractice: [
      { kind: "case", title: "COMANECI case report – giant ICA aneurysm", person: "Dr. Patankar", linkUrl: FILE(OUS, "Patankar_COMANECI+case+report_giant+ICA+AN.pdf"), imageUrl: IMG(OUS, "opt/Aneurysym+slider-1-1920w.png") },
      { kind: "case", title: "Y-Stent technique using dual COMANECI devices", linkUrl: "https://pubmed.ncbi.nlm.nih.gov/38578712/", imageUrl: IMG(OUS, "opt/Aneurysym+slider-2-1920w.png") },
    ],
    actionLinks: [
      { label: "Place an order", href: "mailto:info@rapid-medical.com?subject=Order%20inquiry" },
      { label: "Ask a product question", href: "/contact-us?region=apac&topic=support" },
      { label: "Request an IFU", href: "mailto:info@rapid-medical.com?subject=IFU%20request" },
    ],
    closingBody: CLOSING_Q,
    regulatoryMd: "", referencesMd: COMANECI_REFERENCES,
  },
  {
    slug: "vasospasm", region: "apac", product: "comaneci", sortOrder: 4,
    navLabel: "Vasospasm", breadcrumb: "OUR SOLUTIONS / VASOSPASM",
    metaTitle: "Vasospasm Treatment | Rapid Medical™ | APAC",
    metaDescription: "COMANECI™ is the only active assist device with the versatility to treat wide-neck aneurysms and restore arteries in vasospasm.",
    heroTitle: "Take command in vasospasm",
    heroBody: "COMANECI™ is the only active assist device with the versatility to treat wide-neck aneurysms and restore arteries in vasospasm, providing results without permanent implants.",
    heroVideoUrl: VID(APAC, "IVrIJ8XYRkCmpOUJNFsI_Hero_vessel+animation-v.mp4"),
    heroCta: demo("apac"),
    introBody: "Cerebral vasospasm is an orphan disease, and leading cause of death and disability following subarachnoid hemorrhage (SAH),¹˒² yet lacks a defined treatment strategy. COMANECI is the first device to receive FDA breakthrough designation to provide options for these patients.",
    benefits: vasoBenefits(APAC, VID(APAC, "y43C1qcTyG3YURCUX3gA_3_RAPID-MEDICAL_07_Comaneci-Blood-Flow+%28circle+format%29+resized-v.mp4"), "/apac/see-the-comparison"),
    overviewBody: "COMANECI™ is designed with active, responsive technology to enable non-occlusive coil embolization procedures.",
    overviewImageUrl: IMG(OUS, "opt/OUS-Vasospasm-Product-Overview-D2-d9c9896b-1920w.jpg"),
    specImageUrls: [IMG(OUS, "opt/COMANEC-Specs-1920w.jpg"), IMG(OUS, "opt/Vasospasm+chart-1920w.png")],
    howItWorks: VASO_STEPS,
    inPractice: [{ kind: "case", title: "COMANECI for vasospasm", person: "Dr. Tufail", linkUrl: "/apac/comaneci-for-vasospasm", imageUrl: IMG(OUS, "opt/dr+tufail-1920w.png") }],
    actionLinks: [
      { label: "Place an order", href: "mailto:info@rapid-medical.com?subject=Order%20inquiry" },
      { label: "Ask a product question", href: "/contact-us?region=apac&topic=support" },
      { label: "Request an IFU", href: "mailto:info@rapid-medical.com?subject=IFU%20request" },
    ],
    closingBody: CLOSING_Q,
    regulatoryMd: "", referencesMd: VASO_REFERENCES,
  },
  {
    slug: "access", region: "apac", product: "drivewire", sortOrder: 5,
    navLabel: "Access", breadcrumb: "OUR SOLUTIONS / ACCESS",
    metaTitle: "Active Access | DRIVEWIRE™ Steerable Guidewire | Rapid Medical™ | APAC",
    metaDescription: "DRIVEWIRE™ – the world's first steerable neurovascular guidewire.",
    heroTitle: "Active access",
    heroBody: "DRIVEWIRE™ redefines access. Active technology enables distal steering to select vessels and navigate a large range of catheters with ease.",
    heroImageUrl: IMG(APAC, "opt/RM_Drivewire-Ad_Graphic-V2-1920w.png"),
    heroCta: demo("apac"),
    benefits: [{ title: "Steer with precision", body: "", imageUrl: IMG(APAC, "opt/Drivewire+graphic-1920w.png") }],
    overviewBody: "",
    specImageUrls: [IMG(APAC, "opt/OUS_Drivewire+chart_Product+Overview-1920w.jpg")],
    howItWorks: [], inPractice: [],
    actionLinks: ACTIONS.apac, webinarCtaEnabled: false,
    regulatoryMd: DRIVEWIRE_IFU, referencesMd: "",
  },
];
