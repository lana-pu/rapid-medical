import type { Draft, Revision } from "@/db";
import type { SessionUser } from "@/lib/auth";
import { publishResource, unpublishResource, discardDraftAction, reviewAction, scheduleAction, restoreAction } from "@/admin/actions";
import { Button, StatusBadge, formatDate } from "./ui";
import Link from "next/link";

const REVIEW_LABEL: Record<string, string> = { editing: "Editing", in_review: "In review", changes_requested: "Changes requested", approved: "Approved" };

export function WorkflowPanel({
  resourceSlug,
  id,
  liveStatus,
  draft,
  revisions,
  user,
  requireApproval,
  previewHref,
  editHref,
}: {
  resourceSlug: string;
  id: number;
  liveStatus: string;
  draft: Draft | null;
  revisions: Revision[];
  user: SessionUser;
  requireApproval: boolean;
  previewHref: string | null;
  editHref?: string | null;
}) {
  const hidden = (
    <>
      <input type="hidden" name="__resource" value={resourceSlug} />
      <input type="hidden" name="__id" value={id} />
    </>
  );
  const pending = Boolean(draft?.data);
  const review = draft?.reviewStatus ?? "editing";
  const isApprover = user.role === "admin" || user.role === "approver";
  const mayPublish = !requireApproval || isApprover || review === "approved";
  const toLocalInput = (d: Date | null | undefined) => (d ? new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16) : "");

  return (
    <aside className="space-y-4 text-sm">
      {/* State */}
      <div className="rounded-lg border border-neutral-200 bg-white p-4">
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase text-neutral-500">Live</span>
          <StatusBadge status={liveStatus} />
        </div>
        {pending && (
          <div className="mt-3 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
            Unpublished changes by <b>{draft!.updatedByName || "someone"}</b> · {formatDate(draft!.updatedAt, { dateStyle: "medium", timeStyle: "short" })}
            {requireApproval && <div className="mt-1">Review: <b>{REVIEW_LABEL[review]}</b>{draft!.reviewNote && <> — “{draft!.reviewNote}”</>}</div>}
          </div>
        )}
        {draft?.publishAt && (
          <div className="mt-2 rounded border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-900">
            Scheduled to publish {formatDate(draft.publishAt, { dateStyle: "medium", timeStyle: "short" })}
          </div>
        )}
        <div className="mt-4 flex flex-wrap gap-2">
          {(pending || liveStatus !== "published") && (
            <form action={publishResource}>{hidden}<Button type="submit" disabled={!mayPublish} title={mayPublish ? "" : "Needs approval first"}>{pending ? "Publish changes" : "Publish"}</Button></form>
          )}
          {liveStatus === "published" && (
            <form action={unpublishResource}>{hidden}<Button type="submit" variant="secondary">Unpublish</Button></form>
          )}
          {pending && (
            <form action={discardDraftAction}>{hidden}<Button type="submit" variant="danger">Discard changes</Button></form>
          )}
        </div>
        {previewHref && (
          <div className="mt-3 text-xs">
            <Link href={previewHref} target="_blank" className="underline">Preview {pending ? "with pending changes" : "page"} ↗</Link>
            <span className="ml-2 text-neutral-400">(share this link — valid 7 days)</span>
            {editHref && <a href={editHref} className="ml-4 font-medium underline">Edit on site ✎</a>}
          </div>
        )}
      </div>

      {/* Review */}
      {requireApproval && (pending || liveStatus !== "published") && (
        <div className="rounded-lg border border-neutral-200 bg-white p-4">
          <div className="text-xs uppercase text-neutral-500">Review</div>
          <form action={reviewAction} className="mt-2 space-y-2">
            {hidden}
            <textarea name="note" rows={2} placeholder="Note for the reviewer / author" className="w-full rounded border border-neutral-300 px-2 py-1 text-sm" defaultValue="" />
            <div className="flex flex-wrap gap-2">
              {review !== "in_review" && <button name="status" value="in_review" className="rounded border border-neutral-400 px-2 py-1 text-xs">Submit for review</button>}
              {isApprover && review !== "approved" && <button name="status" value="approved" className="rounded bg-green-700 px-2 py-1 text-xs text-white">Approve</button>}
              {isApprover && review !== "changes_requested" && <button name="status" value="changes_requested" className="rounded border border-red-300 px-2 py-1 text-xs text-red-700">Request changes</button>}
            </div>
          </form>
        </div>
      )}

      {/* Schedule */}
      <div className="rounded-lg border border-neutral-200 bg-white p-4">
        <div className="text-xs uppercase text-neutral-500">Schedule publication</div>
        <form action={scheduleAction} className="mt-2 flex items-center gap-2">
          {hidden}
          <input type="datetime-local" name="publishAt" defaultValue={toLocalInput(draft?.publishAt)} className="rounded border border-neutral-300 px-2 py-1 text-sm" />
          <Button type="submit" variant="secondary">Set</Button>
          {draft?.publishAt && <button name="publishAt" value="" className="text-xs text-red-600 underline">clear</button>}
        </form>
        <p className="mt-1 text-[11px] text-neutral-500">Publishes the pending changes (or the draft record) at that time{requireApproval ? ", if approved" : ""}.</p>
      </div>

      {/* History */}
      <div className="rounded-lg border border-neutral-200 bg-white p-4">
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase text-neutral-500">History</span>
          {revisions.length > 1 && <Link href={`/admin/${resourceSlug}/${id}/history`} className="text-xs underline">Compare ↗</Link>}
        </div>
        <ul className="mt-2 max-h-72 divide-y divide-neutral-100 overflow-auto text-xs">
          {revisions.length === 0 && <li className="py-2 text-neutral-400">No revisions yet.</li>}
          {revisions.map((r) => (
            <li key={r.id} className="flex items-center justify-between gap-2 py-1.5">
              <div>
                <span className={`rounded px-1.5 py-0.5 ${r.kind === "published" ? "bg-green-100 text-green-800" : r.kind === "restored" ? "bg-blue-100 text-blue-800" : "bg-neutral-100 text-neutral-700"}`}>{r.kind}</span>
                <span className="ml-2 text-neutral-700">{r.userName || "—"}</span>
                <span className="ml-2 text-neutral-400">{formatDate(r.createdAt, { dateStyle: "short", timeStyle: "short" })}</span>
                {r.note && <div className="text-neutral-500">{r.note}</div>}
              </div>
              <form action={restoreAction}>
                {hidden}
                <input type="hidden" name="revision" value={r.id} />
                <button className="text-neutral-500 underline hover:text-neutral-900">restore</button>
              </form>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
