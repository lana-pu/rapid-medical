"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import type { Elsewhere, Message } from "@/admin/inbox";
import { MessageList } from "./MessageList";
import { UNDER_HEADER } from "./chrome";

/**
 * Inbox like Gmail (docs/screens/admin-inbox.md): with no message open the list takes the whole width; an open message
 * moves the list into a column beside it — from lg; below, only the message with «← Inbox» (docs/admin-ia.md →
 * «Адаптив»). The filters live here, so they stay while messages are opened and closed.
 */
export function InboxShell({ messages, elsewhere, me, detail }: { messages: Message[]; elsewhere: Elsewhere[]; me: number; detail: ReactNode }) {
  const wide = usePathname() === "/admin/inbox";
  const [state, setState] = useState("open");
  const [source, setSource] = useState("any");
  const [region, setRegion] = useState("any");
  const list = <MessageList messages={messages} elsewhere={elsewhere} me={me} state={state} source={source} region={region} onState={setState} onSource={setSource} onRegion={setRegion} wide={wide} />;
  if (wide) return list;
  return (
    <>
      <div className={`${UNDER_HEADER} hidden flex-none lg:flex`}>{list}</div>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="sticky top-12 z-30 flex h-11 flex-none items-center border-b border-neutral-200 bg-white px-2 lg:hidden">
          <Link href="/admin/inbox" className="rounded px-2 py-1.5 text-sm font-medium hover:bg-neutral-100">← Inbox</Link>
        </div>
        {detail}
      </div>
    </>
  );
}
