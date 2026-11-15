import { requireUser } from "@/lib/auth";
import Link from "next/link";
import { isPast, type EventDates } from "@/lib/events";
import { notFound } from "next/navigation";
import { db, products, REGIONS, type Region } from "@/db";
import { getResource } from "@/admin/resources";
import { crumbsFor } from "@/admin/site-sections";
import { listRows } from "@/admin/engine";
import { bulkResource } from "@/admin/actions";
import { PageHeader, LinkButton, StatusBadge, RegionBadge, formatDate, Notice } from "@/components/admin/ui";
import { REGION_CHOICES } from "@/lib/regions";
import { ListFilters, type ListFilter } from "@/components/admin/ListFilters";
import { thumbsFor } from "@/admin/page-screen";
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
  const regionName = (r: string) => REGION_CHOICES.find((c) => c.region === r)?.label ?? r;
  // a picture next to the name, and yes/no columns as labels by the name (docs/screens/admin-list.md)
  const thumbs = res.listThumb ? await thumbsFor(rows.map((r) => String(r[res.listThumb!] ?? "")).filter(Boolean)) : {};
  const FLAG: Record<string, string> = { featured: "Featured", noindex: "Hidden from search" };
  const flags = res.listColumns.filter((c) => c.kind === "boolean");
  const columns = res.listColumns.filter((c) => c.kind !== "boolean");
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

      <ListFilters
        base={`/admin/${res.slug}`}
        q={sp.q ?? ""}
        active={!!sp.q || Object.keys(filters).length > 0}
        keep={Object.fromEntries(Object.entries({ sort: sp.sort, dir: sp.dir }).filter(([, v]) => v)) as Record<string, string>}
        filters={[
          ...(has("status") ? [{ name: "status", value: sp.status ?? "", label: "Status", options: [{ value: "", label: "Any status" }, { value: "published", label: "On the site" }, { value: "draft", label: "Draft" }] }] : []),
          ...(has("region") ? [{ name: "region", value: sp.region ?? "", label: "Region", options: [{ value: "", label: "Any region" }, ...REGIONS.map((r) => ({ value: r, label: regionName(r) })), { value: "__null", label: "All regions (global)" }] }] : []),
          ...(has("regions") ? [{ name: "regions", value: sp.regions ?? "", label: "Shown in", options: [{ value: "", label: "Any region" }, ...REGIONS.map((r) => ({ value: r, label: `Shown in ${regionName(r)}` }))] }] : []),
          ...(has("productId") ? [{ name: "productId", value: sp.productId ?? "", label: "Product", options: [{ value: "", label: "Any product" }, ...prods.map((p) => ({ value: String(p.id), label: p.name }))] }] : []),
          ...(has("featured") ? [{ name: "featured", value: sp.featured ?? "", label: "Featured", options: [{ value: "", label: "Featured or not" }, { value: "true", label: "Featured" }, { value: "false", label: "Not featured" }] }] : []),
        ] satisfies ListFilter[]}
      />

      <form action={bulkResource}>
        <input type="hidden" name="__resource" value={res.slug} />
        <BulkBar hasStatus={has("status")} />
        <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-left text-xs uppercase text-neutral-500">
              <tr>
                <th className="w-8 px-3 py-2"><input type="checkbox" data-select-all aria-label="Select all" /></th>
                {columns.map((c) => (
                  <th key={c.name} className="px-3 py-2 font-medium">
                    <Link href={sortLink(c.name)} className="hover:text-neutral-900">
                      {c.label}{sp.sort === c.name ? (sp.dir === "desc" ? " ↓" : " ↑") : ""}
                    </Link>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr><td colSpan={columns.length + 1} className="px-3 py-8 text-center text-neutral-400">
                  {sp.q || Object.keys(filters).length ? <>Nothing matches — <Link href={`/admin/${res.slug}`} className="underline">clear filters</Link></> : "Nothing here."}
                </td></tr>
              )}
              {rows.map((row) => (
                <tr key={row.id} className="border-t border-neutral-100 hover:bg-neutral-50">
                  <td className="px-3 py-2"><input type="checkbox" name="ids" value={row.id} aria-label={`Select ${row[res.labelField]}`} /></td>
                  {columns.map((c, i) => {
                    const v = row[c.name];
                    let cell: React.ReactNode;
                    switch (c.kind) {
                      case "status": cell = <StatusBadge status={String(v)} />; break;
                      case "date": cell = formatDate(v); break;
                      case "region": cell = <RegionBadge region={v as Region | null} />; break;
                      case "regions": cell = Array.isArray(v) && v.length ? (v as Region[]).map(regionName).join(", ") : <span className="text-neutral-400">All regions</span>; break;
                      case "product": cell = productName(v); break;
                      case "boolean": cell = v ? "✓" : ""; break;
                      case "eventWhen": cell = isPast(row as unknown as EventDates) ? <span className="text-neutral-400">Past</span> : "Upcoming"; break;
                      default: cell = String(v ?? "");
                    }
                    return (
                      <td key={c.name} className={`px-3 py-2 ${i === 0 ? "max-w-md font-medium" : "text-neutral-600"}`}>
                        {i === 0 ? (
                          <Link href={`/admin/${res.slug}/${row.id}`} className="flex items-center gap-3 hover:underline">
                            {res.listThumb && (
                              <span aria-hidden className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded bg-neutral-100">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                {row[res.listThumb] ? <img src={thumbs[String(row[res.listThumb])] ?? String(row[res.listThumb])} alt="" loading="lazy" className="h-full w-full object-cover" /> : null}
                              </span>
                            )}
                            <span className="min-w-0 truncate">{cell}</span>
                            {flags.filter((f) => row[f.name]).map((f) => <span key={f.name} className="shrink-0 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-normal text-amber-900 no-underline">{FLAG[f.name] ?? f.label}</span>)}
                          </Link>
                        ) : cell}
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
          <span className="text-neutral-500">Showing {(page - 1) * per + 1}–{Math.min(page * per, total)} of {total}</span>
          {page < pages && <Link href={qs({ page: String(page + 1) })} className="underline">Next ›</Link>}
        </div>
      )}
    </>
  );
}
