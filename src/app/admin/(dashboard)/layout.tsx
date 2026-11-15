import { requireUser } from "@/lib/auth";
import { DEMO, withBase } from "@/lib/demo";
import { unreadCount } from "@/admin/inbox";
import { AdminRail } from "@/components/admin/AdminRail";
import { ProjectBar } from "@/components/admin/ProjectBar";
import { NavTracker } from "@/components/admin/BackLink";

export const metadata = { title: "Rapid Medical · Admin" };

const ROLE: Record<string, string> = { editor: "Editor", designer: "Designer", admin: "Admin" };

/**
 * Inside the Website project (docs/admin-ia.md → «проект отдельно»): the project in the header with an arrow back to
 * the previous page, its spaces on the rail; each space's layout adds its own column.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const unread = await unreadCount();

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      <NavTracker />
      <ProjectBar
        project={{ name: "Website", icon: "🌐", href: "/admin/website" }}
        editHref={DEMO ? withBase("/") : "/api/editor?on=1&redirect=%2F"}
        user={{ name: user.name, email: user.email, role: ROLE[user.role] ?? user.role }}
      />
      <div className="flex">
        <AdminRail unread={unread} />
        {children}
      </div>
    </div>
  );
}
