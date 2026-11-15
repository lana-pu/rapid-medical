import type { Region, SitePageKey, StoredBlock } from "@/db/schema";
import { THERAPY_GROUPS } from "@/lib/therapy-groups";
import { homeToBlocks, careersToBlocks, evidenceToBlocks, therapiesToBlocks, type HomeSettings, type CareersSettings, type EvidenceSettings, type TherapiesLanding } from "./from-settings";
import { aboutToBlocks, type AboutSettings } from "./from-pages";
import { newBlockId, toStored } from "./stored";
import type { Block } from "./types";

/**
 * Pages that exist once (or once per region): Home, About, Careers, Evidence, Therapies overview (ADR-007).
 * Their texts used to live in site settings; the conversion below runs once (scripts/migrate-blocks.ts).
 * Lists (news, team, offices, studies, therapy cards) become `source` blocks, filled when the page is shown.
 */

export const SITE_PAGES: { key: SitePageKey; title: string; regional: boolean }[] = [
  { key: "home", title: "Home", regional: false },
  { key: "about", title: "About Us", regional: false },
  { key: "careers", title: "Careers", regional: false },
  { key: "evidence", title: "Evidence", regional: true },
  { key: "therapies", title: "Therapies", regional: true },
];

export function sitePagePath(key: string, region: Region | null): string {
  switch (key) {
    case "home":
      return "/";
    case "about":
      return "/about-us";
    case "careers":
      return "/careers";
    default:
      return `/${region ?? "us"}/${key}`;
  }
}

const find = (blocks: Block[], type: string, variant?: string) => blocks.findIndex((b) => b.type === type && (!variant || b.variant === variant));

export function homeToStored(home: HomeSettings): StoredBlock[] {
  const blocks = homeToBlocks({ home, news: [], region: "us" });
  return toStored(blocks, { region: "us" }, { [find(blocks, "news")]: "featuredNews" });
}

export function careersToStored(c: CareersSettings): StoredBlock[] {
  const blocks = careersToBlocks({ c, jobCount: 0 });
  return toStored(blocks, { region: null }, { [find(blocks, "hero")]: "openPositions", [find(blocks, "jobs", "roles")]: "openRoles" });
}

export function aboutToStored(about: AboutSettings): StoredBlock[] {
  // a placeholder office keeps the offices section in the list; its content comes from Contact details
  const blocks = aboutToBlocks({ about, offices: [{ name: "" }] as never, team: [] });
  return toStored(blocks, { region: null }, { [find(blocks, "text", "facts")]: "companyFacts", [find(blocks, "people")]: "team", [find(blocks, "officesMap", "offices")]: "offices", [find(blocks, "officesMap", "map")]: "officePins" });
}

export function evidenceToStored(cfg: EvidenceSettings, region: Region): StoredBlock[] {
  const blocks = evidenceToBlocks({ region, cfg, all: [], featured: [], products: [] });
  // DESIGN.md → Evidence: overview (counted per product, the line, the featured ones) and the archive
  return toStored(blocks, { region }, { [find(blocks, "hero")]: "regionLabel", [find(blocks, "publications", "overview")]: "featuredPublications", [find(blocks, "publications", "library")]: "publicationsByProduct" });
}

export function therapiesToStored(landing: TherapiesLanding, region: Region): StoredBlock[] {
  const blocks = therapiesToBlocks({ region, landing, items: [] });
  const stored = toStored(blocks, { region }, { [find(blocks, "hero")]: "regionLabel" });
  // one section per therapy group (and one for therapies without a group); a group without therapies is not shown
  const groups = [...THERAPY_GROUPS.map((g) => g.value as string), ""].map((group) => ({ id: newBlockId(), type: "columns", variant: "cards", data: { group }, source: "therapyGroup" }));
  stored.splice(1, 0, ...groups);
  return stored;
}
