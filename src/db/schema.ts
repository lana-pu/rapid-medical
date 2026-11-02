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
import { relations } from "drizzle-orm";

/* ------------------------------------------------------------------ */
/*  Enums                                                              */
/* ------------------------------------------------------------------ */

/** Regulatory regions. "us" = Americas, "ous" = Europe & Middle East (+ LATAM/AU), "apac" = Asia-Pacific. */
export const regionEnum = pgEnum("region", ["us", "ous", "apac"]);
export type Region = (typeof regionEnum.enumValues)[number];
export const REGIONS: Region[] = ["us", "ous", "apac"];

export const statusEnum = pgEnum("status", ["draft", "published"]);
export type Status = (typeof statusEnum.enumValues)[number];

export const userRoleEnum = pgEnum("user_role", ["admin", "editor"]);

export const submissionStatusEnum = pgEnum("submission_status", ["new", "in_progress", "done", "spam"]);

/* ------------------------------------------------------------------ */
/*  JSON shapes stored in jsonb columns                                */
/* ------------------------------------------------------------------ */

export type ActionLink = { label: string; href: string };
export type Benefit = { eyebrow?: string; title: string; body: string; imageUrl?: string; videoUrl?: string; footnote?: string; link?: ActionLink };
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
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
});

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
    breadcrumb: text("breadcrumb").notNull().default(""), // "OUR SOLUTIONS / LARGE VESSEL STROKE"
    metaTitle: text("meta_title").notNull().default(""),
    metaDescription: text("meta_description").notNull().default(""),

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

    /** Indications / contraindications – markdown, region-specific */
    regulatoryMd: text("regulatory_md").notNull().default(""),
    /** Numbered references – markdown */
    referencesMd: text("references_md").notNull().default(""),

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
  bioMd: text("bio_md").notNull().default(""),
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
  descriptionMd: text("description_md").notNull().default(""),
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
    bodyMd: text("body_md").notNull().default(""),
    metaTitle: text("meta_title").notNull().default(""),
    metaDescription: text("meta_description").notNull().default(""),
    /** Hide from sitemap/nav (landing pages used in campaigns) */
    noindex: boolean("noindex").notNull().default(false),
    status: statusEnum("status").notNull().default("draft"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("pages_slug_region").on(t.slug, t.region)],
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
  form: text("form").notNull().default("contact"), // contact | webinar | careers
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
export type Webinar = typeof webinars.$inferSelect;
export type TeamMember = typeof teamMembers.$inferSelect;
export type Job = typeof jobs.$inferSelect;
export type Page = typeof pages.$inferSelect;
export type ContactSubmission = typeof contactSubmissions.$inferSelect;
export type Redirect = typeof redirects.$inferSelect;
