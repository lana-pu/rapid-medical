// The code before the redesign had no «Choose your location» window: render.cjs --asis copies this as modal.tsx.
import type { Region } from "@/db/schema";

export function RegionWindow(_: { region: Region | null; source: "location" | "chosen" | null; q: string }): never {
  throw new Error("no «Choose your location» window in the code before the redesign");
}
