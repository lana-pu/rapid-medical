import { viewingVersion } from "@/lib/version";
import { safeLocalPath } from "@/lib/safe-path";

/**
 * Above a page shown in an earlier version (History → View): whose version, when, and what can be done. Editor chrome
 * (the editor's neutral palette), shown only to the signed-in editor viewing it.
 */
export async function VersionBanner() {
  const v = await viewingVersion();
  if (!v) return null;
  const path = safeLocalPath(v.path, "/");
  const when = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Jerusalem" }).format(v.rev.createdAt);
  return (
    <div role="region" aria-label="Earlier version" className="sticky top-0 z-[1000] flex flex-wrap items-center gap-3 bg-neutral-950 px-4 py-2.5 text-sm text-white shadow-lg">
      <span aria-hidden>🕘</span>
      <span className="min-w-0 flex-1">
        <b>Version saved by {v.rev.userName || "someone"}, {when}</b>
        <span className="text-neutral-300"> — not on the site; nothing changes until you restore it.</span>
      </span>
      <form action="/api/version/restore" method="post">
        <input type="hidden" name="rev" value={v.rev.id} />
        <input type="hidden" name="path" value={path} />
        <button type="submit" className="rounded bg-white px-3 py-1.5 text-sm font-semibold text-black hover:bg-neutral-200">Restore this version</button>
      </form>
      <a href={path} className="rounded border border-neutral-600 px-3 py-1.5 hover:bg-neutral-800">Back to the current page</a>
    </div>
  );
}
