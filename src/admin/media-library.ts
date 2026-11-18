import "server-only";
import { inArray } from "drizzle-orm";
import { db, media, pages, sitePages, solutions } from "@/db";
import { mediaIndex, urlPattern, usageIn, type MediaUsage } from "@/lib/media-usage";
import { getResource } from "./resources";
import { pageKey } from "./page-tree";
import { blockName } from "@/blocks/diff";
import type { StoredBlock } from "@/db/schema";

/**
 * The media library in order (docs/screens/admin-media.md → «Порядок в медиатеке»): groups built from where each file is
 * used — pages of the site (by section of the page), lists, site settings — and the files nobody uses.
 */

export type MediaRow = typeof media.$inferSelect;
export type Group = { key: string; label: string; section: "site" | "lists" | "settings"; count: number; other?: boolean; child?: boolean };
export type LibraryItem = MediaRow & { used: string | null; usedCount: number };

const PAGE_RECORDS = ["site-pages", "solutions", "pages", "materials"];
/** Where a page sits in the site, for the order of the column. */
const ORDER = ["/", "/therapies", "/evidence", "/webinars", "/news-events", "/about-us", "/careers", "/contact-us"];
const orderOf = (key: string) => {
  const i = ORDER.findIndex((k) => (k === "/" ? key === "/" : key === k || key.startsWith(`${k}/`)));
  return i < 0 ? ORDER.length : i;
};
const placeOf = (u: MediaUsage): { key: string; label: string; section: Group["section"] } => {
  if (u.r.startsWith("settings:")) return { key: "settings", label: "Site settings", section: "settings" };
  if (PAGE_RECORDS.includes(u.r) && u.pagePath) return { key: `page:${pageKey(u.pagePath)}`, label: u.label.replace(/ \([^)]*\)$/, ""), section: "site" };
  return { key: `list:${u.r}`, label: getResource(u.r)?.title ?? u.r, section: "lists" };
};

export async function mediaLibrary() {
  const [rows, index] = await Promise.all([db.select().from(media), mediaIndex()]);
  const usage = new Map<number, MediaUsage[]>(rows.map((m) => [m.id, usageIn(index, m.url)]));
  const groups = new Map<string, Group & { ids: Set<number> }>();
  for (const m of rows)
    for (const u of usage.get(m.id) ?? []) {
      const p = placeOf(u);
      const g = groups.get(p.key) ?? { ...p, count: 0, ids: new Set<number>() };
      g.ids.add(m.id);
      g.count = g.ids.size;
      groups.set(p.key, g);
    }
  const items: LibraryItem[] = rows.map((m) => {
    const places = [...new Set((usage.get(m.id) ?? []).map((u) => placeOf(u).label))];
    return { ...m, usedCount: places.length, used: places.length ? `${places[0]}${places.length > 1 ? ` + ${places.length - 1} more` : ""}` : null };
  });
  const path = (g: Group) => g.key.slice(5);
  const site = (g: Group) => g.section === "site";
  const list = [...groups.values()].sort((a, b) =>
    ["site", "lists", "settings"].indexOf(a.section) - ["site", "lists", "settings"].indexOf(b.section) ||
    (site(a) && site(b) ? orderOf(path(a)) - orderOf(path(b)) || path(a).split("/").length - path(b).split("/").length : 0) ||
    a.label.localeCompare(b.label));
  for (const g of list.filter(site)) {
    g.other = orderOf(path(g)) === ORDER.length; // pages outside the main sections: posts, studies, legal
    g.child = path(g).startsWith("/therapies/");
    if (list.some((h) => h !== g && site(h) && h.label === g.label)) g.label = `${g.label} · ${path(g)}`; // two pages, one title
  }
  return { items, groups: list, idsOf: (key: string) => groups.get(key)?.ids ?? new Set<number>() };
}

/**
 * The files of one page of the site by the section of the page they are in (every region of the page together):
 * [{ section: "Hero", ids }, …]; files used outside the sections (fields of the record) under «Other places on the page».
 */
export async function pageSections(key: string, items: LibraryItem[]): Promise<{ section: string; ids: number[] }[]> {
  const [sites, sols, pgs] = await Promise.all([
    db.select({ blocks: sitePages.blocks, key: sitePages.key, region: sitePages.region }).from(sitePages),
    db.select({ blocks: solutions.blocks, slug: solutions.slug }).from(solutions).where(inArray(solutions.slug, [key.replace(/^\/therapies\//, "")])),
    db.select({ blocks: pages.blocks, slug: pages.slug }).from(pages).where(inArray(pages.slug, [key.replace(/^\//, "")])),
  ]);
  const siteKey = key === "/" ? "home" : key.replace(/^\//, "").replace("about-us", "about");
  const lists: StoredBlock[][] = [
    ...sites.filter((s) => s.key === siteKey).map((s) => s.blocks ?? []),
    ...(key.startsWith("/therapies/") ? sols.map((s) => (s.blocks as StoredBlock[] | null) ?? []) : []),
    ...pgs.map((p) => (p.blocks as StoredBlock[] | null) ?? []),
  ];
  const out = new Map<string, Set<number>>();
  for (const m of items) {
    let found = false;
    for (const blocks of lists)
      for (const b of blocks) {
        const re = urlPattern(m.url);
        if (re.test(JSON.stringify(b))) {
          const name = blockName(b);
          out.set(name, (out.get(name) ?? new Set()).add(m.id));
          found = true;
        }
      }
    if (!found) out.set("Other places on the page", (out.get("Other places on the page") ?? new Set()).add(m.id));
  }
  return [...out].map(([section, ids]) => ({ section, ids: [...ids] }));
}
