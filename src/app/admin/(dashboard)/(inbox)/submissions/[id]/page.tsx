import { and, asc, desc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { auditLog, contactSubmissions, db, events, jobs, requestNotes, users, webinars } from "@/db";
import { requireUser } from "@/lib/auth";
import { addNote, setStatus } from "@/admin/requests";
import { STATUS_LABEL, formLabel } from "@/admin/request-labels";
import { Button, formatDate, inputCls } from "@/components/admin/ui";
import { AssignSelect, MarkRead, ReplyButton } from "@/components/admin/RequestControls";
import { sourceLabel } from "@/lib/tracking";
import { getLiveSetting } from "@/lib/settings";
import { recipientFor, type RoutingSettings } from "@/lib/contact-topics";
import { formatEventDates } from "@/lib/events";
import { replyHref } from "@/lib/reply-mail";
import { MAIN_BLEED } from "@/components/admin/chrome";

const when = (d: Date) => formatDate(d, { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Jerusalem" });

/** A request: what was sent, actions applied at once, notes for the team as a thread (docs/screens/admin-requests.md). */
export default async function SubmissionPage({ params }: { params: Promise<{ id: string }> }) {
  const me = await requireUser();
  const { id } = await params;
  const s = await db.query.contactSubmissions.findFirst({ where: eq(contactSubmissions.id, Number(id)) });
  if (!s) notFound();
  const [people, history, notes, contact] = await Promise.all([
    db.select({ id: users.id, name: users.name }).from(users).where(eq(users.active, true)).orderBy(users.name),
    db.select().from(auditLog).where(and(eq(auditLog.action, "request"), eq(auditLog.recordId, String(s.id)))).orderBy(desc(auditLog.createdAt)).limit(20),
    db.select().from(requestNotes).where(eq(requestNotes.submissionId, s.id)).orderBy(asc(requestNotes.createdAt)),
    getLiveSetting<RoutingSettings & { phoneHq?: string; phoneUs?: string }>("contact"),
  ]);
  const owner = people.find((p) => p.id === s.assignedToId);

  // what the request was about, for the ready reply: the webinar's recording, the event's dates and place, the job
  const meta = s.meta as Record<string, string>;
  const [webinar, event, job] = await Promise.all([
    // the topic is what the visitor's browser sent: only a published webinar's recording goes into the ready reply
    s.form === "webinar" ? db.query.webinars.findFirst({ where: and(eq(webinars.title, meta.webinar || s.topic), eq(webinars.status, "published")) }) : null,
    s.form === "event" && meta.event ? db.query.events.findFirst({ where: eq(events.slug, meta.event) }) : null,
    s.form === "careers" && meta.job ? db.query.jobs.findFirst({ where: eq(jobs.slug, meta.job) }) : null,
  ]);
  const reply = replyHref({
    to: s.email,
    cc: recipientFor(s, contact) ?? process.env.MAIL_TO ?? undefined,
    firstName: s.firstName,
    lastName: s.lastName,
    form: s.form,
    topic: s.topic,
    formLabel: formLabel(s.form),
    message: s.message,
    createdAt: s.createdAt,
    sender: (owner && owner.id !== me.id ? owner.name : me.name) || "The Rapid Medical team",
    phone: (s.region === "Americas" ? contact.phoneUs : contact.phoneHq) || contact.phoneHq || undefined,
    webinar: webinar ? { title: webinar.title, url: webinar.videoUrl } : null,
    event: event ? { title: event.title, when: formatEventDates(event), where: [event.venue, event.city].filter(Boolean).join(", ") } : null,
    job: job?.title ?? null,
  });

  const state = s.status === "done" ? "Done" : s.status === "spam" ? "Spam" : `${STATUS_LABEL[s.status] ?? s.status} · ${owner ? `${owner.id === me.id ? "you answer" : `${owner.name} answers`}` : "nobody answers"}`;
  // like an email (docs/screens/admin-requests.md): the message in the middle, everything about it in «Details»
  const name = `${s.firstName} ${s.lastName}`.trim();
  const initials = `${s.firstName.slice(0, 1)}${s.lastName.slice(0, 1)}`.toUpperCase() || "?";
  const contactRows = ([["Phone", s.phone], ["Country", s.country], ["State", s.state]] as [string, string][]).filter(([, v]) => v);
  const VISIT = new Set(["form_page", "previous_page", "landing_page", "referrer", "utm_source", "utm_medium", "utm_campaign"]);
  const visit = Object.entries(meta).filter(([k, v]) => VISIT.has(k) && v);
  const about = Object.entries(meta).filter(([k, v]) => !VISIT.has(k) && v && v !== s.topic);
  const requestRows: [string, string][] = [["Form", formLabel(s.form)], ["Region", s.region], ...about.map(([k, v]) => [sourceLabel(k), v] as [string, string])].filter(([, v]) => v) as [string, string][];
  const statusButton = (status: string, text: string) => (
    <form action={setStatus}>
      <input type="hidden" name="id" value={s.id} />
      <input type="hidden" name="status" value={status} />
      <Button type="submit" variant="secondary">{text}</Button>
    </form>
  );
  const h3 = "mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500";
  const rows = (list: [string, string][]) => (
    <dl className="space-y-1.5">
      {list.map(([k, v]) => (
        <div key={k}>
          <dt className="text-xs text-neutral-500">{k}</dt>
          <dd className="break-words">{k === "Phone" ? <a href={`tel:${v.replace(/[^\d+]/g, "")}`} className="underline decoration-neutral-300">{v}</a> : v}</dd>
        </div>
      ))}
    </dl>
  );

  return (
    <div className={`${MAIN_BLEED} flex min-h-[calc(100vh-3rem)] flex-col bg-white @3xl:flex-row`}>
      <MarkRead id={s.id} read={!!s.readAt} />
      <div className="min-w-0 flex-1">
        {/* actions: a thin bar on top of the message, as in mail */}
        <div role="toolbar" aria-label="Request actions" className="flex flex-wrap items-center gap-2 border-b border-neutral-200 px-4 py-3 sm:px-8">
          <ReplyButton id={s.id} href={reply} />
          {s.status === "done" ? statusButton("in_progress", "Reopen") : s.status !== "spam" && statusButton("done", "✓ Done")}
          {s.status === "spam" ? statusButton("new", "Not spam") : statusButton("spam", "Spam")}
          <span className="flex-1" />
          <span role="status" aria-label="Request state" className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs text-neutral-700">{state}</span>
        </div>

        <div className="max-w-3xl px-4 py-6 sm:px-8">
          <h1 className="text-2xl font-semibold text-neutral-900">{s.topic || formLabel(s.form)}</h1>

          {/* the message as one piece: who, when, and what they wrote right under it */}
          <article aria-label="Message" className="mt-6 flex gap-4">
            <span aria-hidden className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-sm font-semibold text-white">{initials}</span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline justify-between gap-x-4">
                <div className="min-w-0">
                  <b className="font-semibold text-neutral-900">{name}</b>
                  {s.organization && <span className="text-neutral-600"> · {s.organization}</span>}
                </div>
                <span className="shrink-0 text-sm text-neutral-500">{when(s.createdAt)}</span>
              </div>
              <a href={`mailto:${s.email}`} className="text-sm text-neutral-600 underline decoration-neutral-300 hover:decoration-neutral-900">{s.email}</a>
              <div className="mt-4 whitespace-pre-wrap text-[15px] leading-[1.6] text-neutral-900">
                {s.message || <span className="text-sm text-neutral-400">Sent without a message.</span>}
              </div>
            </div>
          </article>

          {/* the team's own notes: below the message, like internal comments */}
          <section aria-label="Notes for the team" className="mt-10 border-t border-neutral-200 pt-6 text-sm">
            <h2 className={h3}>Notes for the team <span className="font-normal normal-case tracking-normal text-neutral-400">· only people in the admin see them</span></h2>
            {notes.length > 0 && (
              <ul className="mb-4 space-y-3">
                {notes.map((n) => (
                  <li key={n.id} className="rounded-lg bg-amber-50 px-3 py-2">
                    <div className="text-xs text-neutral-500"><b className="text-neutral-800">{n.userName || "Someone"}</b> · {when(n.createdAt)}</div>
                    <p className="mt-0.5 whitespace-pre-wrap">{n.body}</p>
                  </li>
                ))}
              </ul>
            )}
            <form action={addNote} key={notes.length} className="space-y-2">
              <input type="hidden" name="id" value={s.id} />
              <textarea name="body" aria-label="New note" rows={2} maxLength={4000} required className={inputCls} placeholder="Called back, demo on Friday…" />
              <Button type="submit" variant="secondary">Add note</Button>
            </form>
          </section>
        </div>
      </div>

      {/* everything about the request, out of the way of the message */}
      <aside aria-label="Details" className="shrink-0 space-y-6 border-t border-neutral-200 @3xl:w-72 @3xl:border-l @3xl:border-t-0 bg-neutral-50 px-5 py-5 text-sm">
        <AssignSelect id={s.id} value={s.assignedToId} people={people} />
        <section aria-label="Request">
          <h2 className={h3}>Request</h2>
          {rows(requestRows)}
        </section>
        {(contactRows.length > 0 || s.optIn) && (
          <section aria-label="Contact">
            <h2 className={h3}>Contact</h2>
            {rows(contactRows)}
            {s.optIn && <p className="mt-2 text-neutral-700">✓ Wants news and updates</p>}
          </section>
        )}
        {visit.length > 0 && (
          <details>
            <summary className={`${h3} cursor-pointer`}>How they found us</summary>
            {rows(visit.map(([k, v]) => [sourceLabel(k), v]))}
          </details>
        )}
        {history.length > 0 && (
          <details>
            <summary className={`${h3} cursor-pointer`}>History ({history.length})</summary>
            <ul className="space-y-1.5">
              {history.map((h) => {
                const m = h.meta as Record<string, unknown>;
                const said = [
                  m.replied ? "opened a reply" : m.took ? "took it" : "",
                  m.status ? `status → ${STATUS_LABEL[String(m.status)] ?? m.status}` : "",
                  "assignedToId" in m ? `answers: ${people.find((p) => p.id === m.assignedToId)?.name ?? "nobody"}` : "",
                  m.note ? "added a note" : "",
                ].filter(Boolean).join(", ");
                return (
                  <li key={h.id}>
                    <b>{h.userName}</b> {said} <span className="text-neutral-500">· {when(h.createdAt)}</span>
                  </li>
                );
              })}
            </ul>
          </details>
        )}
      </aside>
    </div>
  );
}
