"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { Elsewhere, Message } from "@/admin/inbox";
import { UNDER_HEADER } from "./chrome";

/**
 * Inbox — the list of messages, like a mail client (docs/screens/admin-inbox.md): every folder always shown, unread in
 * bold, the open message on the right. Admin chrome: its own neutral palette.
 */
type Folder = { key: string; label: string; test: (m: Message) => boolean; empty: string };
const open = (m: Message) => m.kind === "note" || (m.status !== "done" && m.status !== "spam");
const FOLDERS: Folder[] = [
  { key: "inbox", label: "Inbox", test: open, empty: "Nothing waiting. Everything sent through the site's forms and the team's notes on pages arrives here." },
  { key: "unread", label: "Unread", test: (m) => m.unread, empty: "Everything is read." },
  { key: "contact", label: "Contact", test: (m) => m.folder === "contact" && open(m), empty: "Requests from the Contact Us page arrive here: demos, orders, IFU, support." },
  { key: "webinar", label: "Webinars", test: (m) => m.folder === "webinar" && open(m), empty: "Requests for webinar recordings from the Webinars page arrive here." },
  { key: "careers", label: "Careers", test: (m) => m.folder === "careers" && open(m), empty: "Applications from the Careers page and from job pages without an outside Apply link arrive here." },
  { key: "event", label: "Events", test: (m) => m.folder === "event" && open(m), empty: "Registrations for events with a registration form arrive here." },
  { key: "subscribed", label: "Subscribed", test: (m) => !!m.optIn && m.status !== "spam", empty: "Nobody has ticked “News and updates” in a form yet." },
  { key: "notes", label: "Notes on pages", test: (m) => m.kind === "note", empty: "No open notes. Notes the team leaves on pages in the editor arrive here." },
  { key: "done", label: "Done", test: (m) => m.status === "done", empty: "Nothing marked done yet." },
  { key: "spam", label: "Spam", test: (m) => m.status === "spam", empty: "No spam." },
];

const when = (iso: string) => {
  const d = new Date(iso);
  const today = new Date();
  return d.toDateString() === today.toDateString()
    ? d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
    : d.toLocaleDateString("en-GB", { day: "numeric", month: "short", ...(d.getFullYear() !== today.getFullYear() ? { year: "numeric" } : {}) });
};

export function MessageList({ messages, elsewhere = [] }: { messages: Message[]; elsewhere?: Elsewhere[] }) {
  const path = usePathname();
  const [folder, setFolder] = useState("inbox");
  const [q, setQ] = useState("");
  const f = FOLDERS.find((x) => x.key === folder) ?? FOLDERS[0];
  const needle = q.trim().toLowerCase();
  const shown = messages.filter((m) => f.test(m) && (!needle || `${m.from} ${m.subject} ${m.snippet}`.toLowerCase().includes(needle)));
  const outside = elsewhere.filter((x) => x.folder === folder);
  const people = (n: number) => `${n} click${n === 1 ? "" : "s"}`;

  return (
    <nav aria-label="Inbox" className={`${UNDER_HEADER} flex w-96 flex-none flex-col border-r border-neutral-200 bg-white`}>
      <div className="space-y-2 border-b border-neutral-200 px-3 pb-3 pt-4">
        <div className="flex items-baseline justify-between px-1">
          <h2 className="text-base font-semibold">Inbox</h2>
          <Link href="/admin/submissions" className="text-xs text-neutral-500 underline hover:text-neutral-900">All requests as a table · Export</Link>
        </div>
        <div role="tablist" aria-label="Folders" className="flex flex-wrap gap-1">
          {FOLDERS.map((x) => {
            const mine = messages.filter(x.test);
            // Subscribed counts people; the others count what is unread; Done and Spam count nothing
            const n = x.key === "subscribed" ? new Set(mine.map((m) => (m.email ?? m.from).trim().toLowerCase())).size : x.key === "done" || x.key === "spam" ? 0 : mine.filter((m) => m.unread).length;
            return (
              <button key={x.key} type="button" role="tab" aria-selected={folder === x.key} onClick={() => setFolder(x.key)} className={`rounded-full px-2.5 py-0.5 text-xs ${folder === x.key ? "bg-neutral-900 text-white" : mine.length ? "bg-neutral-100 text-neutral-700 hover:bg-neutral-200" : "bg-neutral-50 text-neutral-400 hover:bg-neutral-100"}`}>
                {x.label}
                {n > 0 && <span className={`ml-1 ${x.key === "subscribed" ? "" : "font-semibold"}`}>{n}</span>}
              </button>
            );
          })}
        </div>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search messages" aria-label="Search messages" className="w-full rounded border border-neutral-300 px-2 py-1.5 text-sm" />
      </div>
      <ul aria-label="Messages" className="flex-1 divide-y divide-neutral-100 overflow-y-auto">
        {folder === "subscribed" && (
          <li className="flex items-center justify-between gap-2 bg-neutral-50 px-4 py-2 text-xs text-neutral-600">
            <span>People who ticked “News and updates”.</span>
            <a href="/api/admin/submissions.csv?subscribed=1" className="shrink-0 font-medium text-neutral-900 underline">Export for Mailchimp</a>
          </li>
        )}
        {outside.map((x) => (
          <li key={x.key}>
            <Link href={x.href} className="block bg-neutral-50 px-4 py-3 text-xs text-neutral-600 hover:bg-neutral-100" aria-label={`${x.title} — outside the site`}>
              <span className="block text-sm font-medium text-neutral-800">{x.title}</span>
              {x.folder === "event" ? `Registration on ${x.where}` : `Applications go to ${x.where}`} — they do not come here.{" "}
              {people(x.clicks)} on {x.button} in 30 days.
            </Link>
          </li>
        ))}
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
        {!shown.length && <li className="p-6 text-center text-sm text-neutral-500">{needle ? "Nothing matches." : f.empty}</li>}
      </ul>
    </nav>
  );
}
