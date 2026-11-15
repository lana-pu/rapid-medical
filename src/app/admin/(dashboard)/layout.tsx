import { redirect } from "next/navigation";
import { destroySession, requireUser } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { DEMO, withBase } from "@/lib/demo";
import { unreadCount } from "@/admin/inbox";
import { AdminRail } from "@/components/admin/AdminRail";

export const metadata = { title: "Rapid Medical · Admin" };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  async function logout() {
    "use server";
    await audit(user, "logout");
    await destroySession();
    redirect("/admin/login");
  }

  const unread = await unreadCount();
  const ROLE: Record<string, string> = { editor: "Editor", designer: "Designer", admin: "Admin" };

  // four spaces on the rail; each space's layout adds its own column (docs/admin-ia.md)
  return (
    <div className="flex min-h-screen bg-neutral-50 text-neutral-900">
      <AdminRail unread={unread} editHref={DEMO ? withBase("/") : "/api/editor?on=1&redirect=%2F"} user={{ name: user.name, email: user.email, role: ROLE[user.role] ?? user.role }} logout={logout} />
      {children}
    </div>
  );
}
