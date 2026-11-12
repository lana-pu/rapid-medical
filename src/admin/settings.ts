import type { FieldDef } from "./fields";

/** May this person open and save the group (ADR-006 roles)? */
export const mayEditGroup = (user: { role: string }, g: { access?: "designer" | "admin" }) =>
  !g.access || user.role === "admin" || (g.access === "designer" && user.role === "designer");

/**
 * Site-wide settings, grouped by key. Each group is stored as one jsonb row
 * in site_settings. Fields reuse the admin form renderer.
 */
export type SettingsGroup = {
  key: string;
  title: string;
  description?: string;
  fields: FieldDef[];
  revalidate: string[];
  /** who may open and save it (ADR-006): designer — designer and admin; admin — admin only. Default: everyone signed in */
  access?: "designer" | "admin";
};

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
      { name: "ifuEmail", label: "IFU requests email", type: "text", half: true, help: "Contact form, topic “Instructions for Use (IFU)”. Orders go to the orders emails above by region; everything else to MAIL_TO." },
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
  ...(["us", "ous", "apac"] as const).map((r) => ({
    key: `therapies:${r}`,
    title: `Therapies overview – ${r.toUpperCase()} (Google)`,
    description: `Google title and description of /${r}/therapies. The page itself is edited on the page (Pages → Therapies).`,
    revalidate: [`/${r}/therapies`],
    fields: [
      { name: "metaTitle", label: "Google title (≤60 chars, full title incl. “| Rapid Medical”)", type: "text", half: true, section: "SEO" },
      { name: "metaDescription", label: "Google description (≤155 chars)", type: "textarea", rows: 2, section: "SEO" },
    ] as FieldDef[],
  })),
  {
    key: "seo",
    title: "Google titles & descriptions",
    description: "Titles are used as-is (include “| Rapid Medical”); keep titles ≤60 and descriptions ≤155 characters. Product pages have their own SEO fields.",
    revalidate: ["/us/evidence", "/ous/evidence", "/apac/evidence", "/us/webinars", "/ous/webinars", "/apac/webinars", "/contact-us"],
    fields: [
      { name: "evidenceTitle", label: "Evidence – title", type: "text", half: true },
      { name: "evidenceDescription", label: "Evidence – description", type: "text", half: true },
      { name: "webinarsTitle", label: "Webinars – title", type: "text", half: true },
      { name: "webinarsDescription", label: "Webinars – description", type: "text", half: true },
      { name: "contactTitleUs", label: "Contact (US) – title", type: "text", half: true },
      { name: "contactDescriptionUs", label: "Contact (US) – description", type: "text", half: true },
      { name: "contactTitleOus", label: "Contact (OUS) – title", type: "text", half: true },
      { name: "contactDescriptionOus", label: "Contact (OUS) – description", type: "text", half: true },
      { name: "contactTitleApac", label: "Contact (APAC) – title", type: "text", half: true },
      { name: "contactDescriptionApac", label: "Contact (APAC) – description", type: "text", half: true },
      { name: "contactTitle", label: "Contact (global) – title", type: "text", half: true },
      { name: "contactDescription", label: "Contact (global) – description", type: "text", half: true },
    ],
  },
  {
    key: "branding",
    access: "designer",
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
    access: "admin",
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
