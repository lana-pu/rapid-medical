import { elsewhere, inboxMessages } from "@/admin/inbox";
import { InboxShell } from "@/components/admin/InboxShell";
import { AdminMain } from "@/components/admin/AdminMain";

/** Inbox like Gmail: the list on the whole width; an open message beside a narrowed list (docs/screens/admin-inbox.md). */
export default async function InboxLayout({ children }: { children: React.ReactNode }) {
  const [messages, outside] = await Promise.all([inboxMessages(), elsewhere()]);
  return <InboxShell messages={messages} elsewhere={outside} detail={<AdminMain>{children}</AdminMain>} />;
}
