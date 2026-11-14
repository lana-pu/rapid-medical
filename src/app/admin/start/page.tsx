import { redirect } from "next/navigation";

/** The old «website or training tool» choice: the admin opens on the Inbox now (docs/admin-ia.md). */
export default function Start() {
  redirect("/admin");
}
