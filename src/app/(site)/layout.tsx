import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { getRememberedRegion } from "@/lib/region-cookie";
import { getAllSettings } from "@/lib/settings";
import { getSolutionsNav } from "@/lib/content";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [region, settings] = await Promise.all([getRememberedRegion(), getAllSettings()]);
  const nav = region ? await getSolutionsNav(region) : [];
  const contact = (settings.contact ?? {}) as { phoneHq?: string; phoneUs?: string; email?: string };
  const social = (settings.social ?? {}) as { x?: string; linkedin?: string; instagram?: string; youtube?: string };
  const regional = (settings.regional ?? {}) as { usNotice?: string; ousNotice?: string };

  return (
    <>
      <Header region={region} solutionsNav={nav} contact={contact} />
      <div className="flex-1">{children}</div>
      <Footer contact={contact} social={social} region={region} regionalNotice={region === "us" ? regional.usNotice : regional.ousNotice} />
    </>
  );
}
