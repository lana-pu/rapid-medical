import type { ReactNode } from "react";
import type { EditBinding } from "./bind";
import type { HeroData, HeroVariant } from "./hero";
import type { TextData, TextVariant } from "./text";
import type { TextMediaData, TextMediaVariant } from "./text-media";
import type { KeyNumbersData, KeyNumbersVariant } from "./key-numbers";
import type { ColumnsData, ColumnsVariant } from "./columns";
import type { DeviceDiagramData, DeviceDiagramVariant } from "./device-diagram";
import type { SpecTableData, SpecTableVariant } from "./spec-table";
import type { CtaData, CtaVariant } from "./call-to-action";
import type { PeopleData, PeopleVariant } from "./people";
import type { VideoData, VideoVariant } from "./video";
import type { ProductDetailsData, ProductDetailsVariant } from "./product-details";
import type { IndicationsData, IndicationsVariant } from "./indications";

/**
 * Page blocks. A page is an ordered list of blocks; a block is
 * `{ type, variant, data, edit? }`. Each block type lives in one file
 * (component + definition) and is listed in `registry.ts`.
 * Contract and rules: docs/DESIGN.md → «Коллекция блоков».
 */
export type BlockMap = {
  hero: { variant: HeroVariant; data: HeroData };
  text: { variant: TextVariant; data: TextData };
  textMedia: { variant: TextMediaVariant; data: TextMediaData };
  keyNumbers: { variant: KeyNumbersVariant; data: KeyNumbersData };
  columns: { variant: ColumnsVariant; data: ColumnsData };
  deviceDiagram: { variant: DeviceDiagramVariant; data: DeviceDiagramData };
  specTable: { variant: SpecTableVariant; data: SpecTableData };
  cta: { variant: CtaVariant; data: CtaData };
  people: { variant: PeopleVariant; data: PeopleData };
  video: { variant: VideoVariant; data: VideoData };
  productDetails: { variant: ProductDetailsVariant; data: ProductDetailsData };
  indications: { variant: IndicationsVariant; data: IndicationsData };
};

export type BlockType = keyof BlockMap;

export type BlockOf<T extends BlockType> = {
  type: T;
  variant: BlockMap[T]["variant"];
  data: BlockMap[T]["data"];
  /** Where the fields are stored, for the on-page editor. No binding → not editable on the page. */
  edit?: EditBinding;
};

export type Block = { [T in BlockType]: BlockOf<T> }[BlockType];

/** Renders a block; `nested` = inside another block (e.g. a Product details tab), without its own section. */
export type RenderBlock = (block: Block, nested?: boolean, key?: string | number) => ReactNode;

export type BlockProps<T extends BlockType> = {
  variant: BlockMap[T]["variant"];
  data: BlockMap[T]["data"];
  edit?: EditBinding;
  nested: boolean;
  render: RenderBlock;
};

export type BlockCategory = "content" | "list" | "system";

export type FieldKind = "text" | "longText" | "rich" | "link" | "links" | "media" | "items" | "chart" | "table";

export type FieldDef = { key: string; label: string; kind: FieldKind; required?: boolean; note?: string };

export type VariantDef<V extends string> = { id: V; label: string; description?: string };

export type BlockDef<T extends BlockType> = {
  type: T;
  /** Name shown to editors (English, as in the admin UI). */
  name: string;
  /** What the block is for, one sentence. */
  description: string;
  category: BlockCategory;
  variants: VariantDef<BlockMap[T]["variant"]>[];
  fields: FieldDef[];
  /** Can sit inside Product details. */
  nestable?: boolean;
  /** Editors cannot remove or move it (regulatory). */
  pinned?: boolean;
  /** Sample data for the style guide; `examples` overrides it per variant. */
  example: BlockMap[T]["data"];
  examples?: Partial<Record<BlockMap[T]["variant"], BlockMap[T]["data"]>>;
  Component: (props: BlockProps<T>) => ReactNode | Promise<ReactNode>;
  /** Consecutive top-level blocks of this type share one wrapper (one band). */
  stack?: (children: ReactNode) => ReactNode;
};
