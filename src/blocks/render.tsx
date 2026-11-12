import { Fragment, type ReactNode } from "react";
import { Section } from "@/components/site/primitives";
import { isEditing } from "@/lib/editing";
import { BLOCKS } from "./registry";
import { blockName } from "./diff";
import type { Block, BlockDef, BlockType, RenderBlock } from "./types";

const def = (b: Block) => BLOCKS[b.type] as unknown as BlockDef<BlockType>;

export const renderBlock: RenderBlock = (b, nested = false, key) => {
  const { Component } = def(b);
  return <Component key={key} variant={b.variant} data={b.data} edit={b.edit} nested={nested} render={renderBlock} />;
};

const isFlow = (b: Block) => def(b).flow?.(b.variant as never) ?? false;

/**
 * A page: blocks in order. Consecutive blocks of a type with `stack` share one band;
 * consecutive flow blocks (page title, text, form…) share one plain section.
 */
export function BlockList({ blocks }: { blocks: Block[] }) {
  const out: ReactNode[] = [];
  // In the page editor each stored section is preceded by an invisible mark; the editor finds a section's extent
  // between its mark and the next one (no wrappers, so the layout is the same as visitors see).
  const marked = (b: Block, i: number, node: ReactNode, key: number) => (
    <Fragment key={key}>
      <Mark i={i} uid={b.uid} b={b} />
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

async function Mark({ i, uid, b }: { i: number; uid?: string; b?: Block }) {
  if (!uid || !(await isEditing())) return null;
  // what the section is, for the editor in the static demo (no server to ask)
  const info = b ? { t: b.type, v: b.variant, n: blockName({ id: uid, type: b.type, variant: b.variant as string, data: b.data as Record<string, unknown> }), p: !!def(b).pinned } : {};
  return <i hidden data-rm-b={JSON.stringify({ i, id: uid, ...info })} />;
}
