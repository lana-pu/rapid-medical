import type { StoredBlock } from "@/db/schema";
import { BLOCKS } from "./registry";
import { newBlockId } from "./stored";
import { PRESETS, presetBlock } from "./templates";
import type { BlockDef, BlockType } from "./types";

/**
 * Section operations of the on-page editor (ADR-007 §6). Pure: list in → list out, or an error with a message
 * for the editor. Rules: only presets can be added; a variant can change only to another preset of the same block;
 * pinned blocks (regulatory) cannot be moved, copied or removed and always stay at the end of the page.
 */

export type BlockOp =
  | { op: "add"; at: number; type: string; variant: string }
  | { op: "move"; id: string; dir: -1 | 1 }
  | { op: "duplicate"; id: string }
  | { op: "remove"; id: string }
  | { op: "variant"; id: string; variant: string }
  /** Undo: put back an earlier list. Every block must be one the page had (now or in a recent version). */
  | { op: "set"; blocks: StoredBlock[] };

const def = (t: string) => (Object.hasOwn(BLOCKS, t) ? (BLOCKS[t as BlockType] as unknown as BlockDef<BlockType>) : null);
export const isPinned = (b: StoredBlock) => !!def(b.type)?.pinned;

/** Pinned blocks go to the end, in their order; everything else keeps its order. */
function pinnedLast(list: StoredBlock[]): StoredBlock[] {
  return [...list.filter((b) => !isPinned(b)), ...list.filter(isPinned)];
}

export class BlockOpError extends Error {}
const fail = (m: string): never => {
  throw new BlockOpError(m);
};

export function variantsFor(type: string): { id: string; label: string }[] {
  return PRESETS.filter((p) => p.type === type).map((p) => ({ id: p.variant, label: p.label }));
}

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

export function applyOp(current: StoredBlock[], op: BlockOp, known: StoredBlock[] = []): StoredBlock[] {
  const list = [...current];
  const find = (id: string) => {
    const i = list.findIndex((b) => b.id === id);
    if (i < 0) fail("This section is no longer on the page. Reload to see the latest version.");
    return i;
  };
  switch (op.op) {
    case "add": {
      if (!Number.isInteger(op.at) || op.at < 0 || op.at > list.length) fail("Bad position");
      list.splice(op.at, 0, presetBlock(op.type, op.variant));
      return pinnedLast(list);
    }
    case "move": {
      const i = find(op.id);
      const j = i + op.dir;
      if (isPinned(list[i])) fail("This section stays at the end of the page");
      if (op.dir !== -1 && op.dir !== 1) fail("Bad move");
      if (j < 0 || j >= list.length || isPinned(list[j])) fail(op.dir < 0 ? "Already the first section" : "Already the last section");
      [list[i], list[j]] = [list[j], list[i]];
      return list;
    }
    case "duplicate": {
      const i = find(op.id);
      if (isPinned(list[i])) fail("This section cannot be copied");
      list.splice(i + 1, 0, { ...JSON.parse(JSON.stringify(list[i])), id: newBlockId() });
      return list;
    }
    case "remove": {
      const i = find(op.id);
      if (isPinned(list[i])) fail("This section is required on the page");
      list.splice(i, 1);
      return list;
    }
    case "variant": {
      const i = find(op.id);
      if (!variantsFor(list[i].type).some((v) => v.id === op.variant) || !variantsFor(list[i].type).some((v) => v.id === list[i].variant)) {
        fail("This layout is not available for this section");
      }
      list[i] = { ...list[i], variant: op.variant };
      return list;
    }
    case "set": {
      if (!Array.isArray(op.blocks)) fail("Bad list");
      const ids = new Set<string>();
      for (const b of op.blocks) {
        if (!b || typeof b.id !== "string" || ids.has(b.id)) fail("Bad list");
        ids.add(b.id);
        const match = [...list, ...known].some((k) => k.id === b.id && k.type === b.type && same(k, b));
        if (!match) fail("This version is too old to undo. Use History instead.");
      }
      // a pinned block cannot disappear through undo
      for (const p of list.filter(isPinned)) if (!ids.has(p.id)) fail("This section is required on the page");
      return pinnedLast(op.blocks.map((b) => JSON.parse(JSON.stringify(b)) as StoredBlock));
    }
  }
  return fail("Unknown operation");
}
