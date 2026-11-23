import { movedAdminPath } from "@/admin/legacy";
import { notFound, redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, products, solutions } from "@/db";
import { canDelete, requireAdmin, requireUser } from "@/lib/auth";
import { fieldsFor, getResource } from "@/admin/resources";
import { getEditable, hasWorkflow, listRevisions } from "@/admin/workflow";
import { makePreviewToken } from "@/lib/preview";
import { DEMO, withBase } from "@/lib/demo";
import { duplicateResource } from "@/admin/actions";
import { PageHeader, Notice, Button } from "@/components/admin/ui";
import { crumbsFor } from "@/admin/site-sections";
import { ResourceForm } from "@/components/admin/ResourceForm";
import { PageTabs } from "@/components/admin/PageTabs";
import { pageKey } from "@/admin/page-tree";
import { isPageRecord } from "@/lib/version";

import { WorkflowPanel } from "@/components/admin/WorkflowPanel";
import { REGIONS } from "@/db/schema";
import { REGION_CHOICES } from "@/lib/regions";
import { BackButton } from "@/components/admin/BackLink";
import { DocumentChecks } from "@/components/admin/DocumentChecks";
import type { DocumentCheck } from "@/db/schema";
import { sourceName, unchecked } from "@/lib/document-import";

type SP = { created?: string; checked?: string; saved?: string; pending?: string; published?: string; unpublished?: string; discarded?: string; scheduled?: string; restored?: string; error?: string };

export default async function EditResource({ params, searchParams }: { params: Promise<{ resource: string; id: string }>; searchParams: Promise<SP> }) {
  const { resource, id } = await params;
  const sp = await searchParams;
  await requireUser();
  const moved = /^\d{1,9}$/.test(id) ? await movedAdminPath(resource, Number(id)) : null;
  if (moved) redirect(moved);
  const res = getResource(resource);
  if (!res) notFound();
  const me = await requireUser();
  if (res.adminOnly) await requireAdmin();
  const [editable, prods, revisions] = await Promise.all([
    getEditable(res, Number(id)),
    db.select().from(products).orderBy(products.sortOrder),
    hasWorkflow(res) ? listRevisions(res, Number(id)) : Promise.resolve([]),
  ]);
  if (!editable) notFound();
  const { row, draft, live } = editable;

  const previewPath = res.previewUrl?.(row) ?? null;
  const previewHref = previewPath ? (DEMO ? withBase(previewPath) : `/api/preview?token=${await makePreviewToken(previewPath)}`) : null;
  // «Edit on page» only where the page is made of sections: not a material shown by its own template (publication, news)
  const onPage = res.slug !== "materials" || isPageRecord(res.slug, row) || (Array.isArray(row.blocks) && row.blocks.length > 0);
  const editHref = previewPath && onPage ? (DEMO ? withBase(previewPath) : `/api/editor?on=1&redirect=${encodeURIComponent(previewPath)}`) : null;
  const fields = fieldsFor(res, row);
  const checksOpen = res.slug === "materials" ? unchecked((row.documentCheck as DocumentCheck | null)?.items).length : 0;
  // a therapy page in a region it is not in yet: create that region's version (not a copy over an existing one)
  const taken = res.slug === "solutions" ? (await db.select({ region: solutions.region }).from(solutions).where(eq(solutions.slug, String(row.slug ?? "")))).map((x) => x.region) : [];
  const otherRegions = res.slug === "solutions" ? REGIONS.filter((r) => !taken.includes(r)) : [];
  const regionLabel = (r: string) => REGION_CHOICES.find((c) => c.region === r)?.label ?? r;
  // records that are pages of the site (therapy, text and site pages) show as a tab of their page
  const pageOf = isPageRecord(res.slug, row) && previewPath ? pageKey(previewPath) : null;

  return (
    <>
      {pageOf ? (
        // a page of the site: the page's header with its tabs (docs/screens/admin-sections.md → «Экран страницы»)
        <PageTabs pageKey={pageOf} active="settings" current={{ r: res.slug, id: Number(row.id) }} actions={
          <>
            {otherRegions.map((r) => (
              <form key={r} action={duplicateResource}>
                <input type="hidden" name="__resource" value={res.slug} />
                <input type="hidden" name="__id" value={row.id} />
                <input type="hidden" name="region" value={r} />
                <Button type="submit" variant="secondary">Create {regionLabel(r)} version</Button>
              </form>
            ))}
          </>
        } />
      ) : (
        <PageHeader
        crumbs={crumbsFor(res.slug, res.title, String(row.key ?? ""))}
        title={String(row[res.labelField] ?? res.titleSingular)}
        subtitle={res.titleSingular}
        actions={
          <>
            {otherRegions.map((r) => (
              <form key={r} action={duplicateResource}>
                <input type="hidden" name="__resource" value={res.slug} />
                <input type="hidden" name="__id" value={row.id} />
                <input type="hidden" name="region" value={r} />
                <Button type="submit" variant="secondary">Create {regionLabel(r)} version</Button>
              </form>
            ))}
            <BackButton fallback={`/admin/${res.slug}`} />
          </>
        }
      />
      )}
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

      {sp.created === "document" && <Notice kind="success">The draft is built from the PDF. Check the values marked «Check» below, look at the page, then publish.</Notice>}
      {sp.checked && <Notice kind="success">Confirmed.</Notice>}
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          {res.slug === "materials" && row.documentCheck ? <DocumentChecks id={Number(row.id)} check={row.documentCheck as DocumentCheck} demo={DEMO} /> : null}
          <ResourceForm resourceSlug={res.slug} fields={fields} row={row} products={prods} workflow={hasWorkflow(res)} liveStatus={String(live.status ?? "")} pending={!!draft?.data} contentHref={editHref} publishBlocked={checksOpen ? `Check ${checksOpen} value${checksOpen > 1 ? "s" : ""} against ${sourceName(row.documentCheck as DocumentCheck)} first` : null} />
        </div>
        {hasWorkflow(res) && (
          <WorkflowPanel resourceSlug={res.slug} id={row.id} liveStatus={String(live.status)} draft={draft} revisions={revisions} previewHref={previewHref} editHref={editHref} alwaysLive={!!res.alwaysLive} label={String(row[res.labelField] ?? "")} canDelete={canDelete(me)} />
        )}
      </div>
    </>
  );
}
