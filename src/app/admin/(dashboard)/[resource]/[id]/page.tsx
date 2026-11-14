import { notFound } from "next/navigation";
import { db, products } from "@/db";
import { requireUser } from "@/lib/auth";
import { getResource } from "@/admin/resources";
import { getEditable, hasWorkflow, listRevisions } from "@/admin/workflow";
import { makePreviewToken } from "@/lib/preview";
import { DEMO, withBase } from "@/lib/demo";
import { duplicateResource } from "@/admin/actions";
import { PageHeader, LinkButton, Notice, Button } from "@/components/admin/ui";
import { crumbsFor } from "@/admin/site-sections";
import { ResourceForm } from "@/components/admin/ResourceForm";
import { WorkflowPanel } from "@/components/admin/WorkflowPanel";
import { REGIONS } from "@/db/schema";

type SP = { saved?: string; pending?: string; published?: string; unpublished?: string; discarded?: string; scheduled?: string; restored?: string; error?: string };

export default async function EditResource({ params, searchParams }: { params: Promise<{ resource: string; id: string }>; searchParams: Promise<SP> }) {
  const { resource, id } = await params;
  const sp = await searchParams;
  const res = getResource(resource);
  if (!res) notFound();
  await requireUser();
  const [editable, prods, revisions] = await Promise.all([
    getEditable(res, Number(id)),
    db.select().from(products).orderBy(products.sortOrder),
    hasWorkflow(res) ? listRevisions(res, Number(id)) : Promise.resolve([]),
  ]);
  if (!editable) notFound();
  const { row, draft, live } = editable;

  const previewPath = res.previewUrl?.(row) ?? null;
  const previewHref = previewPath ? (DEMO ? withBase(previewPath) : `/api/preview?token=${await makePreviewToken(previewPath)}`) : null;
  const editHref = previewPath ? (DEMO ? withBase(previewPath) : `/api/editor?on=1&redirect=${encodeURIComponent(previewPath)}`) : null;
  const otherRegions = res.slug === "solutions" ? REGIONS.filter((r) => r !== row.region) : [];

  return (
    <>
      <PageHeader
        crumbs={crumbsFor(res.slug, res.title, String(row.key ?? ""))}
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
      {sp.published && (
        <Notice kind="success">
          {previewPath && live.status === "published" ? (
            <>
              Live on <b>{previewPath}</b> · <a href={withBase(previewPath)} target="_blank" rel="noreferrer" className="underline">View on the site ↗</a>
            </>
          ) : (
            "Published."
          )}
        </Notice>
      )}
      {sp.unpublished && <Notice kind="info">Unpublished — the page is no longer visible on the site.</Notice>}
      {sp.discarded && <Notice kind="info">Pending changes discarded.</Notice>}
      {sp.scheduled && <Notice kind="info">Schedule updated.</Notice>}
      {sp.restored && <Notice kind="success">Revision restored{live.status === "published" ? " as pending changes" : ""}.</Notice>}
      {sp.error && <Notice kind="error">{sp.error}</Notice>}

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div>
          <ResourceForm resourceSlug={res.slug} fields={res.fields} row={row} products={prods} workflow={hasWorkflow(res)} liveStatus={String(live.status ?? "")} pending={!!draft?.data} contentHref={editHref} />
        </div>
        {hasWorkflow(res) && (
          <WorkflowPanel resourceSlug={res.slug} id={row.id} liveStatus={String(live.status)} draft={draft} revisions={revisions} previewHref={previewHref} editHref={editHref} alwaysLive={!!res.alwaysLive} label={String(row[res.labelField] ?? "")} />
        )}
      </div>
    </>
  );
}
