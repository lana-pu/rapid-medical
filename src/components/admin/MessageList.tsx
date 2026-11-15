"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Elsewhere, Message } from "@/admin/inbox";

/**
 * Inbox — a mail list (docs/screens/admin-inbox.md): two levels of filters (state; which form it came from), the whole
 * width while no message is open, a column beside the open one. Admin chrome: its own neutral palette.
 */

type Filter = { key: string; label: string; test: (m: Message) => boolean };
const open = (m: Message) => m.kind === "note" || (m.status !== "done" && m.status !== "spam");

/** Level 1: the state of a message. */
export const STATES: (Filter & { count: boolean })[] = [
  { key: "inbox", label: "Inbox", test: open, count: true },
  { key: "unread", label: "Unread", test: (m) => m.unread, count: true },
  { key: "progress", label: "In progress", test: (m) => m.status === "in_progress", count: true },
  { key: "done", label: "Done", test: (m) => m.status === "done", count: false },
  { key: "spam", label: "Spam", test: (m) => m.status === "spam", count: false },
  { key: "all", label: "All", test: (m) => m.status !== "spam", count: false },
];

/** Level 2: where on the site it came from — every form of the site, the team's notes, and who subscribed. */
export const SOURCES: (Filter & { empty: string; short: string })[] = [
  { key: "any", label: "All sources", short: "", test: () => true, empty: "Everything sent through the site's forms and the team's notes on pages arrives here." },
  { key: "contact", label: "Contact Us — contact form", short: "Contact", test: (m) => m.folder === "contact", empty: "Requests from the Contact Us page arrive here: demos, orders, IFU, support." },
  { key: "webinar", label: "Webinars — recording requests", short: "Webinars", test: (m) => m.folder === "webinar", empty: "Requests for webinar recordings from the Webinars page arrive here." },
  { key: "careers", label: "Careers & jobs — applications", short: "Careers", test: (m) => m.folder === "careers", empty: "Applications from the Careers page and from job pages without an outside Apply link arrive here." },
  { key: "event", label: "Events — registrations", short: "Events", test: (m) => m.folder === "event", empty: "Registrations for events with a registration form arrive here." },
  { key: "notes", label: "Notes on pages (the team)", short: "Note", test: (m) => m.kind === "note", empty: "Notes the team leaves on pages in the editor arrive here." },
  { key: "subscribed", label: "Subscribed to news", short: "", test: (m) => !!m.optIn, empty: "Nobody has ticked “News and updates” in a form here yet." },
];

const sourceOf = (m: Message) => SOURCES.find((s) => s.key !== "any" && s.key !== "subscribed" && s.test(m))?.short ?? "";

const when = (iso: string) => {
  const d = new Date(iso);
  const today = new Date();
  return d.toDateString() === today.toDateString()
    ? d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
    : d.toLocaleDateString("en-GB", { day: "numeric", month: "short", ...(d.getFullYear() !== today.getFullYear() ? { year: "numeric" } : {}) });
};

export function MessageList({ messages, elsewhere = [], state, source, onState, onSource, wide }: {
  messages: Message[];
  elsewhere?: Elsewhere[];
  state: string;
  source: string;
  onState: (key: string) => void;
  onSource: (key: string) => void;
  /** no message open: the list takes the whole width */
  wide: boolean;
}) {
  const path = usePathname();
  const st = STATES.find((x) => x.key === state) ?? STATES[0];
  const src = SOURCES.find((x) => x.key === source) ?? SOURCES[0];
  const inState = messages.filter(st.test);
  const shown = inState.filter(src.test);
  const outside = elsewhere.filter((x) => x.folder === source);
  const clicks = (n: number) => `${n} click${n === 1 ? "" : "s"}`;
  const subscribers = new Set(messages.filter((m) => m.optIn && m.status !== "spam").map((m) => (m.email ?? m.from).trim().toLowerCase())).size;

  return (
    <nav aria-label="Inbox" className={wide ? "min-w-0 flex-1 bg-white" : "flex w-96 flex-none flex-col border-r border-neutral-200 bg-white"}>
      <div className={`space-y-2 border-b border-neutral-200 bg-white pb-3 pt-4 ${wide ? "sticky top-12 z-10 px-6" : "px-3"}`}>
        <div className="flex items-baseline justify-between gap-3 px-1">
          <h2 className="text-base font-semibold">Inbox</h2>
          <Link href="/admin/submissions" className="text-xs text-neutral-500 underline hover:text-neutral-900">All requests as a table · Export</Link>
        </div>
        <div className={`flex gap-2 ${wide ? "flex-row items-center" : "flex-col"}`}>
          <div role="tablist" aria-label="State" className="flex flex-wrap gap-1">
            {STATES.map((x) => {
              const n = x.count ? messages.filter((m) => x.test(m) && m.unread).length : 0;
              return (
                <button key={x.key} type="button" role="tab" aria-selected={state === x.key} onClick={() => onState(x.key)} className={`rounded-full px-2.5 py-0.5 text-xs ${state === x.key ? "bg-neutral-900 text-white" : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"}`}>
                  {x.label}
                  {n > 0 && <span className="ml-1 font-semibold">{n}</span>}
                </button>
              );
            })}
          </div>
          <label className={`flex items-center gap-2 text-xs text-neutral-500 ${wide ? "ml-auto" : ""}`}>
            From
            <select aria-label="Which form" value={source} onChange={(e) => onSource(e.target.value)} className="min-w-0 flex-1 rounded border border-neutral-300 bg-white px-2 py-1 text-sm text-neutral-900">
              {SOURCES.map((x) => <option key={x.key} value={x.key}>{x.label} ({inState.filter(x.test).length})</option>)}
            </select>
          </label>
        </div>
      </div>

      <ul aria-label="Messages" className={`divide-y divide-neutral-100 ${wide ? "" : "flex-1 overflow-y-auto"}`}>
        {source === "subscribed" && (
          <li className="flex items-center justify-between gap-2 bg-neutral-50 px-4 py-2 text-xs text-neutral-600">
            <span>People who ticked “News and updates” — {subscribers} in all.</span>
            <a href="/api/admin/submissions.csv?subscribed=1" className="shrink-0 font-medium text-neutral-900 underline">Export for Mailchimp</a>
          </li>
        )}
        {outside.map((x) => (
          <li key={x.key}>
            <Link href={x.href} className="block bg-neutral-50 px-4 py-3 text-xs text-neutral-600 hover:bg-neutral-100" aria-label={`${x.title} — outside the site`}>
              <span className="block text-sm font-medium text-neutral-800">{x.title}</span>
              {x.folder === "event" ? `Registration on ${x.where}` : `Applications go to ${x.where}`} — they do not come here.{" "}
              {clicks(x.clicks)} on {x.button} in 30 days.
            </Link>
          </li>
        ))}
        {shown.map((m) => {
          const here = path === m.href;
          const cls = wide ? "flex items-center gap-4 px-6 py-2.5" : "block px-4 py-3";
          const body = wide ? (
            <>
              <span aria-label={m.unread ? "unread" : undefined} className={`h-2 w-2 shrink-0 rounded-full ${m.unread ? "bg-blue-600" : "bg-transparent"}`} />
              <span className={`w-56 shrink-0 truncate text-sm ${m.unread ? "font-semibold text-neutral-900" : "text-neutral-700"}`}>{m.from}</span>
              <span className="min-w-0 flex-1 truncate text-sm">
                <span className={m.unread ? "font-medium text-neutral-900" : "text-neutral-700"}>{m.subject}</span>
                {m.snippet && <span className="text-neutral-500"> — {m.snippet}</span>}
              </span>
              {sourceOf(m) && <span className="shrink-0 rounded bg-neutral-100 px-1.5 py-0.5 text-[11px] text-neutral-600">{sourceOf(m)}</span>}
              <span className="w-16 shrink-0 text-right text-xs text-neutral-500">{when(m.at)}</span>
            </>
          ) : (
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
                <a href={m.href} className={`${cls} hover:bg-neutral-50`} title="Opens the page in the editor, at the note">{body}</a>
              ) : (
                <Link href={m.href} aria-current={here ? "page" : undefined} className={`${cls} ${here ? "bg-blue-50" : "hover:bg-neutral-50"}`}>{body}</Link>
              )}
            </li>
          );
        })}
        {!shown.length && (
          <li className="p-8 text-center text-sm text-neutral-500">
            {inState.length ? `Nothing from here in «${st.label}». ` : `Nothing in «${st.label}». `}
            {src.empty}
          </li>
        )}
      </ul>
    </nav>
  );
}
