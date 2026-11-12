import {
  pgTable,
  pgEnum,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
  serial,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";

/* ------------------------------------------------------------------ */
/*  Enums                                                              */
/* ------------------------------------------------------------------ */

/** Regulatory regions. "us" = Americas, "ous" = Europe & Middle East (+ LATAM/AU), "apac" = Asia-Pacific. */
export const regionEnum = pgEnum("region", ["us", "ous", "apac"]);
export type Region = (typeof regionEnum.enumValues)[number];
export const REGIONS: Region[] = ["us", "ous", "apac"];

export const statusEnum = pgEnum("status", ["draft", "published"]);
export type Status = (typeof statusEnum.enumValues)[number];

export const userRoleEnum = pgEnum("user_role", ["admin", "designer", "editor"]);
export type UserRole = (typeof userRoleEnum.enumValues)[number];

export const reviewStatusEnum = pgEnum("review_status", ["editing", "in_review", "changes_requested", "approved"]);
export type ReviewStatus = (typeof reviewStatusEnum.enumValues)[number];

export const submissionStatusEnum = pgEnum("submission_status", ["new", "in_progress", "done", "spam"]);

/* ------------------------------------------------------------------ */
/*  JSON shapes stored in jsonb columns                                */
/* ------------------------------------------------------------------ */

export type ActionLink = { label: string; href: string };
export type SpecTable = { caption?: string; columns: string[]; rows: string[][]; note?: string };
/** Big number + caption (home counters, evidence badge, "47% FPE" circles). */
export type Stat = { value: string; label: string; note?: string; iconUrl?: string };
/** Structured chart rendered as SVG (replaces chart screenshots). */
export type Chart = {
  kind: "bar" | "stackedBar";
  title?: string;
  unit?: string;
  max?: number;
  /** one label per bar / bar group */
  categories: string[];
  /** bar: one series with a value per category; stackedBar: several series stacked per category */
  series: { name: string; values: number[] }[];
  /** indexes of categories drawn in the accent colour (kind "bar") */
  highlight?: number[];
  /** free-text callouts shown beside the chart */
  annotations?: string[];
  note?: string;
};
/** Icon + title + text, laid out 2×2 (product overview). */
export type Feature = { iconUrl?: string; title: string; body: string };
/** Image with numbered markers and a legend (device diagrams). */
export type AnnotatedImage = { imageUrl: string; caption?: string; markers: { x: number; y: number; label: string }[] };
/** Text + media row. The media slot shows (in priority order) stats, chart, video, image. */
export type Benefit = {
  eyebrow?: string;
  title: string;
  body: string;
  imageUrl?: string;
  videoUrl?: string;
  /** extra image shown beside the main media (e.g. device photo) */
  secondaryImageUrl?: string;
  stats?: Stat[];
  statsCaption?: string;
  chart?: Chart;
  footnote?: string;
  link?: ActionLink;
};
export type Step = { title: string; body?: string; imageUrl?: string; videoUrl?: string };
export type InPracticeItem = {
  kind: "testimonial" | "case" | "recording";
  title: string;
  person?: string;
  location?: string;
  linkUrl: string;
  imageUrl?: string;
};

/* ------------------------------------------------------------------ */
/*  Users / auth                                                        */
/* ------------------------------------------------------------------ */

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  passwordHash: text("password_hash").notNull(),
  role: userRoleEnum("role").notNull().default("editor"),
  active: boolean("active").notNull().default(true),
  /** TOTP secret (base32) once 2FA is enabled */
  totpSecret: text("totp_secret"),
  totpEnabledAt: timestamp("totp_enabled_at", { withTimezone: true }),
  /** Hashed one-time recovery codes */
  recoveryCodes: jsonb("recovery_codes").$type<string[]>().notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
});

/** Server-side sessions: revocable, listable ("sign out everywhere"). */
export const sessions = pgTable(
  "sessions",
  {
    id: text("id").primaryKey(), // random 32-byte hex
    userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    /** 2FA passed (or not required) */
    verified: boolean("verified").notNull().default(false),
    ip: text("ip"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  },
  (t) => [index("sessions_user").on(t.userId)],
);

/** Password-reset and invite tokens (hashed) */
export const passwordResets = pgTable("password_resets", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull().unique(),
  /** reset — «forgot password» (1 hour); invite — first sign-in of an invited person (7 days) */
  purpose: text("purpose").notNull().default("reset"),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  usedAt: timestamp("used_at", { withTimezone: true }),
});

/** Login attempts per email/IP for throttling */
export const loginAttempts = pgTable(
  "login_attempts",
  {
    id: serial("id").primaryKey(),
    key: text("key").notNull(), // "email:<e>" or "ip:<ip>"
    at: timestamp("at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("login_attempts_key").on(t.key, t.at)],
);

/** Public 404s, so editors can create redirects for old links. */
export const notFoundLog = pgTable(
  "not_found_log",
  {
    path: text("path").primaryKey(),
    hits: integer("hits").notNull().default(1),
    lastReferer: text("last_referer"),
    firstSeenAt: timestamp("first_seen_at", { withTimezone: true }).notNull().defaultNow(),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).notNull().defaultNow(),
    /** Set when a redirect was created for it */
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  },
);

/* ------------------------------------------------------------------ */
/*  Media library                                                       */
/* ------------------------------------------------------------------ */

export const media = pgTable("media", {
  id: serial("id").primaryKey(),
  /** Public URL (local /uploads/... or CDN) */
  url: text("url").notNull(),
  filename: text("filename").notNull(),
  mime: text("mime").notNull(),
  size: integer("size").notNull(),
  width: integer("width"),
  height: integer("height"),
  alt: text("alt").notNull().default(""),
  /** Storage key of the original (for deletion) */
  key: text("key"),
  /** Responsive WebP variants [{w, url}] for raster images */
  variants: jsonb("variants").$type<{ w: number; url: string }[]>().notNull().default([]),
  /** Tiny data-URI placeholder for blur-up */
  placeholder: text("placeholder"),
  /** Poster image URL for videos */
  posterUrl: text("poster_url"),
  /** Original Duda URL, kept for traceability during migration */
  sourceUrl: text("source_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/* ------------------------------------------------------------------ */
/*  Products (brands) – used as tags for solutions, evidence, webinars  */
/* ------------------------------------------------------------------ */

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(), // tigertriever | comaneci | drivewire
  name: text("name").notNull(), // TIGERTRIEVER™
  fullName: text("full_name").notNull(), // TIGERTRIEVER™ Revascularization Device
  /** Parent family slug (e.g. tigertriever-13 → tigertriever); null for a family itself */
  family: text("family"),
  /** Regions where this product gets its own Evidence tab; empty = all */
  regions: jsonb("regions").$type<Region[]>().notNull().default([]),
  /** Region-specific display names, e.g. { apac: "COLUMBUS™" } */
  aliases: jsonb("aliases").$type<Partial<Record<Region, { name: string; fullName: string }>>>().notNull().default({}),
  sortOrder: integer("sort_order").notNull().default(0),
});

/**
 * A page section stored in a block list (ADR-007). `type` and `variant` come from the block registry
 * (src/blocks/registry.ts); `data` follows that block type's data shape; `source` names a list that is
 * filled in at render time from other records (src/blocks/stored.ts → SOURCES).
 */
export type StoredBlock = { id: string; type: string; variant: string; data: Record<string, unknown>; source?: string };

/* ------------------------------------------------------------------ */
/*  Solutions = therapy pages (LVO, MVO, Aneurysm, Vasospasm, Access)   */
/*  One row per (slug, region) because regulatory copy differs.        */
/* ------------------------------------------------------------------ */

export const solutions = pgTable(
  "solutions",
  {
    id: serial("id").primaryKey(),
    slug: text("slug").notNull(), // lvo | mvo | aneurysm | vasospasm | access
    region: regionEnum("region").notNull(),
    productId: integer("product_id").references(() => products.id, { onDelete: "set null" }),
    status: statusEnum("status").notNull().default("draft"),
    sortOrder: integer("sort_order").notNull().default(0),

    navLabel: text("nav_label").notNull(), // "Large vessel stroke"
    /** Menu and overview group: ischemic | hemorrhagic | access ("" = ungrouped, listed last) */
    therapyGroup: text("therapy_group").notNull().default(""),
    /** Optional one-line proof point on the overview card ("TIGER trial: …"); filled after MLR review */
    proofPoint: text("proof_point").notNull().default(""),
    breadcrumb: text("breadcrumb").notNull().default(""), // "OUR SOLUTIONS / LARGE VESSEL STROKE"
    metaTitle: text("meta_title").notNull().default(""),
    metaDescription: text("meta_description").notNull().default(""),
    /** Social share (Open Graph) image; falls back to the hero image */
    shareImageUrl: text("share_image_url"),

    heroTitle: text("hero_title").notNull(),
    heroBody: text("hero_body").notNull().default(""),
    heroImageUrl: text("hero_image_url"),
    heroVideoUrl: text("hero_video_url"),
    heroCta: jsonb("hero_cta").$type<ActionLink | null>(),

    /** Optional intro block below the hero (e.g. "Like fingerprints…") */
    introTitle: text("intro_title"),
    introBody: text("intro_body"),
    introVideoUrl: text("intro_video_url"),
    introImageUrl: text("intro_image_url"),

    benefits: jsonb("benefits").$type<Benefit[]>().notNull().default([]),

    overviewTitle: text("overview_title").notNull().default("Product overview"),
    overviewBody: text("overview_body").notNull().default(""),
    /** Icon + title + text features (2×2 grid) */
    overviewFeatures: jsonb("overview_features").$type<Feature[]>().notNull().default([]),
    /** Device diagram with numbered markers */
    annotatedImage: jsonb("annotated_image").$type<AnnotatedImage | null>(),
    overviewImageUrl: text("overview_image_url"),
    specImageUrls: jsonb("spec_image_urls").$type<string[]>().notNull().default([]),
    specNote: text("spec_note").notNull().default("Not all products are available in all countries."),

    howItWorks: jsonb("how_it_works").$type<Step[]>().notNull().default([]),
    inPractice: jsonb("in_practice").$type<InPracticeItem[]>().notNull().default([]),

    /** Order / IFU / question links shown under tabs — differ per region */
    actionLinks: jsonb("action_links").$type<ActionLink[]>().notNull().default([]),
    actionNote: text("action_note"), // "Canada: orders.canada@rapid-medical.com"

    webinarCtaEnabled: boolean("webinar_cta_enabled").notNull().default(true),

    closingTitle: text("closing_title"),
    closingBody: text("closing_body"),
    /** YouTube/Vimeo embed or mp4 shown in the closing section */
    closingEmbedUrl: text("closing_embed_url"),

    /** Structured specification table (replaces spec screenshots) */
    specs: jsonb("specs").$type<SpecTable | null>(),
    /** Indications / contraindications – rich text HTML, region-specific */
    regulatoryHtml: text("regulatory_html").notNull().default(""),
    /** Numbered references – rich text HTML */
    referencesHtml: text("references_html").notNull().default(""),

    /** The page as a block list (ADR-007). null = not converted yet: built from the fields above. */
    blocks: jsonb("blocks").$type<StoredBlock[] | null>(),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("solutions_slug_region").on(t.slug, t.region)],
);

/* ------------------------------------------------------------------ */
/*  Evidence / publications                                             */
/* ------------------------------------------------------------------ */

export const publications = pgTable(
  "publications",
  {
    id: serial("id").primaryKey(),
    title: text("title").notNull(),
    authors: text("authors").notNull().default(""),
    journal: text("journal").notNull().default(""),
    /** First day of the publication month; day is ignored in UI */
    publishedOn: timestamp("published_on", { withTimezone: false, mode: "date" }).notNull(),
    url: text("url"), // DOI / journal link
    pdfUrl: text("pdf_url"),
    doi: text("doi"),
    productId: integer("product_id").references(() => products.id, { onDelete: "set null" }),
    /** Regions where it is shown; empty = all */
    regions: jsonb("regions").$type<Region[]>().notNull().default([]),
    featured: boolean("featured").notNull().default(false),
    imageUrl: text("image_url"),
    status: statusEnum("status").notNull().default("published"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("publications_date").on(t.publishedOn)],
);

/* ------------------------------------------------------------------ */
/*  News & events (external links)                                      */
/* ------------------------------------------------------------------ */

export const newsItems = pgTable(
  "news_items",
  {
    id: serial("id").primaryKey(),
    title: text("title").notNull(),
    publishedOn: timestamp("published_on", { withTimezone: false, mode: "date" }).notNull(),
    url: text("url").notNull(),
    source: text("source").notNull().default(""), // BusinessWire, NeuroNews…
    imageUrl: text("image_url"),
    excerpt: text("excerpt").notNull().default(""),
    featured: boolean("featured").notNull().default(false),
    status: statusEnum("status").notNull().default("published"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("news_date").on(t.publishedOn)],
);

/* ------------------------------------------------------------------ */
/*  Events (decision 2026-11-10, docs/screens/events.md)                */
/*  Upcoming / past is derived from the dates — nobody archives by hand */
/* ------------------------------------------------------------------ */

export const events = pgTable(
  "events",
  {
    id: serial("id").primaryKey(),
    slug: text("slug").notNull().unique(),
    title: text("title").notNull(),
    subtitle: text("subtitle").notNull().default(""),
    startsOn: timestamp("starts_on", { withTimezone: false, mode: "date" }).notNull(),
    /** Free text, e.g. "12:45 PM" or "19:30"; empty = no time shown */
    startTime: text("start_time").notNull().default(""),
    /** Last day of a multi-day event; null = one day */
    endsOn: timestamp("ends_on", { withTimezone: false, mode: "date" }),
    city: text("city").notNull().default(""),
    venue: text("venue").notNull().default(""),
    /** Congress the event is part of (ESMINT, LINNC…) */
    congress: text("congress").notNull().default(""),
    descriptionHtml: text("description_html").notNull().default(""),
    imageUrl: text("image_url"),
    /** none | form | link */
    registration: text("registration").notNull().default("none"),
    registrationUrl: text("registration_url"),
    /** Registration closes after this day; null = the start day */
    registrationClosesOn: timestamp("registration_closes_on", { withTimezone: false, mode: "date" }),
    recapHtml: text("recap_html").notNull().default(""),
    recapPhotos: jsonb("recap_photos").$type<string[]>().notNull().default([]),
    status: statusEnum("status").notNull().default("draft"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("events_date").on(t.startsOn)],
);

/* ------------------------------------------------------------------ */
/*  Webinars (gated – shown as a list, access via request form)         */
/* ------------------------------------------------------------------ */

export const webinars = pgTable("webinars", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  speaker: text("speaker").notNull().default(""),
  event: text("event").notNull().default(""),
  heldOn: timestamp("held_on", { mode: "date" }),
  videoUrl: text("video_url"), // private; sent on request
  imageUrl: text("image_url"),
  productId: integer("product_id").references(() => products.id, { onDelete: "set null" }),
  regions: jsonb("regions").$type<Region[]>().notNull().default([]),
  status: statusEnum("status").notNull().default("published"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/* ------------------------------------------------------------------ */
/*  Team                                                                */
/* ------------------------------------------------------------------ */

export const teamMembers = pgTable("team_members", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  title: text("title").notNull(), // shown on About
  longTitle: text("long_title").notNull().default(""), // shown on profile
  bioHtml: text("bio_html").notNull().default(""),
  photoUrl: text("photo_url"),
  sortOrder: integer("sort_order").notNull().default(0),
  status: statusEnum("status").notNull().default("published"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/* ------------------------------------------------------------------ */
/*  Jobs                                                                */
/* ------------------------------------------------------------------ */

export const jobs = pgTable("jobs", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  location: text("location").notNull().default(""),
  department: text("department").notNull().default(""),
  descriptionHtml: text("description_html").notNull().default(""),
  applyUrl: text("apply_url"),
  applyEmail: text("apply_email"),
  status: statusEnum("status").notNull().default("draft"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/* ------------------------------------------------------------------ */
/*  Generic pages (legal, landing pages)                                */
/* ------------------------------------------------------------------ */

export const pages = pgTable(
  "pages",
  {
    id: serial("id").primaryKey(),
    slug: text("slug").notNull(),
    /** null = global page; otherwise lives under /[region]/… */
    region: regionEnum("region"),
    title: text("title").notNull(),
    bodyHtml: text("body_html").notNull().default(""),
    /** The page as a block list (ADR-007). null = not converted yet: title + bodyHtml. */
    blocks: jsonb("blocks").$type<StoredBlock[] | null>(),
    metaTitle: text("meta_title").notNull().default(""),
    metaDescription: text("meta_description").notNull().default(""),
    /** Social share (Open Graph) image; falls back to the hero image */
    shareImageUrl: text("share_image_url"),
    /** Hide from sitemap/nav (landing pages used in campaigns) */
    noindex: boolean("noindex").notNull().default(false),
    status: statusEnum("status").notNull().default("draft"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("pages_slug_region").on(t.slug, t.region)],
);

/* ------------------------------------------------------------------ */
/*  Singleton pages (Home, About, Careers, Evidence, Therapies overview) */
/* ------------------------------------------------------------------ */

export const SITE_PAGE_KEYS = ["home", "about", "careers", "evidence", "therapies"] as const;
export type SitePageKey = (typeof SITE_PAGE_KEYS)[number];

/** Pages that exist once (or once per region) and are only edited on the page (ADR-007). */
export const sitePages = pgTable(
  "site_pages",
  {
    id: serial("id").primaryKey(),
    key: text("key").$type<SitePageKey>().notNull(),
    /** null = one page for all regions (Home, About, Careers) */
    region: regionEnum("region"),
    title: text("title").notNull(),
    blocks: jsonb("blocks").$type<StoredBlock[]>().notNull().default([]),
    status: statusEnum("status").notNull().default("published"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  // one page per key and region, and one global page per key
  (t) => [uniqueIndex("site_pages_key_region").on(t.key, t.region), uniqueIndex("site_pages_key_global").on(t.key).where(sql`${t.region} is null`)],
);

/* ------------------------------------------------------------------ */
/*  Site settings (key → json)                                          */
/* ------------------------------------------------------------------ */

export const siteSettings = pgTable("site_settings", {
  key: text("key").primaryKey(), // contact | social | home | about | careers | footer
  value: jsonb("value").$type<Record<string, unknown>>().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/* ------------------------------------------------------------------ */
/*  Form submissions                                                    */
/* ------------------------------------------------------------------ */

export const contactSubmissions = pgTable("contact_submissions", {
  id: serial("id").primaryKey(),
  form: text("form").notNull().default("contact"), // contact | webinar | careers | event
  topic: text("topic").notNull().default(""),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  organization: text("organization").notNull().default(""),
  email: text("email").notNull(),
  phone: text("phone").notNull().default(""),
  region: text("region").notNull().default(""),
  country: text("country").notNull().default(""),
  state: text("state").notNull().default(""),
  message: text("message").notNull().default(""),
  optIn: boolean("opt_in").notNull().default(false),
  /** Extra fields (webinar title, job slug…) */
  meta: jsonb("meta").$type<Record<string, string>>().notNull().default({}),
  status: submissionStatusEnum("status").notNull().default("new"),
  /** Who answers (docs/screens/admin-requests.md) */
  assignedToId: integer("assigned_to_id").references(() => users.id, { onDelete: "set null" }),
  /** Note for the team, admin only */
  note: text("note").notNull().default(""),
  ip: text("ip"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/* ------------------------------------------------------------------ */
/*  Redirects (legacy Duda URLs → new)                                  */
/* ------------------------------------------------------------------ */

export const redirects = pgTable("redirects", {
  id: serial("id").primaryKey(),
  /** Match on host + path, e.g. "us.rapid-medical.com/lvo" or "/welcome_d" (any host) */
  from: text("from").notNull().unique(),
  to: text("to").notNull(),
  permanent: boolean("permanent").notNull().default(true),
  hits: integer("hits").notNull().default(0),
});

/* ------------------------------------------------------------------ */
/*  Editorial workflow                                                  */
/* ------------------------------------------------------------------ */

/**
 * Pending changes to a *published* record. The live table keeps what the
 * site shows; the draft holds the next version until it is published.
 * `data` is null when the draft only schedules publication of the live row.
 */
export const drafts = pgTable(
  "drafts",
  {
    id: serial("id").primaryKey(),
    resource: text("resource").notNull(), // admin resource slug
    recordId: integer("record_id").notNull(),
    data: jsonb("data").$type<Record<string, unknown> | null>(),
    reviewStatus: reviewStatusEnum("review_status").notNull().default("editing"),
    reviewNote: text("review_note").notNull().default(""),
    publishAt: timestamp("publish_at", { withTimezone: true }),
    updatedById: integer("updated_by_id").references(() => users.id, { onDelete: "set null" }),
    updatedByName: text("updated_by_name").notNull().default(""),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("drafts_resource_record").on(t.resource, t.recordId)],
);

/** Pending change to a site_settings group (made from the on-page editor). */
/** Comments on a page (ADR-006: comments in place instead of an approval step; docs/screens/on-page-editor.md). */
export const comments = pgTable(
  "comments",
  {
    id: serial("id").primaryKey(),
    /** the page record: resource slug + id */
    resource: text("resource").notNull(),
    recordId: integer("record_id").notNull(),
    /** the section (stored block id, or a position inside a tab); null = the whole page */
    anchor: text("anchor"),
    /** a reply to this comment */
    parentId: integer("parent_id"),
    body: text("body").notNull(),
    authorId: integer("author_id").references(() => users.id, { onDelete: "set null" }),
    authorName: text("author_name").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
    resolvedByName: text("resolved_by_name"),
  },
  (t) => [index("comments_page").on(t.resource, t.recordId)],
);
export type Comment = typeof comments.$inferSelect;

export const settingDrafts = pgTable("setting_drafts", {
  key: text("key").primaryKey(),
  value: jsonb("value").$type<Record<string, unknown>>().notNull(),
  updatedById: integer("updated_by_id").references(() => users.id, { onDelete: "set null" }),
  updatedByName: text("updated_by_name").notNull().default(""),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
export type SettingDraft = typeof settingDrafts.$inferSelect;

/** Immutable snapshot taken at every save / publish / restore. */
export const revisions = pgTable(
  "revisions",
  {
    id: serial("id").primaryKey(),
    resource: text("resource").notNull(),
    recordId: integer("record_id").notNull(),
    kind: text("kind").notNull(), // draft | published | restored | created
    data: jsonb("data").$type<Record<string, unknown>>().notNull(),
    userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
    userName: text("user_name").notNull().default(""),
    note: text("note").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("revisions_record").on(t.resource, t.recordId, t.createdAt)],
);

/** Who did what in the admin. */
export const auditLog = pgTable(
  "audit_log",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
    userName: text("user_name").notNull().default(""),
    action: text("action").notNull(), // login, login_failed, save, publish, unpublish, delete, restore, bulk, settings, user, media, review
    resource: text("resource"),
    recordId: text("record_id"),
    label: text("label").notNull().default(""),
    meta: jsonb("meta").$type<Record<string, unknown>>().notNull().default({}),
    ip: text("ip"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("audit_created").on(t.createdAt)],
);

/* ------------------------------------------------------------------ */
/*  Relations                                                           */
/* ------------------------------------------------------------------ */

export const productsRelations = relations(products, ({ many }) => ({
  solutions: many(solutions),
  publications: many(publications),
  webinars: many(webinars),
}));
export const solutionsRelations = relations(solutions, ({ one }) => ({
  product: one(products, { fields: [solutions.productId], references: [products.id] }),
}));
export const publicationsRelations = relations(publications, ({ one }) => ({
  product: one(products, { fields: [publications.productId], references: [products.id] }),
}));
export const webinarsRelations = relations(webinars, ({ one }) => ({
  product: one(products, { fields: [webinars.productId], references: [products.id] }),
}));

/* ------------------------------------------------------------------ */
/*  Inferred types                                                      */
/* ------------------------------------------------------------------ */
export type User = typeof users.$inferSelect;
export type Media = typeof media.$inferSelect;
export type Product = typeof products.$inferSelect;
export type Solution = typeof solutions.$inferSelect;
export type NewSolution = typeof solutions.$inferInsert;
export type Publication = typeof publications.$inferSelect;
export type NewsItem = typeof newsItems.$inferSelect;
export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;
export type Webinar = typeof webinars.$inferSelect;
export type TeamMember = typeof teamMembers.$inferSelect;
export type Job = typeof jobs.$inferSelect;
export type Page = typeof pages.$inferSelect;
export type SitePage = typeof sitePages.$inferSelect;
export type ContactSubmission = typeof contactSubmissions.$inferSelect;
export type Redirect = typeof redirects.$inferSelect;
export type Draft = typeof drafts.$inferSelect;
export type Session = typeof sessions.$inferSelect;
export type Revision = typeof revisions.$inferSelect;
export type AuditEntry = typeof auditLog.$inferSelect;
