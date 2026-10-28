import { redirect } from "next/navigation";
import { authenticate, createSession, getSession } from "@/lib/auth";
import { inputCls } from "@/components/admin/ui";

export const metadata = { title: "Sign in · Rapid Medical admin" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const sp = await searchParams;
  if (await getSession()) redirect(sp.next ?? "/admin");

  async function login(fd: FormData) {
    "use server";
    const email = String(fd.get("email") ?? "");
    const password = String(fd.get("password") ?? "");
    const next = String(fd.get("next") ?? "/admin");
    const user = await authenticate(email, password);
    if (!user) redirect(`/admin/login?error=1&next=${encodeURIComponent(next)}`);
    await createSession(user);
    redirect(next.startsWith("/admin") ? next : "/admin");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-100 p-6">
      <form action={login} className="w-full max-w-sm space-y-4 rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
        <h1 className="text-lg font-semibold">Rapid Medical · Admin</h1>
        {sp.error && <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">Invalid email or password.</p>}
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
      </form>
    </main>
  );
}
