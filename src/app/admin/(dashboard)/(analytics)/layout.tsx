import { AdminMain } from "@/components/admin/AdminMain";

/** Analytics: full width, no second column (docs/screens/admin-analytics.md). */
export default function AnalyticsLayout({ children }: { children: React.ReactNode }) {
  return <AdminMain>{children}</AdminMain>;
}
