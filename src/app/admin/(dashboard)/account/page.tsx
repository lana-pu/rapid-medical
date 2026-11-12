import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, users } from "@/db";
import { requireUser, listSessions, destroyAllSessions, hashPassword, verifyPassword } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { PageHeader, Button, inputCls, Notice, formatDate } from "@/components/admin/ui";

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ msg?: string; error?: string }> }) {
  const me = await requireUser();
  const sp = await searchParams;
  const [user, sessions] = await Promise.all([db.query.users.findFirst({ where: eq(users.id, me.id) }), listSessions(me.id)]);
  if (!user) redirect("/admin/login");

  async function changePassword(fd: FormData) {
    "use server";
    const u = await requireUser();
    const row = await db.query.users.findFirst({ where: eq(users.id, u.id) });
    if (!row || !(await verifyPassword(String(fd.get("current")), row.passwordHash))) redirect("/admin/account?error=Current+password+is+wrong");
    const next = String(fd.get("next") ?? "");
    if (next.length < 10) redirect("/admin/account?error=Use+10%2B+characters");
    await db.update(users).set({ passwordHash: await hashPassword(next) }).where(eq(users.id, u.id));
    await destroyAllSessions(u.id, true);
    await audit(u, "user", { recordId: u.id, meta: { passwordChanged: true } });
    redirect("/admin/account?msg=Password+changed.+Other+sessions+were+signed+out.");
  }

  /** Two-step sign-in is mandatory: no «off», only «set up again on a new phone» (docs/screens/admin-people.md). */
  async function setUpAgain(fd: FormData) {
    "use server";
    const u = await requireUser();
    const row = await db.query.users.findFirst({ where: eq(users.id, u.id) });
    if (!row || !(await verifyPassword(String(fd.get("password")), row.passwordHash))) redirect("/admin/account?error=Password+is+wrong");
    await db.update(users).set({ totpSecret: null, totpEnabledAt: null, recoveryCodes: [] }).where(eq(users.id, u.id));
    await audit(u, "user", { recordId: u.id, meta: { totpReset: true, own: true } });
    redirect("/admin/login/setup");
  }

  async function signOutEverywhere() {
    "use server";
    const u = await requireUser();
    await destroyAllSessions(u.id, true);
    await audit(u, "logout", { meta: { everywhere: true } });
    redirect("/admin/account?msg=Other+sessions+signed+out");
  }

  return (
    <>
      <PageHeader title="My account" subtitle={`${user.name} · ${user.email}`} />
      {sp.msg && <Notice kind="success">{sp.msg}</Notice>}
      {sp.error && <Notice kind="error">{sp.error}</Notice>}

      <div className="grid gap-6 md:grid-cols-2">
        <section className="rounded-lg border border-neutral-200 bg-white p-5">
          <h2 className="font-semibold">Two-step sign-in</h2>
          <form action={setUpAgain} className="mt-3 space-y-2 text-sm">
            <p className="text-green-800">On since {formatDate(user.totpEnabledAt, { dateStyle: "medium" })}. {user.recoveryCodes.length} recovery codes left.</p>
            <p className="text-neutral-600">New phone? Set it up again: the old codes stop working.</p>
            <input name="password" type="password" placeholder="Confirm with your password" autoComplete="current-password" required className={inputCls} />
            <Button type="submit" variant="secondary">Set up on a new phone</Button>
          </form>
        </section>

        <section className="rounded-lg border border-neutral-200 bg-white p-5">
          <h2 className="font-semibold">Change password</h2>
          <form action={changePassword} className="mt-3 space-y-2 text-sm">
            <input name="current" type="password" placeholder="Current password" autoComplete="current-password" required className={inputCls} />
            <input name="next" type="password" placeholder="New password (10+ characters)" autoComplete="new-password" minLength={10} required className={inputCls} />
            <Button type="submit" variant="secondary">Change password</Button>
          </form>
        </section>

        <section className="rounded-lg border border-neutral-200 bg-white p-5 md:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Active sessions</h2>
            <form action={signOutEverywhere}><Button type="submit" variant="secondary">Sign out other sessions</Button></form>
          </div>
          <table className="mt-3 w-full text-sm">
            <thead className="text-left text-xs uppercase text-neutral-500"><tr><th className="py-1">Device</th><th>IP</th><th>Signed in</th><th>Last seen</th><th></th></tr></thead>
            <tbody>
              {sessions.map((s) => (
                <tr key={s.id} className="border-t border-neutral-100">
                  <td className="max-w-md truncate py-1.5" title={s.userAgent ?? ""}>{s.userAgent?.replace(/^Mozilla\/5\.0 /, "").slice(0, 70) ?? "—"}</td>
                  <td>{s.ip ?? "—"}</td>
                  <td>{formatDate(s.createdAt, { dateStyle: "short", timeStyle: "short" })}</td>
                  <td>{formatDate(s.lastSeenAt, { dateStyle: "short", timeStyle: "short" })}</td>
                  <td className="text-right">{s.current && <span className="rounded bg-green-100 px-1.5 py-0.5 text-xs text-green-800">this device</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </>
  );
}
