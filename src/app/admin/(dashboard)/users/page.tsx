import { db, users } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { resetTwoStep, setActive, setRole } from "@/admin/people";
import { PageHeader, formatDate, inputCls } from "@/components/admin/ui";
import { InviteAgain, InviteButton, NewPassword, ROLE_TEXT } from "@/components/admin/PeopleTools";

/** People and roles (docs/screens/admin-people.md). */
export default async function PeoplePage() {
  const me = await requireAdmin();
  const rows = await db.select().from(users).orderBy(users.name);

  return (
    <>
      <PageHeader title="People and roles" actions={<InviteButton />} />
      <ul className="divide-y divide-neutral-100 rounded-lg border border-neutral-200 bg-white">
        {rows.map((u) => {
          const waiting = !u.lastLoginAt;
          const twoStep = !u.active ? "Off" : waiting ? "Waiting for sign-in" : u.totpEnabledAt ? "On" : "Not set up";
          const self = u.id === me.id;
          return (
            <li key={u.id} className="flex flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 text-sm" data-person={u.email}>
              <span className="min-w-0 flex-1">
                <span className="block font-medium">{u.name}{self && <span className="text-neutral-400"> (you)</span>}</span>
                <span className="block text-neutral-500">{u.email}</span>
              </span>
              <form action={setRole} className="flex items-center gap-1">
                <input type="hidden" name="id" value={u.id} />
                <select name="role" defaultValue={u.role} disabled={self} aria-label={`What ${u.name} can do`} className={`${inputCls} w-auto py-1`}>
                  {Object.entries(ROLE_TEXT).map(([v, r]) => <option key={v} value={v}>{r.label}</option>)}
                </select>
                {!self && <button className="rounded border border-neutral-300 px-2 py-1 text-xs">Change</button>}
              </form>
              <span className="w-40" title="Two-step sign-in">
                <span className={`rounded px-1.5 py-0.5 text-xs ${twoStep === "On" ? "bg-emerald-100 text-emerald-800" : twoStep === "Off" ? "bg-neutral-200 text-neutral-600" : "bg-amber-100 text-amber-900"}`}>{twoStep}</span>
              </span>
              <span className="w-36 text-xs text-neutral-500">{u.lastLoginAt ? `Last in ${formatDate(u.lastLoginAt, { dateStyle: "medium", timeZone: "Asia/Jerusalem" })}` : ""}</span>
              <span className="flex w-full flex-wrap items-center gap-3 sm:w-auto">
                {waiting && u.active && <InviteAgain id={u.id} name={u.name} />}
                {u.totpEnabledAt && (
                  <form action={resetTwoStep}><input type="hidden" name="id" value={u.id} /><button className="text-xs underline">Reset two-step sign-in</button></form>
                )}
                {!self && (
                  <form action={setActive}><input type="hidden" name="id" value={u.id} /><button className="text-xs underline">{u.active ? "Turn off" : "Turn on"}</button></form>
                )}
                {!waiting && <NewPassword id={u.id} />}
              </span>
            </li>
          );
        })}
      </ul>
    </>
  );
}
