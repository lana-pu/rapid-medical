import { db, users } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { resetTwoStep, setActive } from "@/admin/people";
import { PageHeader, formatDate } from "@/components/admin/ui";
import { InviteAgain, InviteButton, NewPassword, RoleSelect } from "@/components/admin/PeopleTools";

/** People and roles (docs/screens/admin-people.md). */
export default async function PeoplePage() {
  const me = await requireAdmin();
  const rows = await db.select().from(users).orderBy(users.name);

  // what each role can do, in the words of spec.md → «Доступы» (docs/screens/admin-people.md, 2026-11-27)
  const ROLES: [string, string][] = [
    ["Editor", "Texts and pictures, new pages from templates, collections, media, the Inbox, contact details; publishes."],
    ["Designer", "As an editor, plus page sections, the menu and footer, Branding."],
    ["Admin", "Everything, plus deleting, products, Old links, people and roles, Integrations."],
  ];
  const initials = (n: string) => n.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join("") || "?";
  const grid = "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 @3xl:grid-cols-[minmax(0,1.6fr)_9rem_10rem_8rem_2.5rem]";

  return (
    <>
      <PageHeader title="People and roles" subtitle="Who can sign in to the admin. Everyone signs in with a password and a code from their phone." actions={<InviteButton />} />
      <div className="rounded-lg border border-neutral-200 bg-white text-sm">
        <div className={`${grid} hidden border-b border-neutral-100 px-4 py-2 text-xs text-neutral-500 @3xl:grid`} aria-hidden>
          <span>Person</span><span>Role</span><span>Two-step sign-in</span><span>Last signed in</span><span />
        </div>
        <ul className="divide-y divide-neutral-100">
          {rows.map((u) => {
            const waiting = !u.lastLoginAt;
            const twoStep = !u.active ? "Access off" : waiting ? "Waiting for sign-in" : u.totpEnabledAt ? "On" : "Not set up";
            const self = u.id === me.id;
            return (
              <li key={u.id} className={`${grid} px-4 py-3`} data-person={u.email}>
                <span className="col-start-1 flex min-w-0 items-center gap-3">
                  <span aria-hidden className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-xs font-semibold text-neutral-600">{initials(u.name)}</span>
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{u.name}{self && <span className="font-normal text-neutral-400"> (you)</span>}</span>
                    <span className="block truncate text-neutral-500">{u.email}</span>
                  </span>
                </span>
                <span className="col-start-1 pl-11 @3xl:col-start-auto @3xl:pl-0"><RoleSelect id={u.id} role={u.role} name={u.name} self={self} /></span>
                <span className="col-start-1 pl-11 text-xs @3xl:col-start-auto @3xl:pl-0 @3xl:text-sm" title="Two-step sign-in">
                  <span className="@3xl:hidden text-neutral-500">Two-step sign-in: </span>
                  <span className={twoStep === "On" ? "text-emerald-700" : twoStep === "Access off" ? "text-neutral-500" : "text-amber-800"}>{twoStep === "On" ? "✓ On" : twoStep}</span>
                  {waiting && u.active && <span className="ml-2 inline-block"><InviteAgain id={u.id} name={u.name} /></span>}
                </span>
                <span className="col-start-1 pl-11 text-xs text-neutral-500 @3xl:col-start-auto @3xl:pl-0 @3xl:text-sm">
                  <span className="@3xl:hidden">Last signed in: </span>{u.lastLoginAt ? formatDate(u.lastLoginAt, { dateStyle: "medium", timeZone: "Asia/Jerusalem" }) : "—"}
                </span>
                <span className="col-start-2 row-start-1 justify-self-end @3xl:col-start-auto @3xl:row-start-auto">
                  {/* rare actions out of the way (docs/screens/admin-people.md) */}
                  {(u.totpEnabledAt || !self || !waiting) && (
                    <details className="relative">
                      <summary aria-label={`More for ${u.name}`} className="flex h-8 w-8 cursor-pointer list-none items-center justify-center rounded text-lg leading-none text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900">⋯</summary>
                      <div className="absolute right-0 z-10 mt-1 w-64 space-y-2 rounded-lg border border-neutral-200 bg-white p-3 shadow-lg">
                        {u.totpEnabledAt && (
                          <form action={resetTwoStep}><input type="hidden" name="id" value={u.id} /><button className="text-xs underline">Reset two-step sign-in</button></form>
                        )}
                        {!self && (
                          <form action={setActive}><input type="hidden" name="id" value={u.id} /><button className="text-xs underline">{u.active ? "Turn off access" : "Turn access back on"}</button></form>
                        )}
                        {!waiting && <NewPassword id={u.id} />}
                      </div>
                    </details>
                  )}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
      <section aria-label="What each role can do" className="mt-8">
        <h2 className="mb-2 text-sm font-semibold text-neutral-600">What each role can do</h2>
        <dl className="grid gap-3 @3xl:grid-cols-3">
          {ROLES.map(([r, t]) => (
            <div key={r} className="rounded-lg border border-neutral-200 bg-white px-4 py-3 text-sm">
              <dt className="font-medium text-neutral-900">{r}</dt>
              <dd className="mt-0.5 text-neutral-600">{t}</dd>
            </div>
          ))}
        </dl>
      </section>
    </>
  );
}
