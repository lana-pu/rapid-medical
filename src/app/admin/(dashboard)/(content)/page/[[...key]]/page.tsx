import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { REGION_CHOICES, REGIONS } from "@/lib/regions";
import { DEMO, editorHref, withBase } from "@/lib/demo";
import { adminPageHref, pageScreen } from "@/admin/site-tree";
import { listEditorPages } from "@/admin/pages-index";
import { buildPageTree, type PageNode } from "@/admin/page-tree";
import { LinkButton, formatDate } from "@/components/admin/ui";
import { PageTabs } from "@/components/admin/PageTabs";

/** One page of the site: its regions, the collections it shows, the pages under it (docs/screens/admin-sections.md). */

export async function generateStaticParams() {
  // the demo export needs every page of the tree
  const keys: string[] = [];
  const walk = (ns: PageNode[]) => ns.forEach((n) => { if (n.versions.length) keys.push(n.key); walk(n.children); });
  walk(buildPageTree(await listEditorPages()));
  return keys.map((k) => ({ key: k === "/" ? [] : k.slice(1).split("/") }));
}

const STATUS = {
  live: { text: "Live", cls: "bg-emerald-100 text-emerald-800" },
  changed: { text: "Live, with unpublished changes", cls: "bg-amber-100 text-amber-900" },
  draft: { text: "Draft — not live yet", cls: "bg-neutral-200 text-neutral-700" },
} as const;
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

      <section aria-label="Regions" className="mb-8">
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">{regional ? "Regions" : "Page"}</h2>
        <div className="divide-y divide-neutral-100 rounded-lg border border-neutral-200 bg-white">
          {rows.map(({ region, v }) => {
            const card = v ? cards.find((c) => c.r === v.r && c.id === v.id) : undefined;
            return (
              <div key={region ?? "all"} className="flex flex-wrap items-center gap-3 px-4 py-3 text-sm">
                <span className="w-44 font-medium">{regionName(region)}</span>
                {!v ? (
                  <span className="text-neutral-400">No version in this region</span>
                ) : (
                  <>
                    <span className={`rounded px-1.5 py-0.5 text-xs ${STATUS[v.status].cls}`}>{STATUS[v.status].text}</span>
                    {card?.changedBy && <span className="text-xs text-neutral-500">{card.changedBy}{card.changedAt ? `, ${formatDate(card.changedAt, { dateStyle: "medium", timeStyle: "short" })}` : ""}</span>}
                    <span className="flex-1" />
                    <a href={editorHref(v.path)} className="font-medium underline">Edit on page ✎</a>
                    {card && !DEMO && <Link href={card.adminHref} className="text-xs underline">Google &amp; address</Link>}
                    {card && <Link href={`${card.adminHref}/history`} className="text-xs underline">History</Link>}
                    <a href={withBase(v.path)} target="_blank" rel="noreferrer" className="text-xs underline">View ↗</a>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {collections.length > 0 && (
        <section aria-label="Collections on this page" className="mb-8">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">Collections on this page</h2>
          <div className="divide-y divide-neutral-100 rounded-lg border border-neutral-200 bg-white">
            {collections.map((c) => (
              <div key={c.res} className="flex flex-wrap items-center gap-3 px-4 py-3 text-sm">
                <span aria-hidden className="text-neutral-400">▤</span>
                <Link href={`/admin/${c.res}`} className="font-medium underline">{c.title}</Link>
                <span className="text-neutral-500">{c.count}</span>
                <span className="min-w-0 flex-1 truncate text-xs text-neutral-500">{c.where}</span>
                <LinkButton href={`/admin/${c.res}/new`} variant="secondary">+ New {c.newLabel.toLowerCase()}</LinkButton>
              </div>
            ))}
          </div>
        </section>
      )}

      {node.children.length > 0 && (
        <section aria-label="Pages under it">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">Pages under it</h2>
          <table className="w-full overflow-hidden rounded-lg border border-neutral-200 bg-white text-sm">
            {regional && (
              <thead className="bg-neutral-50 text-left text-xs text-neutral-500">
                <tr>
                  <th className="px-4 py-2 font-medium">Page</th>
                  {REGIONS.map((r) => <th key={r} className="px-4 py-2 font-medium">{regionName(r)}</th>)}
                </tr>
              </thead>
            )}
            <tbody className="divide-y divide-neutral-100">
              {node.children.map((c) => (
                <tr key={c.key}>
                  <td className="px-4 py-2.5"><Link href={adminPageHref(c.key)} className="font-medium underline decoration-neutral-300 hover:decoration-neutral-900">{c.title}</Link></td>
                  {regional ? (
                    REGIONS.map((r) => {
                      const v = c.versions.find((x) => x.region === r) ?? c.versions.find((x) => x.region === null);
                      return (
                        <td key={r} className="px-4 py-2.5 text-xs" data-cell={`${c.key}:${r}`}>
                          {v ? <a href={editorHref(v.path)} className="inline-flex items-center gap-1.5 underline decoration-neutral-300 hover:decoration-neutral-900"><span className={`rounded px-1.5 py-0.5 ${STATUS[v.status].cls}`}>{STATUS[v.status].text.split(",")[0]}</span>Edit ✎</a> : <span className="text-neutral-400">No version</span>}
                        </td>
                      );
                    })
                  ) : (
                    <td className="px-4 py-2.5 text-right text-xs text-neutral-500">{c.versions.filter((v) => v.region).map((v) => regionName(v.region)).join(" · ") || "All regions"}</td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </>
  );
}
