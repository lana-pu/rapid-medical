import type { PgTable } from "drizzle-orm/pg-core";
import {
  products,
  solutions,
  publications,
  newsItems,
  webinars,
  teamMembers,
  jobs,
  pages,
  redirects,
} from "@/db/schema";
import type { FieldDef, ListColumn } from "./fields";
import { THERAPY_GROUPS } from "@/lib/therapy-groups";
import { events } from "@/db/schema";
import { templateBlocks } from "@/blocks/templates";
import { sitePagePath } from "@/blocks/site-pages";
import { sitePages } from "@/db/schema";

/** The page's sections (ADR-007): edited on the page; the fields marked `onPage` moved into them. */
const blocksField: FieldDef = { name: "blocks", label: "Page sections", type: "blocks", onPage: true };

export type Resource = {
  slug: string;
  title: string;
  titleSingular: string;
  table: PgTable;
  /** Column used as the row label in lists */
  labelField: string;
  fields: FieldDef[];
  listColumns: ListColumn[];
  /** Column to sort lists by (desc) */
  sortBy: string;
  /** Public paths to revalidate after save */
  revalidate: string[];
  /** Build public preview URL for a row (optional) */
  previewUrl?: (row: Record<string, unknown>) => string | null;
  /** Fill what the form does not ask for when a record is created (e.g. the page's first block list). */
  onCreate?: (data: Record<string, unknown>) => Record<string, unknown>;
  /** The site cannot do without these records (Home, About…): no create, unpublish or delete. */
  alwaysLive?: boolean;
};

const statusField: FieldDef = { name: "status", label: "Status", type: "status", half: true };
const sortField: FieldDef = { name: "sortOrder", label: "Sort order", type: "number", half: true };

const actionLinkFields: FieldDef[] = [
  { name: "label", label: "Label", type: "text", required: true, half: true },
  { name: "href", label: "Link (URL or mailto:)", type: "text", required: true, half: true },
];

export const RESOURCES: Resource[] = [
  /* ------------------------------------------------------------- */
  {
    slug: "solutions",
    title: "Therapies",
    titleSingular: "Therapy page",
    table: solutions,
    labelField: "navLabel",
    sortBy: "sortOrder",
    revalidate: ["/us", "/ous"],
    previewUrl: (r) => `/${r.region}/therapies/${r.slug}`,
    onCreate: (d) => ({ ...d, heroTitle: d.heroTitle || d.navLabel, blocks: templateBlocks("therapy", String(d.navLabel ?? "")) }),
    listColumns: [
      { name: "navLabel", label: "Name" },
      { name: "slug", label: "Slug" },
      { name: "region", label: "Region", kind: "region" },
      { name: "productId", label: "Product", kind: "product" },
      { name: "status", label: "Status", kind: "status" },
    ],
    fields: [
      { name: "navLabel", label: "Menu label", type: "text", required: true, half: true, section: "Basics" },
      { name: "slug", label: "Slug", type: "slug", required: true, half: true, section: "Basics", help: "lvo, mvo, aneurysm, vasospasm, access" },
      { name: "region", label: "Region", type: "region", required: true, half: true, section: "Basics" },
      { name: "productId", label: "Product", type: "product", half: true, section: "Basics" },
      { ...statusField, section: "Basics" },
      { ...sortField, section: "Basics" },
      { onPage: true, name: "breadcrumb", label: "Breadcrumb", type: "text", section: "Basics", placeholder: "OUR SOLUTIONS / LARGE VESSEL STROKE" },
      {
        name: "therapyGroup",
        label: "Group in the menu and on the overview",
        type: "select",
        half: true,
        section: "Basics",
        options: [{ value: "", label: "No group (listed last)" }, ...THERAPY_GROUPS.map((g) => ({ value: g.value, label: g.label }))],
      },
      { name: "proofPoint", label: "Proof point on the overview card", type: "text", half: true, section: "Basics", help: "One line with a cited result. Optional; fill in after MLR approval." },

      { onPage: true, name: "heroTitle", label: "Hero title", type: "text", required: true, section: "Hero" },
      { onPage: true, name: "heroBody", label: "Hero body", type: "textarea", section: "Hero", rows: 3 },
      { onPage: true, name: "heroImageUrl", label: "Hero image (or video poster)", type: "image", section: "Hero", half: true },
      { onPage: true, name: "heroVideoUrl", label: "Hero background video (mp4)", type: "image", section: "Hero", half: true },
      { onPage: true, name: "heroCta", label: "Hero CTA", type: "link", section: "Hero" },

      { onPage: true, name: "introTitle", label: "Intro title", type: "text", section: "Intro" },
      { onPage: true, name: "introBody", label: "Intro body", type: "textarea", section: "Intro", rows: 3 },
      { onPage: true, name: "introImageUrl", label: "Intro image", type: "image", section: "Intro", half: true },
      { onPage: true, name: "introVideoUrl", label: "Intro video (mp4)", type: "image", section: "Intro", half: true },

      {
        onPage: true,
        name: "benefits",
        label: "Benefit blocks",
        type: "repeater",
        section: "Benefits",
        fields: [
          { name: "eyebrow", label: "Eyebrow", type: "text", half: true },
          { name: "title", label: "Title", type: "text", required: true, half: true },
          { name: "body", label: "Body", type: "textarea", rows: 3 },
          { name: "imageUrl", label: "Image", type: "image", half: true },
          { name: "videoUrl", label: "Video (mp4 or YouTube)", type: "image", half: true },
          { name: "secondaryImageUrl", label: "Secondary image (shown beside the media, e.g. device photo)", type: "image" },
          {
            name: "stats",
            label: "Proof points (big numbers in circles – shown instead of the image)",
            type: "repeater",
            fields: [
              { name: "value", label: "Value", type: "text", required: true, half: true, placeholder: "47%" },
              { name: "label", label: "Label", type: "text", required: true, half: true, placeholder: "FPE" },
              { name: "note", label: "Small note", type: "text" },
            ],
          },
          { name: "statsCaption", label: "Caption under the proof points", type: "text", placeholder: "In challenging ICAD cases⁵" },
          { name: "chart", label: "Chart (JSON: kind bar|stackedBar, title, unit, max, categories[], series[{name, values[]}], highlight[], annotations[], note)", type: "json" },
          { name: "footnote", label: "Footnote", type: "text" },
          { name: "link", label: "Link", type: "link" },
        ],
      },

      { onPage: true, name: "overviewTitle", label: "Overview title", type: "text", section: "Product overview", half: true },
      { onPage: true, name: "overviewBody", label: "Overview body", type: "textarea", section: "Product overview", rows: 3 },
      {
        onPage: true,
        name: "overviewFeatures",
        label: "Features (icon + title + text, 2×2)",
        type: "repeater",
        section: "Product overview",
        fields: [
          { name: "iconUrl", label: "Icon / photo", type: "image", half: true },
          { name: "title", label: "Title", type: "text", required: true, half: true },
          { name: "body", label: "Text", type: "textarea", rows: 2 },
        ],
      },
      { onPage: true, name: "annotatedImage", label: "Device diagram (JSON: imageUrl, caption, markers[{x, y, label}] – x/y in % of the image)", type: "json", section: "Product overview" },
      { onPage: true, name: "overviewImageUrl", label: "Overview image (legacy – used only when no features are filled in)", type: "image", section: "Product overview" },
      { onPage: true, name: "specs", label: "Specifications table", type: "table", section: "Product overview", help: "Shown instead of the specification images when filled in." },
      { onPage: true, name: "specImageUrls", label: "Specification images (legacy)", type: "stringList", section: "Product overview", help: "One URL per line. Used only while the table above is empty." },
      { onPage: true, name: "specNote", label: "Specification note", type: "text", section: "Product overview" },

      {
        onPage: true,
        name: "howItWorks",
        label: "Steps",
        type: "repeater",
        section: "How it works",
        fields: [
          { name: "title", label: "Title", type: "text", required: true },
          { name: "body", label: "Body", type: "textarea", rows: 2 },
          { name: "imageUrl", label: "Image", type: "image", half: true },
          { name: "videoUrl", label: "Video (mp4)", type: "image", half: true },
        ],
      },

      {
        onPage: true,
        name: "inPractice",
        label: "In-practice items",
        type: "repeater",
        section: "In practice",
        fields: [
          {
            name: "kind",
            label: "Kind",
            type: "select",
            half: true,
            options: [
              { value: "testimonial", label: "Testimonial" },
              { value: "case", label: "Case study" },
              { value: "recording", label: "Recording" },
            ],
          },
          { name: "title", label: "Title", type: "text", required: true, half: true },
          { name: "person", label: "Person", type: "text", half: true },
          { name: "location", label: "Location / event", type: "text", half: true },
          { name: "linkUrl", label: "Link", type: "url", required: true },
          { name: "imageUrl", label: "Image", type: "image" },
        ],
      },

      { onPage: true, name: "actionLinks", label: "Action links", type: "repeater", section: "Actions", fields: actionLinkFields, help: "Not shown on the page since 2026-11 (two actions: Request a demo + Customer support → contact form). Kept for reference." },
      { onPage: true, name: "actionNote", label: "Action note", type: "text", section: "Actions", placeholder: "Canada: orders.canada@rapid-medical.com" },
      { onPage: true, name: "webinarCtaEnabled", label: "Show webinar CTA", type: "boolean", section: "Actions" },

      { onPage: true, name: "closingTitle", label: "Closing title", type: "text", section: "Closing" },
      { onPage: true, name: "closingBody", label: "Closing body", type: "textarea", section: "Closing", rows: 2 },
      { onPage: true, name: "closingEmbedUrl", label: "Closing video (YouTube URL or mp4)", type: "url", section: "Closing" },

      { onPage: true, name: "regulatoryHtml", label: "Indications / contraindications", type: "markdown", section: "Regulatory", rows: 8 },
      { onPage: true, name: "referencesHtml", label: "References ", type: "markdown", section: "Regulatory", rows: 8 },

      blocksField,
      { name: "metaTitle", label: "Meta title", type: "text", section: "SEO", half: true },
      { name: "metaDescription", label: "Meta description", type: "textarea", section: "SEO", rows: 2 },
      { name: "shareImageUrl", label: "Social share image (Open Graph; falls back to the hero image)", type: "image", section: "SEO" },
    ],
  },

  /* ------------------------------------------------------------- */
  {
    slug: "publications",
    title: "Publications",
    titleSingular: "Publication",
    table: publications,
    labelField: "title",
    sortBy: "publishedOn",
    revalidate: ["/us/evidence", "/ous/evidence"],
    listColumns: [
      { name: "title", label: "Title" },
      { name: "publishedOn", label: "Date", kind: "date" },
      { name: "productId", label: "Product", kind: "product" },
      { name: "regions", label: "Regions", kind: "regions" },
      { name: "featured", label: "Featured", kind: "boolean" },
      { name: "status", label: "Status", kind: "status" },
    ],
    fields: [
      { name: "title", label: "Title", type: "text", required: true },
      { name: "authors", label: "Authors", type: "textarea", rows: 2 },
      { name: "journal", label: "Journal / citation", type: "text" },
      { name: "publishedOn", label: "Published", type: "month", required: true, half: true, help: "Month and year" },
      { name: "productId", label: "Product", type: "product", half: true },
      { name: "url", label: "Link (DOI / journal)", type: "url", half: true },
      { name: "pdfUrl", label: "PDF", type: "url", half: true },
      { name: "doi", label: "DOI", type: "text", half: true },
      { name: "regions", label: "Show in regions", type: "regions", half: true, help: "Leave empty for all." },
      { name: "featured", label: "Featured on Evidence page", type: "boolean", half: true },
      { name: "imageUrl", label: "Image (for featured)", type: "image" },
      statusField,
    ],
  },

  /* ------------------------------------------------------------- */
  {
    // Decision 2026-11-10 (docs/screens/events.md): marketing publishes events; upcoming / past comes from the dates.
    slug: "events",
    title: "Events",
    titleSingular: "Event",
    table: events,
    labelField: "title",
    sortBy: "startsOn",
    revalidate: ["/news-events"],
    previewUrl: (r) => `/events/${r.slug}`,
    listColumns: [
      { name: "title", label: "Title" },
      { name: "startsOn", label: "Date", kind: "date" },
      { name: "city", label: "City" },
      { name: "startsOn", label: "When", kind: "eventWhen" },
      { name: "status", label: "Status", kind: "status" },
    ],
    fields: [
      { name: "title", label: "Title", type: "text", required: true, half: true, section: "Event" },
      { name: "slug", label: "Slug", type: "slug", required: true, half: true, section: "Event" },
      { name: "subtitle", label: "Subtitle", type: "text", section: "Event", placeholder: "Real-world experience from two perspectives" },
      { name: "startsOn", label: "Date (first day)", type: "date", required: true, half: true, section: "Event", help: "YYYY-MM-DD. The event moves to “Past events” on its own the day after it ends." },
      { name: "endsOn", label: "Last day (if several days)", type: "date", half: true, section: "Event" },
      { name: "startTime", label: "Time", type: "text", half: true, section: "Event", placeholder: "12:45 PM" },
      { name: "congress", label: "Congress", type: "text", half: true, section: "Event", placeholder: "ESMINT" },
      { name: "city", label: "City", type: "text", half: true, section: "Event" },
      { name: "venue", label: "Venue", type: "text", half: true, section: "Event", placeholder: "Park Hyatt Busan" },
      { name: "imageUrl", label: "Image", type: "image", section: "Event" },
      { name: "descriptionHtml", label: "Description", type: "markdown", rows: 8, section: "Event" },
      statusField,
      {
        name: "registration",
        label: "Registration",
        type: "select",
        half: true,
        section: "Registration",
        options: [
          { value: "none", label: "No registration" },
          { value: "form", label: "Form on our site" },
          { value: "link", label: "Link to another site" },
        ],
      },
      { name: "registrationUrl", label: "Registration link", type: "url", half: true, section: "Registration", help: "Only for “Link to another site”." },
      { name: "registrationClosesOn", label: "Registration closes after", type: "date", half: true, section: "Registration", help: "Empty = the first day of the event." },
      { name: "recapHtml", label: "Recap (after the event)", type: "markdown", rows: 6, section: "After the event", help: "Shown instead of the description once the event has taken place. Optional." },
      { name: "recapPhotos", label: "Photos (after the event)", type: "stringList", section: "After the event", help: "One image URL per line, from Media." },
    ],
  },

  /* ------------------------------------------------------------- */
  {
    slug: "news",
    title: "News",
    titleSingular: "News item",
    table: newsItems,
    labelField: "title",
    sortBy: "publishedOn",
    revalidate: ["/", "/news-events"],
    listColumns: [
      { name: "title", label: "Title" },
      { name: "publishedOn", label: "Date", kind: "date" },
      { name: "source", label: "Source" },
      { name: "featured", label: "Featured", kind: "boolean" },
      { name: "status", label: "Status", kind: "status" },
    ],
    fields: [
      { name: "title", label: "Title", type: "text", required: true },
      { name: "publishedOn", label: "Date", type: "date", required: true, half: true },
      { name: "source", label: "Source", type: "text", half: true, placeholder: "BusinessWire" },
      { name: "url", label: "External link", type: "url", required: true },
      { name: "excerpt", label: "Excerpt", type: "textarea", rows: 2 },
      { name: "imageUrl", label: "Image", type: "image" },
      { name: "featured", label: "Featured on home / top of News", type: "boolean", half: true },
      statusField,
    ],
  },

  /* ------------------------------------------------------------- */
  {
    slug: "webinars",
    title: "Webinars",
    titleSingular: "Webinar",
    table: webinars,
    labelField: "title",
    sortBy: "sortOrder",
    revalidate: ["/us/webinars", "/ous/webinars"],
    listColumns: [
      { name: "title", label: "Title" },
      { name: "speaker", label: "Speaker" },
      { name: "productId", label: "Product", kind: "product" },
      { name: "regions", label: "Regions", kind: "regions" },
      { name: "status", label: "Status", kind: "status" },
    ],
    fields: [
      { name: "title", label: "Title", type: "text", required: true },
      { name: "speaker", label: "Speaker", type: "text", half: true },
      { name: "event", label: "Event", type: "text", half: true },
      { name: "heldOn", label: "Date", type: "date", half: true },
      { name: "productId", label: "Product", type: "product", half: true },
      { name: "videoUrl", label: "Recording URL (private)", type: "url" },
      { name: "imageUrl", label: "Image", type: "image" },
      { name: "regions", label: "Regions", type: "regions", half: true },
      statusField,
      sortField,
    ],
  },

  /* ------------------------------------------------------------- */
  {
    slug: "team",
    title: "Team",
    titleSingular: "Team member",
    table: teamMembers,
    labelField: "name",
    sortBy: "sortOrder",
    revalidate: ["/about-us"],
    previewUrl: (r) => `/about-us#${r.slug}`,
    listColumns: [
      { name: "name", label: "Name" },
      { name: "title", label: "Title" },
      { name: "sortOrder", label: "Order" },
      { name: "status", label: "Status", kind: "status" },
    ],
    fields: [
      { name: "name", label: "Name", type: "text", required: true, half: true },
      { name: "slug", label: "Slug", type: "slug", required: true, half: true },
      { name: "title", label: "Short title", type: "text", required: true, half: true, placeholder: "CO-FOUNDER & CEO" },
      { name: "longTitle", label: "Long title", type: "text", half: true },
      { name: "photoUrl", label: "Photo", type: "image" },
      { name: "bioHtml", label: "Bio ", type: "markdown", rows: 8 },
      statusField,
      sortField,
    ],
  },

  /* ------------------------------------------------------------- */
  {
    slug: "jobs",
    title: "Jobs",
    titleSingular: "Position",
    table: jobs,
    labelField: "title",
    sortBy: "sortOrder",
    revalidate: ["/careers", "/open-positions"],
    previewUrl: (r) => `/open-positions/${r.slug}`,
    listColumns: [
      { name: "title", label: "Title" },
      { name: "location", label: "Location" },
      { name: "department", label: "Department" },
      { name: "status", label: "Status", kind: "status" },
    ],
    fields: [
      { name: "title", label: "Title", type: "text", required: true, half: true },
      { name: "slug", label: "Slug", type: "slug", required: true, half: true },
      { name: "location", label: "Location", type: "text", half: true },
      { name: "department", label: "Department", type: "text", half: true },
      { name: "descriptionHtml", label: "Description ", type: "markdown", rows: 12 },
      { name: "applyUrl", label: "Apply URL", type: "url", half: true },
      { name: "applyEmail", label: "Apply email", type: "text", half: true },
      statusField,
      sortField,
    ],
  },

  /* ------------------------------------------------------------- */
  {
    slug: "pages",
    title: "Text pages",
    titleSingular: "Page",
    table: pages,
    labelField: "title",
    sortBy: "updatedAt",
    revalidate: ["/"],
    previewUrl: (r) => (r.region ? `/${r.region}/${r.slug}` : `/${r.slug}`),
    onCreate: (d) => ({ ...d, blocks: templateBlocks("text", String(d.title ?? "")) }),
    listColumns: [
      { name: "title", label: "Title" },
      { name: "slug", label: "Slug" },
      { name: "region", label: "Region", kind: "region" },
      { name: "noindex", label: "No-index", kind: "boolean" },
      { name: "status", label: "Status", kind: "status" },
    ],
    fields: [
      { name: "title", label: "Title", type: "text", required: true, half: true },
      { name: "slug", label: "Slug", type: "slug", required: true, half: true },
      { name: "region", label: "Region (empty = global)", type: "region", half: true },
      { name: "noindex", label: "Hide from search engines", type: "boolean", half: true },
      { onPage: true, name: "bodyHtml", label: "Body ", type: "markdown", rows: 20 },
      blocksField,
      { name: "metaTitle", label: "Meta title", type: "text", section: "SEO", half: true },
      { name: "metaDescription", label: "Meta description", type: "textarea", section: "SEO", rows: 2 },
      { ...statusField, section: "SEO" },
    ],
  },

  /* ------------------------------------------------------------- */
  {
    // Home, About, Careers, Evidence ×3, Therapies overview ×3 (ADR-007): content is edited on the page only.
    slug: "site-pages",
    title: "Site pages",
    titleSingular: "Page",
    table: sitePages,
    labelField: "title",
    sortBy: "id",
    revalidate: ["/"],
    previewUrl: (r) => sitePagePath(String(r.key), (r.region ?? null) as never),
    alwaysLive: true,
    listColumns: [
      { name: "title", label: "Name" },
      { name: "key", label: "Page" },
      { name: "region", label: "Region", kind: "region" },
      { name: "status", label: "Status", kind: "status" },
    ],
    fields: [{ name: "title", label: "Page name (in the admin)", type: "text", required: true }, blocksField, statusField],
  },

  /* ------------------------------------------------------------- */
  {
    slug: "products",
    title: "Products",
    titleSingular: "Product",
    table: products,
    labelField: "name",
    sortBy: "sortOrder",
    revalidate: ["/us/evidence", "/ous/evidence", "/apac/evidence"],
    listColumns: [
      { name: "name", label: "Name" },
      { name: "slug", label: "Slug" },
      { name: "family", label: "Family" },
      { name: "regions", label: "Evidence tab in", kind: "regions" },
      { name: "sortOrder", label: "Order" },
    ],
    fields: [
      { name: "name", label: "Name", type: "text", required: true, half: true, placeholder: "TIGERTRIEVER™ 13" },
      { name: "slug", label: "Slug", type: "slug", required: true, half: true },
      { name: "fullName", label: "Full name", type: "text", required: true },
      { name: "family", label: "Family slug (parent product)", type: "text", half: true, help: "e.g. tigertriever; empty for a top-level product" },
      sortField,
      { name: "regions", label: "Own Evidence tab in regions", type: "regions", help: "Empty = all regions." },
      { name: "aliases", label: "Region aliases (JSON)", type: "json", required: true, rows: 4, help: "{\"apac\": {\"name\": \"COLUMBUS™\", \"fullName\": \"COLUMBUS™ Steerable Guidewire\"}}" },
    ],
  },

  /* ------------------------------------------------------------- */
  {
    slug: "redirects",
    title: "Redirects",
    titleSingular: "Redirect",
    table: redirects,
    labelField: "from",
    sortBy: "id",
    revalidate: [],
    listColumns: [
      { name: "from", label: "From" },
      { name: "to", label: "To" },
      { name: "permanent", label: "301", kind: "boolean" },
      { name: "hits", label: "Hits" },
    ],
    fields: [
      { name: "from", label: "From path", type: "text", required: true, help: "e.g. /welcome_d or us.rapid-medical.com/lvo" },
      { name: "to", label: "To", type: "text", required: true },
      { name: "permanent", label: "Permanent (301)", type: "boolean" },
    ],
  },
];

export function getResource(slug: string): Resource | undefined {
  return RESOURCES.find((r) => r.slug === slug);
}
