import type { Draft, Revision } from "@/db";
import { unpublishResource, discardDraftAction, scheduleAction, restoreAction } from "@/admin/actions";
import { Button, StatusBadge, formatDate } from "./ui";
import Link from "next/link";
import { israelZoneLabel, toIsraelInput } from "@/lib/israel-time";

export function WorkflowPanel({
  resourceSlug,
  id,
  liveStatus,
  draft,
  revisions,
  previewHref,
  editHref,
  alwaysLive = false,
}: {
  resourceSlug: string;
  id: number;
  liveStatus: string;
  draft: Draft | null;
  revisions: Revision[];
  previewHref: string | null;
  editHref?: string | null;
  /** Home, About…: the site needs them, no Unpublish */
  alwaysLive?: boolean;
}) {
  const hidden = (
    <>
      <input type="hidden" name="__resource" value={resourceSlug} />
      <input type="hidden" name="__id" value={id} />
    </>
  );
  const pending = Boolean(draft?.data);

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
          </div>
        )}
        {draft?.publishAt && (
          <div className="mt-2 rounded border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-900">
            Scheduled to publish {formatDate(draft.publishAt, { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Jerusalem" })} ({israelZoneLabel(draft.publishAt)})
          </div>
        )}
        <div className="mt-4 flex flex-wrap gap-2">
          {liveStatus === "published" && !alwaysLive && (
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

      {/* Schedule */}
      <div className="rounded-lg border border-neutral-200 bg-white p-4">
        <div className="text-xs uppercase text-neutral-500">Schedule publication</div>
        <form action={scheduleAction} className="mt-2 flex items-center gap-2">
          {hidden}
          <input type="datetime-local" name="publishAt" defaultValue={toIsraelInput(draft?.publishAt)} aria-label="Publish at (Israel time)" className="rounded border border-neutral-300 px-2 py-1 text-sm" />
          <Button type="submit" variant="secondary">Set</Button>
          {draft?.publishAt && <button name="publishAt" value="" className="text-xs text-red-600 underline">clear</button>}
        </form>
        <p className="mt-1 text-[11px] text-neutral-500">Publishes the pending changes (or the draft record) at that time. Time zone: {israelZoneLabel(draft?.publishAt ?? new Date())}.</p>
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
