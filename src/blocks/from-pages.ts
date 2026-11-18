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

export function pageToBlocks(page: Page, regionLabel?: string, resource: "pages" | "materials" = "pages"): Block[] {
  const edit = { r: resource, id: page.id, map: { title: "title", html: "bodyHtml" } };
  return [
    { type: "hero", variant: "page", data: { eyebrow: regionLabel, title: page.title }, edit },
    { type: "richText", variant: "default", data: { html: page.bodyHtml }, edit },
  ];
}

const REGION_MAP: Record<string, string> = { us: "Americas", ous: "Europe", apac: "Asia Pacific" };

/** URL parameters are arbitrary: only the map's own keys count ("constructor" is not a topic). */
const pick = (map: Record<string, string>, key?: string) => (key && Object.hasOwn(map, key) ? map[key] : undefined);

/**
 * Contact Us: title, then the form beside the region's contacts (docs/screens/contact-us.md). Americas → the US office,
 * every other region → headquarters, as orders are routed (`recipientFor`).
 */
export function contactToBlocks({ region, topic, country, offices = [] }: { region?: string; topic?: string; country?: string; offices?: Office[] }): Block[] {
  const office = offices.find((o) => (region === "us" ? o.label === "USA" : o.label === "Headquarters"));
  const where = region === "us" ? "Americas" : "headquarters";
  const contacts: { label: string; value: string; href?: string }[] = [];
  if (office?.phone) contacts.push({ label: `Call ${where}`, value: office.phone, href: `tel:${office.phone.replace(/[^+\d]/g, "")}` });
  if (office?.ordersEmail) contacts.push({ label: "Orders", value: office.ordersEmail, href: `mailto:${office.ordersEmail}` });
  return [
    { type: "hero", variant: "page", data: { title: "Let’s connect", body: "Please provide a few contact details below." } },
    {
      type: "form",
      variant: "split",
      data: {
        topics: TOPICS,
        defaultTopic: pick(TOPIC_KEYS, topic),
        defaultRegion: pick(REGION_MAP, region),
        defaultCountry: country,
        contacts,
        contactsLink: offices.length ? { label: "All offices and addresses →", href: "/about-us#offices" } : null,
      },
    },
  ];
}

/** A leadership card on About (also used by the stored page's `team` source). */
export const teamCard = (m: TeamMember) => ({ name: m.name, title: m.title, longTitle: m.longTitle, photoUrl: m.photoUrl, slug: m.slug, bioHtml: m.bioHtml ? safeHtml(m.bioHtml) : null, href: `/about-us#${m.slug}`, edit: { r: "team", id: m.id, prefix: "" } });

export type AboutSettings = { intro?: string; whatWeDoTitle?: string; whatWeDoBody?: string; leadershipIntro?: string; heroImageUrl?: string; mapTitle?: string; mapSub?: string; mapFallbackImageUrl?: string; closingLine?: string };

/** About facts counted from the records: publications (all regions) and the countries of the offices. */
export function companyFacts(publications: number, offices: Office[]): { label: string; value: string }[] {
  const tc = (s: string) => (s.length <= 3 ? s : s.charAt(0) + s.slice(1).toLowerCase());
  const countries = [...new Set(offices.map((o) => (o.address ?? "").trim().split("\n").pop()?.trim() ?? "").filter(Boolean).map(tc))];
  return [
    ...(publications ? [{ label: "Clinical publications", value: String(publications) }] : []),
    ...(countries.length ? [{ label: "Offices", value: countries.join(" · ") }] : []),
  ];
}

export function aboutToBlocks({ about, offices, team, facts = [] }: { about: AboutSettings; offices: Office[]; team: TeamMember[]; facts?: { label: string; value: string }[] }): Block[] {
  const r = "settings:about";
  const blocks: Block[] = [{ type: "hero", variant: "page", data: { title: "About Us" } }];
  blocks.push({
    type: "text",
    variant: "facts",
    data: { body: about.intro, imageUrl: about.heroImageUrl, title2: about.whatWeDoTitle ?? "What we do", body2: about.whatWeDoBody, countries: "30+", headquarters: "Yokneam, Israel", facts },
    edit: { r, map: { body: "intro", imageUrl: "heroImageUrl", title2: "whatWeDoTitle", body2: "whatWeDoBody" } },
  });
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
