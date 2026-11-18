import { movedAdminPath } from "@/admin/legacy";
import { notFound, redirect } from "next/navigation";
import { db, products, MATERIAL_KINDS } from "@/db";
import { getResource } from "@/admin/resources";
import { crumbsFor } from "@/admin/site-sections";
import { hasWorkflow } from "@/admin/workflow";
import { PageHeader } from "@/components/admin/ui";
import { ResourceForm } from "@/components/admin/ResourceForm";
import { BackButton } from "@/components/admin/BackLink";

/** What a new material starts with when it is created from a slice of the list (Evidence or News; whitelisted). */
function materialStart(sp: Record<string, string | undefined>): Record<string, unknown> | null {
  const out: Record<string, unknown> = {};
  if (sp.kind && (MATERIAL_KINDS as readonly string[]).includes(sp.kind)) out.kind = sp.kind;
  if (sp.showInEvidence === "true") out.showInEvidence = true;
  if (sp.showInNews === "true") out.showInNews = true;
  return Object.keys(out).length ? out : null;
}

export default async function NewResource({ params, searchParams }: { params: Promise<{ resource: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const { resource } = await params;
  const sp = await searchParams;
  const moved = await movedAdminPath(resource, "new");
  if (moved) redirect(moved);
  const res = getResource(resource);
  if (!res || res.alwaysLive) notFound();
  const prods = await db.select().from(products).orderBy(products.sortOrder);

  return (
    <>
      <PageHeader crumbs={crumbsFor(res.slug, res.title)} title={`New ${res.titleSingular.toLowerCase()}`} actions={<BackButton fallback={`/admin/${res.slug}`} />} />
      <ResourceForm resourceSlug={res.slug} fields={res.slug === "materials" ? res.fields.filter((f) => !f.onPage) : res.fields} row={res.slug === "materials" ? materialStart(sp) : null} products={prods} workflow={hasWorkflow(res)} contentHref={null} />
    </>
  );
}
