import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { Integrations } from "@/components/site/Integrations";
import { Tracking } from "@/components/site/Tracking";
import { MediaLightbox } from "@/components/site/MediaLightbox";
import { getRememberedRegion, getSuggestedRegion } from "@/lib/region-cookie";
import { RegionBanner } from "@/components/site/RegionBanner";
import { REGION_LABELS } from "@/lib/regions";
import { cookies } from "next/headers";
import { getAllSettings } from "@/lib/settings";
import { getSolutionsNav } from "@/lib/content";
import { draftMode } from "next/headers";
import { PreviewBanner } from "@/components/site/PreviewBanner";
import { EditorLoader } from "@/components/editor/EditorLoader";
import { isEditing } from "@/lib/editing";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [region, settings, dm, editing, suggested, jar] = await Promise.all([getRememberedRegion(), getAllSettings(), draftMode(), isEditing(), getSuggestedRegion(), cookies()]);
  const showSuggestion = !!suggested && suggested !== region && jar.get("rm_geo_dismissed")?.value !== "1";
  const nav = region ? await getSolutionsNav(region) : [];
  const contact = (settings.contact ?? {}) as { phoneHq?: string; phoneUs?: string; email?: string };
  const social = (settings.social ?? {}) as { x?: string; linkedin?: string; instagram?: string; youtube?: string };
  const regional = (settings.regional ?? {}) as { usNotice?: string; ousNotice?: string; apacNotice?: string };
  const branding = (settings.branding ?? {}) as { logoUrl?: string };
  const integrations = (settings.integrations ?? {}) as { gaMeasurementId?: string; userwayAccount?: string };
  const notice = region === "us" ? regional.usNotice : region === "apac" ? regional.apacNotice : region === "ous" ? regional.ousNotice : undefined;

  return (
    <>
      {dm.isEnabled && !editing && <PreviewBanner />}
      {showSuggestion && suggested && <RegionBanner suggested={suggested} label={REGION_LABELS[suggested]} href={`/${suggested}/therapies`} />}
      <Header region={region} solutionsNav={nav} contact={contact} logoUrl={branding.logoUrl} />
      <div className="flex-1">{children}</div>
      <Footer contact={contact} social={social} region={region} regionalNotice={notice} />
      {editing ? <EditorLoader /> : (<><Integrations gaMeasurementId={integrations.gaMeasurementId} userwayAccount={integrations.userwayAccount} /><Tracking /><MediaLightbox /></>)}
    </>
  );
}
