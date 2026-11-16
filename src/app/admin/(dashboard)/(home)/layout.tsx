import { AdminMain } from "@/components/admin/AdminMain";

/** The project's Home: no second column (docs/screens/admin-home.md). */
export default function HomeLayout({ children }: { children: React.ReactNode }) {
  return <AdminMain>{children}</AdminMain>;
}
