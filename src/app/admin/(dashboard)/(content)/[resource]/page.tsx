import { canDelete, requireAdmin, requireUser } from "@/lib/auth";
import Link from "next/link";
import { isPast, type EventDates } from "@/lib/events";
import { notFound } from "next/navigation";
import { db, products, REGIONS, type Region } from "@/db";
import { getResource } from "@/admin/resources";
import { crumbsFor, sectionForResource } from "@/admin/site-sections";
import { listRows, type Row } from "@/admin/engine";
import { hasWorkflow, listStates, type RowState } from "@/admin/workflow";
import { bulkResource } from "@/admin/actions";
import type { ListColumn } from "@/admin/fields";
import { PageHeader, LinkButton, StateDot, type StateTone, formatDate, Notice } from "@/components/admin/ui";
import { REGION_CHOICES } from "@/lib/regions";
import { ListFilters, type ListFilter } from "@/components/admin/ListFilters";
import { thumbsFor } from "@/admin/page-screen";
import { safeLocalPath } from "@/lib/safe-path";
import { BulkBar } from "@/components/admin/BulkBar";

type SP = { q?: string; bulk?: string; n?: string; live?: string; sort?: string; dir?: "asc" | "desc"; page?: string; status?: string; region?: string; productId?: string; regions?: string; featured?: string };

/** The status tabs (docs/screens/admin-list.md → «Иерархия»): the value in the address and its words. */
const TABS = [
  { key: "", label: "All" },
  { key: "published", label: "On the site" },
  { key: "changed", label: "Changes waiting" },
  { key: "scheduled", label: "Scheduled" },
  { key: "draft", label: "Drafts" },
] as const;

/** Secondary columns go under the name; the date, numbers and the status keep their own column. */
const OWN_COLUMN = new Set<ListColumn["kind"]>(["date", "number", "status"]);

export default async function ResourceList({ params, searchParams }: { params: Promise<{ resource: string }>; searchParams: Promise<SP> }) {
  const me = await requireUser(); // the layout checks too; a page never relies on it alone
  const { resource } = await params;
  const sp = await searchParams;
  const res = getResource(resource);
  if (!res) notFound();
  if (res.adminOnly) await requireAdmin(); // Products, Redirects (ADR-006 → «Права»)

  const filters: Record<string, string> = {};
  for (const k of ["region", "productId", "regions", "featured"] as const) if (sp[k]) filters[k] = sp[k]!;
  const states = hasWorkflow(res) ? await listStates(res) : null;
  // a tab: published / draft are the record's own status; changed / scheduled live in drafts
  const tab = TABS.some((t) => t.key === sp.status) ? (sp.status as (typeof TABS)[number]["key"]) : "";
  if (tab === "published" || tab === "draft") filters.status = tab;
  const ids = tab === "changed" ? states?.changedIds ?? [] : tab === "scheduled" ? states?.scheduledIds ?? [] : undefined;
  const notIds = tab === "published" ? states?.changedIds : undefined;

  const [{ rows, total, page, per }, prods] = await Promise.all([
    listRows(res, { search: sp.q, filters, sort: sp.sort, dir: sp.dir, page: Math.floor(Number(sp.page)) || 1, ids, notIds }),
    db.select().from(products).orderBy(products.sortOrder),
  ]);
  const productName = (id: unknown) => prods.find((p) => p.id === id)?.name ?? "";
  const regionName = (r: string) => REGION_CHOICES.find((c) => c.region === r)?.label ?? r;
  // a picture next to the name (docs/screens/admin-list.md)
  const thumbs = res.listThumb ? await thumbsFor(rows.map((r) => String(r[res.listThumb!] ?? "")).filter(Boolean)) : {};
  const FLAG: Record<string, string> = { featured: "Featured", noindex: "Hidden from search", permanent: "Temporary" };
  // only the media library's own files, or a file of the site itself — never an outside address (security review)
  const thumbOf = (v: unknown) => {
    const u = String(v ?? "");
    if (!u) return null;
    if (Object.hasOwn(thumbs, u)) return thumbs[u];
    return safeLocalPath(u, "") || null; // no «//», «/\», tabs or line breaks (browsers drop them and read «//evil»)
  };
  const flags = res.listColumns.filter((c) => c.kind === "boolean");
  const [nameCol, ...rest] = res.listColumns.filter((c) => c.kind !== "boolean");
  // the status column only when some record is not simply on the site (docs/screens/admin-list.md → «Иерархия»)
  const quiet = !!states && states.counts.changed + states.counts.scheduled + states.counts.drafts === 0;
  const own = rest.filter((c) => OWN_COLUMN.has(c.kind) && !(c.kind === "status" && quiet));
  const under = rest.filter((c) => !OWN_COLUMN.has(c.kind));
  const dateCol = own.find((c) => c.kind === "date");
  const pages = Math.max(1, Math.ceil(total / per));
  const has = (c: string) => res.listColumns.some((x) => x.name === c);

  const qs = (over: Partial<SP>) => {
    const u = new URLSearchParams();
    const merged = { ...sp, ...over } as Record<string, string | undefined>;
    for (const [k, v] of Object.entries(merged)) if (v && !["bulk", "n", "live"].includes(k)) u.set(k, v);
    const str = u.toString();
    return `/admin/${res.slug}${str ? `?${str}` : ""}`;
  };
  const sortLink = (c: string) => qs({ sort: c, dir: sp.sort === c && (sp.dir ?? "asc") === "asc" ? "desc" : "asc", page: undefined });

  // tabs with something in them; none when every record is in the same state (docs/screens/admin-list.md)
  const count = (k: string) => (!states ? 0 : { "": states.counts.all, published: states.counts.live, changed: states.counts.changed, scheduled: states.counts.scheduled, draft: states.counts.drafts }[k] ?? 0);
  const tabs = states ? TABS.filter((t) => t.key === "" || count(t.key) > 0 || t.key === tab) : [];
  const showTabs = tabs.length > 2 || (tab !== "" && tabs.length > 1);

  // a row's state, said only when it is not the usual «on the site» (docs/screens/admin-list.md → «Иерархия»)
  const stateOf = (row: Row): { tone: StateTone; text: string } | null => {
    if (!states) return null;
    const st: RowState | undefined = states.byId.get(Number(row.id));
    if (st?.publishAt) return { tone: "scheduled", text: `Publishes ${formatDate(st.publishAt, { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Jerusalem" })}` };
    if (row.status === "draft") return { tone: "draft", text: "Draft" };
    if (st?.pending) return { tone: "changed", text: "Changes waiting" };
    return null;
  };
  const underText = (row: Row, c: ListColumn): string => {
    const v = row[c.name];
    switch (c.kind) {
      case "region": return v ? regionName(String(v)) : "All regions";
      case "regions": return Array.isArray(v) && v.length ? (v as Region[]).map(regionName).join(", ") : "All regions";
      case "product": return productName(v);
      default: return String(v ?? "");
    }
  };
  const ownCell = (row: Row, c: ListColumn) => {
    if (c.kind === "date") return formatDate(row[c.name]);
    if (c.kind === "status") { const s = stateOf(row); return s ? <StateDot tone={s.tone}>{s.text}</StateDot> : null; }
    return String(row[c.name] ?? "");
  };
  // the date and the status go under the name below 576 px of the working area; the columns themselves from 576 px
  const width = (c: ListColumn) => (c.kind === "status" ? "w-52" : c.kind === "date" ? "w-28" : "w-20");

  // events: upcoming first, then past (docs/screens/admin-list.md); other lists keep one group
  const groups: { label?: string; rows: Row[]; empty?: string }[] =
    res.slug === "events"
      ? [
          { label: "Upcoming", rows: rows.filter((r) => !isPast(r as unknown as EventDates)), empty: "No upcoming events." },
          { label: "Past", rows: rows.filter((r) => isPast(r as unknown as EventDates)) },
        ]
      : [{ rows }];
  const where = sectionForResource(res.slug)?.lists?.find((l) => l.resource === res.slug)?.where;
  const subtitle = [where && where[0].toUpperCase() + where.slice(1), !showTabs && `${total} items`].filter(Boolean).join(" · ");
  const cols = 1 + 1 + own.length;

  // room for a picture only when some row on this page has one
  const withThumbs = !!res.listThumb && rows.some((r) => !!thumbOf(r[res.listThumb!]));
  const row = (r: Row) => {
    const s = stateOf(r);
    const pic = res.listThumb ? thumbOf(r[res.listThumb]) : null;
    const meta = under.map((c) => underText(r, c)).filter(Boolean);
    const tags = flags.filter((f) => (f.name === "permanent" ? !r[f.name] : r[f.name])).map((f) => FLAG[f.name] ?? f.label);
    return (
      <tr key={r.id} className="border-t border-neutral-100 hover:bg-neutral-50 has-[:checked]:bg-neutral-50">
        <td className="w-10 px-3 py-2.5 align-middle"><input type="checkbox" name="ids" value={r.id} aria-label={`Select ${r[res.labelField]}`} /></td>
        <td className="px-3 py-2.5">
          <Link href={`/admin/${res.slug}/${r.id}`} className="group flex items-center gap-3">
            {withThumbs && (
              <span aria-hidden className="h-9 w-9 shrink-0 overflow-hidden rounded-md">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {pic ? <img src={pic} alt="" loading="lazy" className="h-full w-full object-cover" /> : null}
              </span>
            )}
            <span className="grid min-w-0 gap-0.5">
              <span className="line-clamp-2 font-medium leading-snug text-neutral-900 group-hover:underline">{String(r[nameCol.name] ?? "")}</span>
              {(tags.length > 0 || meta.length > 0 || dateCol || s) && (
                <span className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-neutral-500">
                  {tags.map((t) => <span key={t} className="rounded-full bg-amber-50 px-2 py-px text-[11px] font-medium text-amber-900">{t}</span>)}
                  {(dateCol || meta.length > 0) && (
                    <span className="min-w-0">
                      {dateCol && <span className="@xl:hidden">{formatDate(r[dateCol.name])}{meta.length ? " · " : ""}</span>}
                      {meta.join(" · ")}
                    </span>
                  )}
                  {s && <StateDot tone={s.tone} className="@xl:hidden">{s.text}</StateDot>}
                </span>
              )}
            </span>
          </Link>
        </td>
        {own.map((c) => (
          <td key={c.name} className={`hidden whitespace-nowrap px-3 py-2.5 text-neutral-600 @xl:table-cell ${width(c)}`}>{ownCell(r, c)}</td>
        ))}
      </tr>
    );
  };

  return (
    <>
      <PageHeader crumbs={crumbsFor(res.slug).slice(0, -1)} title={res.title} subtitle={subtitle || undefined} actions={res.alwaysLive ? undefined : <LinkButton href={`/admin/${res.slug}/new`} variant="primary">+ New {res.titleSingular.toLowerCase()}</LinkButton>} />
      {/* Home, About… cannot be created: no «+ New» that leads to a 404 (docs/screens/admin-list.md, 2026-11-16) */}
      {sp.bulk && <Notice kind="success">{sp.bulk === "delete" ? "Deleted" : sp.bulk === "publish" ? "Published" : "Unpublished"} {sp.n} item(s).</Notice>}
      {sp.bulk === "delete" && Number(sp.live) > 0 && <Notice kind="error">{sp.live} on the site {Number(sp.live) === 1 ? "was" : "were"} not deleted: unpublish {Number(sp.live) === 1 ? "it" : "them"} first.</Notice>}

      {showTabs && (
        <nav aria-label="Status" className="mb-3 flex flex-wrap gap-x-1 border-b border-neutral-200">
          {tabs.map((t) => {
            const on = t.key === tab;
            const n = count(t.key);
            return (
              <Link key={t.key} href={qs({ status: t.key || undefined, page: undefined })} aria-current={on ? "page" : undefined} className={`-mb-px flex items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-2 text-[13px] ${on ? "border-neutral-900 font-medium text-neutral-900" : "border-transparent text-neutral-500 hover:text-neutral-900"}`}>
                {t.label}
                <span className={`rounded-full px-1.5 text-[11px] font-medium tabular-nums ${t.key === "changed" && n > 0 ? "bg-amber-100 text-amber-900" : "bg-neutral-100 text-neutral-600"}`}>{n}</span>
              </Link>
            );
          })}
        </nav>
      )}

      <ListFilters
        base={`/admin/${res.slug}`}
        q={sp.q ?? ""}
        active={!!sp.q || Object.keys(filters).some((k) => k !== "status")}
        keep={Object.fromEntries(Object.entries({ sort: sp.sort, dir: sp.dir, status: sp.status }).filter(([, v]) => v)) as Record<string, string>}
        filters={[
          ...(has("region") ? [{ name: "region", value: sp.region ?? "", label: "Region", options: [{ value: "", label: "Any region" }, ...REGIONS.map((r) => ({ value: r, label: regionName(r) })), { value: "__null", label: "All regions (global)" }] }] : []),
          ...(has("regions") ? [{ name: "regions", value: sp.regions ?? "", label: "Shown in", options: [{ value: "", label: "Any region" }, ...REGIONS.map((r) => ({ value: r, label: `Shown in ${regionName(r)}` }))] }] : []),
          ...(has("productId") ? [{ name: "productId", value: sp.productId ?? "", label: "Product", options: [{ value: "", label: "Any product" }, ...prods.map((p) => ({ value: String(p.id), label: p.name }))] }] : []),
          ...(has("featured") ? [{ name: "featured", value: sp.featured ?? "", label: "Featured", options: [{ value: "", label: "Featured or not" }, { value: "true", label: "Featured" }, { value: "false", label: "Not featured" }] }] : []),
        ] satisfies ListFilter[]}
      />

      <form action={bulkResource}>
        <input type="hidden" name="__resource" value={res.slug} />
        <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
          <table className="w-full table-fixed text-sm">
            <thead className="text-left text-xs text-neutral-500">
              <tr>
                <th className="w-10 px-3 py-2"><input type="checkbox" data-select-all aria-label="Select all" /></th>
                {[nameCol, ...own].map((c, i) => (
                  <th key={`${c.name}-${i}`} className={`px-3 py-2 font-medium ${i === 0 ? "" : `hidden @xl:table-cell ${width(c)}`}`}>
                    <Link href={sortLink(c.name)} className="hover:text-neutral-900">
                      {c.label}{sp.sort === c.name ? (sp.dir === "desc" ? " ↓" : " ↑") : ""}
                    </Link>
                  </th>
                ))}
              </tr>
            </thead>
            {rows.length === 0 ? (
              <tbody>
                <tr><td colSpan={cols} className="px-3 py-8 text-center text-neutral-400">
                  {sp.q || Object.keys(filters).length || tab ? <>Nothing matches — <Link href={`/admin/${res.slug}`} className="underline">clear filters</Link></> : "Nothing here."}
                </td></tr>
              </tbody>
            ) : (
              groups.map((g, gi) => (
                <tbody key={gi}>
                  {g.label && (
                    <tr className="border-t border-neutral-100 bg-neutral-50">
                      <th colSpan={cols} scope="colgroup" className="px-3 py-1.5 text-left text-[11px] font-semibold uppercase tracking-wide text-neutral-500">{g.label} · {g.rows.length}</th>
                    </tr>
                  )}
                  {g.rows.length === 0 && g.empty ? (
                    <tr className="border-t border-neutral-100"><td /><td colSpan={cols - 1} className="px-3 py-2.5 text-[13px] text-neutral-500">{g.empty}</td></tr>
                  ) : (
                    g.rows.map(row)
                  )}
                </tbody>
              ))
            )}
          </table>
        </div>
        <BulkBar hasStatus={has("status")} fixed={!!res.alwaysLive} canDelete={canDelete(me)} />
      </form>

      {pages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-3 text-sm">
          {page > 1 && <Link href={qs({ page: String(page - 1) })} className="underline">‹ Prev</Link>}
          <span className="text-neutral-500">Showing {(page - 1) * per + 1}–{Math.min(page * per, total)} of {total}</span>
          {page < pages && <Link href={qs({ page: String(page + 1) })} className="underline">Next ›</Link>}
        </div>
      )}
    </>
  );
}
