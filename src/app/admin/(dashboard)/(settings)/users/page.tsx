import { db, users } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { resetTwoStep, setActive } from "@/admin/people";
import { PageHeader, formatDate } from "@/components/admin/ui";
import { InviteAgain, InviteButton, NewPassword, RoleSelect } from "@/components/admin/PeopleTools";

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
              <RoleSelect id={u.id} role={u.role} name={u.name} self={self} />
              <span className="w-48" title="Two-step sign-in">
                <span className={`rounded px-1.5 py-0.5 text-xs ${twoStep === "On" ? "bg-emerald-100 text-emerald-800" : twoStep === "Off" ? "bg-neutral-200 text-neutral-600" : "bg-amber-100 text-amber-900"}`}>{u.active ? `Two-step: ${twoStep}` : "Access off"}</span>
              </span>
              <span className="w-36 text-xs text-neutral-500">{u.lastLoginAt ? `Last in ${formatDate(u.lastLoginAt, { dateStyle: "medium", timeZone: "Asia/Jerusalem" })}` : ""}</span>
              <span className="flex w-full flex-wrap items-center gap-3 sm:w-auto">
                {waiting && u.active && <InviteAgain id={u.id} name={u.name} />}
                {/* rare actions out of the way (docs/screens/admin-people.md) */}
                {(u.totpEnabledAt || !self || !waiting) && (
                  <details className="relative">
                    <summary className="cursor-pointer list-none rounded border border-neutral-300 px-2 py-1 text-xs hover:bg-neutral-50">More ▾</summary>
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
    </>
  );
}
