import Link from "next/link";
import { redirect } from "next/navigation";
import { resolveEditorNext } from "@/lib/editing";
import { authenticate, createSession, getSession } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { inputCls } from "@/components/admin/ui";

export const metadata = { title: "Sign in · Rapid Medical admin" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string; reset?: string }> }) {
  const sp = await searchParams;
  const session = await getSession();
  if (session && !session.totpPending) redirect(sp.next ?? "/admin");

  async function login(fd: FormData) {
    "use server";
    const email = String(fd.get("email") ?? "");
    const password = String(fd.get("password") ?? "");
    const next = String(fd.get("next") ?? "/admin");
    const result = await authenticate(email, password);
    if (!result.ok) {
      await audit(null, "login_failed", { meta: { email, reason: result.reason } });
      redirect(`/admin/login?error=${result.reason}&next=${encodeURIComponent(next)}`);
    }
    const { needsTotp } = await createSession(result.user);
    const u = result.user;
    await audit({ id: u.id, email: u.email, name: u.name, role: u.role }, "login", { meta: needsTotp ? { step: "password" } : {} });
    const target = next.startsWith("/admin") || next.startsWith("/api/editor") ? next : "/admin";
    if (needsTotp) redirect(`/admin/login/2fa?next=${encodeURIComponent(target)}`);
    const editorPath = await resolveEditorNext(target);
    redirect(editorPath ?? target);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-100 p-6">
      <form action={login} className="w-full max-w-sm space-y-4 rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
        <h1 className="text-lg font-semibold">Rapid Medical · Admin</h1>
        {sp.error === "invalid" && <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">Invalid email or password.</p>}
        {sp.error === "throttled" && <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">Too many attempts. Try again in 15 minutes.</p>}
        {sp.reset && <p className="rounded bg-green-50 px-3 py-2 text-sm text-green-800">Password updated. Please sign in.</p>}
        <input type="hidden" name="next" value={sp.next ?? "/admin"} />
        <div>
          <label className="mb-1 block text-sm font-medium">Email</label>
          <input name="email" type="email" required autoComplete="username" className={inputCls} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Password</label>
          <input name="password" type="password" required autoComplete="current-password" className={inputCls} />
        </div>
        <button className="w-full rounded bg-neutral-900 px-3 py-2 text-sm font-medium text-white hover:bg-neutral-700">Sign in</button>
        <p className="text-center text-xs"><Link href="/admin/reset" className="text-neutral-500 underline">Forgot your password?</Link></p>
      </form>
    </main>
  );
}
