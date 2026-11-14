import { requireUser } from "@/lib/auth";
import Link from "next/link";
import { isPast, type EventDates } from "@/lib/events";
import { notFound } from "next/navigation";
import { db, products, REGIONS, type Region } from "@/db";
import { getResource } from "@/admin/resources";
import { crumbsFor } from "@/admin/site-sections";
import { listRows } from "@/admin/engine";
import { bulkResource } from "@/admin/actions";
import { PageHeader, LinkButton, StatusBadge, RegionBadge, formatDate, Notice, inputCls } from "@/components/admin/ui";
import { REGION_SHORT, REGION_LABELS } from "@/lib/regions";
import { BulkBar } from "@/components/admin/BulkBar";

type SP = { q?: string; deleted?: string; bulk?: string; n?: string; sort?: string; dir?: "asc" | "desc"; page?: string; status?: string; region?: string; productId?: string; regions?: string; featured?: string };

export default async function ResourceList({ params, searchParams }: { params: Promise<{ resource: string }>; searchParams: Promise<SP> }) {
  await requireUser(); // the layout checks too; a page never relies on it alone
  const { resource } = await params;
  const sp = await searchParams;
  const res = getResource(resource);
  if (!res) notFound();

  const filters: Record<string, string> = {};
  for (const k of ["status", "region", "productId", "regions", "featured"] as const) if (sp[k]) filters[k] = sp[k]!;

  const [{ rows, total, page, per }, prods] = await Promise.all([
    listRows(res, { search: sp.q, filters, sort: sp.sort, dir: sp.dir, page: Math.floor(Number(sp.page)) || 1 }),
    db.select().from(products).orderBy(products.sortOrder),
  ]);
  const productName = (id: unknown) => prods.find((p) => p.id === id)?.name ?? "";
  const pages = Math.max(1, Math.ceil(total / per));
  const has = (c: string) => res.listColumns.some((x) => x.name === c);

  const qs = (over: Partial<SP>) => {
    const u = new URLSearchParams();
    const merged = { ...sp, ...over } as Record<string, string | undefined>;
    for (const [k, v] of Object.entries(merged)) if (v && !["deleted", "bulk", "n"].includes(k)) u.set(k, v);
    const str = u.toString();
    return `/admin/${res.slug}${str ? `?${str}` : ""}`;
  };
  const sortLink = (c: string) => qs({ sort: c, dir: sp.sort === c && (sp.dir ?? "asc") === "asc" ? "desc" : "asc", page: undefined });

  return (
    <>
      <PageHeader crumbs={crumbsFor(res.slug).slice(0, -1)} title={res.title} subtitle={`${total} items`} actions={<LinkButton href={`/admin/${res.slug}/new`} variant="primary">+ New {res.titleSingular.toLowerCase()}</LinkButton>} />
      {sp.deleted && <Notice kind="success">Deleted.</Notice>}
      {sp.bulk && <Notice kind="success">{sp.bulk === "delete" ? "Deleted" : sp.bulk === "publish" ? "Published" : "Unpublished"} {sp.n} item(s).</Notice>}

      <form className="mb-4 flex flex-wrap items-center gap-2">
        <input name="q" defaultValue={sp.q ?? ""} placeholder="Search…" className={`${inputCls} max-w-xs`} />
        {has("status") && (
          <select name="status" defaultValue={sp.status ?? ""} className={`${inputCls} w-auto`}>
            <option value="">Any status</option><option value="published">Published</option><option value="draft">Draft</option>
          </select>
        )}
        {has("region") && (
          <select name="region" defaultValue={sp.region ?? ""} className={`${inputCls} w-auto`}>
            <option value="">Any region</option>
            {REGIONS.map((r) => <option key={r} value={r}>{REGION_LABELS[r]}</option>)}
            <option value="__null">Global</option>
          </select>
        )}
        {has("regions") && (
          <select name="regions" defaultValue={sp.regions ?? ""} className={`${inputCls} w-auto`}>
            <option value="">Any region</option>
            {REGIONS.map((r) => <option key={r} value={r}>Shown in {REGION_SHORT[r]}</option>)}
          </select>
        )}
        {has("productId") && (
          <select name="productId" defaultValue={sp.productId ?? ""} className={`${inputCls} w-auto`}>
            <option value="">Any product</option>
            {prods.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        )}
        {has("featured") && (
          <select name="featured" defaultValue={sp.featured ?? ""} className={`${inputCls} w-auto`}>
            <option value="">Featured?</option><option value="true">Featured</option><option value="false">Not featured</option>
          </select>
        )}
        {sp.sort && <input type="hidden" name="sort" value={sp.sort} />}
        {sp.dir && <input type="hidden" name="dir" value={sp.dir} />}
        <button className="rounded border border-neutral-300 bg-white px-3 py-2 text-sm">Apply</button>
        {(sp.q || Object.keys(filters).length > 0) && <Link href={`/admin/${res.slug}`} className="text-sm text-neutral-500 underline">Reset</Link>}
      </form>

      <form action={bulkResource}>
        <input type="hidden" name="__resource" value={res.slug} />
        <BulkBar hasStatus={has("status")} />
        <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-left text-xs uppercase text-neutral-500">
              <tr>
                <th className="w-8 px-3 py-2"><input type="checkbox" data-select-all aria-label="Select all" /></th>
                {res.listColumns.map((c) => (
                  <th key={c.name} className="px-3 py-2 font-medium">
                    <Link href={sortLink(c.name)} className="hover:text-neutral-900">
                      {c.label}{sp.sort === c.name ? (sp.dir === "desc" ? " ↓" : " ↑") : ""}
                    </Link>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && <tr><td colSpan={res.listColumns.length + 1} className="px-3 py-8 text-center text-neutral-400">Nothing here.</td></tr>}
              {rows.map((row) => (
                <tr key={row.id} className="border-t border-neutral-100 hover:bg-neutral-50">
                  <td className="px-3 py-2"><input type="checkbox" name="ids" value={row.id} aria-label={`Select ${row[res.labelField]}`} /></td>
                  {res.listColumns.map((c, i) => {
                    const v = row[c.name];
                    let cell: React.ReactNode;
                    switch (c.kind) {
                      case "status": cell = <StatusBadge status={String(v)} />; break;
                      case "date": cell = formatDate(v); break;
                      case "region": cell = <RegionBadge region={v as Region | null} />; break;
                      case "regions": cell = Array.isArray(v) && v.length ? (v as Region[]).map((r) => REGION_SHORT[r]).join(", ") : <span className="text-neutral-400">all</span>; break;
                      case "product": cell = productName(v); break;
                      case "boolean": cell = v ? "✓" : ""; break;
                      case "eventWhen": cell = isPast(row as unknown as EventDates) ? <span className="text-neutral-400">Past</span> : "Upcoming"; break;
                      default: cell = String(v ?? "");
                    }
                    return (
                      <td key={c.name} className={`px-3 py-2 ${i === 0 ? "max-w-md truncate font-medium" : "text-neutral-600"}`}>
                        {i === 0 ? <Link href={`/admin/${res.slug}/${row.id}`} className="hover:underline">{cell}</Link> : cell}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </form>

      {pages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-3 text-sm">
          {page > 1 && <Link href={qs({ page: String(page - 1) })} className="underline">‹ Prev</Link>}
          <span className="text-neutral-500">Page {page} of {pages}</span>
          {page < pages && <Link href={qs({ page: String(page + 1) })} className="underline">Next ›</Link>}
        </div>
      )}
    </>
  );
}
