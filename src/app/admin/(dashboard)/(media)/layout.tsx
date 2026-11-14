import { AdminMain } from "@/components/admin/AdminMain";

/** Media: the library, full width — no second column (docs/admin-ia.md). */
export default function MediaLayout({ children }: { children: React.ReactNode }) {
  return <AdminMain>{children}</AdminMain>;
}
