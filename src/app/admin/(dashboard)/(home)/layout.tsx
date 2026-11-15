import { AdminMain } from "@/components/admin/AdminMain";

/** The dashboard: above the projects, no second column (docs/admin-ia.md → «Уточнения 2026-11-15»). */
export default function HomeLayout({ children }: { children: React.ReactNode }) {
  return <AdminMain>{children}</AdminMain>;
}
