import Link from "next/link";
import { redirect } from "next/navigation";
import { destroySession, requireUser } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { attention } from "@/admin/home";

export const metadata = { title: "Rapid Medical · Admin" };

/** After sign-in: the website or the training tool (docs/screens/admin-choose.md). */
export default async function Start() {
  const user = await requireUser();
  const todo = await attention(user);

  async function logout() {
    "use server";
    await audit(user, "logout");
    await destroySession();
    redirect("/admin/login");
  }

  return (
    <main className="min-h-screen bg-neutral-50 px-4 py-10 text-neutral-900">
      <div className="mx-auto max-w-3xl">
        <div className="mb-10 flex items-center justify-between text-sm">
          <span className="font-semibold">Rapid Medical</span>
          <span className="text-neutral-600">{user.name}</span>
        </div>
        <h1 className="mb-6 text-2xl font-semibold">What do you want to work on?</h1>
        <div className="grid gap-4 sm:grid-cols-2">
          <Link href="/admin" className="block rounded-xl border border-neutral-200 bg-white p-6 hover:border-neutral-900">
            <span className="block text-lg font-semibold">Website</span>
            <span className="mt-1 block text-sm text-neutral-600">Pages, Evidence, News, Team, Jobs, Webinars</span>
            <span className="mt-4 block text-sm font-medium">{todo.length ? `${todo.length} thing${todo.length > 1 ? "s" : ""} need${todo.length > 1 ? "" : "s"} your attention` : "Everything is live"}</span>
          </Link>
          <div aria-disabled="true" className="rounded-xl border border-dashed border-neutral-300 bg-white p-6 text-neutral-500">
            <span className="block text-lg font-semibold">Training tool</span>
            <span className="mt-1 block text-sm">TIGERTRIEVER courses, stages and videos</span>
            <span className="mt-4 block text-sm">Not built yet</span>
          </div>
        </div>
        <div className="mt-10 flex gap-4 text-sm text-neutral-600">
          <Link href="/admin/account" className="underline">My account</Link>
          <form action={logout}><button className="underline">Sign out</button></form>
        </div>
      </div>
    </main>
  );
}
