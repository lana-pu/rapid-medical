// Wireframe snapshot page: the real site for every unit of the flows (docs/flows/*.json; units — blocks-kit/key.js).
// Not part of the app: render.cjs copies it into src/app/flows-render/page.tsx (with boundary.tsx, modal.tsx), opens it in a
// browser, takes each unit's HTML and the compiled CSS, and removes the folder. The queue is written by render.cjs.
// Route units (whole pages) are not here: render.cjs opens those pages themselves.
import { readFileSync } from "node:fs";
import path from "node:path";
import { Suspense } from "react";
import { BlockList } from "@/blocks/render";
import { BLOCKS } from "@/blocks/registry";
import type { Block } from "@/blocks/types";
import type { Region } from "@/db/schema";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { RegionBanner } from "@/components/site/RegionBanner";
import { siteChrome } from "@/components/site/chrome";
import { REGION_LABELS } from "@/lib/regions";
import { Boundary } from "./boundary";
import { RegionWindow } from "./modal";

export const dynamic = "force-dynamic";

type Unit = { k: string; page?: boolean; blocks?: Block[]; chrome?: "header" | "footer" | "banner" | "modal"; region?: Region | null; suggested?: Region; route?: string; source?: "location" | "chosen" | null; back?: string | null; next?: string | null };

// {"sample": true} as a node's only field: the block's sample data from the registry (the style guide's) — for the
// Library examples of variants no page uses
const withSample = (b: Block): Block => {
  const d = BLOCKS[b.type] as { example: unknown; examples?: Record<string, unknown> };
  return (b.data as { sample?: boolean }).sample === true ? ({ ...b, data: d.examples?.[b.variant as string] ?? d.example } as Block) : b;
};

async function Chrome({ u }: { u: Unit }) {
  if (u.chrome === "modal") {
    // the window opens the way the site opens it: a click on a link to /choose-your-location (render.cjs clicks it)
    const q = u.back ? `back=${encodeURIComponent(u.back)}` : `next=${encodeURIComponent(u.next ?? "/")}`;
    return <RegionWindow region={u.region ?? null} source={u.source ?? null} q={q} />;
  }
  if (u.chrome === "banner") {
    const s = u.suggested ?? "us";
    return <RegionBanner suggested={s} label={REGION_LABELS[s]} href={`/${s}/therapies`} />;
  }
  const c = await siteChrome(u.region ?? null);
  return u.chrome === "header" ? <Header {...c.header} /> : <Footer {...c.footer} />;
}

// ?only=<key>: that unit alone (windows listen to clicks on the whole document: one at a time)
export default async function FlowsRender({ searchParams }: { searchParams: Promise<{ only?: string }> }) {
  const { only } = await searchParams;
  const units: Unit[] = JSON.parse(readFileSync(path.join(process.cwd(), "docs/flows/blocks-kit/.queue.json"), "utf8"));
  return (
    <main>
      {units.filter((u) => !u.route && (only ? u.k === only : u.chrome !== "modal")).map((u) => (
        <div key={u.k} data-wf-unit={u.k} data-wf-modal={u.chrome === "modal" ? "" : undefined}>
          {/* a server error falls back to the client here, where Boundary shows it */}
          <Suspense>
            <Boundary>
              {u.chrome ? (
                <Chrome u={u} />
              ) : (
                // a page: the site's own grouping (BlockList), each block marked where it stands
                <BlockList blocks={(u.blocks ?? []).map(withSample)} slot={u.page ? (i, node) => <div data-wf-item={i}>{node}</div> : undefined} />
              )}
            </Boundary>
          </Suspense>
        </div>
      ))}
    </main>
  );
}
