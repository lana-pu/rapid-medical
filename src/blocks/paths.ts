import { BLOCKS } from "./registry";
import { SOURCES, isSource } from "./stored";
import type { BlockDef, BlockType } from "./types";

/**
 * Which field of a stored block list may be written by the on-page editor (ADR-007 §6).
 * The path is the part after the record field `blocks`: `{n}.data.{key…}`, or inside Product details tabs
 * `{n}.data.tabs.{t}.blocks.{j}[.blocks.{k}].data.{key…}`.
 * Only string values can be written; the structure (type, variant, id, arrays, objects) changes through
 * block operations only. Keys filled by a source are not writable (they come from other records).
 */

const IDX = /^\d+$/;
const KEY = /^[A-Za-z][A-Za-z0-9]*$/;
const FORBIDDEN = new Set(["__proto__", "constructor", "prototype", "edit"]);

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => !!v && typeof v === "object" && !Array.isArray(v);
const def = (t: unknown) => (typeof t === "string" && Object.hasOwn(BLOCKS, t) ? (BLOCKS[t as BlockType] as unknown as BlockDef<BlockType>) : null);

export type BlockPathCheck = { ok: true; type: string; key: string; kind: string | null } | { ok: false; reason: string };

export function checkBlockPath(blocks: unknown, path: string[]): BlockPathCheck {
  const no = (reason: string): BlockPathCheck => ({ ok: false, reason });
  if (!Array.isArray(blocks)) return no("The page has no sections");
  if (!IDX.test(path[0] ?? "") || path[1] !== "data") return no("Bad section path");
  let block = blocks[Number(path[0])];
  if (!isObj(block)) return no("Section not found");
  const source = isSource(block.source as string | undefined) ? SOURCES[block.source as string] : null;
  let pos = 2;
  // descend into Product details tabs: tabs.{t}.blocks.{j}[.blocks.{k}].data
  while (path[pos] === "tabs" && def(block.type)?.type === "productDetails") {
    const [t, b, j] = path.slice(pos + 1, pos + 4);
    if (!IDX.test(t ?? "") || b !== "blocks" || !IDX.test(j ?? "")) return no("Bad tab path");
    const tabs = (block.data as Obj | undefined)?.tabs;
    const tab = Array.isArray(tabs) ? tabs[Number(t)] : undefined;
    let inner = isObj(tab) && Array.isArray(tab.blocks) ? tab.blocks[Number(j)] : undefined;
    pos += 4;
    if (isObj(inner) && Array.isArray(inner.blocks) && "group" in inner) {
      if (path[pos] !== "blocks" || !IDX.test(path[pos + 1] ?? "")) return no("Bad group path");
      inner = inner.blocks[Number(path[pos + 1])];
      pos += 2;
    }
    if (!isObj(inner) || path[pos] !== "data") return no("Section not found");
    block = inner;
    pos += 1;
  }
  const d = def(block.type);
  if (!d) return no("Unknown section type");
  const leaf = path.slice(pos);
  if (!leaf.length) return no("Bad field");
  for (const seg of leaf) if (!(IDX.test(seg) || KEY.test(seg)) || FORBIDDEN.has(seg)) return no("Bad field");
  if (IDX.test(leaf[0])) return no("Bad field");
  if (source && pos === 2 && source.keys.includes(leaf[0])) return no("This list comes from other records; edit it there");

  let cur: unknown = block.data;
  for (let i = 0; i < leaf.length - 1; i++) {
    const seg = leaf[i];
    if (Array.isArray(cur)) {
      if (!IDX.test(seg)) return no("Bad field");
      cur = cur[Number(seg)];
    } else if (isObj(cur)) {
      if (IDX.test(seg)) return no("Bad field");
      cur = Object.hasOwn(cur, seg) ? cur[seg] : undefined;
    } else return no("Field not found");
    if (cur === undefined || cur === null) {
      // a missing object on the way may be created only for a declared field ("cta" → cta.label)
      if (i === 0 && d.fields.some((f) => f.key === seg) && leaf.length === 2 && KEY.test(leaf[1])) {
        cur = {};
        break;
      }
      return no("Field not found");
    }
  }
  const last = leaf[leaf.length - 1];
  if (Array.isArray(cur)) {
    if (!IDX.test(last) || Number(last) >= cur.length) return no("Field not found");
  } else if (isObj(cur)) {
    if (IDX.test(last)) return no("Bad field");
    if (!Object.hasOwn(cur, last) && !(leaf.length === 1 && d.fields.some((f) => f.key === last)) && !(leaf.length === 2 && cur && Object.keys(cur).length === 0)) {
      return no("Field not found");
    }
  } else return no("Field not found");
  const value = (cur as Obj)[last as never];
  if (value !== undefined && value !== null && typeof value !== "string") return no("Only text and media can be changed here");
  const field = d.fields.find((f) => f.key === leaf[0]);
  return { ok: true, type: d.type, key: leaf.join("."), kind: field?.kind ?? null };
}
