import { Fragment, type ReactNode } from "react";
import { BLOCKS } from "./registry";
import type { Block, BlockDef, BlockType, RenderBlock } from "./types";

const def = (b: Block) => BLOCKS[b.type] as unknown as BlockDef<BlockType>;

export const renderBlock: RenderBlock = (b, nested = false, key) => {
  const { Component } = def(b);
  return <Component key={key} variant={b.variant} data={b.data} edit={b.edit} nested={nested} render={renderBlock} />;
};

/** A page: blocks in order. Consecutive blocks of a type with `stack` share one band. */
export function BlockList({ blocks }: { blocks: Block[] }) {
  const out: ReactNode[] = [];
  for (let i = 0; i < blocks.length; ) {
    const { stack } = def(blocks[i]);
    if (!stack) {
      out.push(renderBlock(blocks[i], false, i));
      i++;
      continue;
    }
    let j = i + 1;
    while (j < blocks.length && blocks[j].type === blocks[i].type) j++;
    out.push(<Fragment key={i}>{stack(blocks.slice(i, j).map((b, k) => renderBlock(b, false, k)))}</Fragment>);
    i = j;
  }
  return <>{out}</>;
}
