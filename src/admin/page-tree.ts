import type { Region } from "@/db/schema";
import { REGIONS } from "@/db/schema";

/**
 * The site as a tree for the page editor (docs/screens/on-page-editor.md → «Страницы и коллекции»): every page once,
 * its regional copies as versions (the region is chosen in the top bar). Pure: cards in, tree out.
 */

export type PageVersion = { region: Region | null; r?: string; id?: number; path: string; status: "live" | "changed" | "draft" };
export type PageNode = { key: string; title: string; type: string; fieldsOnly?: boolean; versions: PageVersion[]; children: PageNode[] };
type Card = { r: string; id: number; title: string; type: string; region: Region | null; path: string; status: "live" | "changed" | "draft" };

/** «/us/therapies/lvo» → «/therapies/lvo»: the same page in every region. */
export const pageKey = (path: string) => path.split("#")[0].replace(/^\/(us|ous|apac)(?=\/|$)/, "") || "/";

/** Pages that are built from lists, not sections: in the tree for orientation, edited field by field. */
const CATALOGUE: { key: string; title: string; type: string; regional: boolean }[] = [
  { key: "/webinars", title: "Webinars", type: "Webinars list", regional: true },
  { key: "/news-events", title: "News & Events", type: "News and events list", regional: false },
  { key: "/open-positions", title: "Open positions", type: "Jobs list", regional: false },
  { key: "/contact-us", title: "Contact Us", type: "Contact page", regional: false },
];

/** Order of the top of the tree: the site's menu (docs/site-ia.md). */
const TOP = ["/", "/therapies", "/evidence", "/webinars", "/news-events", "/about-us", "/careers", "/contact-us"];
/** A page that sits under another one, not by its address. */
const PARENT: Record<string, string> = { "/open-positions": "/careers" };
const OTHER = "other";

export function buildPageTree(cards: Card[]): PageNode[] {
  const byKey = new Map<string, PageNode>();
  for (const c of cards) {
    const key = pageKey(c.path);
    const node = byKey.get(key) ?? { key, title: c.title, type: c.type, versions: [], children: [] };
    node.versions.push({ region: c.region, r: c.r, id: c.id, path: c.path, status: c.status });
    if (c.region === "us" || node.versions.length === 1) node.title = c.title; // one name: the Americas one if any
    byKey.set(key, node);
  }
  for (const c of CATALOGUE) {
    if (byKey.has(c.key)) continue;
    const versions: PageVersion[] = c.regional ? REGIONS.map((r) => ({ region: r, path: `/${r}${c.key}`, status: "live" as const })) : [{ region: null, path: c.key, status: "live" }];
    byKey.set(c.key, { key: c.key, title: c.title, type: c.type, fieldsOnly: true, versions, children: [] });
  }
  const order = (r: Region | null) => (r ? REGIONS.indexOf(r) : -1);
  for (const n of byKey.values()) n.versions.sort((a, b) => order(a.region) - order(b.region));

  const roots: PageNode[] = [];
  const other: PageNode = { key: OTHER, title: "Other pages", type: "Text pages", versions: [], children: [] };
  for (const n of byKey.values()) {
    const parentKey = PARENT[n.key] ?? (n.key.split("/").length > 2 ? n.key.slice(0, n.key.lastIndexOf("/")) : null);
    const parent = parentKey ? byKey.get(parentKey) : undefined;
    if (parent) parent.children.push(n);
    else if (TOP.includes(n.key)) roots.push(n);
    else other.children.push(n);
  }
  roots.sort((a, b) => TOP.indexOf(a.key) - TOP.indexOf(b.key));
  other.children.sort((a, b) => a.title.localeCompare(b.title));
  if (other.children.length) roots.push(other);
  return roots;
}
