import { safeLocalPath } from "@/lib/safe-path";
import { desc, eq, isNull } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db, notFoundLog, redirects } from "@/db";
import { requireUser } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { OldLinksTabs } from "@/components/admin/OldLinksTabs";
import { formatDate, inputCls, Button } from "@/components/admin/ui";

export default async function NotFoundLogPage() {
  await requireUser(); // the layout checks too; a page never relies on it alone
  const rows = await db.select().from(notFoundLog).where(isNull(notFoundLog.resolvedAt)).orderBy(desc(notFoundLog.hits)).limit(200);

  async function createRedirect(fd: FormData) {
    "use server";
    const user = await requireUser();
    const from = String(fd.get("from"));
    const to = String(fd.get("to") ?? "").trim();
    // a path on this site (not «//host», not «\») or a full https address
    if (safeLocalPath(to, "") === "" && !/^https:\/\/[^\s/]+(\/\S*)?$/.test(to)) redirect("/admin/not-found-log?error=1");
    await db.insert(redirects).values({ from, to }).onConflictDoUpdate({ target: redirects.from, set: { to } });
    await db.update(notFoundLog).set({ resolvedAt: new Date() }).where(eq(notFoundLog.path, from));
    await audit(user, "save", { resource: "redirects", label: `${from} → ${to}` });
    revalidatePath(from);
    redirect("/admin/not-found-log");
  }

  async function dismiss(fd: FormData) {
    "use server";
    await requireUser();
    await db.delete(notFoundLog).where(eq(notFoundLog.path, String(fd.get("from"))));
    redirect("/admin/not-found-log");
  }

  return (
    <>
      <OldLinksTabs active="broken" broken={rows.length} />
      <p className="mb-4 text-sm text-neutral-600">Addresses visitors opened that lead nowhere. Send each to a page that exists, or dismiss it.</p>
      {/* an empty list is good news: say so instead of an empty table (docs/audits/admin-ux-review-2026-11-15.md 7.6) */}
      {rows.length === 0 ? (
        <p className="rounded-lg border border-neutral-200 bg-white p-6 text-sm text-neutral-600">✓ No broken links: every address visitors opened led somewhere.</p>
      ) : (
      <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-left text-xs uppercase text-neutral-500"><tr><th className="px-3 py-2">Address</th><th className="px-3 py-2">Opened</th><th className="px-3 py-2">Last time</th><th className="px-3 py-2">Came from</th><th className="px-3 py-2">Send to</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.path} className="border-t border-neutral-100">
                <td className="px-3 py-2 font-mono text-xs">{r.path}</td>
                <td className="px-3 py-2">{r.hits}</td>
                <td className="px-3 py-2 text-neutral-500">{formatDate(r.lastSeenAt, { dateStyle: "short", timeStyle: "short" })}</td>
                <td className="max-w-xs truncate px-3 py-2 text-neutral-500" title={r.lastReferer ?? ""}>{r.lastReferer ?? ""}</td>
                <td className="px-3 py-2">
                  <form action={createRedirect} className="flex gap-1">
                    <input type="hidden" name="from" value={r.path} />
                    <input name="to" placeholder="/new/path" className={`${inputCls} py-1`} required />
                    <Button type="submit" variant="secondary">Add</Button>
                    <button formAction={dismiss} className="px-2 text-xs text-neutral-500 underline">dismiss</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      )}
    </>
  );
}
