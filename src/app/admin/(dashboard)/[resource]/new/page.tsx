import { notFound } from "next/navigation";
import { db, products } from "@/db";
import { getResource } from "@/admin/resources";
import { crumbsFor } from "@/admin/site-sections";
import { hasWorkflow } from "@/admin/workflow";
import { PageHeader, LinkButton } from "@/components/admin/ui";
import { ResourceForm } from "@/components/admin/ResourceForm";

export default async function NewResource({ params }: { params: Promise<{ resource: string }> }) {
  const { resource } = await params;
  const res = getResource(resource);
  if (!res || res.alwaysLive) notFound();
  const prods = await db.select().from(products).orderBy(products.sortOrder);

  return (
    <>
      <PageHeader crumbs={crumbsFor(res.slug, res.title)} title={`New ${res.titleSingular.toLowerCase()}`} actions={<LinkButton href={`/admin/${res.slug}`}>← Back</LinkButton>} />
      <ResourceForm resourceSlug={res.slug} fields={res.fields} row={null} products={prods} workflow={hasWorkflow(res)} contentHref={null} />
    </>
  );
}
