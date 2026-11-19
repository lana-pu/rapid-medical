import { describe, expect, it } from "vitest";
import { homeLayout2026, homeToStored } from "@/blocks/site-pages";
import type { StoredBlock } from "@/db/schema";

// Home in the order of DESIGN.md → Home (2026-11-15, preliminary): nothing from the old page is lost
const OLD: StoredBlock[] = [
  { id: "h", type: "hero", variant: "banner", data: { title: "EXPAND" } },
  { id: "s", type: "textMedia", variant: "statement", data: { title: "Like fingerprints", stats: [
    { value: "50K+", label: "patients treated", iconUrl: "/icons/stat-patients.svg" },
    { value: "100+", label: "issued patents" },
    { value: "85+", label: "clinical publications" },
  ] } },
  { id: "d", type: "text", variant: "dark", data: { title: "Engineered" } },
  { id: "n", type: "news", variant: "cards", source: "featuredNews", data: { title: "At the forefront", allHref: "/news-events", allLabel: "View all news ›" } },
];

describe("Home layout 2026-11", () => {
  it("promise → problem → therapies → engineered → evidence → news; the numbers move, the publications one is counted", () => {
    const next = homeLayout2026(OLD)!;
    expect(next.map((b) => `${b.type}:${b.variant}${b.source ? `:${b.source}` : ""}`)).toEqual([
      "hero:banner", "textMedia:statement", "columns:cards:homeTherapies", "text:dark", "keyNumbers:evidence:publicationCount", "news:highlights:featuredNews",
    ]);
    expect(next[1].data.stats).toEqual([]);
    const ev = next[4].data as { items: { value: string; label: string; from?: string; iconUrl?: string }[]; link: { href: string } };
    expect(ev.items.map((s) => [s.value, s.from ?? ""])).toEqual([["50K+", ""], ["100+", ""], ["85+", "publications"]]);
    expect(ev.items[0].iconUrl).toBe("/icons/stat-patients.svg");
    expect(ev.link.href).toBe("/{region}/evidence");
    expect(next[5].data).toMatchObject({ title: "At the forefront", allHref: "/news-events", allLabel: "View all news ›" });
  });
  it("runs once: a page already in the new order, or without the problem block, is left alone", () => {
    expect(homeLayout2026(homeLayout2026(OLD))).toBeNull();
    expect(homeLayout2026([OLD[0], OLD[3]])).toBeNull();
    expect(homeLayout2026(null)).toBeNull();
  });
  it("a new database starts in the new order", () => {
    const fresh = homeToStored({ stats: [{ value: "85+", label: "clinical publications" }] } as never);
    expect(fresh.some((b) => b.type === "keyNumbers" && b.variant === "evidence")).toBe(true);
  });
});
