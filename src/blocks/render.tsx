import { Fragment, type ReactNode } from "react";
import { Section } from "@/components/site/primitives";
import { BLOCKS } from "./registry";
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
  for (let i = 0; i < blocks.length; ) {
    if (isFlow(blocks[i])) {
      let j = i + 1;
      while (j < blocks.length && isFlow(blocks[j])) j++;
      out.push(<Section key={i}>{blocks.slice(i, j).map((b, k) => renderBlock(b, true, k))}</Section>);
      i = j;
      continue;
    }
    const { stack } = def(blocks[i]);
    const group = stack?.group(blocks[i].variant as never) ?? null;
    if (!stack || group === null) {
      out.push(renderBlock(blocks[i], false, i));
      i++;
      continue;
    }
    let j = i + 1;
    while (j < blocks.length && blocks[j].type === blocks[i].type && stack.group(blocks[j].variant as never) === group) j++;
    out.push(<Fragment key={i}>{stack.wrap(blocks.slice(i, j).map((b, k) => renderBlock(b, false, k)), group)}</Fragment>);
    i = j;
  }
  return <>{out}</>;
}
