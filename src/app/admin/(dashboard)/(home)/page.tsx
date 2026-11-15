import { requireUser } from "@/lib/auth";
import { attention, type AttentionKind } from "@/admin/home";
import { Notice, PageHeader, formatDate } from "@/components/admin/ui";

/** Inbox — everything that is waiting for someone, in one list (docs/admin-ia.md, docs/screens/admin-home.md). */

const KINDS: Record<AttentionKind, { title: string; empty: string }> = {
  request: { title: "Requests", empty: "No new requests." },
  comment: { title: "Comments", empty: "No open comments on the pages." },
  publish: { title: "To publish", empty: "Nothing waits to be published." },
  media: { title: "Pictures without description", empty: "Every picture has a description." },
  links: { title: "Broken links", empty: "No broken links." },
};

export default async function Inbox({ searchParams }: { searchParams: Promise<{ error?: string; kind?: string }> }) {
  const sp = await searchParams;
  const user = await requireUser();
  const all = await attention(user);
  const kind = sp.kind && sp.kind in KINDS ? (sp.kind as AttentionKind) : null;
  const todo = kind ? all.filter((t) => t.kind === kind) : all;
  const first = user.name.split(/\s+/)[0] || user.name;

  return (
    <>
      <PageHeader title={kind ? KINDS[kind].title : "Everything waiting"} subtitle={kind ? undefined : `Hello, ${first}. This is what needs someone — requests, comments, changes not live yet.`} />
      {sp.error === "forbidden" && <Notice kind="error">That area is for admins.</Notice>}
      {todo.length === 0 ? (
        <p className="rounded-lg border border-neutral-200 bg-white p-6 text-sm text-neutral-600">{kind ? KINDS[kind].empty : "Nothing waiting. Everything is live."}</p>
      ) : (
        <ul className="divide-y divide-neutral-100 rounded-lg border border-neutral-200 bg-white" aria-label="Waiting">
          {todo.map((t) => (
            <li key={t.key} className="flex flex-wrap items-center gap-3 px-4 py-3 text-sm">
              <span className="w-28 shrink-0 text-xs text-neutral-500">{KINDS[t.kind].title}</span>
              <span className="min-w-0 flex-1">
                <span className="font-medium">{t.text}</span>
                {(t.by || t.at) && (
                  <span className="block text-xs text-neutral-500">
                    {t.by ? `by ${t.by}` : ""}
                    {t.by && t.at ? " · " : ""}
                    {t.at ? formatDate(t.at, { dateStyle: "medium", timeStyle: "short" }) : ""}
                  </span>
                )}
              </span>
              <a href={t.href} className="rounded border border-neutral-300 px-3 py-1.5 text-xs font-medium hover:bg-neutral-50">{t.action}</a>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
