import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { REGION_CHOICES, REGIONS } from "@/lib/regions";
import { DEMO, editorHref, withBase } from "@/lib/demo";
import { adminPageHref, pageScreen } from "@/admin/site-tree";
import { pageDetails } from "@/admin/page-screen";
import { duplicateResource, publishResource } from "@/admin/actions";
import { Crumbs, Notice } from "@/components/admin/ui";
import { CopyPostLink } from "@/components/admin/CopyPostLink";

/**
 * One page of the site on one screen (docs/screens/admin-sections.md → «Экран страницы», docs/admin-page-screen.md):
 * its regions with what each waits for, how it did, how Google shows it, its files and collections; details aside.
 * Admin chrome: its own neutral palette.
 */

const STATUS = {
  live: { text: "On the site", cls: "bg-emerald-50 text-emerald-800", dot: "bg-emerald-500" },
  changed: { text: "Changes not published yet", cls: "bg-amber-50 text-amber-900", dot: "bg-amber-500" },
  draft: { text: "Not on the site yet", cls: "bg-neutral-100 text-neutral-700", dot: "bg-neutral-400" },
} as const;
const regionName = (r: string | null | undefined) => (r ? (REGION_CHOICES.find((c) => c.region === r)?.label ?? r) : "All regions");
const SITE_HOST = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.rapid-medical.com").replace(/^https?:\/\//, "").replace(/\/$/, "");
const h2 = "mb-3 text-xs font-semibold uppercase tracking-wide text-neutral-500";
const card = "rounded-lg border border-neutral-200 bg-white";
const btn = "rounded border border-neutral-300 bg-white px-2.5 py-1 text-xs font-medium hover:bg-neutral-50";

export default async function SitePage({ params, searchParams }: { params: Promise<{ key?: string[] }>; searchParams: Promise<{ published?: string; created?: string }> }) {
  await requireUser();
  const { key: parts } = await params;
  const sp = await searchParams;
  const key = parts?.length ? `/${parts.join("/")}` : "/";
  const data = await pageScreen(key);
  if (!data) notFound();
  const { node, trail, cards, collections } = data;
  const d = await pageDetails(cards, node.versions);
  const back = adminPageHref(key);
  const regional = node.versions.some((v) => v.region);
  const rows = regional ? REGIONS.map((r) => ({ region: r as string | null, v: node.versions.find((x) => x.region === r) })) : [{ region: null, v: node.versions[0] }];
  const source = cards.find((c) => c.status !== "draft") ?? cards[0]; // what a new region version is copied from
  const live = node.versions.filter((v) => v.status !== "draft");

  return (
    <>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <Crumbs items={[{ label: "Site", href: withBase("/admin/page") }, ...trail.filter((t) => t.versions.length).map((t) => ({ label: t.title, href: withBase(adminPageHref(t.key)) }))]} />
          <h1 className="text-2xl font-semibold text-neutral-900">{node.title}</h1>
          <p className="mt-1 text-sm text-neutral-500">{node.type}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <CopyPostLink versions={live.map((v) => ({ label: regionName(v.region), path: v.path }))} />
          <a href={withBase((live[0] ?? node.versions[0]).path)} target="_blank" rel="noreferrer" className="inline-flex items-center rounded border border-neutral-300 bg-white px-3 py-2 text-sm font-medium text-neutral-800 hover:bg-neutral-100">View ↗</a>
        </div>
      </div>
      {sp.published && <div className="mb-4"><Notice kind="success">{regionName(sp.published === "all" ? null : sp.published)} is published.</Notice></div>}
      {sp.created && <div className="mb-4"><Notice kind="success">{regionName(sp.created)} version created as a draft — edit it on the page, then publish.</Notice></div>}

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_280px]">
        <div className="min-w-0 space-y-8">
          <section aria-label="Regions">
            <h2 className={h2}>{regional ? "Regions" : "The page"}</h2>
            {node.fieldsOnly && <p className="mb-2 text-sm text-neutral-500">Its texts are edited on the page, its items in the collections below.</p>}
            <ul className={`${card} divide-y divide-neutral-100`}>
              {rows.map(({ region, v }) => {
                const c = v ? cards.find((x) => x.r === v.r && x.id === v.id) : undefined;
                if (!v)
                  return (
                    <li key={region ?? "all"} aria-label={regionName(region)} className="flex flex-wrap items-center gap-3 px-4 py-3 text-sm">
                      <span className="w-36 font-medium text-neutral-500">{regionName(region)}</span>
                      <span className="flex-1 text-neutral-500">No version — visitors there do not see this page.</span>
                      {source && !DEMO && (
                        <form action={duplicateResource}>
                          <input type="hidden" name="__resource" value={source.r} />
                          <input type="hidden" name="__id" value={source.id} />
                          <input type="hidden" name="region" value={region ?? ""} />
                          <input type="hidden" name="__back" value={back} />
                          <button className={btn}>Create from {regionName(source.region)}</button>
                        </form>
                      )}
                    </li>
                  );
                const st = STATUS[v.status];
                const info = c ? d.region(c) : null;
                return (
                  <li key={region ?? "all"} aria-label={regionName(region)} className="flex flex-wrap items-center gap-3 px-4 py-3 text-sm">
                    <span className="w-36 font-medium">{regionName(region)}</span>
                    <span className="min-w-0 flex-1">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs ${st.cls}`}><span aria-hidden className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />{st.text}</span>
                      {info?.publishes && <span className="ml-2 text-xs text-neutral-600">publishes {info.publishes} (Israel time)</span>}
                      {(c?.changedBy || info?.edited) && <span className="block text-xs text-neutral-500">{c?.changedBy ? `Edited by ${c.changedBy}` : `Last saved by ${info!.edited!.who}, ${info!.edited!.ago}`}</span>}
                    </span>
                    <a href={editorHref(v.path)} className="rounded bg-neutral-900 px-2.5 py-1 text-xs font-medium text-white hover:bg-neutral-700">Edit on page</a>
                    {c && v.status !== "live" && !DEMO && (
                      <form action={publishResource}>
                        <input type="hidden" name="__resource" value={c.r} />
                        <input type="hidden" name="__id" value={c.id} />
                        <input type="hidden" name="__back" value={back} />
                        <button className={btn}>Publish</button>
                      </form>
                    )}
                    {c && !DEMO && <Link href={c.adminHref} className={btn}>Settings</Link>}
                    <a href={withBase(v.path)} target="_blank" rel="noreferrer" className="text-xs underline decoration-neutral-300 hover:decoration-neutral-900">View ↗</a>
                  </li>
                );
              })}
            </ul>
          </section>

          <section aria-label="Performance">
            <h2 className={h2}>Performance · last 30 days</h2>
            <div className={`${card} p-4`}>
              <div className="grid grid-cols-3 gap-4">
                <div><div className="text-2xl font-semibold tabular-nums">{d.performance.views}</div><div className="text-xs text-neutral-500">page views</div></div>
                <div><div className="text-2xl font-semibold tabular-nums">{d.performance.landings}</div><div className="text-xs text-neutral-500">visits that started here</div></div>
                <div><div className="text-2xl font-semibold tabular-nums">{d.performance.requests}</div><div className="text-xs text-neutral-500">requests sent from here</div></div>
              </div>
              {d.performance.sources.length > 0 && <p className="mt-3 text-sm text-neutral-700">Came from: {d.performance.sources.map((s) => `${s.label} ${s.value}`).join(" · ")}</p>}
              <p className="mt-2 text-xs text-neutral-500">
                {d.performance.since ? `Counted since ${d.performance.since} — the new site's own counter. ` : ""}
                <Link href="/admin/analytics?days=30" className="underline">Open analytics</Link>
              </p>
            </div>
          </section>

          <section aria-label="Google">
            <h2 className={h2}>How Google shows it</h2>
            {d.google.length ? (
              <ul className="space-y-3">
                {d.google.map((g) => {
                  const tl = g.title.length;
                  const dl = g.description.length;
                  return (
                    <li key={g.key} className={`${card} p-4`}>
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <span className="text-xs font-medium text-neutral-500">{regionName(g.region)}</span>
                        {!DEMO && <Link href={g.settingsHref} className="text-xs underline">Edit</Link>}
                      </div>
                      <div className="text-xs text-neutral-600">{SITE_HOST} › {g.path.split("/").filter(Boolean).join(" › ")}</div>
                      <div className="truncate text-lg leading-snug text-blue-800">{g.title}</div>
                      <p className="line-clamp-2 text-sm text-neutral-700">{g.description || <span className="text-neutral-400">No description — Google will pick text from the page.</span>}</p>
                      <p className="mt-2 text-xs">
                        <span className={tl > 60 ? "text-amber-700" : "text-neutral-500"}>Title {tl}/60{g.titleSet ? "" : " (the page name)"}</span>
                        <span className="text-neutral-300"> · </span>
                        <span className={dl > 155 || dl === 0 ? "text-amber-700" : "text-neutral-500"}>Description {dl}/155</span>
                      </p>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className={`${card} p-4 text-sm text-neutral-600`}>
                The Google title and description of this page are set in <Link href="/admin/settings?group=seo" className="underline">Settings → Google titles &amp; descriptions</Link>.
              </p>
            )}
          </section>

          <section aria-label="Files on this page">
            <h2 className={h2}>Files on this page</h2>
            {d.files.length ? (
              <ul className={`${card} divide-y divide-neutral-100`}>
                {d.files.map((f) => (
                  <li key={f.id} className="flex items-center gap-3 px-4 py-2 text-sm">
                    <span className="w-14 shrink-0 rounded bg-neutral-100 px-1.5 py-0.5 text-center text-[11px] text-neutral-600">{f.kind}</span>
                    <span className="min-w-0 flex-1 truncate">{f.filename}</span>
                    {f.kind === "PDF" && <span className="shrink-0 text-xs text-neutral-500">opened {f.opens}× in 30 days</span>}
                    <Link href={`/admin/media?id=${f.id}`} className="shrink-0 text-xs underline">Open · Replace</Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-neutral-500">No files from the media library on this page.</p>
            )}
          </section>

          {collections.length > 0 && (
            <section aria-label="Collections on this page">
              <h2 className={h2}>Collections shown on this page</h2>
              <ul className={`${card} divide-y divide-neutral-100`}>
                {collections.map((c) => (
                  <li key={c.res} aria-label={c.title} className="flex flex-wrap items-center gap-3 px-4 py-3 text-sm">
                    <span aria-hidden className="text-neutral-400">▤</span>
                    <span className="font-medium">{c.title}</span>
                    <span className="text-xs text-neutral-500">{c.count} {c.count === 1 ? "record" : "records"} · {c.where}</span>
                    <span className="flex-1" />
                    <Link href={`/admin/${c.res}`} className={btn}>Open {c.title.toLowerCase()}</Link>
                    <Link href={`/admin/${c.res}/new`} className="text-xs underline">+ New {c.newLabel.toLowerCase()}</Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <aside aria-label="Details" className="space-y-6 text-sm">
          <section>
            <h2 className={h2}>Details</h2>
            <dl className="space-y-2">
              <div><dt className="text-xs text-neutral-500">Template</dt><dd>{node.type}</dd></div>
              <div>
                <dt className="text-xs text-neutral-500">Address</dt>
                {node.versions.map((v) => <dd key={v.path} className="break-all">{v.path}</dd>)}
              </div>
            </dl>
          </section>
          {d.notes > 0 && (
            <section>
              <h2 className={h2}>Open notes</h2>
              <a href={editorHref(node.versions[0].path)} className="underline">{d.notes} note{d.notes > 1 ? "s" : ""} on this page — open in the editor</a>
            </section>
          )}
          <section>
            <h2 className={h2}>Recent changes</h2>
            {d.recent.length ? (
              <ul className="space-y-1.5">
                {d.recent.map((r) => (
                  <li key={r.id}>{r.href ? <Link href={r.href} className="underline decoration-neutral-300 hover:decoration-neutral-900">{r.text}</Link> : r.text}<span className="text-neutral-500"> · {r.ago}</span></li>
                ))}
              </ul>
            ) : (
              <p className="text-neutral-500">No changes recorded yet.</p>
            )}
            {cards.length > 0 && !DEMO && (
              <p className="mt-2 text-xs text-neutral-600">
                All versions: {cards.map((c, i) => (
                  <span key={`${c.r}:${c.id}`}>{i > 0 && " · "}<Link href={`${c.adminHref}/history`} className="underline">{regionName(c.region)}</Link></span>
                ))}
              </p>
            )}
          </section>
        </aside>
      </div>
    </>
  );
}
