import Link from "next/link";
import { redirect } from "next/navigation";
import { createPasswordReset, consumePasswordReset } from "@/lib/auth";
import { sendMail } from "@/lib/mail";
import { audit } from "@/lib/audit";
import { inputCls } from "@/components/admin/ui";

export const metadata = { title: "Reset password · Rapid Medical admin" };

export default async function ResetPage({ searchParams }: { searchParams: Promise<{ token?: string; sent?: string; error?: string }> }) {
  const sp = await searchParams;

  async function request(fd: FormData) {
    "use server";
    const email = String(fd.get("email") ?? "");
    const r = await createPasswordReset(email);
    if (r) {
      const base = process.env.NEXT_PUBLIC_SITE_URL ?? "";
      await sendMail({
        to: r.user.email,
        subject: "Reset your Rapid Medical admin password",
        text: `Hi ${r.user.name},\n\nUse this link to set a new password (valid for 1 hour):\n${base}/admin/reset?token=${r.token}\n\nIf you didn't ask for this, ignore this email.`,
      }).catch((e) => console.error("reset mail failed", e));
      await audit(null, "user", { recordId: r.user.id, label: r.user.email, meta: { passwordResetRequested: true } });
    }
    // Same response whether or not the email exists
    redirect("/admin/reset?sent=1");
  }

  async function set(fd: FormData) {
    "use server";
    const token = String(fd.get("token") ?? "");
    const password = String(fd.get("password") ?? "");
    if (password.length < 10) redirect(`/admin/reset?token=${token}&error=short`);
    const user = await consumePasswordReset(token, password);
    if (!user) redirect("/admin/reset?error=expired");
    await audit({ id: user.id, email: user.email, name: user.name, role: user.role }, "user", { recordId: user.id, meta: { passwordReset: true } });
    redirect("/admin/login?reset=1");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-100 p-6">
      {sp.token ? (
        <form action={set} className="w-full max-w-sm space-y-4 rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
          <h1 className="text-lg font-semibold">Choose a new password</h1>
          {sp.error === "short" && <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">Use at least 10 characters.</p>}
          <input type="hidden" name="token" value={sp.token} />
          <input name="password" type="password" minLength={10} required autoComplete="new-password" placeholder="New password (10+ characters)" className={inputCls} />
          <button className="w-full rounded bg-neutral-900 px-3 py-2 text-sm font-medium text-white">Set password</button>
        </form>
      ) : (
        <form action={request} className="w-full max-w-sm space-y-4 rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
          <h1 className="text-lg font-semibold">Reset password</h1>
          {sp.sent ? (
            <p className="rounded bg-green-50 px-3 py-2 text-sm text-green-800">If that address has an account, a reset link is on its way (valid 1 hour).</p>
          ) : (
            <>
              {sp.error === "expired" && <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">That link is invalid or has expired. Request a new one.</p>}
              <input name="email" type="email" required placeholder="Your email" className={inputCls} />
              <button className="w-full rounded bg-neutral-900 px-3 py-2 text-sm font-medium text-white">Send reset link</button>
            </>
          )}
          <p className="text-center text-xs"><Link href="/admin/login" className="text-neutral-500 underline">Back to sign in</Link></p>
        </form>
      )}
    </main>
  );
}
