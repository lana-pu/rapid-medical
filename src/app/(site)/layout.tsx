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
import { getAllSettings } from "@/lib/settings";
import { getFeaturedNews } from "@/lib/content";
import { NewsBar } from "@/components/site/NewsBar";
import { materialPaths } from "@/lib/material";
import { draftMode } from "next/headers";
import { PreviewBanner } from "@/components/site/PreviewBanner";
import { EditorLoader } from "@/components/editor/EditorLoader";
import { isEditing } from "@/lib/editing";
import { siteChrome } from "@/components/site/chrome";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [region, settings, dm, editing, suggested, jar] = await Promise.all([getRememberedRegion(), getAllSettings(), draftMode(), isEditing(), getSuggestedRegion(), cookies()]);
  const viewing = await viewingVersion();
  const showSuggestion = !!suggested && suggested !== region && jar.get("rm_geo_dismissed")?.value !== "1";
  const chrome = await siteChrome(region, settings);
  const integrations = (settings.integrations ?? {}) as { gaMeasurementId?: string; userwayAccount?: string };
  // Site settings → News bar: the newest highlight above the header of Home (loaded only when switched on)
  const bar = (settings.newsBar as { enabled?: boolean } | undefined)?.enabled ? (await getFeaturedNews(1)).find((n) => n.featured) : undefined;
  const barHref = bar ? materialPaths(bar)[0] ?? bar.url : null;

  return (
    <>
      <VersionBanner />
      {dm.isEnabled && !editing && !viewing && <PreviewBanner />}
      {showSuggestion && suggested && <RegionBanner suggested={suggested} label={REGION_LABELS[suggested]} href={`/${suggested}/therapies`} />}
      {bar && barHref && <NewsBar title={bar.title} href={barHref} />}
      <Header {...chrome.header} />
      <div className="flex-1">{children}</div>
      <Footer {...chrome.footer} />
      <RegionMemory />
      <RegionModal region={region} source={region ? regionSource(region, suggested, jar.get("rm_region_chosen")?.value) : null} />
      {editing ? <EditorLoader /> : (<><Integrations gaMeasurementId={integrations.gaMeasurementId} userwayAccount={integrations.userwayAccount} /><Tracking /><MediaLightbox /></>)}
    </>
  );
}
