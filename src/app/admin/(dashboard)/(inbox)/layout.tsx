import { elsewhere, inboxMessages } from "@/admin/inbox";
import { InboxShell } from "@/components/admin/InboxShell";
import { AdminMain } from "@/components/admin/AdminMain";
import { requireUser } from "@/lib/auth";

/** Inbox like Gmail: the list on the whole width; an open message beside a narrowed list (docs/screens/admin-inbox.md). */
export default async function InboxLayout({ children }: { children: React.ReactNode }) {
  const [me, messages, outside] = await Promise.all([requireUser(), inboxMessages(), elsewhere()]);
  return <InboxShell messages={messages} elsewhere={outside} me={me.id} detail={<AdminMain>{children}</AdminMain>} />;
}
