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
import { getFeaturedNews, getSolutionsNav } from "@/lib/content";
import { NewsBar } from "@/components/site/NewsBar";
import { materialPaths } from "@/lib/material";
import { draftMode } from "next/headers";
import { PreviewBanner } from "@/components/site/PreviewBanner";
import { EditorLoader } from "@/components/editor/EditorLoader";
import { isEditing } from "@/lib/editing";
import { navigationFrom } from "@/lib/navigation";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [region, settings, dm, editing, suggested, jar] = await Promise.all([getRememberedRegion(), getAllSettings(), draftMode(), isEditing(), getSuggestedRegion(), cookies()]);
  const viewing = await viewingVersion();
  const showSuggestion = !!suggested && suggested !== region && jar.get("rm_geo_dismissed")?.value !== "1";
  const nav = region ? await getSolutionsNav(region) : [];
  const contact = (settings.contact ?? {}) as { phoneHq?: string; phoneUs?: string; email?: string };
  const social = (settings.social ?? {}) as { x?: string; linkedin?: string; instagram?: string; youtube?: string };
  const regional = (settings.regional ?? {}) as { usNotice?: string; ousNotice?: string; apacNotice?: string };
  const branding = (settings.branding ?? {}) as { logoUrl?: string };
  const integrations = (settings.integrations ?? {}) as { gaMeasurementId?: string; userwayAccount?: string };
  const navigation = navigationFrom(settings.navigation);
  // Site settings → News bar: the newest highlight above the header of Home (loaded only when switched on)
  const bar = (settings.newsBar as { enabled?: boolean } | undefined)?.enabled ? (await getFeaturedNews(1)).find((n) => n.featured) : undefined;
  const barHref = bar ? materialPaths(bar)[0] ?? bar.url : null;
  const notice = region === "us" ? regional.usNotice : region === "apac" ? regional.apacNotice : region === "ous" ? regional.ousNotice : undefined;

  return (
    <>
      <VersionBanner />
      {dm.isEnabled && !editing && !viewing && <PreviewBanner />}
      {showSuggestion && suggested && <RegionBanner suggested={suggested} label={REGION_LABELS[suggested]} href={`/${suggested}/therapies`} />}
      {bar && barHref && <NewsBar title={bar.title} href={barHref} />}
      <Header region={region} solutionsNav={nav} contact={contact} logoUrl={branding.logoUrl} nav={navigation} />
      <div className="flex-1">{children}</div>
      <Footer contact={contact} social={social} region={region} regionalNotice={notice} nav={navigation} />
      <RegionMemory />
      <RegionModal region={region} source={region ? regionSource(region, suggested, jar.get("rm_region_chosen")?.value) : null} />
      {editing ? <EditorLoader /> : (<><Integrations gaMeasurementId={integrations.gaMeasurementId} userwayAccount={integrations.userwayAccount} /><Tracking /><MediaLightbox /></>)}
    </>
  );
}
