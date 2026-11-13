import { redirect } from "next/navigation";
import { resolveEditorNext } from "@/lib/editing";
import { eq } from "drizzle-orm";
import { db, users } from "@/db";
import { getSession, totpCheck, consumeRecoveryCode, markSessionVerified, destroySession, codeAttemptsExhausted, recordWrongCode } from "@/lib/auth";
import { safeLocalPath } from "@/lib/safe-path";
import { audit } from "@/lib/audit";
import { inputCls } from "@/components/admin/ui";

export const metadata = { title: "Two-factor · Rapid Medical admin" };

export default async function TwoFactorPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const sp = await searchParams;
  const session = await getSession();
  if (!session) redirect("/admin/login");
  if (!session.totpPending) redirect(safeLocalPath(sp.next, "/admin/start"));

  async function verify(fd: FormData) {
    "use server";
    const s = await getSession();
    if (!s) redirect("/admin/login");
    const code = String(fd.get("code") ?? "").trim();
    const next = String(fd.get("next") ?? "/admin/start");
    const user = await db.query.users.findFirst({ where: eq(users.id, s.id) });
    // a 6-digit code must not be guessable: few tries, then the password again (security check 2026-11-13)
    if (await codeAttemptsExhausted(s.id)) {
      await destroySession();
      redirect("/admin/login?error=throttled");
    }
    const ok = user?.totpSecret ? (await totpCheck(user.totpSecret, code)) || (await consumeRecoveryCode(s.id, code)) : false;
    if (!ok) {
      await audit(s, "login_failed", { meta: { step: "2fa" } });
      if (await recordWrongCode(s.id)) {
        await destroySession();
        redirect("/admin/login?error=throttled");
      }
      redirect(`/admin/login/2fa?error=1&next=${encodeURIComponent(safeLocalPath(next, "/admin/start"))}`);
    }
    await markSessionVerified();
    await audit(s, "login", { meta: { step: "2fa" } });
    const editorPath = await resolveEditorNext(next);
    redirect(editorPath ?? (safeLocalPath(next, "").startsWith("/admin") ? next : "/admin/start"));
  }

  async function cancel() {
    "use server";
    await destroySession();
    redirect("/admin/login");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-100 p-6">
      <form action={verify} className="w-full max-w-sm space-y-4 rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
        <h1 className="text-lg font-semibold">Two-factor authentication</h1>
        <p className="text-sm text-neutral-600">Enter the 6-digit code from your authenticator app, or a recovery code.</p>
        {sp.error && <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">That code didn’t work.</p>}
        <input type="hidden" name="next" value={sp.next ?? "/admin/start"} />
        <input name="code" inputMode="numeric" autoComplete="one-time-code" autoFocus required className={`${inputCls} text-center text-lg tracking-widest`} />
        <button className="w-full rounded bg-neutral-900 px-3 py-2 text-sm font-medium text-white">Verify</button>
        <button formAction={cancel} className="w-full text-xs text-neutral-500 underline">Cancel and sign out</button>
      </form>
    </main>
  );
}
