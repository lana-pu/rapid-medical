import Link from "next/link";
import { redirect } from "next/navigation";
import { destroySession, requireUser } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { DEMO, withBase } from "@/lib/demo";
import { SECTIONS } from "@/admin/site-sections";

export const metadata = { title: "Rapid Medical · Admin" };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  async function logout() {
    "use server";
    await audit(user, "logout");
    await destroySession();
    redirect("/admin/login");
  }

  // the site's sections, in the order of the site's menu (docs/screens/admin-sections.md)
  const groups = [
    { title: "Website", items: SECTIONS.map((x) => ({ href: `/admin/site/${x.key}`, label: x.title })) },
    { title: "Work", items: [{ href: "/admin/submissions", label: "Requests" }, { href: "/admin/media", label: "Media library" }, { href: "/admin/activity", label: "Activity" }] },
    {
      title: "Admin",
      items: [
        ...(user.role === "admin" ? [{ href: "/admin/users", label: "People and roles" }] : []),
        { href: "/admin/settings", label: "Site settings" },
        { href: "/admin/redirects", label: "Redirects" },
        { href: "/admin/not-found-log", label: "Broken links" },
      ],
    },
  ];
  const ROLE: Record<string, string> = { editor: "Editor", designer: "Designer", admin: "Admin" };

  return (
    <div className="flex min-h-screen bg-neutral-50 text-neutral-900">
      <aside className="flex w-60 flex-none flex-col border-r border-neutral-200 bg-white">
        <div className="border-b border-neutral-200 px-4 py-4">
          <Link href="/admin" className="text-sm font-semibold">Rapid Medical</Link>
          <div className="text-xs text-neutral-500">Content admin</div>
        </div>
        <nav className="flex-1 space-y-4 overflow-y-auto p-2 text-sm" aria-label="Admin">
          <Link href="/admin/editor" className="block rounded bg-neutral-100 px-2 py-1.5 font-medium text-neutral-900 hover:bg-neutral-200">Find a page</Link>
          {groups.map((g) => (
            <div key={g.title}>
              <div className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wide text-neutral-400">{g.title}</div>
              {g.items.map((n) => (
                <Link key={n.href} href={n.href} className="block rounded px-2 py-1.5 text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900">
                  {n.label}
                </Link>
              ))}
            </div>
          ))}
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
