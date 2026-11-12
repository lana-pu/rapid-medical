import { redirect } from "next/navigation";
import { acceptInvite, inviteFor } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { inputCls } from "@/components/admin/ui";

export const metadata = { title: "Welcome · Rapid Medical admin" };

/** The invite link: choose a password, then two-step sign-in (docs/screens/admin-people.md). */
export default async function Welcome({ searchParams }: { searchParams: Promise<{ token?: string; error?: string }> }) {
  const sp = await searchParams;
  const token = sp.token ?? "";
  const person = await inviteFor(token);

  async function accept(fd: FormData) {
    "use server";
    const t = String(fd.get("token") ?? "");
    const password = String(fd.get("password") ?? "");
    if (password.length < 10) redirect(`/admin/welcome?token=${t}&error=short`);
    const u = await acceptInvite(t, password);
    if (!u) redirect("/admin/welcome");
    await audit({ id: u.id, email: u.email, name: u.name, role: u.role }, "user", { recordId: u.id, meta: { inviteAccepted: true } });
    redirect("/admin/login/setup");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-100 p-6">
      {person ? (
        <form action={accept} className="w-full max-w-sm space-y-4 rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
          <h1 className="text-lg font-semibold">Welcome, {person.name}</h1>
          <p className="text-sm text-neutral-600">Choose a password for {person.email}. Next you will set up two-step sign-in with an app on your phone.</p>
          {sp.error === "short" && <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">Use at least 10 characters.</p>}
          <input type="hidden" name="token" value={token} />
          <input name="password" type="password" minLength={10} required autoComplete="new-password" placeholder="Password (10+ characters)" aria-label="Password" className={inputCls} />
          <button className="w-full rounded bg-neutral-900 px-3 py-2 text-sm font-medium text-white">Continue</button>
        </form>
      ) : (
        <div className="w-full max-w-sm rounded-lg border border-neutral-200 bg-white p-6 text-sm shadow-sm">
          <h1 className="mb-2 text-lg font-semibold">This link has expired</h1>
          <p className="text-neutral-600">Ask your admin for a new one.</p>
        </div>
      )}
    </main>
  );
}
