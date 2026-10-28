import type { PgTable } from "drizzle-orm/pg-core";
import {
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
      { name: "breadcrumb", label: "Breadcrumb", type: "text", section: "Basics", placeholder: "OUR SOLUTIONS / LARGE VESSEL STROKE" },

      { name: "heroTitle", label: "Hero title", type: "text", required: true, section: "Hero" },
      { name: "heroBody", label: "Hero body", type: "textarea", section: "Hero", rows: 3 },
      { name: "heroImageUrl", label: "Hero image", type: "image", section: "Hero" },
      { name: "heroCta", label: "Hero CTA", type: "repeater", section: "Hero", fields: actionLinkFields, help: "Only the first item is used." },

      { name: "introTitle", label: "Intro title", type: "text", section: "Intro" },
      { name: "introBody", label: "Intro body", type: "textarea", section: "Intro", rows: 3 },

      {
        name: "benefits",
        label: "Benefit blocks",
        type: "repeater",
        section: "Benefits",
        fields: [
          { name: "eyebrow", label: "Eyebrow", type: "text", half: true },
          { name: "title", label: "Title", type: "text", required: true, half: true },
          { name: "body", label: "Body", type: "textarea", rows: 3 },
          { name: "imageUrl", label: "Image", type: "image" },
          { name: "footnote", label: "Footnote", type: "text" },
        ],
      },

      { name: "overviewTitle", label: "Overview title", type: "text", section: "Product overview", half: true },
      { name: "overviewBody", label: "Overview body", type: "textarea", section: "Product overview", rows: 3 },
      { name: "overviewImageUrl", label: "Overview image", type: "image", section: "Product overview" },
      { name: "specImageUrls", label: "Specification images", type: "stringList", section: "Product overview", help: "One URL per line. Replace with a real table later." },
      { name: "specNote", label: "Specification note", type: "text", section: "Product overview" },

      {
        name: "howItWorks",
        label: "Steps",
        type: "repeater",
        section: "How it works",
        fields: [
          { name: "title", label: "Title", type: "text", required: true },
          { name: "body", label: "Body", type: "textarea", rows: 2 },
          { name: "imageUrl", label: "Image", type: "image" },
        ],
      },

      {
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

      { name: "actionLinks", label: "Action links", type: "repeater", section: "Actions", fields: actionLinkFields, help: "Place an order / Ask a question / Request an IFU" },
      { name: "actionNote", label: "Action note", type: "text", section: "Actions", placeholder: "Canada: orders.canada@rapid-medical.com" },
      { name: "webinarCtaEnabled", label: "Show webinar CTA", type: "boolean", section: "Actions" },

      { name: "closingTitle", label: "Closing title", type: "text", section: "Closing" },
      { name: "closingBody", label: "Closing body", type: "textarea", section: "Closing", rows: 2 },

      { name: "regulatoryMd", label: "Indications / contraindications (Markdown)", type: "markdown", section: "Regulatory", rows: 8 },
      { name: "referencesMd", label: "References (Markdown)", type: "markdown", section: "Regulatory", rows: 8 },

      { name: "metaTitle", label: "Meta title", type: "text", section: "SEO", half: true },
      { name: "metaDescription", label: "Meta description", type: "textarea", section: "SEO", rows: 2 },
    ],
  },

  /* ------------------------------------------------------------- */
  {
    slug: "publications",
    title: "Evidence",
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
      { name: "publishedOn", label: "Published (month)", type: "date", required: true, half: true },
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
    slug: "news",
    title: "News & Events",
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
    title: "Leadership team",
    titleSingular: "Team member",
    table: teamMembers,
    labelField: "name",
    sortBy: "sortOrder",
    revalidate: ["/about-us"],
    previewUrl: (r) => `/team/${r.slug}`,
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
      { name: "bioMd", label: "Bio (Markdown)", type: "markdown", rows: 8 },
      statusField,
      sortField,
    ],
  },

  /* ------------------------------------------------------------- */
  {
    slug: "jobs",
    title: "Open positions",
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
      { name: "descriptionMd", label: "Description (Markdown)", type: "markdown", rows: 12 },
      { name: "applyUrl", label: "Apply URL", type: "url", half: true },
      { name: "applyEmail", label: "Apply email", type: "text", half: true },
      statusField,
      sortField,
    ],
  },

  /* ------------------------------------------------------------- */
  {
    slug: "pages",
    title: "Pages",
    titleSingular: "Page",
    table: pages,
    labelField: "title",
    sortBy: "updatedAt",
    revalidate: ["/"],
    previewUrl: (r) => (r.region ? `/${r.region}/${r.slug}` : `/${r.slug}`),
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
      { name: "bodyMd", label: "Body (Markdown)", type: "markdown", rows: 20 },
      { name: "metaTitle", label: "Meta title", type: "text", section: "SEO", half: true },
      { name: "metaDescription", label: "Meta description", type: "textarea", section: "SEO", rows: 2 },
      { ...statusField, section: "SEO" },
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
