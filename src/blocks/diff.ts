import type { StoredBlock } from "@/db/schema";
import { BLOCKS } from "./registry";
import type { BlockDef, BlockType } from "./types";

/**
 * Changes of a page in words, for «Review changes» before Publish and for History (ADR-007);
 * and which sections differ between two regions' copies of a page («Compare with…»).
 */

const def = (t: string) => (Object.hasOwn(BLOCKS, t) ? (BLOCKS[t as BlockType] as unknown as BlockDef<BlockType>) : null);
const same = (a: unknown, b: unknown) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);

/** «Hero “Like fingerprints…”» — block name plus the start of its title, if any. */
export function blockName(b: StoredBlock): string {
  const name = def(b.type)?.name ?? b.type;
  const t = b.data?.title;
  if (typeof t !== "string" || !t.trim()) return name;
  const s = t.trim();
  return `${name} “${s.length > 40 ? `${s.slice(0, 38)}…` : s}”`;
}

function fieldLabel(b: StoredBlock, key: string): string {
  if (key === "tabs") return "tab content";
  const f = def(b.type)?.fields.find((x) => x.key === key);
  // "Numbers: value (required), label, note, icon" → "numbers"
  return (f?.label ?? key).split(/[:(]/)[0].trim().toLowerCase();
}

/** Positions of ids kept in the same relative order (longest common subsequence); the rest were moved. */
function keptInOrder(a: string[], b: string[]): Set<string> {
  const n = a.length;
  const m = b.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const keep = new Set<string>();
  for (let i = 0, j = 0; i < n && j < m; ) {
    if (a[i] === b[j]) {
      keep.add(a[i]);
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) i++;
    else j++;
  }
  return keep;
}

type Nested = { type: string; variant: string; data: Record<string, unknown>; hidden?: boolean };
type Tab = { id?: string; label?: string; href?: string; blocks?: (Nested | { group: string; blocks: Nested[] })[] };
const flat = (t: Tab | undefined): Nested[] => (t?.blocks ?? []).flatMap((x) => ("group" in x ? (x.blocks ?? []) : [x]));
const nestedName = (n: Nested) => blockName({ id: "", ...n });

/** Sections inside Product details tabs have no ids: matched by content, then by type, per tab. */
function describeTabs(before: Tab[], after: Tab[]): string[] {
  const out: string[] = [];
  const key = (t: Tab) => t.id ?? t.label ?? "";
  const was = new Map(before.map((t) => [key(t), t]));
  const now = new Set(after.map(key));
  for (const t of after) {
    const o = was.get(key(t));
    if (!o) out.push(`Added tab “${t.label ?? ""}”`);
    else {
      if (o.label !== t.label) out.push(`Renamed tab “${o.label ?? ""}” to “${t.label ?? ""}”`);
      if (o.href !== t.href) out.push(`Changed the link of tab “${t.label ?? ""}”`);
    }
  }
  for (const t of before) if (!now.has(key(t))) out.push(`Removed tab “${t.label ?? ""}”`);
  const order = (l: Tab[]) => l.map(key).filter((k) => was.has(k) && now.has(k)).join("\n");
  if (order(before) !== order(after)) out.push("Moved tabs");
  for (const t of after) {
    const old = before.find((b) => (b.id ?? b.label) === (t.id ?? t.label));
    if (!old || t.href) continue;
    const where = `in tab “${t.label ?? ""}”`;
    const a = flat(old);
    const b = flat(t);
    const key = (n: Nested) => JSON.stringify(n);
    const removed = [...a];
    const added: Nested[] = [];
    for (const n of b) {
      const i = removed.findIndex((x) => key(x) === key(n));
      if (i >= 0) removed.splice(i, 1);
      else added.push(n);
    }
    for (const n of [...added]) {
      const i = removed.findIndex((x) => x.type === n.type);
      if (i < 0) continue;
      const o = removed[i];
      const onlyHidden = !!o.hidden !== !!n.hidden && n.variant === o.variant && same(n.data, o.data);
      out.push(onlyHidden ? `${n.hidden ? "Hid" : "Showed"} ${nestedName(n)} ${where}` : n.variant !== o.variant ? `Changed layout of ${nestedName(n)} ${where}` : `Changed ${nestedName(n)} ${where}`);
      removed.splice(i, 1);
      added.splice(added.indexOf(n), 1);
    }
    for (const n of added) out.push(`Added ${nestedName(n)} ${where}`);
    for (const n of removed) out.push(`Removed ${nestedName(n)} ${where}`);
    if (!added.length && !removed.length && a.length === b.length && a.some((n, i) => key(n) !== key(b[i])) && out.every((x) => !x.endsWith(where))) out.push(`Moved sections ${where}`);
  }
  return out;
}

export function describeBlockChanges(before: StoredBlock[] | null | undefined, after: StoredBlock[] | null | undefined): string[] {
  const a = before ?? [];
  const b = after ?? [];
  const out: string[] = [];
  const byId = new Map(a.map((x) => [x.id, x]));
  const afterIds = new Set(b.map((x) => x.id));
  const common = b.filter((x) => byId.has(x.id)).map((x) => x.id);
  const kept = keptInOrder(a.filter((x) => afterIds.has(x.id)).map((x) => x.id), common);
  for (const x of b) {
    const old = byId.get(x.id);
    if (!old) {
      out.push(`Added section ${blockName(x)}`);
      continue;
    }
    if (!kept.has(x.id)) out.push(`Moved section ${blockName(x)}`);
    if (!!old.hidden !== !!x.hidden) out.push(`${x.hidden ? "Hid" : "Showed"} section ${blockName(x)}`);
    if (old.variant !== x.variant) {
      const label = def(x.type)?.variants.find((v) => v.id === x.variant)?.label ?? x.variant;
      out.push(`Changed layout of ${blockName(x)} to “${label}”`);
    }
    let keys = [...new Set([...Object.keys(old.data ?? {}), ...Object.keys(x.data ?? {})])].filter((k) => !same(old.data?.[k], x.data?.[k]));
    if (x.type === "productDetails" && keys.includes("tabs") && Array.isArray(old.data?.tabs) && Array.isArray(x.data?.tabs)) {
      out.push(...describeTabs(old.data.tabs as Tab[], x.data.tabs as Tab[]));
      keys = keys.filter((k) => k !== "tabs");
    }
    if (keys.length) out.push(`Changed ${keys.map((k) => fieldLabel(x, k)).join(", ")} in ${blockName(old)}`);
  }
  for (const x of a) if (!afterIds.has(x.id)) out.push(`Removed section ${blockName(x)}`);
  return out;
}

export type RegionDiff = "same" | "different" | "onlyHere";

/**
 * Copies of a page in two regions have independent ids: sections are matched by type in order (longest common
 * subsequence); a matched section is «different» when its layout or content differs.
 */
export function compareBlocks(mine: StoredBlock[], theirs: StoredBlock[]): RegionDiff[] {
  const out: RegionDiff[] = new Array<RegionDiff>(mine.length).fill("onlyHere");
  for (const [i, j] of matchSections(mine, theirs)) out[i] = mine[i].variant === theirs[j].variant && same(mine[i].data, theirs[j].data) ? "same" : "different";
  return out;
}

/** Pairs [i in mine, j in theirs] of the same section in two regions' copies: by type, in order (LCS). */
export function matchSections(mine: { type: string }[], theirs: { type: string }[]): [number, number][] {
  const n = mine.length;
  const m = theirs.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) dp[i][j] = mine[i].type === theirs[j].type ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const out: [number, number][] = [];
  for (let i = 0, j = 0; i < n && j < m; ) {
    if (mine[i].type === theirs[j].type) {
      out.push([i, j]);
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) i++;
    else j++;
  }
  return out;
}
