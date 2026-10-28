import { notFound } from "next/navigation";
import { db, products } from "@/db";
import { getResource } from "@/admin/resources";
import { getRow } from "@/admin/engine";
import { deleteResource, duplicateResource } from "@/admin/actions";
import { PageHeader, LinkButton, Notice, Button } from "@/components/admin/ui";
import { ResourceForm } from "@/components/admin/ResourceForm";
import { REGIONS } from "@/db/schema";

export default async function EditResource({
  params,
  searchParams,
}: {
  params: Promise<{ resource: string; id: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const { resource, id } = await params;
  const sp = await searchParams;
  const res = getResource(resource);
  if (!res) notFound();
  const [row, prods] = await Promise.all([getRow(res, Number(id)), db.select().from(products).orderBy(products.sortOrder)]);
  if (!row) notFound();

  const preview = res.previewUrl?.(row);
  const otherRegion = res.slug === "solutions" ? REGIONS.find((r) => r !== row.region) : null;

  return (
    <>
      <PageHeader
        title={String(row[res.labelField] ?? res.titleSingular)}
        subtitle={`${res.titleSingular} #${row.id}`}
        actions={
          <>
            {preview && <LinkButton href={preview}>Preview ↗</LinkButton>}
            {otherRegion && (
              <form action={duplicateResource}>
                <input type="hidden" name="__resource" value={res.slug} />
                <input type="hidden" name="__id" value={row.id} />
                <input type="hidden" name="region" value={otherRegion} />
                <Button type="submit" variant="secondary">Copy to {otherRegion.toUpperCase()}</Button>
              </form>
            )}
            <form action={deleteResource}>
              <input type="hidden" name="__resource" value={res.slug} />
              <input type="hidden" name="__id" value={row.id} />
              <Button type="submit" variant="danger">Delete</Button>
            </form>
            <LinkButton href={`/admin/${res.slug}`}>← Back</LinkButton>
          </>
        }
      />
      {sp.saved && <Notice kind="success">Saved.</Notice>}
      <ResourceForm resourceSlug={res.slug} fields={res.fields} row={row} products={prods} />
    </>
  );
}
