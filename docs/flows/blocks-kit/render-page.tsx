// Wireframe snapshot page: the real site blocks for every rm-* node of the flows (docs/flows/*.json).
// Not part of the app: render.cjs copies it into src/app/flows-render/page.tsx (with boundary.tsx), opens it in a
// browser, takes each unit's HTML and the compiled CSS, and removes the folder. The queue is written by render.cjs.
import { readFileSync } from "node:fs";
import path from "node:path";
import { Suspense } from "react";
import { BlockList } from "@/blocks/render";
import { BLOCKS } from "@/blocks/registry";
import type { Block } from "@/blocks/types";
import { Boundary } from "./boundary";

export const dynamic = "force-dynamic";

type Unit = { k: string; page: boolean; blocks: Block[] };

// {"sample": true} as a node's only field: the block's sample data from the registry (the style guide's) — for the
// Library examples of variants no page uses
const withSample = (b: Block): Block => {
  const d = BLOCKS[b.type] as { example: unknown; examples?: Record<string, unknown> };
  return (b.data as { sample?: boolean }).sample === true ? ({ ...b, data: d.examples?.[b.variant as string] ?? d.example } as Block) : b;
};

export default function FlowsRender() {
  const units: Unit[] = JSON.parse(readFileSync(path.join(process.cwd(), "docs/flows/blocks-kit/.queue.json"), "utf8"));
  for (const u of units) u.blocks = u.blocks.map(withSample);
  return (
    <main>
      {units.map((u) => (
        <div key={u.k} data-wf-unit={u.k}>
          {/* a server error falls back to the client here, where Boundary shows it */}
          <Suspense>
            <Boundary>
              {/* a page: the site's own grouping (BlockList), each block marked where it stands */}
              <BlockList blocks={u.blocks} slot={u.page ? (i, node) => <div data-wf-item={i}>{node}</div> : undefined} />
            </Boundary>
          </Suspense>
        </div>
      ))}
    </main>
  );
}
