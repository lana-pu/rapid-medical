import type { FieldDef } from "./fields";

/**
 * Site-wide settings, grouped by key. Each group is stored as one jsonb row
 * in site_settings. Fields reuse the admin form renderer.
 */
export type SettingsGroup = { key: string; title: string; description?: string; fields: FieldDef[]; revalidate: string[] };

export const SETTINGS_GROUPS: SettingsGroup[] = [
  {
    key: "contact",
    title: "Contact details",
    revalidate: ["/"],
    fields: [
      { name: "phoneHq", label: "HQ phone", type: "text", half: true },
      { name: "phoneUs", label: "US phone", type: "text", half: true },
      { name: "email", label: "General email", type: "text", half: true },
      { name: "ordersEmailLtd", label: "Orders email (Ltd / OUS)", type: "text", half: true },
      { name: "ordersEmailInc", label: "Orders email (Inc / US)", type: "text", half: true },
      { name: "ordersEmailCanada", label: "Orders email (Canada)", type: "text", half: true },
      {
        name: "offices",
        label: "Offices",
        type: "repeater",
        fields: [
          { name: "name", label: "Entity", type: "text", required: true, half: true },
          { name: "label", label: "Label", type: "text", half: true, placeholder: "Headquarters" },
          { name: "address", label: "Address", type: "textarea", rows: 3 },
          { name: "phone", label: "Phone", type: "text", half: true },
          { name: "fax", label: "Fax", type: "text", half: true },
          { name: "ordersEmail", label: "Orders email", type: "text" },
          { name: "lat", label: "Latitude (map pin)", type: "text", half: true },
          { name: "lon", label: "Longitude (map pin)", type: "text", half: true },
        ],
      },
    ],
  },
  {
    key: "social",
    title: "Social links",
    revalidate: ["/"],
    fields: [
      { name: "x", label: "X / Twitter", type: "url", half: true },
      { name: "linkedin", label: "LinkedIn", type: "url", half: true },
      { name: "instagram", label: "Instagram", type: "url", half: true },
      { name: "youtube", label: "YouTube", type: "url", half: true },
    ],
  },
  {
    key: "home",
    title: "Home page",
    revalidate: ["/"],
    fields: [
      { name: "heroLine1", label: "Hero line 1", type: "text", half: true, placeholder: "EXPAND" },
      { name: "heroLine2", label: "Hero line 2", type: "text", half: true, placeholder: "WHAT’S POSSIBLE" },
      { name: "heroSub", label: "Hero subtitle", type: "text" },
      { name: "heroBody", label: "Hero body", type: "textarea", rows: 2 },
      { name: "heroCtaLabel", label: "Hero CTA label", type: "text", half: true },
      { name: "heroCtaHref", label: "Hero CTA link", type: "text", half: true },
      { name: "heroVideoUrl", label: "Hero background video (mp4)", type: "url" },
      { name: "problemTitle", label: "Problem statement", type: "textarea", rows: 2 },
      { name: "problemVideoUrl", label: "Problem statement video (mp4)", type: "image" },
      {
        name: "stats",
        label: "Stats",
        type: "repeater",
        fields: [
          { name: "value", label: "Value", type: "text", required: true, half: true, placeholder: "40K+" },
          { name: "label", label: "Label", type: "text", required: true, half: true, placeholder: "patients treated" },
        ],
      },
      { name: "solutionLine", label: "Solution line", type: "text", placeholder: "Our solution? Tools that adapt to each patient's anatomy." },
      { name: "engineeredTitle", label: "Engineered block title", type: "text" },
      { name: "engineeredBody", label: "Engineered block body", type: "textarea", rows: 3 },
      { name: "engineeredImageUrl", label: "Engineered block image", type: "image" },
      { name: "newsTitle", label: "News section title", type: "text", placeholder: "At the forefront of advancing stroke intervention" },
    ],
  },
  {
    key: "about",
    title: "About page",
    revalidate: ["/about-us"],
    fields: [
      { name: "intro", label: "Intro statement", type: "textarea", rows: 3 },
      { name: "whatWeDoTitle", label: "What we do – title", type: "text", half: true },
      { name: "whatWeDoBody", label: "What we do – body", type: "textarea", rows: 3 },
      { name: "leadershipIntro", label: "Leadership intro", type: "textarea", rows: 2 },
      { name: "heroImageUrl", label: "Hero image", type: "image" },
      { name: "mapTitle", label: "Map section title", type: "textarea", rows: 2 },
      { name: "mapSub", label: "Map section subtitle", type: "text" },
      { name: "mapFallbackImageUrl", label: "Map fallback image", type: "image" },
      { name: "closingLine", label: "Closing line", type: "text" },
    ],
  },
  {
    key: "careers",
    title: "Careers page",
    revalidate: ["/careers"],
    fields: [
      { name: "heroTitle", label: "Hero title", type: "text", half: true },
      { name: "heroSub", label: "Hero subtitle", type: "text", half: true },
      { name: "heroBody", label: "Hero body", type: "textarea", rows: 3 },
      { name: "heroImageUrl", label: "Hero image", type: "image", half: true },
      { name: "heroVideoUrl", label: "Hero background video (mp4)", type: "image", half: true },
      {
        name: "quotes",
        label: "Employee quotes",
        type: "repeater",
        fields: [
          { name: "quote", label: "Quote", type: "textarea", rows: 2 },
          { name: "author", label: "Author", type: "text", placeholder: "Isaac, Clinical Specialist" },
          { name: "imageUrl", label: "Image", type: "image" },
        ],
      },
      { name: "principlesTitle", label: "Principles title", type: "text", half: true },
      { name: "principlesBody", label: "Principles body", type: "text", half: true },
      { name: "principlesImageUrl", label: "Principles graphic", type: "image" },
      { name: "eeoStatement", label: "Equal-opportunity statement", type: "textarea", rows: 4 },
    ],
  },
  {
    key: "regional",
    title: "Regional notices",
    description: "Text shown on the location chooser and region banners.",
    revalidate: ["/choose-your-location", "/us", "/ous"],
    fields: [
      { name: "chooserTitle", label: "Chooser title", type: "text", placeholder: "Choose your location." },
      { name: "usNotice", label: "US regulatory footer note", type: "textarea", rows: 2 },
      { name: "ousNotice", label: "OUS regulatory footer note", type: "textarea", rows: 2 },
      { name: "apacNotice", label: "APAC regulatory footer note", type: "textarea", rows: 2 },
      { name: "chooserNote", label: "Chooser subtitle", type: "text" },
    ],
  },
  {
    key: "evidence",
    title: "Evidence page",
    revalidate: ["/us/evidence", "/ous/evidence", "/apac/evidence"],
    fields: [
      { name: "title", label: "Title", type: "text", half: true },
      { name: "heroVideoUrl", label: "Hero background video (mp4)", type: "image", half: true },
      { name: "intro", label: "Intro", type: "textarea", rows: 3 },
      { name: "statImageUrl", label: "“75+ publications” graphic", type: "image", half: true },
      { name: "forefrontText", label: "Forefront text", type: "text", half: true },
      { name: "forefrontImageUrl", label: "Forefront image 1", type: "image", half: true },
      { name: "forefrontImage2Url", label: "Forefront image 2", type: "image", half: true },
      { name: "featuredTitle", label: "Featured section title", type: "text", half: true },
      { name: "browseTitle", label: "Browse section title", type: "text", half: true },
    ],
  },
  ...(["us", "ous", "apac"] as const).map((r) => ({
    key: `therapies:${r}`,
    title: `Therapies landing – ${r.toUpperCase()}`,
    description: `The “Our Therapies” page at /${r}/therapies.`,
    revalidate: [`/${r}/therapies`],
    fields: [
      { name: "title", label: "Title", type: "text", half: true },
      { name: "heroVideoUrl", label: "Hero background video (mp4)", type: "image", half: true },
      { name: "intro", label: "Intro", type: "textarea", rows: 3 },
      { name: "note", label: "Note (e.g. availability)", type: "text" },
      {
        name: "blocks",
        label: "Therapy blocks",
        type: "repeater",
        fields: [
          { name: "title", label: "Title", type: "text", required: true },
          { name: "body", label: "Body", type: "textarea", rows: 3 },
          { name: "imageUrl", label: "Image", type: "image" },
          { name: "links", label: "Links", type: "repeater", fields: [{ name: "label", label: "Label", type: "text", required: true, half: true }, { name: "href", label: "Link", type: "text", required: true, half: true }] },
        ],
      },
      { name: "closingTitle", label: "Closing title", type: "text", half: true },
      { name: "closingBody", label: "Closing body", type: "text", half: true },
    ] as FieldDef[],
  })),
  {
    key: "workflow",
    title: "Workflow",
    description: "Editorial workflow for published content.",
    revalidate: [],
    fields: [
      { name: "requireApproval", label: "Require approval before publishing (editors submit, approvers/admins publish)", type: "boolean" },
      { name: "notifyEmail", label: "Notify this email when content is submitted for review", type: "text", half: true },
    ],
  },
  {
    key: "branding",
    title: "Branding",
    revalidate: ["/"],
    fields: [
      { name: "logoUrl", label: "Logo (SVG/PNG)", type: "image", half: true },
      { name: "logoPngUrl", label: "Logo PNG (email / fallback)", type: "image", half: true },
      { name: "ogImageUrl", label: "Social sharing image", type: "image", half: true },
      { name: "faviconUrl", label: "Favicon", type: "image", half: true, help: "Also replace src/app/favicon.ico when changing." },
    ],
  },
  {
    key: "integrations",
    title: "Integrations",
    description: "Third-party scripts. Leave a field empty to disable.",
    revalidate: ["/"],
    fields: [
      { name: "gaMeasurementId", label: "Google Analytics 4 measurement ID", type: "text", half: true, placeholder: "G-XXXXXXXXXX" },
      { name: "userwayAccount", label: "UserWay accessibility widget account", type: "text", half: true },
      { name: "geoSuggest", label: "Suggest region by visitor country", type: "boolean" },
    ],
  },
];

export function getSettingsGroup(key: string) {
  return SETTINGS_GROUPS.find((g) => g.key === key);
}
