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
    if (old.variant !== x.variant) {
      const label = def(x.type)?.variants.find((v) => v.id === x.variant)?.label ?? x.variant;
      out.push(`Changed layout of ${blockName(x)} to “${label}”`);
    }
    const keys = [...new Set([...Object.keys(old.data ?? {}), ...Object.keys(x.data ?? {})])].filter((k) => !same(old.data?.[k], x.data?.[k]));
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
  const n = mine.length;
  const m = theirs.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) dp[i][j] = mine[i].type === theirs[j].type ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const out: RegionDiff[] = new Array<RegionDiff>(n).fill("onlyHere");
  for (let i = 0, j = 0; i < n && j < m; ) {
    if (mine[i].type === theirs[j].type) {
      out[i] = mine[i].variant === theirs[j].variant && same(mine[i].data, theirs[j].data) ? "same" : "different";
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) i++;
    else j++;
  }
  return out;
}
