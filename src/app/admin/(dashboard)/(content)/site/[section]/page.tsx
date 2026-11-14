import Link from "next/link";
import { notFound } from "next/navigation";
import { count } from "drizzle-orm";
import { contactSubmissions, db, solutions } from "@/db";
import { requireUser } from "@/lib/auth";
import { getAllSettings } from "@/lib/settings";
import { navigationFrom } from "@/lib/navigation";
import { REGION_CHOICES } from "@/lib/regions";
import { THERAPY_GROUPS } from "@/lib/therapy-groups";
import { DEMO, editorHref, withBase } from "@/lib/demo";
import { getResource } from "@/admin/resources";
import { getSettingsGroup, mayEditGroup } from "@/admin/settings";
import { listEditorPages, type PageCard } from "@/admin/pages-index";
import { sectionOf, SECTIONS } from "@/admin/site-sections";
import { LinkButton, PageHeader } from "@/components/admin/ui";

/** A section of the site: its pages, the lists they show, the settings they use (docs/screens/admin-sections.md). */

export function generateStaticParams() {
  return SECTIONS.map((s) => ({ section: s.key }));
}

const STATUS: Record<PageCard["status"], { text: string; cls: string }> = {
  live: { text: "Live", cls: "bg-emerald-100 text-emerald-800" },
  changed: { text: "Live, with unpublished changes", cls: "bg-amber-100 text-amber-900" },
  draft: { text: "Draft — not live yet", cls: "bg-neutral-200 text-neutral-700" },
};
const regionName = (r: string | null) => (r ? REGION_CHOICES.find((c) => c.region === r)?.label ?? r : "All regions");

function Status({ s }: { s: PageCard["status"] }) {
  return <span className={`rounded px-1.5 py-0.5 text-xs ${STATUS[s].cls}`}>{STATUS[s].text}</span>;
}

function PageRow({ c, label }: { c: PageCard; label?: string }) {
  return (
    <li className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 text-sm">
      <span className="min-w-0 flex-1">
        <span className="block font-medium">{label ?? c.title}</span>
        <span className="block text-xs text-neutral-500">{regionName(c.region)} · {c.path}</span>
      </span>
      <Status s={c.status} />
      <a href={editorHref(c.path)} className="font-medium underline">Edit on page ✎</a>
      <Link href={c.adminHref} className="text-xs underline">Page settings</Link>
    </li>
  );
}

function Box({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-neutral-500">{title}</h2>
      {children}
    </section>
  );
}

export default async function SectionPage({ params }: { params: Promise<{ section: string }> }) {
  const me = await requireUser();
  const { section } = await params;
  const s = sectionOf(section);
  if (!s) notFound();

  const needPages = !!s.sitePages || s.key === "therapies" || s.key === "other";
  const [cards, settings, sols] = await Promise.all([
    needPages ? listEditorPages() : Promise.resolve([] as PageCard[]),
    s.key === "other" ? getAllSettings() : Promise.resolve({} as Record<string, Record<string, unknown>>),
    s.key === "therapies" ? db.select({ id: solutions.id, slug: solutions.slug, region: solutions.region, group: solutions.therapyGroup, label: solutions.navLabel, sort: solutions.sortOrder }).from(solutions) : Promise.resolve([]),
  ]);
  const counts = new Map<string, number>();
  for (const l of s.lists ?? []) {
    const table = l.resource === "submissions" ? contactSubmissions : getResource(l.resource)?.table;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (table) counts.set(l.resource, ((await db.select({ n: count() }).from(table as any)) as { n: number }[])[0].n);
  }

  const sitePageCards = cards.filter((c) => c.r === "site-pages" && !!c.siteKey && !!s.sitePages?.includes(c.siteKey));
  const view = s.views?.[0]?.path ?? sitePageCards[0]?.path ?? null;

  // Other pages: legal (linked from the footer), the rest published, drafts
  const legalPaths = new Set(navigationFrom(settings.navigation).legal.map((l) => l.href));
  const textPages = cards.filter((c) => c.r === "pages");

  return (
    <>
      <PageHeader crumbs={[{ label: "Website", href: "/admin" }]} title={s.title} subtitle={s.intro} actions={view ? <a href={withBase(view)} target="_blank" rel="noreferrer" className="rounded border border-neutral-300 bg-white px-3 py-2 text-sm">View on the site ↗</a> : undefined} />

      {sitePageCards.length > 0 && (
        <Box title={s.key === "therapies" ? "Overview pages" : "Pages"}>
          <ul className="divide-y divide-neutral-100 rounded-lg border border-neutral-200 bg-white">
            {sitePageCards.map((c) => <PageRow key={c.adminHref} c={c} label={`${c.title}${c.region ? ` — ${regionName(c.region)}` : ""}`} />)}
          </ul>
        </Box>
      )}

      {s.key === "therapies" && (
        <Box title="Therapy pages in each region">
          <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 text-left text-xs text-neutral-500">
                <tr>
                  <th className="px-4 py-2 font-medium">Therapy</th>
                  {REGION_CHOICES.map((r) => <th key={r.region} className="px-4 py-2 font-medium">{r.label}</th>)}
                </tr>
              </thead>
              <tbody>
                {THERAPY_GROUPS.map((g) => {
                  const slugs = [...new Set(sols.filter((x) => x.group === g.value).sort((a, b) => a.sort - b.sort).map((x) => x.slug))];
                  if (!slugs.length) return null;
                  return [
                    <tr key={g.value} className="border-t border-neutral-100 bg-neutral-50/60"><td colSpan={4} className="px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-neutral-500">{g.label}</td></tr>,
                    ...slugs.map((slug) => (
                      <tr key={slug} className="border-t border-neutral-100">
                        <td className="px-4 py-2 font-medium">{sols.find((x) => x.slug === slug)?.label}</td>
                        {REGION_CHOICES.map((r) => {
                          const sol = sols.find((x) => x.slug === slug && x.region === r.region);
                          const c = sol ? cards.find((k) => k.r === "solutions" && k.id === sol.id) : undefined;
                          return (
                            <td key={r.region} className="px-4 py-2 align-top" data-cell={`${slug}:${r.region}`}>
                              {c ? (
                                <span className="flex flex-col items-start gap-1">
                                  <Status s={c.status} />
                                  <span className="flex gap-3 text-xs">
                                    <a href={editorHref(c.path)} className="font-medium underline">Edit on page ✎</a>
                                    <Link href={c.adminHref} className="underline">Settings</Link>
                                  </span>
                                </span>
                              ) : (
                                <span className="text-xs text-neutral-400">No version</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    )),
                  ];
                })}
              </tbody>
            </table>
          </div>
        </Box>
      )}

      {s.key === "other" && (
        <>
          {[
            { title: "Legal — linked from the footer", items: textPages.filter((c) => legalPaths.has(c.path)) },
            { title: "Studies and cases", items: textPages.filter((c) => !legalPaths.has(c.path) && c.status !== "draft") },
            { title: "Not on the site", items: textPages.filter((c) => !legalPaths.has(c.path) && c.status === "draft") },
          ].map((g) =>
            g.items.length ? (
              <Box key={g.title} title={g.title}>
                <ul className="divide-y divide-neutral-100 rounded-lg border border-neutral-200 bg-white">{g.items.map((c) => <PageRow key={c.adminHref} c={c} />)}</ul>
              </Box>
            ) : null,
          )}
          {!DEMO && <LinkButton href="/admin/editor?new=1" variant="primary">+ New page</LinkButton>}
        </>
      )}

      {s.views && (
        <Box title="On the site">
          <ul className="divide-y divide-neutral-100 rounded-lg border border-neutral-200 bg-white">
            {s.views.map((v) => (
              <li key={v.path} className="flex items-center gap-4 px-4 py-3 text-sm">
                <span className="flex-1"><span className="font-medium">{v.label}</span> <span className="text-xs text-neutral-500">{v.path}</span></span>
                <span className="text-xs text-neutral-500">Made from the list below</span>
                <a href={withBase(v.path)} target="_blank" rel="noreferrer" className="underline">View ↗</a>
              </li>
            ))}
          </ul>
        </Box>
      )}

      {s.lists && (
        <Box title="Lists on these pages">
          <ul className="divide-y divide-neutral-100 rounded-lg border border-neutral-200 bg-white">
            {s.lists.map((l) => (
              <li key={l.resource} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 text-sm">
                <span className="min-w-0 flex-1">
                  <Link href={`/admin/${l.resource}`} className="font-medium underline">{l.label}</Link>
                  <span className="ml-2 text-neutral-500">{counts.get(l.resource) ?? 0}</span>
                  <span className="block text-xs text-neutral-500">Shown on: {l.where}</span>
                </span>
                {l.newLabel && !DEMO && <LinkButton href={`/admin/${l.resource}/new`}>+ New {l.newLabel.toLowerCase()}</LinkButton>}
              </li>
            ))}
          </ul>
          {s.key === "careers" && counts.get("jobs") === 0 && <p className="mt-2 text-xs text-neutral-500">No open positions — the list is hidden on Careers.</p>}
        </Box>
      )}

      {s.settings && (
        <Box title="Settings used here">
          <ul className="divide-y divide-neutral-100 rounded-lg border border-neutral-200 bg-white">
            {s.settings.map((x) => {
              const g = getSettingsGroup(x.group);
              const may = g ? mayEditGroup(me, g) : false;
              return (
                <li key={x.group} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 text-sm">
                  <span className="min-w-0 flex-1">
                    {may ? <Link href={`/admin/settings?group=${x.group}`} className="font-medium underline">{x.label}</Link> : <span className="font-medium">{x.label}</span>}
                    <span className="block text-xs text-neutral-500">{x.where}</span>
                  </span>
                  {!may && <span className="text-xs text-neutral-500">{g?.pageLabels ? "Labels are edited right on the page; the rest — by a designer or an admin" : "A designer or an admin changes it"}</span>}
                </li>
              );
            })}
          </ul>
        </Box>
      )}
    </>
  );
}
