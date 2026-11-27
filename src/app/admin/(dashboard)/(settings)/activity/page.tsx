import Link from "next/link";
import { desc, eq, and, ilike, inArray, notInArray, sql } from "drizzle-orm";
import { requireUser } from "@/lib/auth";
import { db, auditLog, users } from "@/db";
import { PageHeader } from "@/components/admin/ui";
import { ListFilters, type ListFilter } from "@/components/admin/ListFilters";
import { getResource } from "@/admin/resources";
import { namesFor, phrase } from "@/admin/home";

/**
 * The team's actions in words (docs/screens/admin-activity.md): one sentence per action, the same action one after
 * another reads once with a count; sign-ins are a separate view for admins. Admin chrome: its own neutral palette.
 */

const SIGN_INS = ["login", "login_failed", "logout"];
/** Actions in words, for the filter. */
const ACTION_WORDS: [string, string][] = [
  ["publish", "Published"], ["save", "Saved"], ["unpublish", "Took off the site"], ["delete", "Deleted"], ["restore", "Restored a version"],
  ["schedule", "Scheduled"], ["bulk", "Several at once"], ["settings", "Settings"], ["user", "People"], ["media", "Media"], ["request", "Requests"], ["comment", "Notes"],
];
// as everywhere in the admin: «15 Nov, 18:39», the office's time
const when = (d: Date) => new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jerusalem" }).format(d);

export default async function ActivityPage({ searchParams }: { searchParams: Promise<{ view?: string; action?: string; user?: string; q?: string; page?: string }> }) {
  const me = await requireUser();
  const sp = await searchParams;
  const signIns = sp.view === "sign-ins" && me.role === "admin"; // sign-ins (typed addresses, IPs) are for admins only
  const per = 100;
  const page = Math.max(1, Math.floor(Number(sp.page)) || 1);
  const conds = [
    signIns
      ? and(inArray(auditLog.action, SIGN_INS), sql`not (${auditLog.action} = 'login' and ${auditLog.meta}->>'step' = 'password')`) // one sign-in = the code step
      : notInArray(auditLog.action, SIGN_INS),
  ];
  if (!signIns && sp.action) conds.push(eq(auditLog.action, sp.action));
  if (sp.user) conds.push(eq(auditLog.userId, Number(sp.user)));
  if (sp.q) conds.push(ilike(auditLog.label, `%${sp.q}%`));
  const where = and(...conds);
  const [rows, [{ n }], people] = await Promise.all([
    db.select().from(auditLog).where(where).orderBy(desc(auditLog.createdAt)).limit(per).offset((page - 1) * per),
    db.select({ n: sql<number>`count(*)::int` }).from(auditLog).where(where),
    db.select({ id: users.id, name: users.name }).from(users).orderBy(users.name),
  ]);
  const pages = Math.max(1, Math.ceil(n / per));

  // the same action on the same record, one after another, reads once
  const runs: { e: (typeof rows)[number]; n: number }[] = [];
  for (const e of rows) {
    const last = runs[runs.length - 1];
    if (last && last.e.userName === e.userName && last.e.action === e.action && last.e.resource === e.resource && last.e.recordId === e.recordId && (e.resource || last.e.label === e.label)) last.n += 1;
    else runs.push({ e, n: 1 });
  }
  const names = signIns ? new Map<string, string>() : await namesFor(runs.map((r) => r.e));
  const sentence = (e: (typeof rows)[number]) => {
    if (e.action === "login") return "signed in";
    if (e.action === "logout") return "signed out";
    if (e.action === "login_failed") return `failed to sign in${(e.meta as Record<string, unknown>).email ? ` as ${String((e.meta as Record<string, unknown>).email)}` : ""}`;
    const named = e.resource && e.recordId ? { ...e, label: names.get(`${e.resource}:${e.recordId}`) ?? e.label } : e;
    return phrase(named);
  };
  const link = (e: (typeof rows)[number]) => {
    const r = e.resource ? getResource(e.resource) : null;
    return r && e.recordId ? `/admin/${r.slug}/${e.recordId}` : null;
  };
  const qs = (over: Record<string, string | undefined>) => {
    const u = new URLSearchParams();
    for (const [k, v] of Object.entries({ ...sp, ...over })) if (v) u.set(k, v);
    return `/admin/activity?${u.toString()}`;
  };

  return (
    <>
      <PageHeader title="Activity log" subtitle={signIns ? "Sign-ins to the admin" : "What the team changed, newest first"} />
      {me.role === "admin" && (
        <nav aria-label="Activity views" className="mb-4 flex gap-1 border-b border-neutral-200">
          {[["", "Changes"], ["sign-ins", "Sign-ins"]].map(([v, label]) => (
            <Link key={v} href={v ? "/admin/activity?view=sign-ins" : "/admin/activity"} aria-current={(sp.view ?? "") === v ? "page" : undefined} className={`-mb-px border-b-2 px-3 py-2 text-sm ${(sp.view ?? "") === v ? "border-neutral-900 font-medium" : "border-transparent text-neutral-500 hover:text-neutral-800"}`}>{label}</Link>
          ))}
        </nav>
      )}
      <ListFilters
        base="/admin/activity"
        q={sp.q ?? ""}
        active={!!(sp.q || sp.user || sp.action)}
        keep={signIns ? { view: "sign-ins" } : {}}
        filters={[
          { name: "user", value: sp.user ?? "", label: "Who", options: [{ value: "", label: "Anyone" }, ...people.map((p) => ({ value: String(p.id), label: p.name }))] },
          ...(signIns ? [] : [{ name: "action", value: sp.action ?? "", label: "Action", options: [{ value: "", label: "Any action" }, ...ACTION_WORDS.map(([value, label]) => ({ value, label }))] }]),
        ] satisfies ListFilter[]}
      />
      <ul className="divide-y divide-neutral-100 rounded-lg border border-neutral-200 bg-white text-sm">
        {runs.map(({ e, n: count }) => {
          const href = link(e);
          const text = `${sentence(e)}${count > 1 ? ` · ${count} times` : ""}`;
          return (
            <li key={e.id} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 px-4 py-2.5">
              <span className="min-w-0 flex-1">
                <b className="font-medium">{e.userName || "Someone"}</b>{" "}
                {href ? <Link href={href} className="underline decoration-neutral-300 hover:decoration-neutral-900">{text}</Link> : text}
              </span>
              {signIns && e.ip && <span className="text-xs text-neutral-400">from {e.ip}</span>}
              <span className="shrink-0 text-xs text-neutral-500">{when(e.createdAt)}</span>
            </li>
          );
        })}
        {runs.length === 0 && <li className="px-4 py-8 text-center text-neutral-400">{sp.q || sp.user || sp.action ? "Nothing matches." : "No activity yet."}</li>}
      </ul>
      {pages > 1 && (
        <div className="mt-4 flex justify-center gap-3 text-sm">
          {page > 1 && <Link href={qs({ page: String(page - 1) })} className="underline">‹ Newer</Link>}
          <span className="text-neutral-500">Page {page} of {pages}</span>
          {page < pages && <Link href={qs({ page: String(page + 1) })} className="underline">Older ›</Link>}
        </div>
      )}
    </>
  );
}
