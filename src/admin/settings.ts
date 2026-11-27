import type { FieldDef } from "./fields";
import { DEFAULT_NAVIGATION } from "@/lib/navigation";

/** May this person open and save the group (ADR-006 roles)? */
export const mayEditGroup = (user: { role: string }, g: { access?: "designer" | "admin" }) =>
  !g.access || user.role === "admin" || (g.access === "designer" && user.role === "designer");

/**
 * The group's value with every text field blanked: two values with the same «structure» differ only in texts
 * (labels). Someone with page-label rights only may publish a draft only if its structure equals the live one.
 */
export function structureOf(fields: FieldDef[], v: unknown): unknown {
  if (!v || typeof v !== "object") return v;
  const o = v as Record<string, unknown>;
  const out: Record<string, unknown> = { ...o };
  for (const f of fields) {
    if (f.type === "text") out[f.name] = "";
    else if (f.type === "repeater" && f.fields && Array.isArray(o[f.name])) out[f.name] = (o[f.name] as unknown[]).map((it) => structureOf(f.fields!, it));
  }
  return out;
}

/** May this person edit (and publish or discard) the group's changes made on the page? */
export const mayEditOnPage = (user: { role: string }, g: { access?: "designer" | "admin"; pageLabels?: boolean }) => mayEditGroup(user, g) || !!g.pageLabels;

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
  /** its text fields (labels) are edited on the page by any role, even when the group itself is limited */
  pageLabels?: boolean;
  /** values read from another group until this one is saved (Where requests go ← Contact details, 2026-11-27) */
  inherit?: { from: string; keys: string[] };
  /** what the site shows while the group has never been saved (the form and on-page edits start from it) */
  defaults?: Record<string, unknown>;
  /** the form's blocks: a field's `section` → one line on what the block is for (docs/screens/admin-settings.md) */
  sections?: Record<string, string>;
};

/** Live value of a group as the form and the page editor see it: defaults, then live, then the pending draft. */
export const groupValue = (g: SettingsGroup | undefined, live: Record<string, unknown>, draft?: Record<string, unknown> | null) => ({ ...(g?.defaults ?? {}), ...live, ...(draft ?? {}) });

export const SETTINGS_GROUPS: SettingsGroup[] = [
  {
    key: "contact",
    title: "Contact details",
    description: "Phones, emails and offices shown on the site. Where requests go is its own setting.",
    revalidate: ["/"],
    sections: {
      "Phones and email on the site": "In the footer of every page and on Contact Us.",
      Offices: "On Contact Us with a map pin; the first one is also in the footer.",
    },
    fields: [
      { name: "phoneHq", label: "Head office phone", type: "text", half: true, section: "Phones and email on the site" },
      { name: "phoneUs", label: "US phone", type: "text", half: true, section: "Phones and email on the site" },
      { name: "email", label: "General email", type: "text", half: true, section: "Phones and email on the site" },
      // the order and IFU mailboxes moved to Where requests go (2026-11-27); their values stay here and are read from there
      {
        name: "offices",
        label: "Offices",
        section: "Offices",
        type: "repeater",
        folded: true,
        summary: ["name", "label"],
        fields: [
          { name: "name", label: "Entity", type: "text", required: true, half: true },
          { name: "label", label: "Label", type: "text", half: true, placeholder: "Headquarters" },
          { name: "address", label: "Address", type: "textarea", rows: 3 },
          { name: "phone", label: "Phone", type: "text", half: true },
          { name: "fax", label: "Fax", type: "text", half: true },
          { name: "ordersEmail", label: "Orders email", type: "text" },
          { name: "lat", label: "Latitude", type: "text", half: true, fold: "Map pin" },
          { name: "lon", label: "Longitude", type: "text", half: true, fold: "Map pin" },
        ],
      },
    ],
  },
  {
    // docs/screens/admin-settings.md → «Where requests go» (decision 2026-11-27); read by src/lib/contact-topics.ts
    key: "requests",
    title: "Where requests go",
    description: "Every request is in the Inbox; here — which mailbox also gets it by email. An empty line sends it to the main address of the visitor's region. Several addresses — separate with commas.",
    revalidate: [],
    inherit: { from: "contact", keys: ["ordersEmailInc", "ordersEmailCanada", "ordersEmailLtd", "ifuEmail"] },
    sections: {
      "Main address": "Gets every request that has no address of its own below. Both empty — the address set on the server.",
      "Contact Us — by topic": "The topic the visitor picks on Contact Us.",
      "Other forms": "The forms on webinar, job and event pages.",
    },
    fields: [
      { name: "mainEmailAmericas", label: "Main address — Americas", type: "text", half: true, emails: true, section: "Main address", placeholder: "Empty — the other main address" },
      { name: "mainEmail", label: "Main address — everywhere else", type: "text", half: true, emails: true, section: "Main address", placeholder: "Empty — the other main address" },
      ...(
        [
          ["demoEmail", "Request a demo"], ["supportEmail", "Product question / Support"],
          ["ordersEmailInc", "Customer Service / Orders — Americas (Inc)"], ["ordersEmailCanada", "Customer Service / Orders — Canada"],
          ["ordersEmailLtd", "Customer Service / Orders — everywhere else (Ltd)"], ["ifuEmail", "Instructions for Use (IFU)"],
          ["eventsEmail", "Meetings & Events"], ["investorsEmail", "Investor relations"], ["otherEmail", "Other"],
        ] as const
      ).map(([name, label]): FieldDef => ({ name, label, type: "text", half: true, emails: true, section: "Contact Us — by topic", placeholder: name === "ordersEmailCanada" ? "Empty — Orders, Americas" : "Empty — the main address" })),
      ...(
        [["webinarEmail", "Webinar recording"], ["careersEmail", "Job application"], ["eventFormEmail", "Event registration"]] as const
      ).map(([name, label]): FieldDef => ({ name, label, type: "text", half: true, emails: true, section: "Other forms", placeholder: "Empty — the main address" })),
    ],
  },
  {
    key: "social",
    title: "Social links",
    description: "The icons in the footer of every page. An empty address — no icon.",
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
    description: "The region chooser and the regulatory note at the bottom of each region's pages.",
    revalidate: ["/choose-your-location", "/us", "/ous", "/apac"],
    sections: {
      "Region chooser": "The page where a visitor picks a region.",
      "Note under each region's pages": "Above the footer of every page of the region.",
    },
    fields: [
      { name: "chooserTitle", label: "Title", type: "text", placeholder: "Choose your location.", section: "Region chooser" },
      { name: "chooserNote", label: "Subtitle", type: "text", section: "Region chooser" },
      { name: "usNotice", label: "Americas (US)", type: "textarea", rows: 2, section: "Note under each region's pages", help: "Empty — no note on US pages." },
      { name: "ousNotice", label: "Europe & Middle East (OUS)", type: "textarea", rows: 2, section: "Note under each region's pages", help: "Empty — no note on OUS pages." },
      { name: "apacNotice", label: "Asia & Pacific (APAC)", type: "textarea", rows: 2, section: "Note under each region's pages", help: "Empty — no note on APAC pages." },
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
    title: "Google texts of list pages",
    // the pages built from lists keep their Google texts here; every other page keeps them on itself — all of them
    // are edited in Search & sharing (docs/screens/admin-seo.md)
    description: "How Google shows the pages built from lists. All pages are in Search & sharing.",
    revalidate: ["/us/webinars", "/ous/webinars", "/apac/webinars", "/contact-us", "/news-events"],
    fields: [
      { name: "webinarsTitle", label: "Webinars – title", type: "text", half: true },
      { name: "webinarsDescription", label: "Webinars – description", type: "text", half: true },
      { name: "newsTitle", label: "News & Events – title", type: "text", half: true },
      { name: "newsDescription", label: "News & Events – description", type: "text", half: true },
      { name: "contactTitle", label: "Contact Us – title", type: "text", half: true },
      { name: "contactDescription", label: "Contact Us – description", type: "text", half: true },
      { name: "contactTitleUs", label: "Contact Us (Americas) – title", type: "text", half: true },
      { name: "contactDescriptionUs", label: "Contact Us (Americas) – description", type: "text", half: true },
      { name: "contactTitleOus", label: "Contact Us (Europe & Middle East) – title", type: "text", half: true },
      { name: "contactDescriptionOus", label: "Contact Us (Europe & Middle East) – description", type: "text", half: true },
      { name: "contactTitleApac", label: "Contact Us (Asia & Pacific) – title", type: "text", half: true },
      { name: "contactDescriptionApac", label: "Contact Us (Asia & Pacific) – description", type: "text", half: true },
    ],
  },
  {
    key: "navigation",
    title: "Menu and footer",
    access: "designer", // the structure and the addresses; labels are edited on the page by everyone
    pageLabels: true,
    description: "The menu at the top of every page and the footer. Labels can also be changed right on the page.",
    revalidate: ["/"],
    defaults: DEFAULT_NAVIGATION,
    fields: [
      {
        name: "menu",
        label: "Menu",
        type: "repeater",
        fields: [
          { name: "label", label: "Label", type: "text", required: true, half: true },
          { name: "kind", label: "Opens", type: "select", half: true, options: [{ value: "page", label: "A page" }, { value: "therapies", label: "Therapies menu" }, { value: "evidence", label: "Evidence of the visitor's region" }] },
          { name: "href", label: "Page address", type: "url", help: "For «A page»: /about-us or https://…" },
        ],
      },
      { name: "contactLabel", label: "Contact button label", type: "text", half: true },
      { name: "contactTitle", label: "Footer: contact column title", type: "text", half: true },
      { name: "followTitle", label: "Footer: social column title", type: "text", half: true },
      { name: "legalTitle", label: "Footer: legal column title", type: "text", half: true },
      {
        name: "legal",
        label: "Footer: legal links",
        type: "repeater",
        fields: [
          { name: "label", label: "Label", type: "text", required: true, half: true },
          { name: "href", label: "Address", type: "url", half: true },
        ],
      },
      { name: "copyright", label: "Copyright line (the year is added)", type: "text" },
    ],
  },
  {
    key: "branding",
    access: "designer",
    title: "Branding",
    description: "The logo in the site's header, the picture shown when a page is shared, and the icon in the browser tab.",
    revalidate: ["/"],
    // «Logo PNG (email / fallback)» is not in the form: emails go without a logo (decision 2026-11-27); its value stays
    fields: [
      { name: "logoUrl", label: "Logo (SVG/PNG)", type: "image", half: true, help: "In the header of every page." },
      { name: "ogImageUrl", label: "Social sharing image", type: "image", half: true, help: "When a page is shared on LinkedIn, in a message or an email. 1200 × 630. Empty — the standard picture." },
      { name: "faviconUrl", label: "Browser tab icon", type: "image", half: true, help: "Square, at least 48 × 48. Empty — the standard icon." },
    ],
  },
  {
    key: "integrations",
    access: "admin",
    title: "Integrations",
    description: "Services the site connects to. An empty field — the service is off.",
    revalidate: ["/"],
    fields: [
      { name: "gaMeasurementId", label: "Google Analytics 4 measurement ID", type: "text", half: true, placeholder: "G-XXXXXXXXXX", help: "Marketing's own reports in Google Analytics. In GA: Admin → Data streams → the site → Measurement ID." },
      { name: "userwayAccount", label: "UserWay accessibility widget account", type: "text", half: true, help: "The accessibility button on every page." },
      { name: "geoSuggest", label: "Suggest region by visitor country", type: "boolean", help: "A visitor on another region's pages sees «It looks like you are in …» with a link to their region." },
    ],
  },
];

export function getSettingsGroup(key: string) {
  return SETTINGS_GROUPS.find((g) => g.key === key);
}
