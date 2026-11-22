import type { Region } from "@/db/schema";
import { getAllSettings } from "@/lib/settings";
import { getSolutionsNav } from "@/lib/content";
import { navigationFrom } from "@/lib/navigation";
import type { Header } from "./Header";
import type { Footer } from "./Footer";

type Settings = Awaited<ReturnType<typeof getAllSettings>>;

/**
 * What the site's header and footer show for a region (null: the IP country is unknown) — from the settings and the
 * region's therapies. One place for the site layout and the wireframe snapshot (docs/flows/blocks-kit/render-page.tsx).
 */
export async function siteChrome(region: Region | null, settings?: Settings) {
  const s = settings ?? (await getAllSettings());
  const nav = region ? await getSolutionsNav(region) : [];
  const contact = (s.contact ?? {}) as { phoneHq?: string; phoneUs?: string; email?: string };
  const social = (s.social ?? {}) as { x?: string; linkedin?: string; instagram?: string; youtube?: string };
  const regional = (s.regional ?? {}) as { usNotice?: string; ousNotice?: string; apacNotice?: string };
  const branding = (s.branding ?? {}) as { logoUrl?: string };
  const navigation = navigationFrom(s.navigation);
  const notice = region === "us" ? regional.usNotice : region === "apac" ? regional.apacNotice : region === "ous" ? regional.ousNotice : undefined;
  const header: Parameters<typeof Header>[0] = { region, solutionsNav: nav, contact, logoUrl: branding.logoUrl, nav: navigation };
  const footer: Parameters<typeof Footer>[0] = { contact, social, region, regionalNotice: notice, nav: navigation };
  return { header, footer };
}
