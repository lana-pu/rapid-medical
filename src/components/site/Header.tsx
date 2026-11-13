import Link from "next/link";
import type { Region } from "@/db/schema";
import { groupTherapies } from "@/lib/therapy-groups";
import { RegionSwitcher } from "./RegionSwitcher";
import { E } from "./editable";
import { menuHref, type Navigation } from "@/lib/navigation";

/** Labels of the menu are edited right on the page (settings group `navigation`, docs/screens/menu-footer.md). */
const NAV = "settings:navigation";

export type NavSolution = { slug: string; navLabel: string; therapyGroup?: string | null };

export function Header({
  region,
  solutionsNav,
  contact,
  logoUrl,
  nav,
}: {
  region: Region | null;
  solutionsNav: NavSolution[];
  contact: { phoneHq?: string; phoneUs?: string; email?: string };
  logoUrl?: string | null;
  nav: Navigation;
}) {
  // No region only when the IP country is unknown: then the menu goes through the location chooser (decision 2026-11-10).

  return (
    <header className="border-b border-border bg-background">
      {/* Top bar: "Get in touch" + region + contact (Duda header strip) */}
      <div className="border-b border-border bg-surface text-xs">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-1.5">
          <div className="flex items-center gap-4 text-muted">
            <span className="font-medium text-foreground">Get in touch</span>
            {/* on a phone one number fits: the visitor's own — US in the Americas, HQ elsewhere (usability pass 2026-11-13) */}
            {contact.phoneHq && <a href={`tel:${contact.phoneHq}`} className={`whitespace-nowrap ${region === "us" && contact.phoneUs ? "hidden sm:inline" : ""}`}>HQ: {contact.phoneHq}</a>}
            {contact.phoneUs && <a href={`tel:${contact.phoneUs}`} className={`whitespace-nowrap ${region === "us" ? "" : "hidden sm:inline"}`}>US: {contact.phoneUs}</a>}
            {contact.email && <a href={`mailto:${contact.email}`} className="hidden md:inline">{contact.email}</a>}
          </div>
          <RegionSwitcher region={region} />
        </div>
      </div>

      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-4 py-4">
        <Link href="/" className="flex items-center" aria-label="Rapid Medical – home">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt="Rapid Medical" className="h-8 w-auto" />
          ) : (
            <span className="text-lg font-semibold tracking-tight">Rapid Medical<span className="align-super text-[0.6em]">™</span></span>
          )}
        </Link>

        <nav className="hidden items-center gap-6 text-sm md:flex" aria-label="Main">
          {nav.menu.map((m, i) =>
            m.kind !== "therapies" ? (
              <Link key={i} href={menuHref(m, region)}>{m.path ? <E r={NAV} f={`${m.path}.label`}>{m.label}</E> : m.label}</Link>
            ) : (
          <div key={i} className="group relative">
            <Link href={menuHref(m, region)} className="inline-flex items-center gap-1">
              {m.path ? <E r={NAV} f={`${m.path}.label`}>{m.label}</E> : m.label} <span aria-hidden>▾</span>
            </Link>
            {solutionsNav.length > 0 && region && (
              <div className="invisible absolute left-0 top-full z-20 min-w-56 rounded border border-border bg-background p-2 opacity-0 shadow-md transition group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
                {groupTherapies(solutionsNav).map((g) => (
                  <div key={g.value} className="py-1">
                    {g.label && <div className="px-3 pb-1 text-xs font-semibold uppercase tracking-widest text-muted">{g.label}</div>}
                    {g.items.map((s) => (
                      <Link key={s.slug} href={`/${region}/therapies/${s.slug}`} className="block rounded px-3 py-1.5 hover:bg-surface">
                        {s.navLabel}
                      </Link>
                    ))}
                  </div>
                ))}
                <Link href={`/${region}/therapies`} className="mt-1 block rounded border-t border-border px-3 py-2 hover:bg-surface">
                  All therapies →
                </Link>
              </div>
            )}
          </div>
            ),
          )}
        </nav>

        <Link href={region ? `/contact-us?region=${region}` : "/contact-us"} className="rounded bg-accent px-3 py-1.5 text-sm text-accent-foreground">
          <E r={NAV} f="contactLabel">{nav.contactLabel}</E>
        </Link>
      </div>

      {/* Mobile nav – plain links; replace with a drawer when design lands */}
      <nav className="flex gap-4 overflow-x-auto border-t border-border px-4 py-2 text-sm md:hidden" aria-label="Mobile">
        {nav.menu.filter((m) => menuHref(m, region) !== "/").map((m, i) => (
          <Link key={i} href={menuHref(m, region)}>{m.label}</Link>
        ))}
      </nav>
    </header>
  );
}
