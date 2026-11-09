import type { BlockDef, BlockType } from "./types";
import { hero } from "./hero";
import { text } from "./text";
import { textMedia } from "./text-media";
import { keyNumbers } from "./key-numbers";
import { columns } from "./columns";
import { video } from "./video";
import { cta } from "./call-to-action";
import { productDetails } from "./product-details";
import { deviceDiagram } from "./device-diagram";
import { specTable } from "./spec-table";
import { people } from "./people";
import { indications } from "./indications";
import { richText } from "./rich-text";
import { media } from "./media";
import { form } from "./form";
import { officesMap } from "./offices-map";

/**
 * All page blocks. Adding a block = a file next to this one + a line here
 * (+ its entry in BlockMap, types.ts). Adding a variant = the block's file only.
 * Order here is the order in the style guide and, later, in the editor's preset list.
 */
export const BLOCKS: { [T in BlockType]: BlockDef<T> } = {
  hero,
  text,
  richText,
  textMedia,
  media,
  keyNumbers,
  columns,
  video,
  cta,
  productDetails,
  deviceDiagram,
  specTable,
  people,
  form,
  officesMap,
  indications,
};

export const BLOCK_LIST = Object.values(BLOCKS) as BlockDef<BlockType>[];
