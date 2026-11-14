import { Fragment, type ReactNode } from "react";
import { Section } from "@/components/site/primitives";
import { Mark, listOf } from "./mark";
import { BLOCKS } from "./registry";
import { blockName } from "./diff";
import type { Block, BlockDef, BlockType, RenderBlock } from "./types";
import { isEditing } from "@/lib/editing";
import { HiddenStrip } from "@/components/editor/HiddenStrip";

const def = (b: Block) => BLOCKS[b.type] as unknown as BlockDef<BlockType>;

const nameOf = (b: Block, uid: string) => blockName({ id: uid, type: b.type, variant: b.variant as string, data: b.data as Record<string, unknown> });
const info = (b: Block, uid: string) => ({ t: b.type, v: b.variant as string, n: nameOf(b, uid), p: !!def(b).pinned, ...(b.hidden ? { h: true } : {}) });

export const renderBlock: RenderBlock = (b, nested = false, key) => {
  const { Component } = def(b);
  // hidden on the site: in the editor a strip with «Show», for visitors nothing (HiddenStrip checks)
  const node = b.hidden ? (
    <HiddenStrip key={b.uid?.includes("/") ? undefined : key} uid={b.uid} name={nameOf(b, b.uid ?? "")} />
  ) : (
    <Component key={b.uid?.includes("/") ? undefined : key} variant={b.variant} data={b.data} edit={b.edit} nested={nested} render={renderBlock} />
  );
  // a section inside a Product details tab: its own mark (the page's sections get theirs from BlockList)
  if (!b.uid?.includes("/")) return node;
  return (
    <Fragment key={key}>
      <Mark i={Number(b.uid.split("/").pop())} uid={b.uid} l={listOf(b.uid)} info={info(b, b.uid)} />
      {node}
    </Fragment>
  );
};

const isFlow = (b: Block) => def(b).flow?.(b.variant as never) ?? false;

/**
 * A page: blocks in order. Consecutive blocks of a type with `stack` share one band;
 * consecutive flow blocks (page title, text, form…) share one plain section.
 */
export async function BlockList({ blocks: all }: { blocks: Block[] }) {
  // visitors do not get hidden sections at all; the editor shows them folded (HiddenStrip)
  const blocks = (await isEditing()) ? all : all.filter((b) => !b.hidden);
  const out: ReactNode[] = [];
  // In the page editor each stored section is preceded by an invisible mark; the editor finds a section's extent
  // between its mark and the next one (no wrappers, so the layout is the same as visitors see).
  const marked = (b: Block, i: number, node: ReactNode, key: number) => (
    <Fragment key={key}>
      <Mark i={i} uid={b.uid} info={b.uid ? info(b, b.uid) : undefined} />
      {node}
    </Fragment>
  );
  for (let i = 0; i < blocks.length; ) {
    if (isFlow(blocks[i])) {
      let j = i + 1;
      while (j < blocks.length && isFlow(blocks[j])) j++;
      out.push(<Section key={i}>{blocks.slice(i, j).map((b, k) => marked(b, i + k, renderBlock(b, true), k))}</Section>);
      i = j;
      continue;
    }
    const { stack } = def(blocks[i]);
    const group = stack?.group(blocks[i].variant as never) ?? null;
    if (!stack || group === null) {
      out.push(marked(blocks[i], i, renderBlock(blocks[i], false), i));
      i++;
      continue;
    }
    let j = i + 1;
    while (j < blocks.length && blocks[j].type === blocks[i].type && stack.group(blocks[j].variant as never) === group) j++;
    out.push(<Fragment key={i}>{stack.wrap(blocks.slice(i, j).map((b, k) => marked(b, i + k, renderBlock(b, false), k)), group)}</Fragment>);
    i = j;
  }
  if (blocks.some((b) => b.uid)) out.push(<Mark key="end" i={blocks.length} uid="end" />);
  return <>{out}</>;
}
