import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, passwordResets, users } from "@/db";
import { requireUser, listSessions, destroyAllSessions, hashPassword, confirmOwnPassword } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { PageHeader, Button, inputCls, Notice, formatDate } from "@/components/admin/ui";
import { deviceName } from "@/lib/device";

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ msg?: string; error?: string }> }) {
  const me = await requireUser();
  const sp = await searchParams;
  const [user, sessions] = await Promise.all([db.query.users.findFirst({ where: eq(users.id, me.id) }), listSessions(me.id)]);
  if (!user) redirect("/admin/login");

  async function changePassword(fd: FormData) {
    "use server";
    const u = await requireUser();
    const row = await db.query.users.findFirst({ where: eq(users.id, u.id) });
    const check = row ? await confirmOwnPassword(u.id, String(fd.get("current")), row.passwordHash) : "wrong";
    if (check === "throttled") redirect("/admin/account?error=Too+many+attempts.+Try+again+in+15+minutes.");
    if (check !== "ok") redirect("/admin/account?error=Current+password+is+wrong");
    const next = String(fd.get("next") ?? "");
    if (next.length < 10) redirect("/admin/account?error=Use+10%2B+characters");
    await db.update(users).set({ passwordHash: await hashPassword(next) }).where(eq(users.id, u.id));
    await destroyAllSessions(u.id, true);
    await db.delete(passwordResets).where(eq(passwordResets.userId, u.id)); // open reset links stop working
    await audit(u, "user", { recordId: u.id, meta: { passwordChanged: true } });
    redirect("/admin/account?msg=Password+changed.+Other+sessions+were+signed+out.");
  }

  /** Two-step sign-in is mandatory: no «off», only «set up again on a new phone» (docs/screens/admin-people.md). */
  async function setUpAgain(fd: FormData) {
    "use server";
    const u = await requireUser();
    const row = await db.query.users.findFirst({ where: eq(users.id, u.id) });
    const check = row ? await confirmOwnPassword(u.id, String(fd.get("password")), row.passwordHash) : "wrong";
    if (check === "throttled") redirect("/admin/account?error=Too+many+attempts.+Try+again+in+15+minutes.");
    if (check !== "ok") redirect("/admin/account?error=Password+is+wrong");
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

  // newest first, this device on top; five on view, the rest folded (docs/screens/admin-account.md, 2026-11-27)
  const ordered = [...sessions].sort((a, b) => Number(b.current) - Number(a.current) || +new Date(b.lastSeenAt) - +new Date(a.lastSeenAt));
  const SHOWN = 5;
  const when = (d: Date | string) => formatDate(d, { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Jerusalem" });
  const row = (x: (typeof ordered)[number]) => (
    <li key={x.id} className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 px-5 py-2.5 text-sm @xl:grid-cols-[minmax(0,1fr)_9rem_11rem]" title={`Signed in ${when(x.createdAt)}${x.userAgent ? ` · ${x.userAgent}` : ""}`}>
      <span className="min-w-0 truncate">{deviceName(x.userAgent)}{x.current && <span className="ml-2 rounded bg-emerald-50 px-1.5 py-0.5 text-xs text-emerald-800">this device</span>}</span>
      <span className="hidden text-neutral-500 @xl:block">{x.ip ?? "—"}</span>
      <span className="text-neutral-500">{x.current ? "Now" : when(x.lastSeenAt)}</span>
    </li>
  );
  const codes = user.recoveryCodes.length;
  const reveal = "cursor-pointer list-none rounded border border-neutral-300 bg-white px-3 py-1.5 text-sm font-medium text-neutral-800 hover:bg-neutral-100";

  return (
    <div className="max-w-3xl">
      <PageHeader title="My account & security" subtitle={`${user.name} · ${user.email}`} />
      {sp.msg && <Notice kind="success">{sp.msg}</Notice>}
      {sp.error && <Notice kind="error">{sp.error}</Notice>}

      <div className="divide-y divide-neutral-100 rounded-lg border border-neutral-200 bg-white">
        <section aria-label="Two-step sign-in" className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3 px-5 py-4">
          <div className="min-w-0 flex-1 basis-64">
            <h2 className="font-semibold">Two-step sign-in</h2>
            <p className="mt-0.5 text-sm text-neutral-600">On since {formatDate(user.totpEnabledAt, { dateStyle: "medium" })} · a code from your phone at every sign-in.</p>
            {codes > 0 ? (
              <p className="mt-0.5 text-sm text-neutral-600">{codes} recovery code{codes === 1 ? "" : "s"} left.</p>
            ) : (
              <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-amber-900"><span aria-hidden className="h-1.5 w-1.5 rounded-full bg-amber-500" />No recovery codes left — if you lose the phone, an admin has to reset it.</p>
            )}
          </div>
          <details className="group w-full @xl:w-72">
            <summary className={`${reveal} text-center`}>Set up on a new phone…</summary>
            <form action={setUpAgain} className="mt-3 space-y-2 text-sm">
              <p className="text-neutral-600">The old codes stop working.</p>
              <input name="password" type="password" placeholder="Confirm with your password" autoComplete="current-password" required className={inputCls} />
              <Button type="submit" variant="secondary">Set up on a new phone</Button>
            </form>
          </details>
        </section>

        <section aria-label="Password" className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3 px-5 py-4">
          <div className="min-w-0 flex-1 basis-64">
            <h2 className="font-semibold">Password</h2>
            <p className="mt-0.5 text-sm text-neutral-600">Changing it signs you out everywhere else.</p>
          </div>
          <details className="w-full @xl:w-72">
            <summary className={`${reveal} text-center`}>Change password…</summary>
            <form action={changePassword} className="mt-3 space-y-2 text-sm">
              <input name="current" type="password" placeholder="Current password" autoComplete="current-password" required className={inputCls} />
              <input name="next" type="password" placeholder="New password (10+ characters)" autoComplete="new-password" minLength={10} required className={inputCls} />
              <Button type="submit" variant="secondary">Change password</Button>
            </form>
          </details>
        </section>
      </div>

      <section aria-label="Where you are signed in" className="mt-8">
        <h2 className="mb-2 text-sm font-semibold text-neutral-600">Where you are signed in</h2>
        <div className="rounded-lg border border-neutral-200 bg-white">
          <div aria-hidden className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 border-b border-neutral-100 px-5 py-2 text-xs text-neutral-500 @xl:grid-cols-[minmax(0,1fr)_9rem_11rem]">
            <span>Device</span><span className="hidden @xl:block">IP</span><span>Last active</span>
          </div>
          <ul className="divide-y divide-neutral-100">{ordered.slice(0, SHOWN).map(row)}</ul>
          {ordered.length > SHOWN && (
            <details className="border-t border-neutral-100">
              <summary className="cursor-pointer px-5 py-2.5 text-sm text-neutral-700 underline decoration-neutral-300 underline-offset-[3px]">Show {ordered.length - SHOWN} more</summary>
              <ul className="divide-y divide-neutral-100 border-t border-neutral-100">{ordered.slice(SHOWN).map(row)}</ul>
            </details>
          )}
          <div className="flex justify-end border-t border-neutral-100 px-5 py-3">
            <form action={signOutEverywhere}><Button type="submit" variant="secondary">Sign out everywhere else</Button></form>
          </div>
        </div>
      </section>
    </div>
  );
}
