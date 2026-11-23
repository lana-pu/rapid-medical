import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { PAUSED_REGIONS, REGION_CHOICES, REGIONS } from "@/lib/regions";
import { DEMO, editorHref, withBase } from "@/lib/demo";
import { adminPageHref, pageScreen } from "@/admin/site-tree";
import { pageDetails, thumbsFor } from "@/admin/page-screen";
import { seoPages } from "@/admin/seo";
import { regionTexts } from "@/admin/page-editor";
import { duplicateResource, publishResource } from "@/admin/actions";
import { Calm, Crumbs, Notice, SectionHead, Tip, quietLink } from "@/components/admin/ui";
import { Icon, type IconName } from "@/components/admin/icons";
import { EditMenu } from "@/components/admin/EditMenu";
import { Meter, MiniBars, ShareBar } from "@/components/admin/Charts";
import { DESCRIPTION_MAX, TITLE_MAX } from "@/lib/seo";
import { CopyPostLink } from "@/components/admin/CopyPostLink";
import { FilesOnPage } from "@/components/admin/FilePreview";
import { RegionDiff } from "@/components/admin/RegionDiff";

/**
 * One page of the site on one screen (docs/screens/admin-sections.md → «Экран страницы», docs/admin-page-screen.md):
 * its regions with what each waits for, how it did, how Google shows it, its files and collections; details aside.
 * Admin chrome: its own neutral palette.
 */

const STATUS = {
  live: { text: "On the site", cls: "text-emerald-800", dot: "bg-emerald-500" },
  changed: { text: "Changes not published yet", cls: "text-amber-900", dot: "bg-amber-500" },
  draft: { text: "Not on the site yet", cls: "text-neutral-600", dot: "bg-neutral-400" },
} as const;
const regionName = (r: string | null | undefined) => (r ? (REGION_CHOICES.find((c) => c.region === r)?.label ?? r) : "All regions");
const SITE_HOST = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.rapid-medical.com").replace(/^https?:\/\//, "").replace(/\/$/, "");
const card = "rounded-xl border border-neutral-200 bg-white";
const btn = "inline-flex items-center whitespace-nowrap rounded-md border border-neutral-300 bg-white px-2.5 py-1 text-xs font-medium hover:bg-neutral-50";
const iconBtn = "grid h-7 w-7 shrink-0 place-items-center rounded-md border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50";
const PILL = { ok: "bg-emerald-50 text-emerald-900", warn: "border border-amber-200 bg-amber-50 text-amber-900", info: "bg-neutral-100 text-neutral-700" } as const;
/** one row of the regions «table»: region · status · last change · actions; on a phone region and status, actions under */
const ROW = "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 px-4 py-3 text-sm @2xl:grid-cols-[minmax(9rem,1.1fr)_minmax(10rem,1fr)_minmax(0,1fr)_16rem]";

export default async function SitePage({ params, searchParams }: { params: Promise<{ key?: string[] }>; searchParams: Promise<{ published?: string; created?: string; view?: string }> }) {
  await requireUser();
  const { key: parts } = await params;
  const sp = await searchParams;
  const key = parts?.length ? `/${parts.join("/")}` : "/";
  const data = await pageScreen(key);
  if (!data) notFound();
  const { node, trail, cards, collections } = data;
  const back = adminPageHref(key);
  // «Differences between regions»: for a page with copies in several regions (docs/screens/admin-sections.md)
  const order = (r: string | null) => REGIONS.indexOf(r as (typeof REGIONS)[number]);
  const copies = cards.filter((c) => c.region).sort((a, b) => order(a.region) - order(b.region));
  const comparable = copies.length > 1 && !DEMO;
  const view = comparable && sp.view === "regions" ? "regions" : "overview";
  const regional = node.versions.some((v) => v.region);
  const rows = regional ? REGIONS.map((r) => ({ region: r as string | null, v: node.versions.find((x) => x.region === r) })) : [{ region: null, v: node.versions[0] }];
  const source = cards.find((c) => c.status !== "draft") ?? cards[0]; // what a new region version is copied from
  const live = node.versions.filter((v) => v.status !== "draft");

  return (
    <>
      {/* the header: the one filled button is Edit on page (docs/screens/admin-sections.md → «Иерархия») */}
      <div className="mb-4 flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
        <div className="min-w-0 flex-1 basis-72">
          <Crumbs items={[{ label: "Site", href: withBase("/admin/page") }, ...trail.filter((t) => t.versions.length).map((t) => ({ label: t.title, href: withBase(adminPageHref(t.key)) }))]} />
          <h1 className="flex flex-wrap items-center gap-x-3 gap-y-1 text-2xl font-semibold text-neutral-900">
            {node.title}
            <span className="rounded bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-600">{node.type}</span>
          </h1>
          {/* one line on what to do here: the screen is opened once or twice a month (docs/audits/admin-walkthrough-2026-11-15.md) */}
          <p className="mt-1 text-sm text-neutral-500">
            {view === "regions"
              ? "What is different between the regional versions of this page. Click a text to change it in that region; the change waits there until you publish it."
              : node.fieldsOnly
                ? "Its texts are edited on the page, its items in the collections below."
                : "To change texts and pictures, use Edit on page. Visitors see the changes after Publish."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <CopyPostLink versions={live.map((v) => ({ label: regionName(v.region), path: v.path }))} />
          <a href={withBase((live[0] ?? node.versions[0]).path)} target="_blank" rel="noreferrer" className="inline-flex items-center rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm font-medium text-neutral-800 hover:bg-neutral-100">View ↗</a>
          <EditMenu items={node.versions.map((v) => ({ label: regionName(v.region), href: editorHref(v.path) }))} />
        </div>
      </div>
      {sp.published && <div className="mb-4"><Notice kind="success">{regionName(sp.published === "all" ? null : sp.published)} is published.</Notice></div>}
      {sp.created && <div className="mb-4"><Notice kind="success">{regionName(sp.created)} version created as a draft — edit it on the page, then publish.</Notice></div>}

      {comparable && (
        <nav aria-label="Page views" className="mb-5 flex gap-1 border-b border-neutral-200">
          {([["overview", "Overview", back], ["regions", "Differences between regions", `${back}?view=regions`]] as const).map(([k, label, href]) => (
            <Link key={k} href={href} aria-current={view === k ? "page" : undefined} className={`-mb-px border-b-2 px-3 py-2 text-sm ${view === k ? "border-neutral-900 font-medium" : "border-transparent text-neutral-500 hover:text-neutral-800"}`}>{label}</Link>
          ))}
        </nav>
      )}

      {view === "regions" ? await regionsView() : await overview()}
    </>
  );

  async function regionsView() {
    const ref0 = { r: copies[0].r, id: copies[0].id };
    const data = await regionTexts(ref0, true);
    if ("error" in data) return <Notice kind="error">{data.error}</Notice>;
    const urls = data.rows.flatMap((r) => r.cells.flatMap((c) => (c?.media ? [c.value] : [])));
    return <RegionDiff initial={data} ref0={ref0} thumbs={await thumbsFor(urls)} editHref={Object.fromEntries(data.regions.map((c, i) => [i, c.path ? editorHref(c.path) : "#"]))} back={`${back}?view=regions`} />;
  }

  async function overview() {
    const [d, seo] = await Promise.all([pageDetails(cards, node.versions), seoPages().then((all) => all.find((p) => p.key === key))]);
    const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

    // the page's state in one line, from what is already known (docs/screens/admin-sections.md → «Иерархия»)
    const present = rows.filter((x) => x.v);
    const missing = rows.filter((x) => !x.v);
    const onSite = present.filter((x) => x.v!.status !== "draft").length;
    const pending = present.filter((x) => x.v!.status === "changed");
    const scheduled = present.flatMap(({ v }) => {
      const c = cards.find((x) => x.r === v!.r && x.id === v!.id);
      const when = c ? d.region(c).publishes : null;
      return when ? [`${regionName(v!.region)}: ${when}`] : [];
    });
    const googleVersions = seo ? seo.versions.filter((v) => !v.region || !PAUSED_REGIONS.includes(v.region)) : [];
    const noDescription = googleVersions.filter((g) => g.problems.includes("No description"));
    const tooLong = googleVersions.filter((g) => g.problems.some((x) => x !== "No description"));
    const pills: { tone: keyof typeof PILL; icon: IconName; text: string; tip: string }[] = [
      {
        tone: onSite ? "ok" : "info",
        icon: onSite ? "check" : "info",
        text: !regional ? (onSite ? "On the site · all regions" : "Not on the site yet") : `On the site in ${onSite} of ${rows.length} regions`,
        tip: onSite ? "Visitors see this page" : "Visitors do not see this page yet",
      },
      ...(pending.length ? [{ tone: "warn" as const, icon: "publish" as const, text: regional ? `${plural(pending.length, "region", "regions")} with unpublished changes` : "Changes not published yet", tip: `Saved changes wait for Publish${regional ? `: ${pending.map((x) => regionName(x.region)).join(", ")}` : ""}` }] : []),
      ...(scheduled.length ? [{ tone: "info" as const, icon: "clock" as const, text: scheduled.length === 1 ? `Publishes ${scheduled[0].split(": ")[1]}` : `${scheduled.length} publications planned`, tip: `${scheduled.join(" · ")} (Israel time)` }] : []),
      ...(regional && missing.length ? [{ tone: "info" as const, icon: "info" as const, text: `No version in ${plural(missing.length, "region", "regions")}`, tip: `Visitors there do not see this page: ${missing.map((x) => regionName(x.region)).join(", ")}` }] : []),
      ...(noDescription.length ? [{ tone: "warn" as const, icon: "search" as const, text: googleVersions.length > 1 ? `No description for Google in ${plural(noDescription.length, "region", "regions")}` : "No description for Google", tip: "Google will pick a random piece of the page instead" }] : []),
      ...(tooLong.length ? [{ tone: "warn" as const, icon: "search" as const, text: googleVersions.length > 1 ? `Google text too long in ${plural(tooLong.length, "region", "regions")}` : "Google text too long", tip: `Google cuts titles after ${TITLE_MAX} characters and descriptions after ${DESCRIPTION_MAX}` }] : []),
      ...(d.notes ? [{ tone: "info" as const, icon: "note" as const, text: plural(d.notes, "open note", "open notes"), tip: "Notes colleagues left on the page — open them in the editor" }] : []),
    ];

    // regions with the same Google texts: one card (display only — each region keeps its own texts)
    const snippets: { versions: typeof googleVersions; title: string; description: string }[] = [];
    for (const g of googleVersions) {
      const title = g.title || g.fallbackTitle;
      const same = snippets.find((s) => s.title === title && s.description === g.description);
      if (same) same.versions.push(g);
      else snippets.push({ versions: [g], title, description: g.description });
    }
    const seoHref = (region: string | null) => `/admin/seo?page=${encodeURIComponent(key)}#region-${region ?? "all"}`;

    const collectionsBlock = collections.length > 0 && (
      <section aria-label="Collections on this page">
        <SectionHead title="Collections on this page" count={collections.length} />
        <ul className="grid gap-3 @xl:grid-cols-2">
          {collections.map((c) => (
            <li key={c.res} aria-label={c.title} className={`${card} flex flex-col gap-1.5 p-4`}>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-semibold leading-tight tabular-nums">{c.count}</span>
                <span className="font-semibold">{c.title}</span>
              </div>
              <span className="text-xs text-neutral-500">{c.count === 1 ? "record" : "records"} · {c.where}</span>
              <span className="mt-1 flex flex-wrap items-center gap-3">
                <Link href={`/admin/${c.res}`} className={btn}>Open {c.title.toLowerCase()}</Link>
                <Link href={`/admin/${c.res}/new`} className={`text-xs ${quietLink}`}>+ New {c.newLabel.toLowerCase()}</Link>
              </span>
            </li>
          ))}
        </ul>
      </section>
    );

    const p = d.performance;
    return (
      <div className="space-y-6">
        <ul aria-label="The page's state" className="flex flex-wrap gap-2">
          {pills.map((x) => (
            <li key={x.text}>
              <Tip tip={x.tip} align="start" focusable>
                <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${PILL[x.tone]}`}>
                  <Icon name={x.icon} className="h-3.5 w-3.5" />
                  {x.text}
                </span>
              </Tip>
            </li>
          ))}
        </ul>

        <div className="grid grid-cols-[minmax(0,1fr)] gap-8 @4xl:grid-cols-[minmax(0,1fr)_260px] @4xl:items-start">
          <div className="min-w-0 space-y-8">
            {collectionsBlock /* a list page: its collections are what is worked with — first */}

            <section aria-label="Regions">
              <SectionHead title={regional ? "Regions" : "The page"} count={regional ? `${onSite} of ${rows.length} on the site` : undefined} />
              <div className={card}>
                <div aria-hidden className={`${ROW} hidden border-b border-neutral-100 py-2 text-[11px] font-medium text-neutral-500 @2xl:grid`}>
                  <span>{regional ? "Region" : "Version"}</span><span>Status</span><span>Last change</span><span />
                </div>
                <ul className="divide-y divide-neutral-100">
                  {rows.map(({ region, v }) => {
                    const c = v ? cards.find((x) => x.r === v.r && x.id === v.id) : undefined;
                    const name = (
                      <span className="min-w-0">
                        <span className={`block font-medium ${v ? "" : "text-neutral-500"}`}>{regionName(region)}</span>
                        {v && <span className="block truncate font-mono text-xs text-neutral-500">{v.path}</span>}
                      </span>
                    );
                    if (!v)
                      return (
                        <li key={region ?? "all"} aria-label={regionName(region)} className={ROW}>
                          {name}
                          <span className="col-span-2 text-xs text-neutral-500">No version — visitors there do not see this page.</span>
                          <span className="col-span-2 flex justify-start @2xl:col-span-1 @2xl:justify-end">
                            {source && !DEMO && (
                              <form action={duplicateResource}>
                                <input type="hidden" name="__resource" value={source.r} />
                                <input type="hidden" name="__id" value={source.id} />
                                <input type="hidden" name="region" value={region ?? ""} />
                                <input type="hidden" name="__back" value={back} />
                                <button className={btn}>Create from {regionName(source.region)}</button>
                              </form>
                            )}
                          </span>
                        </li>
                      );
                    const st = STATUS[v.status];
                    const info = c ? d.region(c) : null;
                    const who = c?.changedBy ? `Edited by ${c.changedBy}` : info?.edited ? `${info.edited.who} · ${info.edited.ago}` : null;
                    return (
                      <li key={region ?? "all"} aria-label={regionName(region)} className={ROW}>
                        {name}
                        <span className="min-w-0">
                          <span className={`inline-flex items-center gap-1.5 whitespace-nowrap text-xs font-medium ${st.cls}`}><span aria-hidden className={`h-2 w-2 rounded-full ${st.dot}`} />{st.text}</span>
                          {info?.publishes && <span className="block text-xs text-neutral-600">publishes {info.publishes} (Israel time)</span>}
                        </span>
                        <span className="hidden text-xs text-neutral-500 @2xl:block">{who ?? "—"}</span>
                        <span className="col-span-2 flex flex-wrap items-center gap-2 @2xl:col-span-1 @2xl:justify-end">
                          {c && v.status !== "live" && !DEMO && (
                            <form action={publishResource}>
                              <input type="hidden" name="__resource" value={c.r} />
                              <input type="hidden" name="__id" value={c.id} />
                              <input type="hidden" name="__back" value={back} />
                              <button className={`${btn} border-amber-300 bg-amber-100 text-amber-950 hover:bg-amber-200`}>Publish</button>
                            </form>
                          )}
                          <a href={editorHref(v.path)} className={btn}>Edit on page</a>
                          {c && !DEMO && (
                            <Tip tip={`Settings of ${regionName(region)}: address, template, Google texts`} align="end">
                              <Link href={c.adminHref} aria-label="Settings" className={iconBtn}><Icon name="settings" className="h-3.5 w-3.5" /></Link>
                            </Tip>
                          )}
                          <Tip tip="View on the site" align="end">
                            <a href={withBase(v.path)} target="_blank" rel="noreferrer" aria-label={`View ${regionName(region)} ↗`} className={iconBtn}><Icon name="open" className="h-3.5 w-3.5" /></a>
                          </Tip>
                          {who && <span className="basis-full text-xs text-neutral-500 @2xl:hidden">{who}</span>}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </section>

            <section aria-label="Performance">
              <SectionHead title="Performance" count="last 30 days" href="/admin/analytics?days=30" link="Analytics" />
              {p.views + p.landings + p.requests === 0 ? (
                <Calm check={false}>No visits counted here yet{p.since ? ` (the counter started ${p.since})` : ""}.</Calm>
              ) : (
                <div className={card}>
                  <div className="grid grid-cols-1 divide-y divide-neutral-100 @xl:grid-cols-3 @xl:divide-x @xl:divide-y-0">
                    {([["page views", p.views, p.byDay.views, "Pages opened, all regions"], ["visits started here", p.landings, p.byDay.landings, "Visits whose first page was this one"], ["requests sent from here", p.requests, p.byDay.requests, "Requests sent from this page or right after it"]] as const).map(([label, value, days, tip]) => (
                      <div key={label} className="min-w-0 p-4">
                        <Tip tip={tip} focusable align="start"><span className="text-xs text-neutral-500">{label}</span></Tip>
                        <div className="text-2xl font-semibold leading-tight tabular-nums">{value}</div>
                        <MiniBars days={[...days]} label={label} />
                      </div>
                    ))}
                  </div>
                  {p.sources.length > 0 && (
                    <div className="border-t border-neutral-100 p-4">
                      <ShareBar title="Came from" rows={p.sources} unit={["visit", "visits"]} />
                    </div>
                  )}
                  {p.since && <p className="border-t border-neutral-100 px-4 py-2.5 text-xs text-neutral-500">Counted since {p.since} — the new site&apos;s own counter.</p>}
                </div>
              )}
            </section>

            {/* the same texts as in Search & sharing — one system (docs/screens/admin-seo.md) */}
            <section aria-label="Google">
              <SectionHead title="How Google shows it" href={seo && !DEMO ? `/admin/seo?page=${encodeURIComponent(key)}` : undefined} link="Edit in Search & sharing" />
              {seo ? (
                <ul className={`${card} divide-y divide-neutral-100`}>
                  {snippets.map((s) => {
                    const desc = s.description.length;
                    return (
                      <li key={s.versions.map((v) => v.key).join(",")} className="grid gap-1 p-4">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
                          {s.versions.map((v) => <span key={v.key} className="rounded bg-neutral-100 px-1.5 py-0.5 font-medium text-neutral-700">{v.label}</span>)}
                          {s.versions.length > 1 && <span className="text-neutral-500">same text</span>}
                          {!DEMO && (
                            <span className="ml-auto flex flex-wrap gap-3">
                              {s.versions.map((v) => (
                                <Link key={v.key} href={seoHref(v.region)} className={`text-neutral-600 ${quietLink}`}>{s.versions.length > 1 ? `Edit ${v.label}` : "Edit"}</Link>
                              ))}
                            </span>
                          )}
                        </div>
                        <div className="truncate text-xs text-neutral-600">{SITE_HOST} › {s.versions[0].path.split("?")[0].split("/").filter(Boolean).join(" › ")}</div>
                        <div className="text-lg leading-snug text-blue-800 [overflow-wrap:anywhere]">{s.title}</div>
                        <p className="line-clamp-2 text-sm text-neutral-700">{s.description || <span className="text-neutral-400">No description — Google will pick text from the page.</span>}</p>
                        <div className="mt-1 flex flex-wrap gap-x-6 gap-y-2 text-[11px] text-neutral-500">
                          <span className="flex min-w-40 items-center gap-2">
                            <span className="w-16"><Meter value={s.title.length} total={TITLE_MAX} warn={s.title.length > TITLE_MAX} tip={`Title: ${s.title.length} of ${TITLE_MAX} characters Google shows`} /></span>
                            <span className={s.title.length > TITLE_MAX ? "font-medium text-amber-800" : ""}>Title {s.title.length} / {TITLE_MAX}{s.title.length > TITLE_MAX ? " — Google cuts the end" : ""}</span>
                          </span>
                          <span className="flex min-w-40 items-center gap-2">
                            <span className="w-16"><Meter value={desc} total={DESCRIPTION_MAX} warn={!desc || desc > DESCRIPTION_MAX} tip={desc ? `Description: ${desc} of ${DESCRIPTION_MAX} characters Google shows` : "No description"} /></span>
                            <span className={!desc || desc > DESCRIPTION_MAX ? "font-medium text-amber-800" : ""}>Description {desc} / {DESCRIPTION_MAX}{!desc ? " — empty" : desc > DESCRIPTION_MAX ? " — Google cuts the end" : ""}</span>
                          </span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <Calm check={false}>Google shows this page&apos;s name and picks a description from the page.</Calm>
              )}
            </section>

            <section aria-label="Files on this page">
              <SectionHead title="Files on this page" count={d.files.length || undefined} href={d.files.length ? "/admin/media" : undefined} link="Media" />
              <FilesOnPage files={d.files} />
            </section>

          </div>

          <aside aria-label="Details" className="space-y-8 text-sm">
            <section>
              <SectionHead title="Recent changes" />
              {d.recent.length ? (
                <ul className="space-y-2.5">
                  {d.recent.map((r) => (
                    <li key={r.id} className="flex gap-2.5">
                      <span aria-hidden className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-neutral-200 text-[10px] font-semibold text-neutral-700">{r.text.slice(0, 1).toUpperCase()}</span>
                      <span className="min-w-0">
                        {r.href ? <Link href={r.href} className={quietLink}>{r.text}</Link> : r.text}
                        <span className="block text-xs text-neutral-500">{r.ago}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-neutral-500">No changes recorded yet.</p>
              )}
              {cards.length > 0 && !DEMO && (
                <p className="mt-3 text-xs text-neutral-600">
                  All versions: {cards.map((c, i) => (
                    <span key={`${c.r}:${c.id}`}>{i > 0 && " · "}<Link href={`${c.adminHref}/history`} className={quietLink}>{regionName(c.region)}</Link></span>
                  ))}
                </p>
              )}
            </section>
            {d.notes > 0 && (
              <section>
                <SectionHead title="Open notes" count={d.notes} />
                <a href={editorHref(node.versions[0].path)} className={quietLink}>{plural(d.notes, "note", "notes")} on this page — open in the editor</a>
              </section>
            )}
            <section>
              <SectionHead title="Details" />
              <dl className="space-y-2">
                <div><dt className="text-xs text-neutral-500">Template</dt><dd>{node.type}</dd></div>
                <div>
                  <dt className="text-xs text-neutral-500">Address</dt>
                  {node.versions.map((v) => <dd key={v.path} className="break-all font-mono text-xs">{v.path}</dd>)}
                </div>
              </dl>
            </section>
          </aside>
        </div>
      </div>
    );
  }
}
