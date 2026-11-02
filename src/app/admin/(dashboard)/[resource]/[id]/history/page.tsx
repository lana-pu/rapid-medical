import Link from "next/link";
import { notFound } from "next/navigation";
import { diffWords } from "diff";
import { getResource } from "@/admin/resources";
import { listRevisions, getRevision, getEditable, snapshot } from "@/admin/workflow";
import { restoreAction } from "@/admin/actions";
import { PageHeader, LinkButton, formatDate, inputCls, Button } from "@/components/admin/ui";

function asText(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "string") return v.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  return JSON.stringify(v, null, 1);
}

function Diff({ a, b }: { a: string; b: string }) {
  if (a === b) return <span className="text-neutral-500">{a || "—"}</span>;
  const parts = diffWords(a, b);
  return (
    <span>
      {parts.map((p, i) => (
        <span key={i} className={p.added ? "bg-green-200" : p.removed ? "bg-red-200 line-through" : ""}>{p.value}</span>
      ))}
    </span>
  );
}

export default async function HistoryPage({ params, searchParams }: { params: Promise<{ resource: string; id: string }>; searchParams: Promise<{ a?: string; b?: string }> }) {
  const { resource, id } = await params;
  const sp = await searchParams;
  const res = getResource(resource);
  if (!res) notFound();
  const recordId = Number(id);
  const [editable, revs] = await Promise.all([getEditable(res, recordId), listRevisions(res, recordId, 200)]);
  if (!editable) notFound();

  // Default: compare the latest revision against the one before it; "live" = current live row
  const aId = sp.a ?? String(revs[1]?.id ?? "live");
  const bId = sp.b ?? String(revs[0]?.id ?? "live");
  const load = async (key: string) => (key === "live" ? snapshot(res, editable.live) : key === "draft" ? snapshot(res, editable.row) : (await getRevision(Number(key)))?.data ?? {});
  const [A, B] = await Promise.all([load(aId), load(bId)]);
  const keys = res.fields.map((f) => f.name);
  const changed = keys.filter((k) => JSON.stringify(A[k] ?? null) !== JSON.stringify(B[k] ?? null));

  const label = (key: string) => {
    if (key === "live") return "Live (current)";
    if (key === "draft") return "Pending draft";
    const r = revs.find((x) => String(x.id) === key);
    return r ? `#${r.id} ${r.kind} · ${r.userName} · ${formatDate(r.createdAt, { dateStyle: "short", timeStyle: "short" })}` : key;
  };

  return (
    <>
      <PageHeader title={`History · ${editable.row[res.labelField]}`} subtitle={`${revs.length} revisions`} actions={<LinkButton href={`/admin/${res.slug}/${recordId}`}>← Back to record</LinkButton>} />
      <form className="mb-6 grid gap-3 rounded-lg border border-neutral-200 bg-white p-4 md:grid-cols-[1fr_1fr_auto]">
        <label className="text-sm">From
          <select name="a" defaultValue={aId} className={inputCls}>
            <option value="live">Live (current)</option>
            {editable.draft?.data && <option value="draft">Pending draft</option>}
            {revs.map((r) => <option key={r.id} value={r.id}>{label(String(r.id))}</option>)}
          </select>
        </label>
        <label className="text-sm">To
          <select name="b" defaultValue={bId} className={inputCls}>
            <option value="live">Live (current)</option>
            {editable.draft?.data && <option value="draft">Pending draft</option>}
            {revs.map((r) => <option key={r.id} value={r.id}>{label(String(r.id))}</option>)}
          </select>
        </label>
        <div className="self-end"><Button type="submit" variant="secondary">Compare</Button></div>
      </form>

      <div className="rounded-lg border border-neutral-200 bg-white">
        <div className="grid grid-cols-[180px_1fr] border-b border-neutral-200 bg-neutral-50 px-4 py-2 text-xs uppercase text-neutral-500">
          <div>Field</div><div>{label(aId)} → {label(bId)}</div>
        </div>
        {changed.length === 0 && <p className="px-4 py-8 text-center text-sm text-neutral-400">No differences.</p>}
        {changed.map((k) => (
          <div key={k} className="grid grid-cols-[180px_1fr] border-b border-neutral-100 px-4 py-3 text-sm">
            <div className="font-medium text-neutral-700">{res.fields.find((f) => f.name === k)?.label ?? k}</div>
            <div className="whitespace-pre-wrap break-words leading-relaxed"><Diff a={asText(A[k])} b={asText(B[k])} /></div>
          </div>
        ))}
      </div>

      <h2 className="mt-10 mb-3 text-lg font-semibold">All revisions</h2>
      <table className="w-full rounded-lg border border-neutral-200 bg-white text-sm">
        <thead className="bg-neutral-50 text-left text-xs uppercase text-neutral-500"><tr><th className="px-3 py-2">#</th><th className="px-3 py-2">Kind</th><th className="px-3 py-2">By</th><th className="px-3 py-2">When</th><th className="px-3 py-2">Note</th><th className="px-3 py-2"></th></tr></thead>
        <tbody>
          {revs.map((r) => (
            <tr key={r.id} className="border-t border-neutral-100">
              <td className="px-3 py-2">{r.id}</td>
              <td className="px-3 py-2">{r.kind}</td>
              <td className="px-3 py-2">{r.userName}</td>
              <td className="px-3 py-2">{formatDate(r.createdAt, { dateStyle: "medium", timeStyle: "short" })}</td>
              <td className="px-3 py-2 text-neutral-500">{r.note}</td>
              <td className="px-3 py-2 text-right">
                <Link href={`/admin/${res.slug}/${recordId}/history?a=${r.id}&b=live`} className="mr-3 underline">vs live</Link>
                <form action={restoreAction} className="inline">
                  <input type="hidden" name="__resource" value={res.slug} /><input type="hidden" name="__id" value={recordId} /><input type="hidden" name="revision" value={r.id} />
                  <button className="underline">restore</button>
                </form>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
