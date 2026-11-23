import type { Region, SitePageKey, Stat, StoredBlock } from "@/db/schema";
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
  const stored = toStored(blocks, { region: "us" }, { [find(blocks, "news")]: "featuredNews" });
  return homeLayout2026(stored) ?? stored;
}

/**
 * Home in the order of DESIGN.md → Home (2026-11-15, preliminary until Emily confirms): promise → problem and answer →
 * our therapies → how it is made → evidence → news. Nothing is lost: the numbers move from the problem block into a new
 * evidence block (the publications one counted from the records), the therapy cards come from the records, the news
 * take the News & Events layout. Only a page still in the old order is changed (numbers inside the problem block, no
 * evidence block) — null otherwise, so a page someone rearranged since is left alone.
 */
export function homeLayout2026(blocks: StoredBlock[] | null | undefined): StoredBlock[] | null {
  if (!blocks?.length || blocks.some((b) => b.type === "keyNumbers" && b.variant === "evidence")) return null;
  const st = blocks.findIndex((b) => b.type === "textMedia" && b.variant === "statement");
  if (st < 0) return null;
  const stats = ((blocks[st].data.stats ?? []) as Stat[]).filter((s) => s.value || s.label);
  const out: StoredBlock[] = blocks.map((b, i) =>
    i === st ? { ...b, data: { ...b.data, stats: [] } }
    : b.type === "news" && b.source === "featuredNews" && b.variant === "cards" ? { ...b, variant: "highlights" }
    : b,
  );
  out.splice(st + 1, 0, { id: newBlockId(), type: "columns", variant: "cards", data: { title: "Our therapies" }, source: "homeTherapies" });
  const evidence: StoredBlock = {
    id: newBlockId(),
    type: "keyNumbers",
    variant: "evidence",
    source: "publicationCount",
    data: {
      title: "Backed by clinical evidence",
      link: { label: "Explore the evidence →", href: "/{region}/evidence" },
      items: stats.map((s) => (/publication/i.test(s.label) ? { ...s, from: "publications" } : s)),
    },
  };
  const news = out.findIndex((b) => b.type === "news");
  out.splice(news >= 0 ? news : out.length, 0, evidence);
  return out;
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
