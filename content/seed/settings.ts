/** Site-wide settings, lifted from the current Duda sites. */
const WWW = "https://irp.cdn-website.com/be427182/dms3rep/multi";
const VWWW = "https://vid.cdn-website.com/be427182/videos";
const US = "https://irp.cdn-website.com/9d0280ee/dms3rep/multi";
const OUS = "https://irp.cdn-website.com/8b5f57de/dms3rep/multi";
const APAC = "https://irp.cdn-website.com/48595db0/dms3rep/multi";

const THERAPIES_INTRO = "The only active devices that provide interventional physicians with greater treatment options and the ability to tailor endovascular procedures to every patient.";
const ISCHEMIC = "87% of all strokes are ischemic and caused by a blood clot that disrupts blood flow in the brain. Active thrombectomy with TIGERTRIEVER™ enables fast revascularization and real-time adjustability for better patient outcomes.";
const HEMORRHAGIC_US = "Hemorrhagic stroke is caused by a blood vessel that ruptures in the brain. COMANECI™ is the only non-occlusive, active assist device to treat wide-neck aneurysms without occluding blood flow or permanent implants.";
const HEMORRHAGIC_OUS = "Hemorrhagic stroke is caused by a blood vessel that ruptures in the brain. COMANECI™ is the only non-occlusive, active assist device with the versatility to treat wide-neck aneurysms and restore arteries in vasospasm, providing results without permanent implants.";
const ACCESS = "DRIVEWIRE™ redefines access. Active technology enables distal steering to select vessels and navigate a large range of catheters with ease.";

export const SETTINGS: Record<string, Record<string, unknown>> = {
  contact: {
    phoneHq: "+972-72-250-3331",
    phoneUs: "+1-469-991-7712",
    email: "info@rapid-medical.com",
    ordersEmailLtd: "customerservice.ltd@rapid-medical.com",
    ordersEmailInc: "orders.inc@rapid-medical.com",
    ordersEmailCanada: "orders.canada@rapid-medical.com",
    offices: [
      { name: "Rapid Medical Ltd.", label: "Headquarters", address: "P.O.B. 337\nCarmel building, Yokneam 2069205\nISRAEL", phone: "+972-72-250-3331", fax: "+972-72-250-3332", ordersEmail: "customerservice.ltd@rapid-medical.com", lat: 32.659, lon: 35.104 },
      { name: "Rapid Medical Inc.", label: "USA", address: "445 S. Kimball Ave. Ste. 140\nSouthlake, Texas 76092\nUSA", phone: "+1-469-991-7712", fax: "+1-469-914-9300", ordersEmail: "orders.inc@rapid-medical.com", lat: 32.9378, lon: -97.1246 },
      { name: "Rapid Medical GmbH", label: "Germany", address: "Westendstrasse 21\n60325 Frankfurt\nGERMANY", phone: "+49 69 795 888 718", fax: "+49 (0) 69 795 888 711", ordersEmail: "ordersgmbh@rapid-medical.com", lat: 50.1146, lon: 8.6631 },
      { name: "Rapid Medical UK", label: "UK & Ireland", address: "3rd Floor, Great Titchfield House\n14-18 Great Titchfield Street\nLondon, W1W 8BD", phone: "+44 7876 122250", fax: "", ordersEmail: "uk-support@rapid-medical.com", lat: 51.518, lon: -0.1415 },
    ],
  },
  social: {
    x: "https://x.com/Rapid__Medical",
    linkedin: "https://www.linkedin.com/company/rapid-medical/",
    instagram: "https://www.instagram.com/rapid__medical/",
    youtube: "",
  },
  branding: {
    // copied into public/ (src/app/favicon.ico, public/logo.svg, public/og-image.jpg)
    logoUrl: "/logo.svg",
    logoPngUrl: `${WWW}/opt/Rapid-Medical-Logo-28982953-1920w.png`,
    faviconUrl: "/favicon.ico",
    ogImageUrl: "/og-image.jpg",
  },
  workflow: {
    requireApproval: false,
    notifyEmail: "",
  },
  integrations: {
    gaMeasurementId: "G-FB4LNFSBSR",
    userwayAccount: "cDW2354yK3",
    geoSuggest: true,
  },
  home: {
    heroLine1: "EXPAND",
    heroLine2: "WHAT’S POSSIBLE",
    heroSub: "in neurovascular therapy",
    heroBody: "Discover the power of active technology for ischemic and hemorrhagic stroke.",
    heroCtaLabel: "Explore Our Therapies",
    heroCtaHref: "",
    heroVideoUrl: `${VWWW}/sCAEMmxbSFuSL1kVU3JW_SNIS_TIGERTRIEVER+FINAL_no+audio-v.mp4`,
    problemTitle: "Like fingerprints, no two strokes are the same. Yet, conventional therapy options are limited and can compromise patient safety.",
    problemVideoUrl: `${VWWW}/nIyRh0PITsqiIot7omkk_Fingerprint+video-v.mp4`,
    stats: [
      { value: "40K+", label: "patients treated" },
      { value: "100+", label: "issued patents" },
      { value: "85+", label: "clinical publications" },
    ],
    solutionLine: "Our solution? Tools that adapt to each patient's anatomy.",
    engineeredTitle: "Engineered for precise control at every step.",
    engineeredBody: "Utilizing proprietary manufacturing techniques, our devices enable physicians to respond in real-time to the anatomy and tailor the procedure to every patient.",
    engineeredImageUrl: "",
    newsTitle: "At the forefront of advancing stroke intervention",
  },
  about: {
    intro: "We are a global community headquartered in Northern Israel focused on one unified goal – to pioneer solutions that expand what’s possible in neurovascular therapy.",
    whatWeDoTitle: "What we do",
    whatWeDoBody: "Utilizing proprietary manufacturing techniques, we develop the only responsive, remotely adjustable interventional tools to treat ischemic and hemorrhagic stroke.",
    leadershipIntro: "Our leadership team combines several decades of global MedTech experience to advance neurovascular technologies, for optimized stroke procedures and better patient outcomes.",
    heroImageUrl: "",
    mapTitle: "Our global footprint provides access to patient-specific stroke treatment to over 30 countries & counting.",
    mapSub: "Select a region to get in touch with a local representative.",
    mapFallbackImageUrl: `${WWW}/opt/Map+Directory-1920w.png`,
    closingLine: "Have a question? We’d love to hear from you.",
  },
  careers: {
    heroTitle: "Unlock your potential",
    heroSub: "Our greatest strength is our team.",
    heroBody: "From an inclusive, passionate culture to comprehensive benefits and professional development opportunities, your career-building potential is limitless at Rapid Medical. We are committed to expanding our fast-growing team with the best talent to fuel the future of neurovascular innovation.",
    heroImageUrl: `${WWW}/opt/Leaderboard-1920w.jpg`,
    heroVideoUrl: "https://vid.cdn-website.com/8b5f57de/videos/4h5iqwySQaYrZQwPg7NQ_Web+-+Careers+banner-v.mp4",
    quotes: [
      { quote: "Working at Rapid Medical grants me the ability to pursue my passion for helping patients while feeling supported to grow my career.", author: "Isaac, Clinical Specialist", imageUrl: `${WWW}/opt/Leaderboard-1920w.jpg` },
      { quote: "The most rewarding aspect is knowing that with each shipment a potential life is saved.", author: "Morgan, Customer Service", imageUrl: `${WWW}/opt/careers-2-1920w.jpg` },
    ],
    principlesTitle: "Our guiding principles",
    principlesBody: "What we at Rapid Medical believe in above all else.",
    principlesImageUrl: `${WWW}/We+are+Rapid+Graphic+Resized.svg`,
    eeoStatement: "Rapid Medical is an equal opportunity employer and prohibits discrimination and harassment of any kind. We are committed to the principle of equal employment opportunity for all employees and to providing employees with a work environment free of discrimination and harassment. All employment decisions at Rapid Medical are based on business needs, job requirements, and individual qualifications, without regard to race, color, religion or belief, national, social or ethnic origin, sex (including pregnancy), age, disability, sexual orientation, gender identity and/or expression, marital or domestic partnership status, military service, or any other status protected by the laws or regulations in the locations where we operate. Rapid Medical will not tolerate discrimination or harassment based on any of these characteristics.",
  },
  evidence: {
    title: "Evidence",
    intro: "Clinical & scientific research play a pivotal role in understanding the effectiveness, safety, and long-term impact that our solutions have on patient outcomes.",
    heroVideoUrl: "https://vid.cdn-website.com/8b5f57de/videos/3MxSd4f4R3ytbzaUxsbN_Evidence-v.mp4",
    statImageUrl: `${OUS}/opt/75+clinical+publications-1920w.png`,
    forefrontText: "We remain at the forefront of bold initiatives that target underserved areas of research.",
    forefrontImageUrl: `${OUS}/opt/Artboard-1-edd4c5d0-1920w.png`,
    forefrontImage2Url: `${OUS}/opt/ChatGPT+Image+Sep+30-+2026-+01_22_47+PM-1920w.png`,
    featuredTitle: "Featured publications",
    browseTitle: "Browse by product",
  },
  regional: {
    chooserTitle: "Choose your location.",
    chooserNote: "Product availability and regulatory information differ by region.",
    usNotice: "",
    ousNotice: "Not all products are available in all countries. Refer to the Instructions for Use for the indications approved in your region.",
    apacNotice: "*Not all products are available in all countries.",
  },
  /* "Our Therapies" landing per region */
  "therapies:us": {
    title: "Our Therapies",
    intro: THERAPIES_INTRO,
    heroVideoUrl: "https://vid.cdn-website.com/9d0280ee/videos/amPu695aTsE5DvMgsxon_Web+-+Our+Solutions+banner-v.mp4",
    note: "",
    blocks: [
      { title: "Ischemic Stroke", body: ISCHEMIC, links: [{ label: "Large vessel stroke", href: "/us/therapies/lvo" }] },
      { title: "Hemorrhagic Stroke", body: HEMORRHAGIC_US, links: [{ label: "Aneurysm", href: "/us/therapies/aneurysm" }] },
      { title: "Neurovascular access", body: ACCESS, imageUrl: `${US}/opt/Neurovascular+access-2-a125c36a-1920w.png`, links: [{ label: "Learn more", href: "/us/therapies/access" }] },
    ],
    closingTitle: "Questions?",
    closingBody: "Reach out to learn more about our company and stroke solutions.",
  },
  "therapies:ous": {
    title: "Our Therapies",
    intro: THERAPIES_INTRO,
    heroVideoUrl: "https://vid.cdn-website.com/8b5f57de/videos/4h5iqwySQaYrZQwPg7NQ_Web+-+Careers+banner-v.mp4",
    note: "",
    blocks: [
      { title: "Ischemic Stroke", body: ISCHEMIC, links: [{ label: "Large vessel stroke", href: "/ous/therapies/lvo" }, { label: "Medium vessel stroke", href: "/ous/therapies/mvo" }] },
      { title: "Hemorrhagic Stroke", body: HEMORRHAGIC_OUS, links: [{ label: "Aneurysm", href: "/ous/therapies/aneurysm" }, { label: "Vasospasm", href: "/ous/therapies/vasospasm" }] },
      { title: "Neurovascular access", body: ACCESS, imageUrl: `${OUS}/opt/Neurovascular+access-2-a125c36a-1920w.png`, links: [{ label: "Learn more", href: "/ous/therapies/access" }] },
    ],
    closingTitle: "Questions?",
    closingBody: "Reach out to learn more about our company and stroke solutions.",
  },
  "therapies:apac": {
    title: "Our Therapies",
    intro: THERAPIES_INTRO,
    heroVideoUrl: "https://vid.cdn-website.com/48595db0/videos/amPu695aTsE5DvMgsxon_Web+-+Our+Solutions+banner-v.mp4",
    note: "*Not all products are available in all countries",
    blocks: [
      { title: "Ischemic Stroke", body: ISCHEMIC.replace("ischemic and", "ischemic* and"), links: [{ label: "LVO", href: "/apac/therapies/lvo" }, { label: "MVO", href: "/apac/therapies/mvo" }] },
      { title: "Hemorrhagic Stroke", body: HEMORRHAGIC_OUS, links: [{ label: "Aneurysm", href: "/apac/therapies/aneurysm" }, { label: "Vasospasm", href: "/apac/therapies/vasospasm" }] },
      { title: "Neurovascular access", body: ACCESS, imageUrl: `${APAC}/opt/Neurovascular+access-2-a125c36a-1920w.png`, links: [{ label: "Learn more", href: "/apac/therapies/access" }] },
    ],
    closingTitle: "Questions?",
    closingBody: "Reach out to learn more about our company and stroke solutions.",
  },
};

/**
 * Products. Families (tigertriever, comaneci, drivewire) are what therapy
 * pages link to; sub-products get their own Evidence tab where `regions`
 * allows. APAC still calls Drivewire by its old name COLUMBUS.
 */
export const PRODUCTS = [
  { slug: "tigertriever-13", name: "TIGERTRIEVER™ 13", fullName: "TIGERTRIEVER™ 13 Revascularization Device", family: "tigertriever", regions: ["ous", "apac"], aliases: {}, sortOrder: 1 },
  { slug: "tigertriever", name: "TIGERTRIEVER™", fullName: "TIGERTRIEVER™ Revascularization Device", family: null, regions: [], aliases: {}, sortOrder: 2 },
  { slug: "tigertriever-xl", name: "TIGERTRIEVER™ 25 & XL", fullName: "TIGERTRIEVER™ 25 & XL Revascularization Device", family: "tigertriever", regions: ["ous", "apac"], aliases: { apac: { name: "TIGERTRIEVER™ XL", fullName: "TIGERTRIEVER™ XL Revascularization Device" } }, sortOrder: 3 },
  { slug: "comaneci", name: "COMANECI™", fullName: "COMANECI™ Embolization Assist Device", family: null, regions: [], aliases: { ous: { name: "COMANECI™", fullName: "COMANECI™ Neurovascular Adjustable Remodeling Mesh" } }, sortOrder: 4 },
  { slug: "drivewire", name: "DRIVEWIRE™", fullName: "DRIVEWIRE™ Steerable Guidewire", family: null, regions: [], aliases: { apac: { name: "COLUMBUS™", fullName: "COLUMBUS™ Steerable Guidewire" } }, sortOrder: 5 },
];

/** Webinar catalogue = the options of the "Request a recording" form on Duda. */
export const WEBINARS = [
  { title: "COMANECI Experience: Increasing packing density", speaker: "Dr. Mani Puthuran", product: "comaneci", sortOrder: 1 },
  { title: "TIGERTRIEVER: Tips to improve patient outcomes", speaker: "Dr. Eitan Abergel", product: "tigertriever", sortOrder: 2 },
  { title: "Tiger Trial results with ESMINT", speaker: "Drs. Ashutosh Jadhav & Brian Jankowitz", event: "ESMINT", product: "tigertriever", sortOrder: 3 },
  { title: "COMANECI: Tips & Tricks from Buffalo", speaker: "Drs. Adnan Siddiqui & Jason Davies", product: "comaneci", sortOrder: 4 },
  { title: "COLUMBUS 14 Guidewire: Mastering steerability", speaker: "Dr. Alexander von Hessling", product: "drivewire", sortOrder: 5 },
];

/** Legacy Duda URLs that don't map 1:1 to the new structure. Subdomains are handled in proxy.ts. */
export const REDIRECTS = [
  { from: "/welcome_d", to: "/" },
  { from: "/our-solutions", to: "/choose-your-location" },
  { from: "/evidence", to: "/choose-your-location?next=evidence" },
  { from: "/privacy-policy", to: "/privacy-statement" },
  { from: "/ronen", to: "/team/ronen" },
  { from: "/michal", to: "/team/michal" },
  { from: "/walid", to: "/team/walid" },
  { from: "/eitan", to: "/team/eitan" },
  { from: "/james", to: "/team/james" },
  { from: "/giora", to: "/team/giora" },
  ...["us", "ous", "apac"].flatMap((r) => ["lvo", "mvo", "aneurysm", "vasospasm", "access"].map((s) => ({ from: `/${r}/${s}`, to: `/${r}/therapies/${s}` }))),
];
