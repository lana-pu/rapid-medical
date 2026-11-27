import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { Integrations } from "@/components/site/Integrations";
import { Tracking } from "@/components/site/Tracking";
import { MediaLightbox } from "@/components/site/MediaLightbox";
import { getRememberedRegion, getSuggestedRegion, regionSource } from "@/lib/region-cookie";
import { RegionModal } from "@/components/site/RegionModal";
import { RegionBanner } from "@/components/site/RegionBanner";
import { RegionMemory } from "@/components/site/RegionMemory";
import { VersionBanner } from "@/components/site/VersionBanner";
import { viewingVersion } from "@/lib/version";
import { REGION_LABELS } from "@/lib/regions";
import { cookies } from "next/headers";
import type { Metadata } from "next";
import { getAllSettings, getSetting } from "@/lib/settings";
import { draftMode } from "next/headers";
import { PreviewBanner } from "@/components/site/PreviewBanner";
import { EditorLoader } from "@/components/editor/EditorLoader";
import { isEditing } from "@/lib/editing";
import { siteChrome } from "@/components/site/chrome";

/**
 * Branding → the picture shown when a page is shared and the browser tab icon (docs/screens/admin-settings.md, connected
 * 2026-11-27): empty — the standard files in public/. A page with its own picture (a therapy) keeps it.
 */
export async function generateMetadata(): Promise<Metadata> {
  const b = await getSetting<{ ogImageUrl?: string; faviconUrl?: string }>("branding");
  const og = b.ogImageUrl?.trim() || "/og-image.jpg";
  return {
    openGraph: { type: "website", siteName: "Rapid Medical™", images: [og] },
    twitter: { card: "summary", images: [og] },
    icons: { icon: b.faviconUrl?.trim() || "/favicon.ico" },
  };
}

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [region, settings, dm, editing, suggested, jar] = await Promise.all([getRememberedRegion(), getAllSettings(), draftMode(), isEditing(), getSuggestedRegion(), cookies()]);
  const viewing = await viewingVersion();
  // Integrations → «Suggest region by visitor country»: off — no banner; never saved — on (docs/screens/admin-settings.md)
  const geoSuggest = (settings.integrations as { geoSuggest?: boolean } | undefined)?.geoSuggest !== false;
  const showSuggestion = geoSuggest && !!suggested && suggested !== region && jar.get("rm_geo_dismissed")?.value !== "1";
  const chrome = await siteChrome(region, settings);
  const integrations = (settings.integrations ?? {}) as { gaMeasurementId?: string; userwayAccount?: string };

  return (
    <>
      <VersionBanner />
      {dm.isEnabled && !editing && !viewing && <PreviewBanner />}
      {showSuggestion && suggested && <RegionBanner suggested={suggested} label={REGION_LABELS[suggested]} href={`/${suggested}/therapies`} />}
      <Header {...chrome.header} />
      <div className="flex-1">{children}</div>
      <Footer {...chrome.footer} />
      <RegionMemory />
      <RegionModal region={region} source={region ? regionSource(region, suggested, jar.get("rm_region_chosen")?.value) : null} />
      {editing ? <EditorLoader /> : (<><Integrations gaMeasurementId={integrations.gaMeasurementId} userwayAccount={integrations.userwayAccount} /><Tracking /><MediaLightbox /></>)}
    </>
  );
}
