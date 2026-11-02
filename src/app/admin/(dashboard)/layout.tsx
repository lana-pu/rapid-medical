import Link from "next/link";
import { redirect } from "next/navigation";
import { destroySession, requireUser } from "@/lib/auth";
import { RESOURCES } from "@/admin/resources";

export const metadata = { title: "Rapid Medical · Admin" };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  async function logout() {
    "use server";
    await destroySession();
    redirect("/admin/login");
  }

  const nav = [
    { href: "/admin", label: "Dashboard" },
    ...RESOURCES.filter((r) => !["redirects", "products"].includes(r.slug)).map((r) => ({ href: `/admin/${r.slug}`, label: r.title })),
    { href: "/admin/products", label: "Products" },
    { href: "/admin/settings", label: "Site settings" },
    { href: "/admin/media", label: "Media" },
    { href: "/admin/submissions", label: "Form submissions" },
    { href: "/admin/redirects", label: "Redirects" },
    ...(user.role === "admin" ? [{ href: "/admin/users", label: "Users" }] : []),
  ];

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
        </nav>
        <div className="border-t border-neutral-200 p-3 text-xs text-neutral-500">
          <div className="truncate font-medium text-neutral-800">{user.name}</div>
          <div className="truncate">{user.email} · {user.role}</div>
          <form action={logout} className="mt-2">
            <button className="underline hover:text-neutral-900">Sign out</button>
          </form>
          <Link href="/" className="mt-1 block underline hover:text-neutral-900" target="_blank">View site ↗</Link>
        </div>
      </aside>
      <main className="min-w-0 flex-1 p-8">{children}</main>
    </div>
  );
}
