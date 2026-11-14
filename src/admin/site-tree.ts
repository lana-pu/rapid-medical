import "server-only";
import { count, eq } from "drizzle-orm";
import { db, contactSubmissions } from "@/db";
import { getResource } from "./resources";
import { listEditorPages, type PageCard } from "./pages-index";
import { buildPageTree, pageKey, type PageNode } from "./page-tree";

/**
 * The admin's left column (docs/screens/admin-sections.md → «Меню слева»): the site as a tree, every page once, with
 * the collections under the page that shows them, and Menu and footer at the end.
 */

export type SiteNode = {
  key: string;
  title: string;
  kind: "page" | "group" | "collection" | "menu";
  href?: string;
  /** collections: how many records */
  count?: number;
  /** a page with unpublished changes or not live in some region */
  pending?: boolean;
  children: SiteNode[];
};

/** Where each collection is shown: the page it hangs under. */
export const COLLECTION_PAGES: { res: string; title: string; under: string; where: string }[] = [
  { res: "publications", title: "Publications", under: "/evidence", where: "Listed on Evidence, by product" },
  { res: "products", title: "Products", under: "/evidence", where: "Product tabs on Evidence and links from therapy pages" },
  { res: "webinars", title: "Webinars", under: "/webinars", where: "On the Webinars page; visitors ask for a recording" },
  { res: "news", title: "News", under: "/news-events", where: "Cards on News & Events and on the home page" },
  { res: "events", title: "Events", under: "/news-events", where: "On News & Events; each event has its own page" },
  { res: "team", title: "Team", under: "/about-us", where: "Leadership on About; each person has their own page" },
  { res: "jobs", title: "Jobs", under: "/open-positions", where: "On Open positions; each position has its own page" },
];

export const adminPageHref = (key: string) => (key === "/" ? "/admin/page" : `/admin/page${key}`);

export async function collectionCounts(): Promise<Record<string, number>> {
  const out: Record<string, number> = {};
  await Promise.all(
    COLLECTION_PAGES.map(async (c) => {
      const res = getResource(c.res);
      if (!res) return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rows = (await db.select({ n: count() }).from(res.table as any)) as { n: number }[];
      out[c.res] = Number(rows[0]?.n ?? 0);
    }),
  );
  return out;
}

export async function newRequestCount(): Promise<number> {
  const [row] = await db.select({ n: count() }).from(contactSubmissions).where(eq(contactSubmissions.status, "new"));
  return Number(row?.n ?? 0);
}

export async function siteTree(cards?: PageCard[]): Promise<SiteNode[]> {
  const [all, counts] = await Promise.all([cards ? Promise.resolve(cards) : listEditorPages(), collectionCounts()]);
  const convert = (n: PageNode): SiteNode => {
    const kids = n.children.map(convert);
    for (const c of COLLECTION_PAGES.filter((x) => x.under === n.key)) kids.push({ key: `collection:${c.res}`, title: c.title, kind: "collection", href: `/admin/${c.res}`, count: counts[c.res] ?? 0, children: [] });
    return n.versions.length
      ? { key: n.key, title: n.title, kind: "page", href: adminPageHref(n.key), pending: n.versions.some((v) => v.status !== "live"), children: kids }
      : { key: n.key, title: n.title, kind: "group", children: kids };
  };
  return [...buildPageTree(all).map(convert), { key: "menu", title: "Menu and footer", kind: "menu", href: "/admin/site/menu", children: [] }];
}

/** One page of the tree with its versions (cards) — for the page screen. */
export async function pageScreen(key: string) {
  const cards = await listEditorPages();
  const tree = buildPageTree(cards);
  const find = (ns: PageNode[], trail: PageNode[]): { node: PageNode; trail: PageNode[] } | null => {
    for (const n of ns) {
      if (n.key === key) return { node: n, trail };
      const hit = find(n.children, [...trail, n]);
      if (hit) return hit;
    }
    return null;
  };
  const hit = find(tree, []);
  if (!hit || !hit.node.versions.length) return null;
  const counts = await collectionCounts();
  return {
    node: hit.node,
    trail: hit.trail,
    cards: cards.filter((c) => pageKey(c.path) === key),
    collections: COLLECTION_PAGES.filter((c) => c.under === key).map((c) => ({ ...c, count: counts[c.res] ?? 0, newLabel: getResource(c.res)?.titleSingular ?? "item" })),
  };
}
