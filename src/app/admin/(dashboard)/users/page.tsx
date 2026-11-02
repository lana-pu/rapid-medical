import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db, users } from "@/db";
import { hashPassword, requireAdmin } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { PageHeader, Button, inputCls, formatDate, Notice } from "@/components/admin/ui";

export default async function UsersPage({ searchParams }: { searchParams: Promise<{ saved?: string; error?: string }> }) {
  await requireAdmin();
  const sp = await searchParams;
  const rows = await db.select().from(users).orderBy(users.id);

  async function create(fd: FormData) {
    "use server";
    const me = await requireAdmin();
    const email = String(fd.get("email") ?? "").toLowerCase().trim();
    const name = String(fd.get("name") ?? "").trim();
    const password = String(fd.get("password") ?? "");
    const role = (["admin", "approver", "editor"].includes(String(fd.get("role"))) ? String(fd.get("role")) : "editor") as "admin" | "approver" | "editor";
    if (!email || !name || password.length < 10) redirect("/admin/users?error=Password+must+be+10%2B+chars");
    try {
      const [u] = await db.insert(users).values({ email, name, role, passwordHash: await hashPassword(password) }).returning();
      await audit(me, "user", { recordId: u.id, label: email, meta: { created: true, role } });
    } catch {
      redirect("/admin/users?error=Email+already+exists");
    }
    redirect("/admin/users?saved=1");
  }

  async function toggle(fd: FormData) {
    "use server";
    const me = await requireAdmin();
    const id = Number(fd.get("id"));
    if (id === me.id) redirect("/admin/users?error=You+cannot+deactivate+yourself");
    const u = await db.query.users.findFirst({ where: eq(users.id, id) });
    if (u) { await db.update(users).set({ active: !u.active }).where(eq(users.id, id)); await audit(me, "user", { recordId: id, label: u.email, meta: { active: !u.active } }); }
    redirect("/admin/users");
  }

  async function reset2fa(fd: FormData) {
    "use server";
    const me = await requireAdmin();
    const id = Number(fd.get("id"));
    await db.update(users).set({ totpSecret: null, totpEnabledAt: null, recoveryCodes: [] }).where(eq(users.id, id));
    await audit(me, "user", { recordId: id, meta: { totpResetByAdmin: true } });
    redirect("/admin/users?saved=1");
  }

  async function resetPassword(fd: FormData) {
    "use server";
    const me = await requireAdmin();
    const password = String(fd.get("password") ?? "");
    if (password.length < 10) redirect("/admin/users?error=Password+must+be+10%2B+chars");
    await db.update(users).set({ passwordHash: await hashPassword(password) }).where(eq(users.id, Number(fd.get("id"))));
    await audit(me, "user", { recordId: Number(fd.get("id")), meta: { passwordReset: true } });
    redirect("/admin/users?saved=1");
  }

  return (
    <>
      <PageHeader title="Users" />
      {sp.saved && <Notice kind="success">Saved.</Notice>}
      {sp.error && <Notice kind="error">{sp.error}</Notice>}
      <div className="mb-8 overflow-hidden rounded-lg border border-neutral-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-left text-xs uppercase text-neutral-500">
            <tr><th className="px-3 py-2">Name</th><th className="px-3 py-2">Email</th><th className="px-3 py-2">Role</th><th className="px-3 py-2">Last login</th><th className="px-3 py-2">2FA</th><th className="px-3 py-2">Active</th><th className="px-3 py-2">New password</th></tr>
          </thead>
          <tbody>
            {rows.map((u) => (
              <tr key={u.id} className="border-t border-neutral-100">
                <td className="px-3 py-2 font-medium">{u.name}</td>
                <td className="px-3 py-2">{u.email}</td>
                <td className="px-3 py-2">{u.role}</td>
                <td className="px-3 py-2 text-neutral-500">{formatDate(u.lastLoginAt, { dateStyle: "medium", timeStyle: "short" })}</td>
                <td className="px-3 py-2">
                  {u.totpEnabledAt ? (
                    <form action={reset2fa} className="inline"><input type="hidden" name="id" value={u.id} /><span className="text-green-700">on</span> <button className="ml-1 text-xs text-neutral-500 underline">reset</button></form>
                  ) : <span className="text-neutral-400">off</span>}
                </td>
                <td className="px-3 py-2">
                  <form action={toggle}>
                    <input type="hidden" name="id" value={u.id} />
                    <button className={`rounded px-2 py-0.5 text-xs ${u.active ? "bg-green-100 text-green-800" : "bg-neutral-200 text-neutral-600"}`}>{u.active ? "active" : "inactive"}</button>
                  </form>
                </td>
                <td className="px-3 py-2">
                  <form action={resetPassword} className="flex gap-1">
                    <input type="hidden" name="id" value={u.id} />
                    <input name="password" type="password" placeholder="10+ chars" className={`${inputCls} py-1`} />
                    <button className="rounded border border-neutral-300 px-2 text-xs">Set</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="mb-3 text-lg font-semibold">Add user</h2>
      <form action={create} className="grid max-w-2xl grid-cols-2 gap-4 rounded-lg border border-neutral-200 bg-white p-5">
        <div><label className="mb-1 block text-sm">Name</label><input name="name" required className={inputCls} /></div>
        <div><label className="mb-1 block text-sm">Email</label><input name="email" type="email" required className={inputCls} /></div>
        <div><label className="mb-1 block text-sm">Password (10+ chars)</label><input name="password" type="password" required minLength={10} className={inputCls} /></div>
        <div><label className="mb-1 block text-sm">Role</label><select name="role" className={inputCls}><option value="editor">Editor</option><option value="approver">Approver</option><option value="admin">Admin</option></select></div>
        <div className="col-span-2"><Button type="submit">Create user</Button></div>
      </form>
    </>
  );
}
