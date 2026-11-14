import { redirect } from "next/navigation";
import { destroySession, requireUser } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { DEMO, withBase } from "@/lib/demo";
import { siteTree, newRequestCount } from "@/admin/site-tree";
import { AdminRail } from "@/components/admin/AdminRail";
import { SiteTree } from "@/components/admin/SiteTree";

export const metadata = { title: "Rapid Medical · Admin" };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  async function logout() {
    "use server";
    await audit(user, "logout");
    await destroySession();
    redirect("/admin/login");
  }

  const [tree, requests] = await Promise.all([siteTree(), newRequestCount()]);
  const ROLE: Record<string, string> = { editor: "Editor", designer: "Designer", admin: "Admin" };

  // functions (rail) apart from the site's navigation (tree): docs/screens/admin-sections.md → «Меню слева»
  return (
    <div className="flex min-h-screen bg-neutral-50 text-neutral-900">
      <AdminRail
        requests={requests}
        editHref={DEMO ? withBase("/") : "/api/editor?on=1&redirect=%2F"}
        user={{ name: user.name, email: user.email, role: ROLE[user.role] ?? user.role }}
        isAdmin={user.role === "admin"}
        logout={logout}
      />
      <SiteTree tree={tree} />
      <main className="min-w-0 flex-1 p-8">
        {DEMO && <div className="mb-6 rounded border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">Admin preview (demo): everything is clickable, but Save / Publish only show a confirmation — nothing is stored.</div>}
        {children}
      </main>
    </div>
  );
}
