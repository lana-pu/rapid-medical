import type { Page, TeamMember } from "@/db/schema";
import type { Block } from "./types";
import { safeHtml } from "@/lib/html";
import { TOPICS, TOPIC_KEYS } from "@/lib/contact-topics";
import type { Office } from "./offices-map";

/**
 * Block lists for the pages that are stored as records or settings:
 * text pages, Contact, About. Storage does not change; the lists are built on render.
 * Specs: docs/screens/pages.md, about-us.md, contact-us.md.
 */

export function pageToBlocks(page: Page, regionLabel?: string): Block[] {
  const edit = { r: "pages", id: page.id, map: { title: "title", html: "bodyHtml" } };
  return [
    { type: "hero", variant: "page", data: { eyebrow: regionLabel, title: page.title }, edit },
    { type: "richText", variant: "default", data: { html: page.bodyHtml }, edit },
  ];
}

const REGION_MAP: Record<string, string> = { us: "Americas", ous: "Europe", apac: "Asia Pacific" };

/** URL parameters are arbitrary: only the map's own keys count ("constructor" is not a topic). */
const pick = (map: Record<string, string>, key?: string) => (key && Object.hasOwn(map, key) ? map[key] : undefined);

export function contactToBlocks({ region, topic }: { region?: string; topic?: string }): Block[] {
  return [
    { type: "hero", variant: "page", data: { title: "Let’s connect", body: "Please provide a few contact details below." } },
    { type: "form", variant: "default", data: { topics: TOPICS, defaultTopic: pick(TOPIC_KEYS, topic), defaultRegion: pick(REGION_MAP, region) } },
  ];
}

/** A leadership card on About (also used by the stored page's `team` source). */
export const teamCard = (m: TeamMember) => ({ name: m.name, title: m.title, longTitle: m.longTitle, photoUrl: m.photoUrl, slug: m.slug, bioHtml: m.bioHtml ? safeHtml(m.bioHtml) : null, href: `/about-us#${m.slug}`, edit: { r: "team", id: m.id, prefix: "" } });

export type AboutSettings = { intro?: string; whatWeDoTitle?: string; whatWeDoBody?: string; leadershipIntro?: string; heroImageUrl?: string; mapTitle?: string; mapSub?: string; mapFallbackImageUrl?: string; closingLine?: string };

export function aboutToBlocks({ about, offices, team }: { about: AboutSettings; offices: Office[]; team: TeamMember[] }): Block[] {
  const r = "settings:about";
  const blocks: Block[] = [{ type: "hero", variant: "page", data: { title: "About Us" } }];
  if (about.intro || about.heroImageUrl) {
    blocks.push({ type: "text", variant: "large", data: { body: about.intro, imageUrl: about.heroImageUrl }, edit: { r, map: { body: "intro", imageUrl: "heroImageUrl" } } });
  }
  blocks.push({ type: "text", variant: "surface", data: { title: about.whatWeDoTitle ?? "What we do", body: about.whatWeDoBody }, edit: { r, map: { title: "whatWeDoTitle", body: "whatWeDoBody" } } });
  blocks.push({
    type: "people",
    variant: "team",
    data: {
      anchor: "leadership",
      title: "Leadership Team",
      intro: about.leadershipIntro,
      members: team.map(teamCard),
    },
    edit: { r, map: { intro: "leadershipIntro" } },
  });
  if (offices.length > 0) {
    blocks.push({ type: "officesMap", variant: "offices", data: { anchor: "offices", title: "Global Offices", offices }, edit: { r: "settings:contact", map: { offices: "offices" } } });
  }
  blocks.push({
    type: "officesMap",
    variant: "map",
    data: {
      anchor: "map",
      title: about.mapTitle,
      subtitle: about.mapSub,
      offices,
      regionLinks: {
        usa: "/contact-us?region=us",
        canada: "/contact-us?region=us",
        latam: "/contact-us?region=ous",
        europe: "/contact-us?region=ous",
        australia: "/contact-us?region=ous",
        middleeast: "/contact-us?region=apac",
        asia: "/contact-us?region=apac",
      },
      fallbackImageUrl: about.mapFallbackImageUrl,
      closingLine: about.closingLine ?? "Have a question? We’d love to hear from you.",
      button: { label: "Contact us", href: "/contact-us" },
    },
    edit: { r, map: { title: "mapTitle", subtitle: "mapSub", closingLine: "closingLine" } },
  });
  return blocks;
}
