import { eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { db, contactSubmissions } from "@/db";
import { requireUser } from "@/lib/auth";
import { PageHeader, LinkButton, StatusBadge, Button, formatDate, inputCls } from "@/components/admin/ui";

export default async function SubmissionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const s = await db.query.contactSubmissions.findFirst({ where: eq(contactSubmissions.id, Number(id)) });
  if (!s) notFound();

  async function setStatus(fd: FormData) {
    "use server";
    await requireUser();
    await db.update(contactSubmissions).set({ status: String(fd.get("status")) as "new" }).where(eq(contactSubmissions.id, Number(fd.get("id"))));
    redirect(`/admin/submissions/${fd.get("id")}`);
  }

  const rows: [string, string][] = [
    ["Form", s.form],
    ["Topic", s.topic],
    ["Name", `${s.firstName} ${s.lastName}`],
    ["Organization", s.organization],
    ["Email", s.email],
    ["Phone", s.phone],
    ["Region", s.region],
    ["Country", s.country],
    ["State", s.state],
    ["Opt-in", s.optIn ? "yes" : "no"],
    ["Received", formatDate(s.createdAt, { dateStyle: "medium", timeStyle: "short" })],
    ["IP", s.ip ?? ""],
  ];

  return (
    <>
      <PageHeader title={`${s.firstName} ${s.lastName}`} subtitle={`Submission #${s.id}`} actions={<LinkButton href="/admin/submissions">← Back</LinkButton>} />
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-4">
          <dl className="grid grid-cols-2 gap-x-6 gap-y-2 rounded-lg border border-neutral-200 bg-white p-5 text-sm">
            {rows.map(([k, v]) => (
              <div key={k} className="contents">
                <dt className="text-neutral-500">{k}</dt>
                <dd>{v || <span className="text-neutral-300">—</span>}</dd>
              </div>
            ))}
            {Object.entries(s.meta).map(([k, v]) => (
              <div key={k} className="contents">
                <dt className="text-neutral-500">{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
          <div className="rounded-lg border border-neutral-200 bg-white p-5 text-sm">
            <div className="mb-2 text-xs uppercase text-neutral-500">Message</div>
            <p className="whitespace-pre-wrap">{s.message || <span className="text-neutral-300">(empty)</span>}</p>
          </div>
        </div>
        <div className="space-y-3 rounded-lg border border-neutral-200 bg-white p-5 text-sm">
          <div>Status: <StatusBadge status={s.status} /></div>
          <form action={setStatus} className="space-y-2">
            <input type="hidden" name="id" value={s.id} />
            <select name="status" defaultValue={s.status} className={inputCls}>
              <option value="new">New</option>
              <option value="in_progress">In progress</option>
              <option value="done">Done</option>
              <option value="spam">Spam</option>
            </select>
            <Button type="submit" variant="secondary">Update</Button>
          </form>
          <a href={`mailto:${s.email}`} className="block underline">Reply by email</a>
        </div>
      </div>
    </>
  );
}
