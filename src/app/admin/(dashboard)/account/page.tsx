import Link from "next/link";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import QRCode from "qrcode";
import { db, users } from "@/db";
import { requireUser, totpSetup, totpCheck, makeRecoveryCodes, listSessions, destroyAllSessions, hashPassword, verifyPassword } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { PageHeader, Button, inputCls, Notice, formatDate } from "@/components/admin/ui";

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ setup?: string; codes?: string; msg?: string; error?: string }> }) {
  const me = await requireUser();
  const sp = await searchParams;
  const [user, sessions] = await Promise.all([db.query.users.findFirst({ where: eq(users.id, me.id) }), listSessions(me.id)]);
  if (!user) redirect("/admin/login");

  // 2FA setup: secret lives only in the form until confirmed
  let setup: { secret: string; qr: string } | null = null;
  if (sp.setup && !user.totpEnabledAt) {
    const s = totpSetup(user.email);
    setup = { secret: s.secret, qr: await QRCode.toDataURL(s.uri, { margin: 1, width: 180 }) };
  }

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

  async function enable2fa(fd: FormData) {
    "use server";
    const u = await requireUser();
    const secret = String(fd.get("secret") ?? "");
    const code = String(fd.get("code") ?? "");
    if (!(await totpCheck(secret, code))) redirect("/admin/account?setup=1&error=Code+didn%27t+match+%E2%80%94+try+again");
    const { plain, hashed } = makeRecoveryCodes();
    await db.update(users).set({ totpSecret: secret, totpEnabledAt: new Date(), recoveryCodes: hashed }).where(eq(users.id, u.id));
    await audit(u, "user", { recordId: u.id, meta: { totpEnabled: true } });
    redirect(`/admin/account?codes=${encodeURIComponent(plain.join(","))}`);
  }

  async function disable2fa(fd: FormData) {
    "use server";
    const u = await requireUser();
    const row = await db.query.users.findFirst({ where: eq(users.id, u.id) });
    if (!row || !(await verifyPassword(String(fd.get("password")), row.passwordHash))) redirect("/admin/account?error=Password+is+wrong");
    await db.update(users).set({ totpSecret: null, totpEnabledAt: null, recoveryCodes: [] }).where(eq(users.id, u.id));
    await audit(u, "user", { recordId: u.id, meta: { totpEnabled: false } });
    redirect("/admin/account?msg=Two-factor+disabled");
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
      <PageHeader title="My account" subtitle={`${user.name} · ${user.email} · ${user.role}`} />
      {sp.msg && <Notice kind="success">{sp.msg}</Notice>}
      {sp.error && <Notice kind="error">{sp.error}</Notice>}
      {sp.codes && (
        <Notice kind="info">
          <b>Two-factor is on.</b> Save these recovery codes somewhere safe — each works once if you lose your phone:
          <pre className="mt-2 rounded bg-white p-2 font-mono text-xs">{sp.codes.split(",").join("\n")}</pre>
        </Notice>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <section className="rounded-lg border border-neutral-200 bg-white p-5">
          <h2 className="font-semibold">Two-factor authentication</h2>
          {user.totpEnabledAt ? (
            <form action={disable2fa} className="mt-3 space-y-2 text-sm">
              <p className="text-green-800">Enabled since {formatDate(user.totpEnabledAt, { dateStyle: "medium" })}. {user.recoveryCodes.length} recovery codes left.</p>
              <input name="password" type="password" placeholder="Confirm with your password" className={inputCls} />
              <Button type="submit" variant="danger">Disable</Button>
            </form>
          ) : setup ? (
            <form action={enable2fa} className="mt-3 space-y-3 text-sm">
              <p>Scan with Google Authenticator, 1Password, Authy… then enter the 6-digit code.</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={setup.qr} alt="QR code" width={180} height={180} />
              <p className="font-mono text-xs text-neutral-500">Manual key: {setup.secret}</p>
              <input type="hidden" name="secret" value={setup.secret} />
              <input name="code" inputMode="numeric" placeholder="123456" required className={`${inputCls} max-w-[10rem]`} />
              <Button type="submit">Turn on</Button>
            </form>
          ) : (
            <div className="mt-3 text-sm">
              <p className="text-neutral-600">Adds a second step at sign-in with an authenticator app. Recommended for everyone who can publish.</p>
              <Link href="/admin/account?setup=1" className="mt-3 inline-block rounded bg-neutral-900 px-3 py-2 text-sm text-white">Set up</Link>
            </div>
          )}
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
