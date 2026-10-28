/** Site-wide settings, lifted from the current Duda site. */
const CDN = "https://irp.cdn-website.com/be427182/dms3rep/multi";

export const SETTINGS: Record<string, Record<string, unknown>> = {
  contact: {
    phoneHq: "+972-72-250-3331",
    phoneUs: "+1-469-991-7712",
    email: "info@rapid-medical.com",
    ordersEmailLtd: "customerservice.ltd@rapid-medical.com",
    ordersEmailInc: "orders.inc@rapid-medical.com",
    ordersEmailCanada: "orders.canada@rapid-medical.com",
    offices: [
      { name: "Rapid Medical Ltd.", label: "Headquarters", address: "P.O.B. 337\nCarmel building, Yokneam 2069205\nISRAEL", phone: "+972-72-250-3331", fax: "+972-72-250-3332", ordersEmail: "customerservice.ltd@rapid-medical.com" },
      { name: "Rapid Medical Inc.", label: "USA", address: "445 S. Kimball Ave. Ste. 140\nSouthlake, Texas 76092\nUSA", phone: "+1-469-991-7712", fax: "+1-469-914-9300", ordersEmail: "orders.inc@rapid-medical.com" },
      { name: "Rapid Medical GmbH", label: "Germany", address: "Westendstrasse 21\n60325 Frankfurt\nGERMANY", phone: "+49 69 795 888 718", fax: "+49 (0) 69 795 888 711", ordersEmail: "ordersgmbh@rapid-medical.com" },
      { name: "Rapid Medical UK", label: "UK & Ireland", address: "3rd Floor, Great Titchfield House\n14-18 Great Titchfield Street\nLondon, W1W 8BD", phone: "+44 7876 122250", fax: "", ordersEmail: "uk-support@rapid-medical.com" },
    ],
  },
  social: {
    x: "https://x.com/Rapid__Medical",
    linkedin: "https://www.linkedin.com/company/rapid-medical/",
    instagram: "https://www.instagram.com/rapid__medical/",
    youtube: "",
  },
  home: {
    heroLine1: "EXPAND",
    heroLine2: "WHAT’S POSSIBLE",
    heroSub: "in neurovascular therapy",
    heroBody: "Discover the power of active technology for ischemic and hemorrhagic stroke.",
    heroCtaLabel: "Explore Our Therapies",
    heroCtaHref: "",
    heroVideoUrl: "https://vid.cdn-website.com/be427182/videos/sCAEMmxbSFuSL1kVU3JW_SNIS_TIGERTRIEVER+FINAL_no+audio-v.mp4",
    problemTitle: "Like fingerprints, no two strokes are the same. Yet, conventional therapy options are limited and can compromise patient safety.",
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
    heroImageUrl: `${CDN}/opt/Map+Directory-1920w.png`,
  },
  careers: {
    heroTitle: "Unlock your potential",
    heroSub: "Our greatest strength is our team.",
    heroBody: "From an inclusive, passionate culture to comprehensive benefits and professional development opportunities, your career-building potential is limitless at Rapid Medical. We are committed to expanding our fast-growing team with the best talent to fuel the future of neurovascular innovation.",
    heroImageUrl: `${CDN}/opt/Leaderboard-1920w.jpg`,
    quotes: [
      { quote: "Working at Rapid Medical grants me the ability to pursue my passion for helping patients while feeling supported to grow my career.", imageUrl: `${CDN}/opt/careers-2-1920w.jpg` },
      { quote: "The most rewarding aspect is knowing that with each shipment a potential life is saved.", imageUrl: "" },
    ],
    principlesTitle: "Our guiding principles",
    principlesBody: "What we at Rapid Medical believe in above all else.",
    principlesImageUrl: `${CDN}/We+are+Rapid+Graphic+Resized.svg`,
    eeoStatement: "Rapid Medical is an equal opportunity employer and prohibits discrimination and harassment of any kind. We are committed to the principle of equal employment opportunity for all employees and to providing employees with a work environment free of discrimination and harassment. All employment decisions at Rapid Medical are based on business needs, job requirements, and individual qualifications, without regard to race, color, religion or belief, national, social or ethnic origin, sex (including pregnancy), age, disability, sexual orientation, gender identity and/or expression, marital or domestic partnership status, military service, or any other status protected by the laws or regulations in the locations where we operate. Rapid Medical will not tolerate discrimination or harassment based on any of these characteristics.",
  },
  regional: {
    chooserTitle: "Choose your location.",
    usNotice: "",
    ousNotice: "Not all products are available in all countries. Refer to the Instructions for Use for the indications approved in your region.",
  },
};

export const PRODUCTS = [
  { slug: "tigertriever", name: "TIGERTRIEVER™", fullName: "TIGERTRIEVER™ Revascularization Device", sortOrder: 1 },
  { slug: "comaneci", name: "COMANECI™", fullName: "COMANECI™ Embolization Assist Device", sortOrder: 2 },
  { slug: "drivewire", name: "DRIVEWIRE™", fullName: "DRIVEWIRE™ Steerable Guidewire", sortOrder: 3 },
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
  { from: "/us/lvo", to: "/us/therapies/lvo" },
  { from: "/us/aneurysm", to: "/us/therapies/aneurysm" },
  { from: "/us/access", to: "/us/therapies/access" },
  { from: "/ous/lvo", to: "/ous/therapies/lvo" },
  { from: "/ous/mvo", to: "/ous/therapies/mvo" },
  { from: "/ous/aneurysm", to: "/ous/therapies/aneurysm" },
  { from: "/ous/vasospasm", to: "/ous/therapies/vasospasm" },
  { from: "/ous/access", to: "/ous/therapies/access" },
];
