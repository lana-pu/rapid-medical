"use client";

import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import type { Elsewhere, Message } from "@/admin/inbox";
import { MessageList } from "./MessageList";
import { UNDER_HEADER } from "./chrome";

/**
 * Inbox like Gmail (docs/screens/admin-inbox.md): with no message open the list takes the whole width; an open message
 * moves the list into a column beside it. The filters live here, so they stay while messages are opened and closed.
 */
export function InboxShell({ messages, elsewhere, detail }: { messages: Message[]; elsewhere: Elsewhere[]; detail: ReactNode }) {
  const wide = usePathname() === "/admin/inbox";
  const [state, setState] = useState("inbox");
  const [source, setSource] = useState("any");
  const list = <MessageList messages={messages} elsewhere={elsewhere} state={state} source={source} onState={setState} onSource={setSource} wide={wide} />;
  if (wide) return list;
  return (
    <>
      <div className={`${UNDER_HEADER} flex flex-none`}>{list}</div>
      {detail}
    </>
  );
}
