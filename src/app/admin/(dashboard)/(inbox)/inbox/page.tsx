import { requireUser } from "@/lib/auth";

/** Inbox with no message open: the list itself takes the whole width (docs/screens/admin-inbox.md). */
export default async function InboxHome() {
  await requireUser();
  return null;
}
