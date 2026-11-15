import { permanentRedirect } from "next/navigation";

/** Open positions live on Careers (DESIGN.md → Careers, 2026-11-14); the old address keeps working. */
export default function OpenPositionsPage() {
  permanentRedirect("/careers#open-positions");
}
