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
  /** `in`: a list inside Product details — `{block}/{tab}` or a group in it `{block}/{tab}/{j}` */
  | { op: "add"; at: number; type: string; variant: string; in?: string }
  | { op: "move"; id: string; dir: -1 | 1 }
  | { op: "duplicate"; id: string }
  | { op: "remove"; id: string }
  | { op: "variant"; id: string; variant: string }
  /** Undo: put back an earlier list. Every block must be one the page had (now or in a recent version). */
  | { op: "set"; blocks: StoredBlock[] }
  /** The tabs of a Product details block (`id`): add (content or link), move, remove, rename, change a link's address */
  | { op: "tab"; id: string; act: "add"; at: number; label: string; href?: string }
  | { op: "tab"; id: string; act: "move"; tab: number; dir: -1 | 1 }
  | { op: "tab"; id: string; act: "remove"; tab: number }
  | { op: "tab"; id: string; act: "rename"; tab: number; label: string }
  | { op: "tab"; id: string; act: "link"; tab: number; href: string };

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

/* ------------------------------------------------------------------ */
/*  Sections inside Product details tabs                               */
/* ------------------------------------------------------------------ */

/*
 * Blocks inside a tab have no ids of their own: they are addressed by position — `{block}/{tab}/{j}`, or inside a
 * group (a small heading such as «Specifications») `{block}/{tab}/{j}/{k}`. The page version check (page-core) keeps
 * positions from going stale between two editors.
 */
type Nested = { type: string; variant: string; data: Record<string, unknown> };
type Group = { group: string; blocks: Nested[] };
type TabItem = Nested | Group;
const isGroup = (x: TabItem): x is Group => "group" in x;
const IDX = /^(0|[1-9]\d{0,3})$/;
export const isNestedId = (id: string) => id.includes("/");

/** The list a nested section sits in («{block}/{tab}» or «{block}/{tab}/{j}») and its position there. */
export function nestedParent(id: string): { list: string; at: number } {
  const parts = id.split("/");
  return { list: parts.slice(0, -1).join("/"), at: Number(parts[parts.length - 1]) };
}

/** Open a list inside a tab for change: a copy of the page with that Product details block cloned. */
function openList(list: StoredBlock[], path: string) {
  const [outerId, t, j, ...rest] = path.split("/");
  if (rest.length || !IDX.test(t ?? "") || (j !== undefined && !IDX.test(j))) fail("Bad position");
  const bi = list.findIndex((b) => b.id === outerId);
  if (bi < 0) fail("This section is no longer on the page. Reload to see the latest version.");
  const outer = list[bi];
  if (outer.type !== "productDetails" || outer.source) fail("Sections cannot be added here");
  const data = JSON.parse(JSON.stringify(outer.data)) as { tabs?: { href?: string; label?: string; blocks?: TabItem[] }[] };
  const tab = Array.isArray(data.tabs) ? data.tabs[Number(t)] : undefined;
  if (!tab || tab.href || !Array.isArray(tab.blocks)) fail("This tab has no sections");
  const tabItems = tab!.blocks!;
  let items: TabItem[] = tabItems;
  if (j !== undefined) {
    const g = tabItems[Number(j)];
    if (!g || !isGroup(g) || !Array.isArray(g.blocks)) fail("This section is no longer on the page. Reload to see the latest version.");
    items = (g as Group).blocks;
  }
  /** sections in the whole tab, groups counted by their blocks */
  const tabCount = () => tabItems.reduce((n, x) => n + (isGroup(x) ? x.blocks.length : 1), 0);
  const done = () => {
    if (j !== undefined && items.length === 0) tabItems.splice(Number(j), 1); // an empty group goes with its heading
    const next = [...list];
    next[bi] = { ...outer, data: data as Record<string, unknown> };
    return next;
  };
  return { items, tabCount, done, inGroup: j !== undefined };
}

function nestedOp(list: StoredBlock[], op: Exclude<BlockOp, { op: "set" | "tab" }>): StoredBlock[] {
  if (op.op === "add") {
    const l = openList(list, op.in!);
    if (!Number.isInteger(op.at) || op.at < 0 || op.at > l.items.length) fail("Bad position");
    if (!def(op.type)?.nestable) fail("This section cannot go inside a tab");
    const { id: _id, ...b } = presetBlock(op.type, op.variant);
    void _id;
    l.items.splice(op.at, 0, b as Nested);
    return l.done();
  }
  const { list: path, at } = nestedParent(op.id);
  if (!IDX.test(op.id.split("/").pop() ?? "")) fail("Bad position");
  const l = openList(list, path);
  const x = l.items[at];
  if (!x || isGroup(x)) fail("This section is no longer on the page. Reload to see the latest version.");
  switch (op.op) {
    case "move": {
      if (op.dir !== -1 && op.dir !== 1) fail("Bad move");
      const k = at + op.dir;
      if (k < 0 || k >= l.items.length) fail(op.dir < 0 ? (l.inGroup ? "Already the first section in this group" : "Already the first section in this tab") : l.inGroup ? "Already the last section in this group" : "Already the last section in this tab");
      [l.items[at], l.items[k]] = [l.items[k], l.items[at]];
      return l.done();
    }
    case "duplicate":
      l.items.splice(at + 1, 0, JSON.parse(JSON.stringify(x)) as Nested);
      return l.done();
    case "remove":
      if (l.tabCount() <= 1) fail("A tab keeps at least one section");
      l.items.splice(at, 1);
      return l.done();
    case "variant": {
      const n = x as Nested;
      if (!variantsFor(n.type).some((v) => v.id === op.variant) || !variantsFor(n.type).some((v) => v.id === n.variant)) fail("This layout is not available for this section");
      l.items[at] = { ...n, variant: op.variant };
      return l.done();
    }
  }
}

/* ------------------------------------------------------------------ */
/*  The tabs themselves                                                */
/* ------------------------------------------------------------------ */

type Tab = { id: string; label: string; title?: string; href?: string; blocks: TabItem[] };
const SAFE_HREF = /^(https?:\/\/[^\s]+|\/(?!\/)[^\s]*)$/;
const tabSlug = (label: string, taken: string[]) => {
  const base = label.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "tab";
  let id = base;
  for (let n = 2; taken.includes(id); n++) id = `${base}-${n}`;
  return id;
};
const cleanLabel = (l: unknown) => {
  const v = String(l ?? "").replace(/\s+/g, " ").trim();
  if (!v || v.length > 60) fail("A tab name is 1–60 characters");
  return v;
};
const cleanHref = (h: unknown) => {
  const v = String(h ?? "").trim();
  if (!SAFE_HREF.test(v)) fail("Use a page address (/…) or a full link (https://…)");
  return v;
};

function tabOp(list: StoredBlock[], op: Extract<BlockOp, { op: "tab" }>): StoredBlock[] {
  const bi = list.findIndex((b) => b.id === op.id);
  if (bi < 0) fail("This section is no longer on the page. Reload to see the latest version.");
  const outer = list[bi];
  if (outer.type !== "productDetails" || outer.source) fail("This section has no tabs");
  const data = JSON.parse(JSON.stringify(outer.data)) as { tabs?: Tab[] };
  const tabs: Tab[] = Array.isArray(data.tabs) ? data.tabs : [];
  const at = (i: number) => {
    if (!Number.isInteger(i) || !tabs[i]) fail("This tab is no longer there. Reload to see the latest version.");
    return tabs[i];
  };
  switch (op.act) {
    case "add": {
      if (!Number.isInteger(op.at) || op.at < 0 || op.at > tabs.length) fail("Bad position");
      const label = cleanLabel(op.label);
      const id = tabSlug(label, tabs.map((t) => t.id));
      const { id: _id, ...text } = presetBlock("text", "default");
      void _id;
      tabs.splice(op.at, 0, op.href !== undefined ? { id, label, href: cleanHref(op.href), blocks: [] } : { id, label, title: label, blocks: [text as Nested] });
      break;
    }
    case "move": {
      at(op.tab);
      const j = op.tab + op.dir;
      if ((op.dir !== -1 && op.dir !== 1) || !tabs[j]) fail(op.dir < 0 ? "Already the first tab" : "Already the last tab");
      [tabs[op.tab], tabs[j]] = [tabs[j], tabs[op.tab]];
      break;
    }
    case "remove": {
      const t = at(op.tab);
      if (!t.href && tabs.filter((x) => !x.href).length <= 1) fail("Product details keeps at least one tab with content");
      tabs.splice(op.tab, 1);
      break;
    }
    case "rename": {
      const t = at(op.tab);
      const label = cleanLabel(op.label);
      tabs[op.tab] = { ...t, label, ...(t.title === t.label ? { title: label } : {}) };
      break;
    }
    case "link": {
      const t = at(op.tab);
      if (!t.href) fail("This tab has sections, not a link");
      tabs[op.tab] = { ...t, href: cleanHref(op.href) };
      break;
    }
  }
  const next = [...list];
  next[bi] = { ...outer, data: { ...data, tabs } as Record<string, unknown> };
  return next;
}

/** The section to select after an operation (a new one, or a moved section inside a tab, whose address changes). */
export function selectAfterOp(op: BlockOp, before: StoredBlock[], after: StoredBlock[]): string | undefined {
  if (op.op === "add" && op.in) return `${op.in}/${op.at}`;
  if ((op.op === "move" || op.op === "duplicate") && isNestedId(op.id)) {
    const { list, at } = nestedParent(op.id);
    return `${list}/${op.op === "move" ? at + op.dir : at + 1}`;
  }
  if (op.op === "add" || op.op === "duplicate") return after.find((b) => !before.some((c) => c.id === b.id))?.id;
  return undefined;
}

export function applyOp(current: StoredBlock[], op: BlockOp, known: StoredBlock[] = []): StoredBlock[] {
  if (op.op === "tab") return tabOp(current, op);
  if (op.op === "add" ? op.in !== undefined : op.op !== "set" && isNestedId(op.id)) return nestedOp(current, op as Exclude<BlockOp, { op: "set" | "tab" }>);
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
