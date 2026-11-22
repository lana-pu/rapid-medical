// The «Choose your location» window for the wireframe snapshot (render-page.tsx): opened the way the site opens it —
// a click on a link to /choose-your-location (render.cjs clicks it). Copied next to the page as modal.tsx;
// the code before the redesign had no such window: render.cjs --asis copies modal-asis.tsx instead.
import type { Region } from "@/db/schema";
import { RegionModal } from "@/components/site/RegionModal";

export function RegionWindow({ region, source, q }: { region: Region | null; source: "location" | "chosen" | null; q: string }) {
  return (
    <>
      <a href={`/choose-your-location?${q}`} data-wf-open>Choose location</a>
      <RegionModal region={region} source={source} />
    </>
  );
}
