"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Elsewhere, Message } from "@/admin/inbox";

/**
 * Inbox — one mail list (docs/screens/admin-inbox.md, 2026-11-24): the state as tabs (Open · Mine · Done · Spam), which
 * form and which region as two selects, Export; the whole width while no message is open, a column beside the open one.
 * A row says the form once and shows who answers only when somebody does. Admin chrome: its own neutral palette.
 */

type Filter = { key: string; label: string; test: (m: Message) => boolean };
const open = (m: Message) => m.kind === "note" || (m.status !== "done" && m.status !== "spam");

/** Level 1: the state of a message. Mine — open requests I answer. */
export const states = (me: number): Filter[] => [
  { key: "open", label: "Open", test: open },
  { key: "mine", label: "Mine", test: (m) => m.kind === "request" && open(m) && m.owner?.id === me },
  { key: "done", label: "Done", test: (m) => m.status === "done" },
  { key: "spam", label: "Spam", test: (m) => m.status === "spam" },
];

/** Level 2: where on the site it came from — every form of the site, the team's notes, and who subscribed. */
export const SOURCES: (Filter & { empty: string; short: string; form?: string })[] = [
  { key: "any", label: "All forms", short: "", test: () => true, empty: "Everything sent through the site's forms and the team's notes on pages arrives here." },
  { key: "contact", form: "contact", label: "Contact Us — contact form", short: "Contact", test: (m) => m.folder === "contact", empty: "Requests from the Contact Us page arrive here: demos, orders, IFU, support." },
  { key: "webinar", form: "webinar", label: "Webinars — recording requests", short: "Webinar", test: (m) => m.folder === "webinar", empty: "Requests for webinar recordings from the Webinars page arrive here." },
  { key: "careers", form: "careers", label: "Careers & jobs — applications", short: "Job", test: (m) => m.folder === "careers", empty: "Applications from the Careers page and from job pages without an outside Apply link arrive here." },
  { key: "event", form: "event", label: "Events — registrations", short: "Event", test: (m) => m.folder === "event", empty: "Registrations for events with a registration form arrive here." },
  { key: "notes", label: "Notes on pages (the team)", short: "Note", test: (m) => m.kind === "note", empty: "Notes the team leaves on pages in the editor arrive here." },
  // people, not a state: every request with the box ticked, whatever its state, spam left out
  { key: "subscribed", label: "Subscribed to news", short: "", test: (m) => !!m.optIn && m.status !== "spam", empty: "Nobody has ticked “News and updates” in a form here yet." },
];

const formOf = (m: Message) => SOURCES.find((s) => s.short && s.test(m))?.short ?? "";

/** The office's time (Israel), as everywhere in the admin: the list and the open request show the same time. */
const TZ = "Asia/Jerusalem";
const dayOf = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
const when = (iso: string) => {
  const d = new Date(iso);
  const now = new Date();
  return dayOf(d) === dayOf(now)
    ? new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: TZ }).format(d)
    : new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: TZ, ...(dayOf(d).slice(0, 4) !== dayOf(now).slice(0, 4) ? { year: "numeric" } : {}) }).format(d);
};

/** Who answers: a small round mark with the initials, only when somebody does; mine is dark. */
function Owner({ m, me }: { m: Message; me: number }) {
  if (!m.owner) return null;
  const mine = m.owner.id === me;
  const words = mine ? "You answer" : `${m.owner.name} answers`;
  const ini = m.owner.name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "?";
  return (
    <span title={words} className={`grid h-[22px] w-[22px] shrink-0 place-items-center rounded-full text-[10px] font-semibold ${mine ? "bg-neutral-900 text-white" : "bg-neutral-200 text-neutral-700"}`}>
      <span aria-hidden>{ini}</span>
      <span className="sr-only">{words}</span>
    </span>
  );
}

export function MessageList({ messages, elsewhere = [], me, state, source, region, onState, onSource, onRegion, wide }: {
  messages: Message[];
  elsewhere?: Elsewhere[];
  /** the signed-in person (Mine, «You answer») */
  me: number;
  state: string;
  source: string;
  region: string;
  onState: (key: string) => void;
  onSource: (key: string) => void;
  onRegion: (key: string) => void;
  /** no message open: the list takes the whole width */
  wide: boolean;
}) {
  const path = usePathname();
  const STATES = states(me);
  const st = STATES.find((x) => x.key === state) ?? STATES[0];
  const src = SOURCES.find((x) => x.key === source) ?? SOURCES[0];
  const people = src.key === "subscribed"; // a list of people: the state does not apply
  const inRegion = (m: Message) => region === "any" || m.region === region;
  const inState = messages.filter((m) => (people || st.test(m)) && inRegion(m));
  const shown = inState.filter(src.test);
  const outside = region === "any" ? elsewhere.filter((x) => x.folder === source) : [];
  const clicks = (n: number) => `${n} click${n === 1 ? "" : "s"}`;
  const subscribers = new Set(shown.map((m) => (m.email ?? m.from).trim().toLowerCase())).size;
  const regions = [...new Set(messages.map((m) => m.region).filter(Boolean) as string[])].sort();
  const tabs = STATES.map((x) => ({ ...x, n: messages.filter((m) => x.test(m) && src.test(m) && inRegion(m)).length })).filter((x) => x.key === "open" || x.key === st.key || x.n > 0);
  const exportHref = `/api/admin/submissions.csv?${new URLSearchParams({ state: st.key, ...(src.form ? { form: src.form } : {}), ...(region !== "any" ? { region } : {}) })}`;
  const pad = wide ? "px-4 @2xl:px-6" : "px-3";

  return (
    <nav aria-label="Inbox" className={wide ? "@container min-w-0 flex-1 bg-white" : "flex w-96 flex-none flex-col border-r border-neutral-200 bg-white"}>
      <div className={`border-b border-neutral-200 bg-white pt-4 ${wide ? "sticky top-12 z-10" : ""}`}>
        <div className={`flex items-center justify-between gap-3 ${pad}`}>
          <h2 className={wide ? "text-xl font-semibold" : "text-base font-semibold"}>Inbox</h2>
          {!people && src.key !== "notes" && (
            <a href={exportHref} className="rounded-lg border border-neutral-300 bg-white px-2.5 py-1 text-[13px] font-medium text-neutral-800 hover:bg-neutral-50" title="Download what is shown as a CSV file">Export ↓</a>
          )}
        </div>
        {!people && (
          <div role="tablist" aria-label="State" className={`mt-2 flex gap-x-1 ${wide ? "px-2 @2xl:px-4" : "px-1"}`}>
            {tabs.map((x) => (
              <button key={x.key} type="button" role="tab" aria-selected={st.key === x.key} onClick={() => onState(x.key)} className={`-mb-px flex items-center gap-1.5 whitespace-nowrap border-b-2 px-2.5 py-2 text-[13px] ${st.key === x.key ? "border-neutral-900 font-medium text-neutral-900" : "border-transparent text-neutral-500 hover:text-neutral-900"}`}>
                {x.label}
                <span className="rounded-full bg-neutral-100 px-1.5 text-[11px] font-medium tabular-nums text-neutral-600">{x.n}</span>
              </button>
            ))}
          </div>
        )}
        <div className={`flex gap-2 border-t border-neutral-100 py-2.5 ${pad} ${people ? "mt-3" : ""}`}>
          <select aria-label="Which form" value={src.key} onChange={(e) => onSource(e.target.value)} className={`min-w-0 rounded-lg border border-neutral-300 bg-white px-2 py-1 text-[13px] text-neutral-800 ${wide ? "flex-1 @2xl:max-w-64 @2xl:flex-none" : "flex-1"}`}>
            {SOURCES.map((x) => <option key={x.key} value={x.key}>{x.label}{x.key === "any" ? "" : ` (${(x.key === "subscribed" ? messages.filter((m) => inRegion(m)) : inState).filter(x.test).length})`}</option>)}
          </select>
          <select aria-label="Region" value={region} onChange={(e) => onRegion(e.target.value)} className={`min-w-0 rounded-lg border border-neutral-300 bg-white px-2 py-1 text-[13px] text-neutral-800 ${wide ? "flex-1 @2xl:max-w-48 @2xl:flex-none" : "flex-1"}`}>
            <option value="any">All regions</option>
            {regions.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
      </div>

      <ul aria-label="Messages" className={`divide-y divide-neutral-100 ${wide ? "" : "flex-1 overflow-y-auto"}`}>
        {people && (
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
          const form = formOf(m);
          const strong = m.unread ? "font-semibold text-neutral-900" : "text-neutral-700";
          // the subject: «Form · » only where the form has no column of its own
          const subject = (prefix: string) => (
            <>
              {form && <span className={`text-neutral-500 ${prefix}`}>{form} · </span>}
              <span className={m.unread ? "font-medium text-neutral-900" : "text-neutral-700"}>{m.subject}</span>
              {m.snippet && <span className="text-neutral-500"> — {m.snippet}</span>}
            </>
          );
          const dot = <span aria-label={m.unread ? "unread" : undefined} className={`h-2 w-2 shrink-0 rounded-full ${m.unread ? "bg-blue-600" : "bg-transparent"}`} />;
          const date = <span className="w-14 shrink-0 text-right text-xs text-neutral-500">{when(m.at)}</span>;
          // wide: one line from 672 px, as in mail; below — who and when, the subject under it
          const cls = wide ? "flex flex-wrap items-center gap-x-3 gap-y-0.5 px-4 py-2.5 @2xl:flex-nowrap @2xl:gap-x-4 @2xl:px-6" : "block px-3 py-2.5";
          const body = wide ? (
            <>
              {dot}
              <span className={`min-w-0 flex-1 truncate text-sm @2xl:w-56 @2xl:flex-none ${strong}`}>{m.from}</span>
              <span className="order-last line-clamp-2 min-w-0 basis-full pl-5 text-sm @2xl:order-none @2xl:line-clamp-none @2xl:flex-1 @2xl:basis-auto @2xl:truncate @2xl:pl-0">{subject("@2xl:hidden")}</span>
              {form && <span className="hidden w-16 shrink-0 text-xs text-neutral-500 @2xl:inline">{form}</span>}
              <span className="flex w-[22px] shrink-0 justify-center"><Owner m={m} me={me} /></span>
              {date}
            </>
          ) : (
            <>
              <span className="flex items-center gap-2">
                {dot}
                <span className={`min-w-0 flex-1 truncate text-sm ${strong}`}>{m.from}</span>
                <Owner m={m} me={me} />
                {date}
              </span>
              <span className="mt-0.5 line-clamp-2 pl-4 text-[13px]">{subject("")}</span>
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
            {people ? "" : inState.length ? `Nothing from here in «${st.label}». ` : `Nothing in «${st.label}». `}
            {src.empty}
          </li>
        )}
      </ul>
    </nav>
  );
}
