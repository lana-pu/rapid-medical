/**
 * The admin by the site's sections (docs/screens/admin-sections.md, docs/site-ia.md): what each section of the site is
 * made of and where it is edited. The menu, the section screens and the breadcrumbs read this.
 */

export type SectionKey = "home" | "therapies" | "evidence" | "webinars" | "news-events" | "about" | "careers" | "contact" | "other" | "menu";

export type SectionList = { resource: string; label: string; where: string; newLabel?: string };

export type Section = {
  key: SectionKey;
  title: string;
  /** what this is on the site, one sentence */
  intro: string;
  /** site pages (`site_pages.key`) that belong here */
  sitePages?: string[];
  /** pages without a stored page record: only «View» (a path per region, or one path) */
  views?: { label: string; path: string }[];
  lists?: SectionList[];
  settings?: { group: string; label: string; where: string }[];
};

const REGION_VIEWS = (suffix: string) => [
  { label: "Americas", path: `/us/${suffix}` },
  { label: "Asia & Pacific", path: `/apac/${suffix}` },
  { label: "Europe & Middle East", path: `/ous/${suffix}` },
];

export const SECTIONS: Section[] = [
  {
    key: "home",
    title: "Home",
    intro: "The first page visitors see. Its sections are edited on the page; the news on it come from News.",
    sitePages: ["home"],
    lists: [{ resource: "news", label: "News", where: "the latest featured news appear on Home", newLabel: "News item" }],
  },
  {
    key: "therapies",
    title: "Therapies",
    intro: "An overview of the therapies in each region and a page for every therapy. Not every therapy exists in every region.",
    sitePages: ["therapies"],
    lists: [
      { resource: "solutions", label: "Therapy pages — settings", where: "Google title, address, region versions of each therapy page" },
      { resource: "products", label: "Products", where: "the product tabs on Evidence and the links from therapy pages" },
    ],
  },
  {
    key: "evidence",
    title: "Evidence",
    intro: "Studies for each region, in a tab per product; therapy pages link here.",
    sitePages: ["evidence"],
    lists: [
      { resource: "publications", label: "Publications", where: "Evidence of the regions they are marked for; featured ones at the top", newLabel: "Publication" },
      { resource: "products", label: "Products", where: "one tab per product on Evidence" },
    ],
  },
  {
    key: "webinars",
    title: "Webinars",
    intro: "On-demand webinars in each region, with a form to request a recording. Therapy pages link here.",
    views: REGION_VIEWS("webinars"),
    lists: [{ resource: "webinars", label: "Webinars", where: "the webinars list of their region", newLabel: "Webinar" }],
  },
  {
    key: "news-events",
    title: "News & Events",
    intro: "Upcoming events at the top, then news and past events. Home links here.",
    views: [{ label: "News & Events", path: "/news-events" }],
    lists: [
      { resource: "news", label: "News", where: "News & Events; featured ones also on Home", newLabel: "News item" },
      { resource: "events", label: "Events", where: "News & Events and a page per event", newLabel: "Event" },
    ],
  },
  {
    key: "about",
    title: "About Us",
    intro: "The company, the leadership team and the offices on a map.",
    sitePages: ["about"],
    lists: [{ resource: "team", label: "Team", where: "the leadership team on About Us", newLabel: "Team member" }],
    settings: [{ group: "contact", label: "Contact details", where: "the offices and the pins on the map" }],
  },
  {
    key: "careers",
    title: "Careers",
    intro: "Why work at Rapid Medical, and the open positions.",
    sitePages: ["careers"],
    lists: [{ resource: "jobs", label: "Open positions", where: "Careers and a page per position; with none, the list is hidden", newLabel: "Position" }],
  },
  {
    key: "contact",
    title: "Contact Us",
    intro: "The contact form. Each request goes to the address for its topic and region and appears in Requests.",
    views: [{ label: "Contact Us", path: "/contact-us" }],
    lists: [{ resource: "submissions", label: "Requests", where: "everything people send through the forms" }],
    settings: [{ group: "contact", label: "Contact details", where: "phones, emails and who gets which request" }],
  },
  {
    key: "other",
    title: "Other pages",
    intro: "Legal pages, study results and case pages; legal pages are linked from the footer.",
  },
  {
    key: "menu",
    title: "Menu and footer",
    intro: "The menu at the top of every page and the footer.",
    settings: [{ group: "navigation", label: "Menu and footer", where: "what is in the menu and the footer and where it leads" }],
  },
];

export const sectionOf = (k: string) => SECTIONS.find((s) => s.key === k);

/** The section a record of this admin resource belongs to (breadcrumbs). Site pages: by their key. */
export function sectionForResource(resource: string, siteKey?: string): Section | undefined {
  const by: Record<string, SectionKey> = {
    solutions: "therapies",
    products: "evidence",
    publications: "evidence",
    webinars: "webinars",
    news: "news-events",
    events: "news-events",
    team: "about",
    jobs: "careers",
    pages: "other",
    submissions: "contact",
  };
  if (resource === "site-pages") {
    const k = ({ home: "home", therapies: "therapies", evidence: "evidence", about: "about", careers: "careers" } as Record<string, SectionKey>)[siteKey ?? ""];
    return k ? sectionOf(k) : undefined;
  }
  return by[resource] ? sectionOf(by[resource]) : undefined;
}

/** Breadcrumbs of an admin list / record: Website › {section} › {list}. The last item is the list (dropped on the list itself). */
export function crumbsFor(resource: string, listTitle?: string, siteKey?: string): { label: string; href?: string }[] {
  const sec = sectionForResource(resource, siteKey);
  const out: { label: string; href?: string }[] = [{ label: "Website", href: "/admin" }];
  if (sec) out.push({ label: sec.title, href: `/admin/site/${sec.key}` });
  if (resource !== "site-pages") out.push({ label: listTitle ?? "", href: `/admin/${resource}` });
  return out;
}
