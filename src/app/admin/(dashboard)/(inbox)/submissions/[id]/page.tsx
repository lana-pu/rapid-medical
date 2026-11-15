import { and, asc, desc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { auditLog, contactSubmissions, db, events, jobs, requestNotes, users, webinars } from "@/db";
import { requireUser } from "@/lib/auth";
import { addNote, setStatus } from "@/admin/requests";
import { STATUS_LABEL, formLabel } from "@/admin/request-labels";
import { Button, PageHeader, formatDate, inputCls } from "@/components/admin/ui";
import { AssignSelect, MarkRead, ReplyButton } from "@/components/admin/RequestControls";
import { sourceLabel } from "@/lib/tracking";
import { getLiveSetting } from "@/lib/settings";
import { recipientFor, type RoutingSettings } from "@/lib/contact-topics";
import { formatEventDates } from "@/lib/events";
import { replyHref } from "@/lib/reply-mail";

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
    s.form === "webinar" ? db.query.webinars.findFirst({ where: eq(webinars.title, meta.webinar || s.topic) }) : null,
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
  // the person and the request in front; how they found the site — folded away (docs/screens/admin-requests.md)
  const contactRows = ([["Phone", s.phone], ["Country", s.country], ["State", s.state]] as [string, string][]).filter(([, v]) => v);
  const VISIT = new Set(["form_page", "previous_page", "landing_page", "referrer", "utm_source", "utm_medium", "utm_campaign"]);
  const visit = Object.entries(meta).filter(([k, v]) => VISIT.has(k) && v);
  const about = Object.entries(meta).filter(([k, v]) => !VISIT.has(k) && v && v !== s.topic);
  const card = "rounded-lg border border-neutral-200 bg-white";
  const statusButton = (status: string, text: string) => (
    <form action={setStatus}>
      <input type="hidden" name="id" value={s.id} />
      <input type="hidden" name="status" value={status} />
      <Button type="submit" variant="secondary">{text}</Button>
    </form>
  );

  return (
    <div className="mx-auto max-w-3xl">
      <MarkRead id={s.id} read={!!s.readAt} />
      <PageHeader crumbs={[{ label: "Inbox", href: "/admin/inbox" }]} title={s.topic || formLabel(s.form)} />

      {/* who wrote, when — like the head of an email */}
      <div className="-mt-2 mb-5 flex flex-wrap items-start justify-between gap-x-6 gap-y-1">
        <div className="min-w-0">
          <div className="text-base">
            <b className="font-semibold text-neutral-900">{`${s.firstName} ${s.lastName}`.trim()}</b>
            {s.organization && <span className="text-neutral-700"> · {s.organization}</span>}
          </div>
          <a href={`mailto:${s.email}`} className="text-sm text-neutral-600 underline decoration-neutral-300 hover:decoration-neutral-900">{s.email}</a>
          <div className="mt-1 text-xs text-neutral-500">
            {[formLabel(s.form), s.region || null, ...about.map(([k, v]) => `${sourceLabel(k)}: ${v}`)].filter(Boolean).join(" · ")}
          </div>
        </div>
        <div className="shrink-0 text-sm text-neutral-500">{when(s.createdAt)}</div>
      </div>

      <div role="toolbar" aria-label="Request actions" className={`${card} mb-5 flex flex-wrap items-center gap-2 p-3`}>
        <ReplyButton id={s.id} href={reply} />
        {s.status === "done" ? statusButton("in_progress", "Reopen") : s.status !== "spam" && statusButton("done", "✓ Done")}
        {s.status === "spam" ? statusButton("new", "Not spam") : statusButton("spam", "Spam")}
        <span className="flex-1" />
        <AssignSelect id={s.id} value={s.assignedToId} people={people} />
        <span role="status" aria-label="Request state" className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs text-neutral-700">{state}</span>
      </div>

      <div className="space-y-4">
        <article aria-label="Message" className={`${card} px-6 py-5`}>
          {s.message ? <p className="whitespace-pre-wrap text-base leading-relaxed text-neutral-900">{s.message}</p> : <p className="text-sm text-neutral-400">Sent without a message.</p>}
        </article>

        {(contactRows.length > 0 || s.optIn) && (
          <section aria-label="Contact" className={`${card} p-5 text-sm`}>
            <div className="mb-2 text-xs uppercase text-neutral-500">Contact</div>
            <dl className="grid grid-cols-[120px_1fr] gap-y-1.5">
              {contactRows.map(([k, v]) => (
                <div key={k} className="contents">
                  <dt className="text-neutral-500">{k}</dt>
                  <dd>{k === "Phone" ? <a href={`tel:${v.replace(/[^\d+]/g, "")}`} className="underline decoration-neutral-300">{v}</a> : v}</dd>
                </div>
              ))}
            </dl>
            {s.optIn && <p className={contactRows.length ? "mt-2 text-neutral-600" : "text-neutral-600"}>✓ Wants news and updates</p>}
          </section>
        )}

        {visit.length > 0 && (
          <details className={`${card} p-5 text-sm`}>
            <summary className="cursor-pointer text-xs uppercase text-neutral-500">How they found us</summary>
            <dl className="mt-3 grid grid-cols-[180px_1fr] gap-y-1.5">
              {visit.map(([k, v]) => (
                <div key={k} className="contents">
                  <dt className="text-neutral-500">{sourceLabel(k)}</dt>
                  <dd className="break-all">{v}</dd>
                </div>
              ))}
            </dl>
          </details>
        )}

        <section aria-label="Notes for the team" className={`${card} p-5 text-sm`}>
          <div className="mb-3 text-xs uppercase text-neutral-500">Notes for the team <span className="normal-case text-neutral-400">· only people in the admin see them</span></div>
          {notes.length > 0 && (
            <ul className="mb-4 space-y-3">
              {notes.map((n) => (
                <li key={n.id}>
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

        {history.length > 0 && (
          <details className={`${card} p-5 text-sm`}>
            <summary className="cursor-pointer text-xs uppercase text-neutral-500">History ({history.length})</summary>
            <ul className="mt-3 space-y-1">
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
      </div>
    </div>
  );
}
