import { AdminMain } from "@/components/admin/AdminMain";

/** Search & sharing has its own list of pages: no Settings column next to it (docs/screens/admin-seo.md). */
export default function SeoLayout({ children }: { children: React.ReactNode }) {
  return <AdminMain>{children}</AdminMain>;
}
