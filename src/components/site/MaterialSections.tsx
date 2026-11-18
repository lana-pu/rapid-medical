import type { Region, StoredBlock } from "@/db/schema";
import { BlockList } from "@/blocks/render";
import { resolveBlocks } from "@/blocks/stored";
import { PageMark } from "@/components/editor/PageMark";

/**
 * A material whose page is made of sections (built by «Create from a document», ADR-009): the sections, editable on the
 * page like any other page of the site. Materials without sections keep their own template.
 */
export function MaterialSections({ id, blocks, region }: { id: number; blocks: StoredBlock[]; region: Region | null }) {
  return (
    <>
      <PageMark r="materials" id={id} />
      <BlockList blocks={resolveBlocks(blocks, { region }, { r: "materials", id })} />
    </>
  );
}
