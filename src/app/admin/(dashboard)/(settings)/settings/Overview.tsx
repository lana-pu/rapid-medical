import Link from "next/link";
import { count, eq, isNull } from "drizzle-orm";
import { db, notFoundLog, users } from "@/db";
import { canDesign, type SessionUser } from "@/lib/auth";
import { seoPages } from "@/admin/seo";

/**
 * Settings → Overview (docs/screens/admin-settings.md → «Обзор Settings», «Иерархия» 2026-11-27): the groups as rows
 * in a few blocks — what each changes and where it shows on the site, and what needs doing. Admin chrome palette.
 */

type Block = { href: string; title: string; text: string; icon: React.ReactNode; note?: string };

const I = (d: React.ReactNode) => (
  <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">{d}</svg>
);
const ICON = {
  contact: I(<><path d="M4 5h16v14H4z" /><path d="m4 7 8 6 8-6" /></>),
  social: I(<><circle cx="6" cy="12" r="2.5" /><circle cx="18" cy="6" r="2.5" /><circle cx="18" cy="18" r="2.5" /><path d="m8.2 10.8 7.6-3.6M8.2 13.2l7.6 3.6" /></>),
  region: I(<><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" /></>),
  google: I(<><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>),
  links: I(<><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" /><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" /></>),
  brand: I(<><path d="M12 3a9 9 0 1 0 0 18c1 0 1.5-.8 1.5-1.6 0-1.4-1.2-1.4-1.2-2.6 0-1 .8-1.8 1.8-1.8H17a4 4 0 0 0 4-4C21 6.6 17 3 12 3z" /><circle cx="7.5" cy="11" r="1" /><circle cx="10" cy="7" r="1" /><circle cx="15" cy="7.5" r="1" /></>),
  people: I(<><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20a6.5 6.5 0 0 1 13 0" /><path d="M16 4.5a3.5 3.5 0 0 1 0 7M21.5 20a6.5 6.5 0 0 0-4-6" /></>),
  activity: I(<><path d="M3 12h4l3-8 4 16 3-8h4" /></>),
  requests: I(<><path d="M4 6h16v12H4z" /><path d="m4 8 8 5 8-5" /><path d="M15 3h6v6" /><path d="m21 3-6 6" /></>),
  plug: I(<><path d="M9 2v6M15 2v6M6 8h12v4a6 6 0 0 1-12 0z" /><path d="M12 18v4" /></>),
  you: I(<><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>),
};

export async function SettingsOverview({ user }: { user: SessionUser }) {
  const admin = user.role === "admin";
  const [seo, [{ n: broken }], people] = await Promise.all([
    seoPages(),
    db.select({ n: count() }).from(notFoundLog).where(isNull(notFoundLog.resolvedAt)),
    admin ? db.select({ totp: users.totpEnabledAt }).from(users).where(eq(users.active, true)) : Promise.resolve([] as { totp: Date | null }[]),
  ]);
  const no2fa = people.filter((p) => !p.totp).length;
  // pages, the same number as «Only problems» in Google & sharing (docs/screens/admin-seo.md)
  const seoProblems = seo.filter((p) => p.problems).length;

  const groups: { title: string; blocks: Block[] }[] = [
    {
      title: "On the site",
      blocks: [
        { href: "/admin/settings?group=contact", title: "Contact details", text: "Phones, emails and offices — in the footer and on Contact Us", icon: ICON.contact },
        { href: "/admin/settings?group=social", title: "Social links", text: "The LinkedIn, X, Instagram and YouTube icons in the footer", icon: ICON.social },
        { href: "/admin/settings?group=regional", title: "Regional notices", text: "The region chooser and the note under each region's pages", icon: ICON.region },
      ],
    },
    { title: "Requests", blocks: [{ href: "/admin/settings?group=requests", title: "Where requests go", text: "Which mailbox gets each kind of request from the site's forms", icon: ICON.requests }] },
    {
      title: "Search & sharing",
      blocks: [
        { href: "/admin/seo", title: "Google & sharing", text: "How every page looks in Google", icon: ICON.google, note: seoProblems ? `${seoProblems} page${seoProblems > 1 ? "s" : ""} to look at` : undefined },
        ...(admin ? [{ href: "/admin/not-found-log", title: "Old links", text: "Addresses that lead nowhere, and where old addresses send visitors", icon: ICON.links, note: broken ? `${broken} broken link${broken > 1 ? "s" : ""} visitors hit` : undefined }] : []),
      ],
    },
    {
      title: "Look & connections",
      blocks: [
        ...(canDesign(user) ? [{ href: "/admin/settings?group=branding", title: "Branding", text: "Logo, the picture for shared links, the browser tab icon", icon: ICON.brand }] : []),
        ...(admin ? [{ href: "/admin/settings?group=integrations", title: "Integrations", text: "Google Analytics, the accessibility widget, region suggestions", icon: ICON.plug }] : []),
      ],
    },
    {
      title: "Team & you",
      blocks: [
        ...(admin ? [{ href: "/admin/users", title: "People and roles", text: "Who can sign in and what each can do", icon: ICON.people, note: no2fa ? `${no2fa} without two-step sign-in` : undefined }] : []),
        { href: "/admin/activity", title: "Activity log", text: "What the team changed, and when", icon: ICON.activity },
        { href: "/admin/account", title: "My account & security", text: "Your password, two-step sign-in and where you are signed in", icon: ICON.you },
      ],
    },
  ].filter((g) => g.blocks.length);

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-semibold text-neutral-900">Settings</h1>
      <p className="mt-1 text-sm text-neutral-600">What the whole site shares, and the team. Changed rarely.</p>
      <div className="mt-6 space-y-5">
        {groups.map((g) => (
          <section key={g.title} aria-label={g.title}>
            <h2 className="mb-2 text-sm font-semibold text-neutral-600">{g.title}</h2>
            <ul className="divide-y divide-neutral-100 rounded-lg border border-neutral-200 bg-white">
              {g.blocks.map((b) => (
                <li key={b.href}>
                  <Link href={b.href} className="group flex items-center gap-3 px-4 py-3 hover:bg-neutral-50">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-neutral-700">{b.icon}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium text-neutral-900">{b.title}</span>
                      <span className="block text-sm text-neutral-600">{b.text}</span>
                    </span>
                    {b.note && <span className="hidden shrink-0 items-center gap-1.5 rounded-full bg-amber-50 px-2 py-0.5 text-xs text-amber-900 sm:inline-flex"><span aria-hidden className="h-1.5 w-1.5 rounded-full bg-amber-500" />{b.note}</span>}
                    <span aria-hidden className="text-neutral-400 group-hover:text-neutral-900">›</span>
                  </Link>
                  {/* on a phone the note goes under the row's text, not squeezed beside it */}
                  {b.note && <span className="-mt-2 mb-3 ml-[3.75rem] inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2 py-0.5 text-xs text-amber-900 sm:hidden"><span aria-hidden className="h-1.5 w-1.5 rounded-full bg-amber-500" />{b.note}</span>}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
