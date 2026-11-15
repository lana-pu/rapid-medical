import { elsewhere, inboxMessages } from "@/admin/inbox";
import { MessageList } from "@/components/admin/MessageList";
import { AdminMain } from "@/components/admin/AdminMain";

/** Inbox: the messages in the second column, the open one on the right — like mail (docs/admin-ia.md). */
export default async function InboxLayout({ children }: { children: React.ReactNode }) {
  const [messages, outside] = await Promise.all([inboxMessages(), elsewhere()]);
  return (
    <>
      <MessageList messages={messages} elsewhere={outside} />
      <AdminMain>{children}</AdminMain>
    </>
  );
}
