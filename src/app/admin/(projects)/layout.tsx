import { requireUser } from "@/lib/auth";
import { ProjectBar } from "@/components/admin/ProjectBar";

export const metadata = { title: "Rapid Medical · Admin" };

const ROLE: Record<string, string> = { editor: "Editor", designer: "Designer", admin: "Admin" };

/** The project picker: the company and the account in the header, no project spaces yet (docs/screens/admin-choose.md). */
export default async function ProjectsLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      <ProjectBar user={{ name: user.name, email: user.email, role: ROLE[user.role] ?? user.role }} />
      <main className="px-8 py-12">{children}</main>
    </div>
  );
}
