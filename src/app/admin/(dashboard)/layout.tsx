import Link from "next/link";
import { redirect } from "next/navigation";
import { destroySession, requireUser } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { DEMO, withBase } from "@/lib/demo";

export const metadata = { title: "Rapid Medical · Admin" };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  async function logout() {
    "use server";
    await audit(user, "logout");
    await destroySession();
    redirect("/admin/login");
  }

  // docs/screens/admin-home.md → «Меню слева»
  const nav = [
    { href: "/admin/editor", label: "Pages" },
    { href: "/admin/publications", label: "Evidence" },
    { href: "/admin/news", label: "News" },
    { href: "/admin/events", label: "Events" },
    { href: "/admin/webinars", label: "Webinars" },
    { href: "/admin/jobs", label: "Jobs" },
    { href: "/admin/team", label: "Team" },
    { href: "/admin/submissions", label: "Requests" },
    { href: "/admin/media", label: "Media library" },
    ...(user.role === "admin" ? [{ href: "/admin/users", label: "People and roles" }] : []),
    { href: "/admin/activity", label: "Activity" },
    { href: "/admin/settings", label: "Site settings" },
  ];
  const more = [
    { href: "/admin/solutions", label: "Therapies" },
    { href: "/admin/pages", label: "Text pages" },
    { href: "/admin/products", label: "Products" },
    { href: "/admin/redirects", label: "Redirects" },
    { href: "/admin/not-found-log", label: "Broken links" },
  ];
  const ROLE: Record<string, string> = { editor: "Editor", designer: "Designer", admin: "Admin" };

  return (
    <div className="flex min-h-screen bg-neutral-50 text-neutral-900">
      <aside className="flex w-60 flex-none flex-col border-r border-neutral-200 bg-white">
        <div className="border-b border-neutral-200 px-4 py-4">
          <Link href="/admin" className="text-sm font-semibold">Rapid Medical</Link>
          <div className="text-xs text-neutral-500">Content admin</div>
        </div>
        <nav className="flex-1 space-y-0.5 p-2 text-sm">
          {nav.map((n) => (
            <Link key={n.href} href={n.href} className="block rounded px-2 py-1.5 text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900">
              {n.label}
            </Link>
          ))}
          <details className="pt-2">
            <summary className="cursor-pointer rounded px-2 py-1.5 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900">More</summary>
            {more.map((n) => (
              <Link key={n.href} href={n.href} className="block rounded px-2 py-1.5 pl-4 text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900">
                {n.label}
              </Link>
            ))}
          </details>
        </nav>
        <div className="border-t border-neutral-200 p-3 text-xs text-neutral-500">
          <div className="truncate font-medium text-neutral-800">{user.name}</div>
          <div className="truncate">{user.email} · {ROLE[user.role] ?? user.role}</div>
          <Link href="/admin/account" className="mt-2 block underline hover:text-neutral-900">My account &amp; security</Link>
          <form action={logout} className="mt-1">
            <button className="underline hover:text-neutral-900">Sign out</button>
          </form>
          <Link href="/" className="mt-1 block underline hover:text-neutral-900" target="_blank">View site ↗</Link>
          <a href={DEMO ? withBase("/") : "/api/editor?on=1&redirect=%2F"} className="mt-1 block underline hover:text-neutral-900">Edit site ✎</a>
        </div>
      </aside>
      <main className="min-w-0 flex-1 p-8">
        {DEMO && <div className="mb-6 rounded border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">Admin preview (demo): everything is clickable, but Save / Publish only show a confirmation — nothing is stored.</div>}
        {children}
      </main>
    </div>
  );
}
