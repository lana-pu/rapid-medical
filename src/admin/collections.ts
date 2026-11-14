"use server";

import { getResource } from "./resources";
import { getEditable } from "./workflow";
import { requireEditor } from "./page-core";
import { db, drafts } from "@/db";
import { inArray } from "drizzle-orm";

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Collections in the page editor (docs/screens/on-page-editor.md → «Страницы и коллекции»): records of one kind that
 * share a look on the site. Told in plain words — where they appear, not how they are stored.
 */

type Row = Record<string, any>;
type Def = {
  res: string;
  icon: string;
  title: string;
  where: string;
  newLabel: string;
  /** the record's own page on the site, if it has one */
  page?: (r: Row) => string | null;
  /** one short line under the title: date · place, source, role… */
  sub: (r: Row) => string;
  /** newest first unless the list has its own order */
  order: (a: Row, b: Row) => number;
  /** the heading the record is listed under: year, product, department… (products: id → name) */
  group?: (r: Row, products: Map<number, string>) => string;
  /** the record's picture, if it has one */
  thumb?: (r: Row) => string | null;
};

const month = (d: unknown) => {
  if (!d) return "";
  const x = new Date(String(d));
  return Number.isNaN(x.getTime()) ? "" : x.toLocaleDateString("en-US", { month: "short", year: "numeric", timeZone: "UTC" });
};
const join = (...xs: unknown[]) => xs.filter((x) => typeof x === "string" && x.trim()).join(" · ");
const newest = (k: string) => (a: Row, b: Row) => String(b[k] ?? "").localeCompare(String(a[k] ?? ""));
const year = (d: unknown) => {
  const x = d ? new Date(String(d)) : null;
  return x && !Number.isNaN(x.getTime()) ? String(x.getUTCFullYear()) : "No date";
};
const product = (r: Row, p: Map<number, string>) => (r.productId ? (p.get(Number(r.productId)) ?? "Other") : "All products");
const pic = (k: string) => (r: Row) => (typeof r[k] === "string" && r[k] && !/\.(mp4|webm|mov)(\?|$)/i.test(r[k]) ? (r[k] as string) : null);
const sorted = (a: Row, b: Row) => (Number(a.sortOrder ?? 0) - Number(b.sortOrder ?? 0)) || String(a.title ?? a.name ?? "").localeCompare(String(b.title ?? b.name ?? ""));

const DEFS: Def[] = [
  { res: "news", icon: "📰", title: "News", newLabel: "news item", where: "Cards on News & Events and on the home page; each leads to the article", sub: (r) => join(month(r.publishedOn), r.source), order: newest("publishedOn"), group: (r) => year(r.publishedOn), thumb: pic("imageUrl") },
  { res: "events", icon: "📅", title: "Events", newLabel: "event", where: "On News & Events; each event has its own page", page: (r) => `/events/${r.slug}`, sub: (r) => join(month(r.startsOn), r.city, r.congress), order: newest("startsOn"), group: (r) => year(r.startsOn), thumb: pic("imageUrl") },
  { res: "webinars", icon: "🎥", title: "Webinars", newLabel: "webinar", where: "On the Webinars page; visitors ask for a recording", sub: (r) => join(r.speaker, r.event), order: sorted, group: product, thumb: pic("imageUrl") },
  { res: "publications", icon: "📄", title: "Publications", newLabel: "publication", where: "On Evidence, by product", sub: (r) => join(month(r.publishedOn), r.journal), order: newest("publishedOn"), group: product, thumb: pic("imageUrl") },
  { res: "jobs", icon: "💼", title: "Jobs", newLabel: "position", where: "On Open positions; each position has its own page", page: (r) => `/open-positions/${r.slug}`, sub: (r) => join(r.department, r.location), order: sorted, group: (r) => String(r.department || "Other") },
  { res: "team", icon: "👤", title: "Team", newLabel: "person", where: "Leadership on About; each person has their own page", page: (r) => `/team/${r.slug}`, sub: (r) => join(r.title), order: sorted, thumb: pic("photoUrl") },
  { res: "products", icon: "🏷", title: "Products", newLabel: "product", where: "Product tabs on Evidence and links from therapy pages", sub: (r) => join(r.fullName), order: sorted, group: (r) => String(r.family || "Other") },
];

type Fail = { error: string };
const fail = (e: unknown): Fail => ({ error: (e as Error).message || "Something went wrong" });

export type CollectionSummary = { key: string; icon: string; title: string; where: string; count: number; ownPage: boolean };
export type CollectionField = { name: string; label: string; type: "text" | "textarea" | "url"; required: boolean };
export type CollectionItem = { r: string; id: number; title: string; sub: string; status: "live" | "changed" | "draft" | null; path: string | null; adminHref: string; group: string | null; thumb: string | null };

async function rowsOf(d: Def): Promise<Row[]> {
  const res = getResource(d.res);
  if (!res) return [];
  return (await db.select().from(res.table as any)) as Row[];
}

export async function collectionsOverview(): Promise<{ items: CollectionSummary[] } | Fail> {
  try {
    await requireEditor();
    const items = await Promise.all(
      DEFS.map(async (d) => ({ key: d.res, icon: d.icon, title: d.title, where: d.where, count: (await rowsOf(d)).length, ownPage: !!d.page })),
    );
    return { items };
  } catch (e) {
    return fail(e);
  }
}

export async function collectionItems(key: string): Promise<{ title: string; where: string; newLabel: string; newHref: string; fields: CollectionField[]; items: CollectionItem[] } | Fail> {
  try {
    await requireEditor();
    const d = DEFS.find((x) => x.res === key);
    const res = d && getResource(d.res);
    if (!d || !res) return { error: "Unknown collection" };
    const rows = (await rowsOf(d)).sort(d.order);
    const prods = d.group ? new Map((await rowsOf(DEFS.find((x) => x.res === "products")!)).map((p) => [Number(p.id), String(p.name)])) : new Map<number, string>();
    const pend = new Set((await db.select({ id: drafts.recordId, data: drafts.data }).from(drafts).where(inArray(drafts.resource, [res.slug]))).filter((x) => x.data).map((x) => x.id));
    const items: CollectionItem[] = rows.map((r) => ({
      r: res.slug,
      id: Number(r.id),
      title: String(r[res.labelField] ?? `#${r.id}`),
      sub: d.sub(r),
      status: !("status" in r) ? null : r.status !== "published" ? "draft" : pend.has(Number(r.id)) ? "changed" : "live",
      // a page of its own only when it is live or being prepared (a draft one opens too: the editor shows drafts)
      path: d.page ? d.page(r) : null,
      adminHref: `/admin/${res.slug}/${r.id}`,
      group: d.group ? d.group(r, prods) : null,
      thumb: d.thumb ? d.thumb(r) : null,
    }));
    const fields: CollectionField[] = res.fields
      .filter((f) => (f.type === "text" || f.type === "textarea" || f.type === "url"))
      .map((f) => ({ name: f.name, label: f.label, type: f.type as CollectionField["type"], required: !!f.required }));
    return { title: d.title, where: d.where, newLabel: d.newLabel, newHref: `/admin/${res.slug}/new`, fields, items };
  } catch (e) {
    return fail(e);
  }
}

/** Status of one record for its panel (live / changes / draft). */
export async function recordStatus(r: string, id: number): Promise<{ status: "live" | "changed" | "draft" | null } | Fail> {
  try {
    await requireEditor();
    const res = getResource(r);
    if (!res || !DEFS.some((d) => d.res === r)) return { error: "Unknown collection" };
    const e = await getEditable(res, id);
    if (!e) return { error: "Not found" };
    return { status: !("status" in e.live) ? null : e.live.status !== "published" ? "draft" : e.draft?.data ? "changed" : "live" };
  } catch (e) {
    return fail(e);
  }
}
