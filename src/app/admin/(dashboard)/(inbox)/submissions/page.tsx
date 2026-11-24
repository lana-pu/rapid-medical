import { redirect } from "next/navigation";

/** No separate table of requests: the list is the Inbox (docs/screens/admin-requests.md → «Список», 2026-11-24). */
export default function SubmissionsPage() {
  redirect("/admin/inbox");
}
