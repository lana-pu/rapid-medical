import { and, desc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { auditLog, contactSubmissions, db, users } from "@/db";
import { requireUser } from "@/lib/auth";
import { saveRequest, takeRequest } from "@/admin/requests";
import { STATUS_LABEL, formLabel } from "@/admin/request-labels";
import { Button, LinkButton, Notice, PageHeader, formatDate, inputCls } from "@/components/admin/ui";
import { sourceLabel } from "@/lib/tracking";

const when = (d: Date) => formatDate(d, { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Jerusalem" });

/** A request: status, who answers, note for the team (docs/screens/admin-requests.md). */
export default async function SubmissionPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string }> }) {
  const me = await requireUser();
  const { id } = await params;
  const sp = await searchParams;
  const s = await db.query.contactSubmissions.findFirst({ where: eq(contactSubmissions.id, Number(id)) });
  if (!s) notFound();
  const [people, history] = await Promise.all([
    db.select({ id: users.id, name: users.name }).from(users).where(eq(users.active, true)).orderBy(users.name),
    db.select().from(auditLog).where(and(eq(auditLog.action, "request"), eq(auditLog.recordId, String(s.id)))).orderBy(desc(auditLog.createdAt)).limit(20),
  ]);
  const owner = people.find((p) => p.id === s.assignedToId);

  const rows: [string, string][] = [
    ["Name", `${s.firstName} ${s.lastName}`],
    ["Organization", s.organization],
    ["Email", s.email],
    ["Phone", s.phone],
    ["Country", s.country],
    ["State", s.state],
    ["News and updates", s.optIn ? "Yes" : "No"],
  ];

  return (
    <>
      <PageHeader crumbs={[{ label: "Website", href: "/admin" }, { label: "Contact Us", href: "/admin/site/contact" }, { label: "Requests", href: "/admin/submissions" }]} title={s.topic || formLabel(s.form)} subtitle={`${formLabel(s.form)} · ${s.region || "no region"} · ${when(s.createdAt)}`} actions={<LinkButton href="/admin/submissions">← Requests</LinkButton>} />
      {sp.saved && <Notice kind="success">Saved.</Notice>}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <dl className="grid grid-cols-2 gap-x-6 gap-y-2 rounded-lg border border-neutral-200 bg-white p-5 text-sm">
            {rows.map(([k, v]) => (
              <div key={k} className="contents">
                <dt className="text-neutral-500">{k}</dt>
                <dd>{v || <span className="text-neutral-300">—</span>}</dd>
              </div>
            ))}
            {Object.entries(s.meta).map(([k, v]) => (
              <div key={k} className="contents">
                <dt className="text-neutral-500">{sourceLabel(k)}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
          <div className="rounded-lg border border-neutral-200 bg-white p-5 text-sm">
            <div className="mb-2 text-xs uppercase text-neutral-500">Message</div>
            <p className="whitespace-pre-wrap">{s.message || <span className="text-neutral-300">(empty)</span>}</p>
          </div>
          {history.length > 0 && (
            <div className="rounded-lg border border-neutral-200 bg-white p-5 text-sm">
              <div className="mb-2 text-xs uppercase text-neutral-500">History</div>
              <ul className="space-y-1">
                {history.map((h) => {
                  const m = h.meta as Record<string, unknown>;
                  const said = m.took
                    ? "took it"
                    : [m.status ? `status → ${STATUS_LABEL[String(m.status)] ?? m.status}` : "", "assignedToId" in m ? `answers: ${people.find((p) => p.id === m.assignedToId)?.name ?? "nobody"}` : "", m.note ? "changed the note" : ""].filter(Boolean).join(", ");
                  return (
                    <li key={h.id}>
                      <b>{h.userName}</b> {said} <span className="text-neutral-500">· {when(h.createdAt)}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>

        <aside className="space-y-4 rounded-lg border border-neutral-200 bg-white p-5 text-sm">
          <a href={`mailto:${s.email}`} className="block font-medium underline">Reply by email</a>
          {s.assignedToId !== me.id && (
            <form action={takeRequest}>
              <input type="hidden" name="id" value={s.id} />
              {owner && <p className="mb-2 text-neutral-600">{owner.name} answers — take it over?</p>}
              <Button type="submit">I&apos;ll answer</Button>
            </form>
          )}
          {/* keyed by what it shows: after «I'll answer» the fields must show the new values, not the ones typed before */}
          <form key={`${s.status}|${s.assignedToId ?? ""}|${s.note}`} action={saveRequest} className="space-y-3">
            <input type="hidden" name="id" value={s.id} />
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-neutral-600">Status</span>
              <select name="status" defaultValue={s.status} className={inputCls}>
                {Object.entries(STATUS_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-neutral-600">Who answers</span>
              <select name="assignedToId" defaultValue={s.assignedToId ?? ""} className={inputCls}>
                <option value="">Nobody</option>
                {people.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-neutral-600">Note for the team</span>
              <textarea name="note" defaultValue={s.note} rows={4} maxLength={4000} className={inputCls} placeholder="Only people in the admin see it" />
            </label>
            <Button type="submit" variant="secondary">Save</Button>
          </form>
        </aside>
      </div>
    </>
  );
}
