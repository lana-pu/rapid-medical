import type { Draft, Revision } from "@/db";
import { unpublishResource, discardDraftAction, scheduleAction, restoreAction } from "@/admin/actions";
import { Button, StateDot, formatDate, quietLink } from "./ui";
import { Icon, type IconName } from "./icons";
import Link from "next/link";
import { israelZoneLabel, toIsraelInput } from "@/lib/israel-time";
import { DeleteDraftButton } from "./DeleteDraftButton";

/** History in words and a mark per kind (docs/screens/admin-record-edit.md → «Панель workflow»). */
const KIND: Record<string, { word: string; icon: IconName; cls: string }> = {
  published: { word: "Published", icon: "publish", cls: "bg-emerald-500 text-white" },
  draft: { word: "Saved", icon: "note", cls: "bg-neutral-200 text-neutral-700" },
  restored: { word: "Restored", icon: "clock", cls: "bg-blue-500 text-white" },
  created: { word: "Created", icon: "file", cls: "bg-neutral-200 text-neutral-700" },
};

/**
 * The record's one status card (docs/screens/admin-record-edit.md → «Панель workflow», 2026-11-24): the state in words,
 * who saved what and what visitors see, Unpublish · Discard · Delete draft, Preview, «Publish later…» and History.
 * Publish itself is in the form's bottom bar: it publishes what is in the form.
 */
export function WorkflowPanel({
  resourceSlug,
  id,
  liveStatus,
  draft,
  revisions,
  previewHref,
  editHref,
  alwaysLive = false,
  label = "",
  canDelete = false,
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
  /** the record's name, for «Delete draft»'s question */
  label?: string;
  /** «Delete draft» — admin only (ADR-006 → «Права») */
  canDelete?: boolean;
}) {
  const hidden = (
    <>
      <input type="hidden" name="__resource" value={resourceSlug} />
      <input type="hidden" name="__id" value={id} />
    </>
  );
  const pending = Boolean(draft?.data);
  const live = liveStatus === "published";
  const lastPublished = revisions.find((r) => r.kind === "published");
  const when = (d: Date | string) => formatDate(d, { dateStyle: "medium", timeStyle: "short" });
  const rule = "border-t border-neutral-100 pt-3";

  return (
    <aside aria-label="Status" className="h-fit rounded-lg border border-neutral-200 bg-white p-4 text-sm @4xl:sticky @4xl:top-16">
      <div className="grid gap-3">
        {live ? pending ? <StateDot tone="changed" big>Changes waiting</StateDot> : <StateDot tone="live" big>On the site</StateDot> : <StateDot tone="draft" big>Draft · not on the site</StateDot>}
        {pending && (
          <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
            <b className="font-semibold">{draft!.updatedByName || "Someone"}</b> · {when(draft!.updatedAt)}. {live ? "Visitors see the old version until you publish." : "Not on the site until you publish."}
          </p>
        )}
        {live && lastPublished && (
          <p className="text-xs text-neutral-500">Published {when(lastPublished.createdAt)}{lastPublished.userName ? ` by ${lastPublished.userName}` : ""}</p>
        )}
        {draft?.publishAt && (
          <StateDot tone="scheduled">Publishes {formatDate(draft.publishAt, { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Jerusalem" })} ({israelZoneLabel(draft.publishAt)})</StateDot>
        )}

        {(live && !alwaysLive) || pending || (!live && !alwaysLive && canDelete) ? (
          <div className="flex flex-wrap gap-2">
            {live && !alwaysLive && <form action={unpublishResource}>{hidden}<Button type="submit" variant="secondary">Unpublish</Button></form>}
            {pending && <form action={discardDraftAction}>{hidden}<Button type="submit" variant="danger">Discard changes</Button></form>}
            {!live && !alwaysLive && canDelete && <DeleteDraftButton resourceSlug={resourceSlug} id={id} label={label} />}
          </div>
        ) : null}

        {previewHref && (
          <p className="text-xs text-neutral-600">
            <Link href={previewHref} target="_blank" className={quietLink}>Preview {pending ? "with the unpublished changes" : "page"} ↗</Link>
            <span className="ml-1 text-neutral-400">(the link works 7 days)</span>
            {editHref && <a href={editHref} className={`ml-3 font-medium text-neutral-900 ${quietLink}`}>Edit on page ✎</a>}
          </p>
        )}

        {/* Publish later: folded until wanted; open when a time is set */}
        <details open={!!draft?.publishAt} className={`group ${rule}`}>
          <summary className="flex cursor-pointer list-none flex-wrap items-center gap-x-2 gap-y-0.5 text-[13px] text-neutral-800 [&::-webkit-details-marker]:hidden">
            <Icon name="clock" className="h-4 w-4 text-neutral-500" />
            <span className="font-medium">Publish later…</span>
            <span className="text-xs text-neutral-500">Time zone: {israelZoneLabel(draft?.publishAt ?? new Date())}</span>
          </summary>
          <form action={scheduleAction} className="mt-2 flex flex-wrap items-center gap-2">
            {hidden}
            <input type="datetime-local" name="publishAt" defaultValue={toIsraelInput(draft?.publishAt)} aria-label="Publish at (Israel time)" className="min-w-0 flex-1 rounded border border-neutral-300 px-2 py-1 text-sm" />
            <Button type="submit" variant="secondary">Set</Button>
            {draft?.publishAt && <button name="publishAt" value="" className="text-xs text-red-600 underline">clear</button>}
          </form>
          <p className="mt-1 text-[11px] text-neutral-500">Publishes the pending changes (or the draft record) at that time.</p>
        </details>

        {/* History — only when there is some */}
        {revisions.length > 0 && (
          <div className={rule}>
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-[13px] font-semibold text-neutral-900">History</h2>
              {revisions.length > 1 && <Link href={`/admin/${resourceSlug}/${id}/history`} className={`text-xs text-neutral-600 ${quietLink}`}>Compare</Link>}
            </div>
            <ul className="grid max-h-72 gap-2.5 overflow-auto text-xs">
              {revisions.map((r) => {
                const k = KIND[r.kind] ?? { word: r.kind, icon: "info" as IconName, cls: "bg-neutral-200 text-neutral-700" };
                return (
                  <li key={r.id} className="grid grid-cols-[1.25rem_minmax(0,1fr)_auto] items-start gap-2">
                    <span aria-hidden className={`grid h-5 w-5 place-items-center rounded-full ${k.cls}`}><Icon name={k.icon} className="h-3 w-3" /></span>
                    <span className="min-w-0">
                      <span className="text-neutral-800">{k.word}{r.userName ? ` · ${r.userName}` : ""}</span>
                      <span className="block text-neutral-500">{when(r.createdAt)}</span>
                      {r.note && <span className="block text-neutral-500">{r.note}</span>}
                    </span>
                    <form action={restoreAction}>
                      {hidden}
                      <input type="hidden" name="revision" value={r.id} />
                      <button className={`text-neutral-500 hover:text-neutral-900 ${quietLink}`}>Restore</button>
                    </form>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </aside>
  );
}
