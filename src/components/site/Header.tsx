import Link from "next/link";
import type { Region } from "@/db/schema";
import { REGION_SHORT } from "@/lib/regions";

export type NavSolution = { slug: string; navLabel: string };

export function Header({
  region,
  solutionsNav,
  contact,
}: {
  region: Region | null;
  solutionsNav: NavSolution[];
  contact: { phoneHq?: string; phoneUs?: string; email?: string };
}) {
  const therapiesHref = region ? `/${region}/therapies` : "/choose-your-location";
  const evidenceHref = region ? `/${region}/evidence` : "/choose-your-location?next=evidence";

  return (
    <header className="border-b border-border bg-background">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-4 py-4">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          Rapid Medical<span className="align-super text-[0.6em]">™</span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm md:flex" aria-label="Main">
          <Link href="/">Welcome</Link>
          <div className="group relative">
            <Link href={therapiesHref} className="inline-flex items-center gap-1">
              Our Therapies <span aria-hidden>▾</span>
            </Link>
            {solutionsNav.length > 0 && region && (
              <div className="invisible absolute left-0 top-full z-20 min-w-48 rounded border border-border bg-background p-2 opacity-0 shadow-md transition group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
                {solutionsNav.map((s) => (
                  <Link key={s.slug} href={`/${region}/therapies/${s.slug}`} className="block rounded px-3 py-1.5 hover:bg-surface">
                    {s.navLabel}
                  </Link>
                ))}
              </div>
            )}
          </div>
          <Link href={evidenceHref}>Evidence</Link>
          <Link href="/news-events">News &amp; Events</Link>
          <Link href="/about-us">About Us</Link>
          <Link href="/careers">Careers</Link>
        </nav>

        <div className="flex items-center gap-3 text-sm">
          <Link href="/choose-your-location" className="rounded border border-border px-2 py-1 text-xs" title="Choose your location">
            {region ? REGION_SHORT[region] : "Region"}
          </Link>
          <Link href={region ? `/contact-us?region=${region}` : "/contact-us"} className="rounded bg-accent px-3 py-1.5 text-accent-foreground">
            Contact Us
          </Link>
        </div>
      </div>

      {/* Mobile nav – plain links; replace with a drawer when design lands */}
      <nav className="flex gap-4 overflow-x-auto border-t border-border px-4 py-2 text-sm md:hidden" aria-label="Mobile">
        <Link href={therapiesHref}>Therapies</Link>
        <Link href={evidenceHref}>Evidence</Link>
        <Link href="/news-events">News</Link>
        <Link href="/about-us">About</Link>
        <Link href="/careers">Careers</Link>
        {contact.email && <a href={`mailto:${contact.email}`}>{contact.email}</a>}
      </nav>
    </header>
  );
}
