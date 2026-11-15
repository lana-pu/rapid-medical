import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { REGION_CHOICES, REGIONS } from "@/lib/regions";
import { DEMO, editorHref, withBase } from "@/lib/demo";
import { pageScreen } from "@/admin/site-tree";
import { PageTabs } from "@/components/admin/PageTabs";

/** One page of the site: its versions by region and the collections it shows, as cards (docs/screens/admin-sections.md). */

/** Status in words a non-technical person reads at a glance (docs/admin-ia.md → «Уточнения 2026-11-15»). */
const STATUS = {
  live: { text: "On the site", hint: "Visitors see the latest version.", cls: "bg-emerald-50 text-emerald-800", dot: "bg-emerald-500" },
  changed: { text: "Changes not published yet", hint: "Edits wait for Publish.", cls: "bg-amber-50 text-amber-900", dot: "bg-amber-500" },
  draft: { text: "Not on the site yet", hint: "A draft — publish it to show it.", cls: "bg-neutral-100 text-neutral-700", dot: "bg-neutral-400" },
} as const;

const ago = (d: Date | string) => {
  const s = Math.round((new Date(d).getTime() - Date.now()) / 1000);
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  for (const [u, n] of [["day", 86400], ["hour", 3600], ["minute", 60]] as const) if (Math.abs(s) >= n) return rtf.format(Math.round(s / n), u);
  return "just now";
};
const regionName = (r: string | null) => (r ? (REGION_CHOICES.find((c) => c.region === r)?.label ?? r) : "All regions");

export default async function SitePage({ params }: { params: Promise<{ key?: string[] }> }) {
  await requireUser();
  const { key: parts } = await params;
  const key = parts?.length ? `/${parts.join("/")}` : "/";
  const data = await pageScreen(key);
  if (!data) notFound();
  const { node, cards, collections } = data;
  const regional = node.versions.some((v) => v.region);
  const rows = regional ? REGIONS.map((r) => ({ region: r as string | null, v: node.versions.find((x) => x.region === r) })) : [{ region: null, v: node.versions[0] }];

  return (
    <>
      <PageTabs
        pageKey={key}
        active="overview"
        actions={<a href={withBase((rows.find((x) => x.v)?.v ?? node.versions[0]).path)} target="_blank" rel="noreferrer" className="inline-flex items-center rounded border border-neutral-300 bg-white px-3 py-2 text-sm font-medium text-neutral-800 hover:bg-neutral-100">View on the site ↗</a>}
      />
      {node.fieldsOnly && <p className="-mt-3 mb-6 text-sm text-neutral-500">Its texts are edited on the page, its items in the collections below.</p>}

      <section aria-label="Regions" className="mb-10">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-neutral-500">{regional ? "In each region" : "The page"}</h2>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {rows.map(({ region, v }) => {
            const card = v ? cards.find((c) => c.r === v.r && c.id === v.id) : undefined;
            if (!v)
              return (
                <div key={region ?? "all"} className="rounded-xl border border-dashed border-neutral-300 p-5 text-neutral-500">
                  <div className="text-base font-semibold text-neutral-700">{regionName(region)}</div>
                  <p className="mt-2 text-sm">No version in this region — visitors there do not see this page.</p>
                </div>
              );
            const st = STATUS[v.status];
            return (
              <article key={region ?? "all"} aria-label={regionName(region)} className="flex flex-col rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <div className="text-base font-semibold">{regionName(region)}</div>
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs ${st.cls}`}><span aria-hidden className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />{st.text}</span>
                </div>
                <p className="mt-2 text-sm text-neutral-500">
                  {card?.changedBy ? `Edited by ${card.changedBy}${card.changedAt ? `, ${ago(card.changedAt)}` : ""}` : st.hint}
                </p>
                <div className="mt-auto flex flex-wrap items-center gap-3 pt-5">
                  <a href={editorHref(v.path)} className="rounded-lg bg-neutral-900 px-3.5 py-2 text-sm font-medium text-white hover:bg-neutral-700">Edit on page</a>
                  {card && !DEMO && <Link href={card.adminHref} className="text-sm underline decoration-neutral-300 hover:decoration-neutral-900">Google &amp; address</Link>}
                  <a href={withBase(v.path)} target="_blank" rel="noreferrer" className="text-sm underline decoration-neutral-300 hover:decoration-neutral-900">View ↗</a>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {collections.length > 0 && (
        <section aria-label="Collections on this page" className="mb-10">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-neutral-500">Collections shown on this page</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {collections.map((c) => (
              <article key={c.res} aria-label={c.title} className="flex flex-col rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <span aria-hidden className="flex h-9 w-9 items-center justify-center rounded-lg bg-neutral-100 text-neutral-500">▤</span>
                  <div>
                    <div className="font-semibold">{c.title}</div>
                    <div className="text-xs text-neutral-500">{c.count} {c.count === 1 ? "record" : "records"}</div>
                  </div>
                </div>
                <p className="mt-3 text-sm text-neutral-600">{c.where}</p>
                <div className="mt-auto flex flex-wrap items-center gap-3 pt-5">
                  <Link href={`/admin/${c.res}`} className="rounded-lg border border-neutral-300 px-3.5 py-2 text-sm font-medium hover:bg-neutral-50">Open {c.title.toLowerCase()}</Link>
                  <Link href={`/admin/${c.res}/new`} className="text-sm underline decoration-neutral-300 hover:decoration-neutral-900">+ New {c.newLabel.toLowerCase()}</Link>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
