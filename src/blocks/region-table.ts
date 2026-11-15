import type { StoredBlock } from "@/db/schema";
import { BLOCKS } from "./registry";
import { checkBlockPath } from "./paths";
import { blockName, matchSections } from "./diff";
import type { BlockDef, BlockType } from "./types";

/**
 * «Texts in all regions» (docs/screens/on-page-editor.md → «Тексты по регионам»): the texts of one page across its
 * regional copies as rows × regions. Sections are matched by type in order (as Compare with…); a row is one text
 * field. Every cell carries the field path the on-page editor writes (`blocks.{n}.data.…`), so a cell is saved like
 * any field on the page. Pure: lists in (the current region first), rows out.
 */

/** media: the value is a file of the media library (shown as a preview, replaced from the library) */
export type MediaKind = "image" | "video" | "pdf";
export type RegionCell = { f: string; value: string; rich: boolean; media?: MediaKind } | null;
export type RegionRow = {
  key: string;
  section: string;
  field: string;
  /** one per region, in the order of the lists; null — no such field there */
  cells: RegionCell[];
  differs: boolean;
  /** the section exists only in this region (index in the lists) */
  onlyIn?: number;
  hidden?: boolean;
};

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => !!v && typeof v === "object" && !Array.isArray(v);
const def = (t: unknown) => (typeof t === "string" && Object.hasOwn(BLOCKS, t) ? (BLOCKS[t as BlockType] as unknown as BlockDef<BlockType>) : null);
const ADDRESS = /^(https?:|\/|#|mailto:|tel:)/i;
const SKIP = new Set(["id", "type", "variant", "source", "anchor", "edit"]);

/** A file address by its extension: picture, video or PDF; anything else (a page link) is not media. */
export function mediaKindOf(url: string): MediaKind | null {
  const p = url.split(/[?#]/)[0].toLowerCase();
  if (/\.(png|jpe?g|webp|gif|svg|avif)$/.test(p)) return "image";
  if (/\.(mp4|webm|mov)$/.test(p)) return "video";
  if (/\.pdf$/.test(p)) return "pdf";
  return null;
}

/** Writable leaves of one section: relative path (after `data.`) → value. Texts; with `media`, also its files. */
function texts(blocks: StoredBlock[], n: number, media = false): Map<string, { value: string; rich: boolean; media?: MediaKind }> {
  const out = new Map<string, { value: string; rich: boolean; media?: MediaKind }>();
  const walk = (v: unknown, path: string[]) => {
    if (typeof v === "string") {
      const kind = media ? mediaKindOf(v.trim()) : null;
      if (!v.trim() || (ADDRESS.test(v.trim()) && !kind)) return;
      const check = checkBlockPath(blocks, [String(n), "data", ...path]);
      if (!check.ok || (check.url && !kind)) return;
      out.set(path.join("."), kind ? { value: v, rich: false, media: kind } : { value: v, rich: check.kind === "rich" });
      return;
    }
    if (Array.isArray(v)) v.forEach((x, i) => walk(x, [...path, String(i)]));
    else if (isObj(v)) for (const [k, x] of Object.entries(v)) if (!SKIP.has(k)) walk(x, [...path, k]);
  };
  walk(blocks[n]?.data, []);
  return out;
}

const firstLabel = (d: BlockDef<BlockType> | null, key: string) => (d?.fields.find((f) => f.key === key)?.label ?? key).split(/[:(]/)[0].trim();

/** «Tab “Overview” › Text › Text 2» from a path inside a section. */
export function fieldLabel(block: StoredBlock, rel: string): string {
  const segs = rel.split(".");
  const parts: string[] = [];
  let d = def(block.type);
  let i = 0;
  if (segs[0] === "tabs" && block.type === "productDetails") {
    const tab = ((block.data as Obj).tabs as Obj[] | undefined)?.[Number(segs[1])];
    parts.push(`Tab “${String(tab?.label ?? Number(segs[1]) + 1)}”`);
    let inner = (tab?.blocks as Obj[] | undefined)?.[Number(segs[3])];
    i = 4;
    if (inner && "group" in inner && segs[4] === "blocks") {
      parts.push(String(inner.group));
      inner = (inner.blocks as Obj[] | undefined)?.[Number(segs[5])];
      i = 6;
    }
    d = def(inner?.type);
    parts.push(d?.name ?? String(inner?.type ?? ""));
    i += 1; // "data"
  }
  const rest = segs.slice(i);
  parts.push(firstLabel(d, rest[0]) + rest.slice(1).map((s) => (/^\d+$/.test(s) ? ` ${Number(s) + 1}` : ` · ${s}`)).join(""));
  return parts.filter(Boolean).join(" › ");
}

export function regionTextRows(lists: StoredBlock[][], opts: { media?: boolean } = {}): RegionRow[] {
  const [mine, ...others] = lists;
  if (!mine) return [];
  const pairs = others.map((o) => new Map(matchSections(mine, o)));
  const rows: RegionRow[] = [];
  const row = (section: string, block: StoredBlock, rel: string, cells: RegionCell[], extra: Partial<RegionRow> = {}): RegionRow => {
    const present = cells.filter((c): c is NonNullable<RegionCell> => !!c);
    return { key: `${rows.length}`, section, field: fieldLabel(block, rel), cells, differs: present.length !== cells.length || present.some((c) => c.value !== present[0].value), ...extra };
  };
  mine.forEach((b, i) => {
    const sets = [texts(mine, i, opts.media), ...others.map((o, k) => (pairs[k].has(i) ? texts(o, pairs[k].get(i)!, opts.media) : new Map<string, { value: string; rich: boolean; media?: MediaKind }>()))];
    const keys = [...new Set(sets.flatMap((s) => [...s.keys()]))];
    for (const rel of keys) {
      const cells = sets.map((s, k) => {
        const t = s.get(rel);
        const n = k === 0 ? i : pairs[k - 1].get(i);
        return t && n !== undefined ? { f: `blocks.${n}.data.${rel}`, value: t.value, rich: t.rich, ...(t.media ? { media: t.media } : {}) } : null;
      });
      rows.push(row(blockName(b), b, rel, cells, b.hidden ? { hidden: true } : {}));
    }
  });
  // sections the current region does not have
  others.forEach((o, k) => {
    const matched = new Set(pairs[k].values());
    o.forEach((b, j) => {
      if (matched.has(j)) return;
      for (const [rel, t] of texts(o, j, opts.media)) {
        const cells: RegionCell[] = lists.map((_, x) => (x === k + 1 ? { f: `blocks.${j}.data.${rel}`, value: t.value, rich: t.rich, ...(t.media ? { media: t.media } : {}) } : null));
        rows.push(row(blockName(b), b, rel, cells, { onlyIn: k + 1 }));
      }
    });
  });
  return rows;
}
