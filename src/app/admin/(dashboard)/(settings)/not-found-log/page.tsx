import { safeLocalPath } from "@/lib/safe-path";
import { desc, eq, isNull } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db, notFoundLog, redirects } from "@/db";
import { requireUser } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { PageHeader, formatDate, inputCls, Button } from "@/components/admin/ui";

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
      <PageHeader title="Broken links (404s)" subtitle="Paths visitors requested that don't exist. Add a redirect or dismiss." />
      <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-left text-xs uppercase text-neutral-500"><tr><th className="px-3 py-2">Path</th><th className="px-3 py-2">Hits</th><th className="px-3 py-2">Last seen</th><th className="px-3 py-2">Referer</th><th className="px-3 py-2">Redirect to</th></tr></thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={5} className="px-3 py-8 text-center text-neutral-400">No broken links recorded.</td></tr>}
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
    </>
  );
}
