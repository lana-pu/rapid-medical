"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { Message } from "@/admin/inbox";

/**
 * Inbox — the list of messages, like a mail client (docs/admin-ia.md → «Уточнения 2026-11-15»): folders on top,
 * unread in bold, the open message on the right. Admin chrome: its own neutral palette.
 */
type Folder = { key: string; label: string; test: (m: Message) => boolean };
const open = (m: Message) => m.kind === "note" || (m.status !== "done" && m.status !== "spam");
const FOLDERS: Folder[] = [
  { key: "inbox", label: "Inbox", test: open },
  { key: "unread", label: "Unread", test: (m) => m.unread },
  { key: "contact", label: "Contact", test: (m) => m.folder === "contact" && open(m) },
  { key: "webinar", label: "Webinars", test: (m) => m.folder === "webinar" && open(m) },
  { key: "careers", label: "Careers", test: (m) => m.folder === "careers" && open(m) },
  { key: "event", label: "Events", test: (m) => m.folder === "event" && open(m) },
  { key: "notes", label: "Notes on pages", test: (m) => m.kind === "note" },
  { key: "done", label: "Done", test: (m) => m.status === "done" },
  { key: "spam", label: "Spam", test: (m) => m.status === "spam" },
];

const when = (iso: string) => {
  const d = new Date(iso);
  const today = new Date();
  return d.toDateString() === today.toDateString()
    ? d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
    : d.toLocaleDateString("en-GB", { day: "numeric", month: "short", ...(d.getFullYear() !== today.getFullYear() ? { year: "numeric" } : {}) });
};

export function MessageList({ messages }: { messages: Message[] }) {
  const path = usePathname();
  const [folder, setFolder] = useState("inbox");
  const [q, setQ] = useState("");
  const f = FOLDERS.find((x) => x.key === folder) ?? FOLDERS[0];
  const needle = q.trim().toLowerCase();
  const shown = messages.filter((m) => f.test(m) && (!needle || `${m.from} ${m.subject} ${m.snippet}`.toLowerCase().includes(needle)));
  const folders = FOLDERS.filter((x) => ["inbox", "unread", "notes", "done"].includes(x.key) || messages.some(x.test));

  return (
    <nav aria-label="Inbox" className="sticky top-0 flex h-screen w-96 flex-none flex-col border-r border-neutral-200 bg-white">
      <div className="space-y-2 border-b border-neutral-200 px-3 pb-3 pt-4">
        <div className="flex items-baseline justify-between px-1">
          <h2 className="text-base font-semibold">Inbox</h2>
          <Link href="/admin/submissions" className="text-xs text-neutral-500 underline hover:text-neutral-900">All requests as a table · Export</Link>
        </div>
        <div role="tablist" aria-label="Folders" className="flex flex-wrap gap-1">
          {folders.map((x) => {
            const n = messages.filter((m) => x.test(m) && m.unread).length;
            return (
              <button key={x.key} type="button" role="tab" aria-selected={folder === x.key} onClick={() => setFolder(x.key)} className={`rounded-full px-2.5 py-0.5 text-xs ${folder === x.key ? "bg-neutral-900 text-white" : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"}`}>
                {x.label}
                {n > 0 && x.key !== "done" && x.key !== "spam" && <span className="ml-1 font-semibold">{n}</span>}
              </button>
            );
          })}
        </div>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search messages" aria-label="Search messages" className="w-full rounded border border-neutral-300 px-2 py-1.5 text-sm" />
      </div>
      <ul aria-label="Messages" className="flex-1 divide-y divide-neutral-100 overflow-y-auto">
        {shown.map((m) => {
          const here = path === m.href;
          const body = (
            <>
              <span className="flex items-baseline gap-2">
                {m.unread && <span aria-label="unread" className="h-2 w-2 shrink-0 translate-y-[-1px] rounded-full bg-blue-600" />}
                <span className={`min-w-0 flex-1 truncate text-sm ${m.unread ? "font-semibold text-neutral-900" : "text-neutral-700"}`}>{m.from}</span>
                <span className="shrink-0 text-xs text-neutral-500">{when(m.at)}</span>
              </span>
              <span className={`block truncate text-sm ${m.unread ? "font-medium text-neutral-900" : "text-neutral-600"}`}>{m.subject}</span>
              {m.snippet && <span className="line-clamp-2 text-xs text-neutral-500">{m.snippet}</span>}
            </>
          );
          return (
            <li key={m.key}>
              {m.external ? (
                <a href={m.href} className="block px-4 py-3 hover:bg-neutral-50" title="Opens the page in the editor, at the note">{body}</a>
              ) : (
                <Link href={m.href} aria-current={here ? "page" : undefined} className={`block px-4 py-3 ${here ? "bg-blue-50" : "hover:bg-neutral-50"}`}>{body}</Link>
              )}
            </li>
          );
        })}
        {!shown.length && <li className="p-6 text-center text-sm text-neutral-500">{needle ? "Nothing matches." : "No messages here."}</li>}
      </ul>
    </nav>
  );
}
