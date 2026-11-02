import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { Integrations } from "@/components/site/Integrations";
import { getRememberedRegion } from "@/lib/region-cookie";
import { getAllSettings } from "@/lib/settings";
import { getSolutionsNav } from "@/lib/content";
import { draftMode } from "next/headers";
import { PreviewBanner } from "@/components/site/PreviewBanner";
import { EditorLoader } from "@/components/editor/EditorLoader";
import { isEditing } from "@/lib/editing";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [region, settings, dm, editing] = await Promise.all([getRememberedRegion(), getAllSettings(), draftMode(), isEditing()]);
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
      <Header region={region} solutionsNav={nav} contact={contact} logoUrl={branding.logoUrl} />
      <div className="flex-1">{children}</div>
      <Footer contact={contact} social={social} region={region} regionalNotice={notice} />
      {editing ? <EditorLoader /> : <Integrations gaMeasurementId={integrations.gaMeasurementId} userwayAccount={integrations.userwayAccount} />}
    </>
  );
}
