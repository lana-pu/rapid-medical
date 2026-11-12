import { notFound } from "next/navigation";
import { db, products } from "@/db";
import { getResource } from "@/admin/resources";
import { PageHeader, LinkButton } from "@/components/admin/ui";
import { ResourceForm } from "@/components/admin/ResourceForm";

export default async function NewResource({ params }: { params: Promise<{ resource: string }> }) {
  const { resource } = await params;
  const res = getResource(resource);
  if (!res || res.alwaysLive) notFound();
  const prods = await db.select().from(products).orderBy(products.sortOrder);

  return (
    <>
      <PageHeader title={`New ${res.titleSingular.toLowerCase()}`} actions={<LinkButton href={`/admin/${res.slug}`}>← Back</LinkButton>} />
      <ResourceForm resourceSlug={res.slug} fields={res.fields} row={null} products={prods} contentHref={null} />
    </>
  );
}
