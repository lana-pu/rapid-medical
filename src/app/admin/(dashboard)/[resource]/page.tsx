import Link from "next/link";
import { notFound } from "next/navigation";
import { db, products } from "@/db";
import { getResource } from "@/admin/resources";
import { listRows } from "@/admin/engine";
import { PageHeader, LinkButton, StatusBadge, RegionBadge, formatDate, Notice, inputCls } from "@/components/admin/ui";
import type { Region } from "@/db/schema";
import { REGION_SHORT } from "@/lib/regions";

export default async function ResourceList({
  params,
  searchParams,
}: {
  params: Promise<{ resource: string }>;
  searchParams: Promise<{ q?: string; deleted?: string }>;
}) {
  const { resource } = await params;
  const sp = await searchParams;
  const res = getResource(resource);
  if (!res) notFound();

  const [rows, prods] = await Promise.all([listRows(res, { search: sp.q }), db.select().from(products)]);
  const productName = (id: unknown) => prods.find((p) => p.id === id)?.name ?? "";

  return (
    <>
      <PageHeader title={res.title} subtitle={`${rows.length} items`} actions={<LinkButton href={`/admin/${res.slug}/new`} variant="primary">+ New {res.titleSingular.toLowerCase()}</LinkButton>} />
      {sp.deleted && <Notice kind="success">Deleted.</Notice>}
      <form className="mb-4 flex gap-2">
        <input name="q" defaultValue={sp.q ?? ""} placeholder="Search…" className={`${inputCls} max-w-xs`} />
        <button className="rounded border border-neutral-300 bg-white px-3 py-2 text-sm">Search</button>
      </form>
      <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-left text-xs uppercase text-neutral-500">
            <tr>
              {res.listColumns.map((c) => (
                <th key={c.name} className="px-3 py-2 font-medium">{c.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={res.listColumns.length} className="px-3 py-8 text-center text-neutral-400">Nothing here yet.</td></tr>
            )}
            {rows.map((row) => (
              <tr key={row.id} className="border-t border-neutral-100 hover:bg-neutral-50">
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
    </>
  );
}
