import { notFound } from "next/navigation";
import { db, products } from "@/db";
import { requireUser } from "@/lib/auth";
import { getResource } from "@/admin/resources";
import { getEditable, hasWorkflow, listRevisions, workflowSettings } from "@/admin/workflow";
import { makePreviewToken } from "@/lib/preview";
import { DEMO, withBase } from "@/lib/demo";
import { duplicateResource } from "@/admin/actions";
import { PageHeader, LinkButton, Notice, Button } from "@/components/admin/ui";
import { ResourceForm } from "@/components/admin/ResourceForm";
import { WorkflowPanel } from "@/components/admin/WorkflowPanel";
import { REGIONS } from "@/db/schema";

type SP = { saved?: string; pending?: string; published?: string; unpublished?: string; discarded?: string; review?: string; scheduled?: string; restored?: string; error?: string };

export default async function EditResource({ params, searchParams }: { params: Promise<{ resource: string; id: string }>; searchParams: Promise<SP> }) {
  const { resource, id } = await params;
  const sp = await searchParams;
  const res = getResource(resource);
  if (!res) notFound();
  const user = await requireUser();
  const [editable, prods, revisions, wf] = await Promise.all([
    getEditable(res, Number(id)),
    db.select().from(products).orderBy(products.sortOrder),
    hasWorkflow(res) ? listRevisions(res, Number(id)) : Promise.resolve([]),
    workflowSettings(),
  ]);
  if (!editable) notFound();
  const { row, draft, live } = editable;

  const previewPath = res.previewUrl?.(row) ?? null;
  const previewHref = previewPath ? (DEMO ? withBase(previewPath) : `/api/preview?token=${await makePreviewToken(previewPath)}`) : null;
  const otherRegions = res.slug === "solutions" ? REGIONS.filter((r) => r !== row.region) : [];

  return (
    <>
      <PageHeader
        title={String(row[res.labelField] ?? res.titleSingular)}
        subtitle={`${res.titleSingular} #${row.id}`}
        actions={
          <>
            {otherRegions.map((r) => (
              <form key={r} action={duplicateResource}>
                <input type="hidden" name="__resource" value={res.slug} />
                <input type="hidden" name="__id" value={row.id} />
                <input type="hidden" name="region" value={r} />
                <Button type="submit" variant="secondary">Copy to {r.toUpperCase()}</Button>
              </form>
            ))}
            <LinkButton href={`/admin/${res.slug}`}>← Back</LinkButton>
          </>
        }
      />
      {sp.saved && <Notice kind="success">Saved.</Notice>}
      {sp.pending && <Notice kind="info">Saved as pending changes. The live page is unchanged until you publish.</Notice>}
      {sp.published && <Notice kind="success">Published.</Notice>}
      {sp.unpublished && <Notice kind="info">Unpublished — the page is no longer visible on the site.</Notice>}
      {sp.discarded && <Notice kind="info">Pending changes discarded.</Notice>}
      {sp.review && <Notice kind="info">Review status updated.</Notice>}
      {sp.scheduled && <Notice kind="info">Schedule updated.</Notice>}
      {sp.restored && <Notice kind="success">Revision restored{live.status === "published" ? " as pending changes" : ""}.</Notice>}
      {sp.error && <Notice kind="error">{sp.error}</Notice>}

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div>
          <ResourceForm resourceSlug={res.slug} fields={res.fields} row={row} products={prods} hideStatus={hasWorkflow(res) && live.status === "published"} />
        </div>
        {hasWorkflow(res) && (
          <WorkflowPanel resourceSlug={res.slug} id={row.id} liveStatus={String(live.status)} draft={draft} revisions={revisions} user={user} requireApproval={Boolean(wf.requireApproval)} previewHref={previewHref} editHref={previewPath ? (DEMO ? withBase(previewPath) : `/api/editor?on=1&redirect=${encodeURIComponent(previewPath)}`) : null} />
        )}
      </div>
    </>
  );
}
