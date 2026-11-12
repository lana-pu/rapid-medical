import type { Region } from "@/db/schema";

/**
 * Menu and footer (docs/screens/menu-footer.md): stored in the `navigation` settings group; until it is saved, the
 * defaults below are the site's menu. The header and footer read `navigationFrom(settings.navigation)`.
 */
export type MenuKind = "page" | "therapies" | "evidence";
export type MenuItem = { label: string; kind: MenuKind; href?: string; /** where its label is stored, for editing on the page; null — not editable there */ path?: string | null };
export type LegalLink = { label: string; href: string; path?: string | null };
export type Navigation = {
  menu: MenuItem[];
  contactLabel: string;
  contactTitle: string;
  followTitle: string;
  legalTitle: string;
  legal: LegalLink[];
  copyright: string;
};

export const DEFAULT_NAVIGATION: Navigation = {
  menu: [
    { label: "Welcome", kind: "page", href: "/" },
    { label: "Therapies", kind: "therapies" },
    { label: "Evidence", kind: "evidence" },
    { label: "News & Events", kind: "page", href: "/news-events" },
    { label: "About Us", kind: "page", href: "/about-us" },
    { label: "Careers", kind: "page", href: "/careers" },
  ],
  contactLabel: "Contact Us",
  contactTitle: "Get in touch",
  followTitle: "Follow",
  legalTitle: "Legal",
  legal: [
    { label: "Privacy Statement", href: "/privacy-statement" },
    { label: "Terms of Use", href: "/terms" },
    { label: "Compliance Statement", href: "/compliance-statement" },
    { label: "Patents", href: "/patents" },
  ],
  copyright: "Rapid Medical™. All rights reserved.",
};

const SAFE = /^(https?:\/\/[^\s]+|\/(?!\/)[^\s]*)$/;
const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");

/** Saved values over the defaults; items with no label or an unsafe address are left out. */
export function navigationFrom(saved: unknown): Navigation {
  const s = (saved && typeof saved === "object" ? saved : {}) as Record<string, unknown>;
  // each kept item keeps its stored position, so a label edited on the page lands on the right item
  const menu = (Array.isArray(s.menu) ? s.menu : [])
    .map((m: Record<string, unknown>, i: number) => ({ label: str(m?.label), kind: (["therapies", "evidence"].includes(String(m?.kind)) ? m.kind : "page") as MenuKind, href: str(m?.href), path: `menu.${i}` }))
    .filter((m) => m.label && (m.kind !== "page" || SAFE.test(m.href)));
  const legal = (Array.isArray(s.legal) ? s.legal : []).map((l: Record<string, unknown>, i: number) => ({ label: str(l?.label), href: str(l?.href), path: `legal.${i}` })).filter((l) => l.label && SAFE.test(l.href));
  // never saved → the defaults are what the editor edits; saved but unusable → shown, not editable on the page
  const fallback = <T,>(key: string, list: T[]): (T & { path: string | null })[] => list.map((x, i) => ({ ...x, path: key in s ? null : `${key}.${i}` }));
  const text = (k: keyof Navigation) => str(s[k]) || (DEFAULT_NAVIGATION[k] as string);
  return {
    menu: menu.length ? menu : fallback("menu", DEFAULT_NAVIGATION.menu),
    contactLabel: text("contactLabel"),
    contactTitle: text("contactTitle"),
    followTitle: text("followTitle"),
    legalTitle: text("legalTitle"),
    legal: Array.isArray(s.legal) ? legal : fallback("legal", DEFAULT_NAVIGATION.legal),
    copyright: text("copyright"),
  };
}

/** Where a menu item goes for a visitor in `region` (null: no region chosen yet). */
export function menuHref(m: MenuItem, region: Region | null): string {
  if (m.kind === "therapies") return region ? `/${region}/therapies` : "/choose-your-location";
  if (m.kind === "evidence") return region ? `/${region}/evidence` : "/choose-your-location?next=evidence";
  return m.href || "/";
}
