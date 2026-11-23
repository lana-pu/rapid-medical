"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { JobRow } from "@/blocks/jobs";
import { Button, Chip } from "./ui";
import { inputClass } from "./ui-classes";

/** How many roles are visible before «Show all N roles» (DESIGN.md → Careers). */
export const ROLES_LIMIT = 6;

/** Departments in the order they first appear; roles without a department go last, under «Other». */
export function groupRoles(items: JobRow[]): { department: string; roles: JobRow[] }[] {
  const groups = new Map<string, JobRow[]>();
  for (const j of items) {
    const d = (j.department ?? "").trim() || "Other";
    groups.set(d, [...(groups.get(d) ?? []), j]);
  }
  const other = groups.get("Other");
  groups.delete("Other");
  return [...groups.entries(), ...(other ? [["Other", other] as const] : [])].map(([department, roles]) => ({ department, roles: [...roles] }));
}

/** The first `limit` roles, keeping the department groups. */
export function limitRoles(groups: { department: string; roles: JobRow[] }[], limit: number) {
  const out: { department: string; roles: JobRow[] }[] = [];
  let left = limit;
  for (const g of groups) {
    if (left <= 0) break;
    out.push({ department: g.department, roles: g.roles.slice(0, left) });
    left -= Math.min(left, g.roles.length);
  }
  return out;
}

/** Open positions with filters: department (chips) and city (list); first six, the rest behind a button. */
export function OpenRoles({ items }: { items: JobRow[] }) {
  const departments = useMemo(() => groupRoles(items).map((g) => g.department), [items]);
  const cities = useMemo(() => [...new Set(items.map((j) => (j.location ?? "").trim()).filter(Boolean))].sort(), [items]);
  const [dept, setDept] = useState("");
  const [city, setCity] = useState("");
  const [all, setAll] = useState(false);

  const matching = items.filter((j) => (!dept || ((j.department ?? "").trim() || "Other") === dept) && (!city || (j.location ?? "").trim() === city));
  const groups = groupRoles(matching);
  const shown = all ? groups : limitRoles(groups, ROLES_LIMIT);

  return (
    <div>
      {(departments.length > 1 || cities.length > 1) && (
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter roles">
          {departments.length > 1 &&
            ["", ...departments].map((d) => (
              <Chip key={d || "all"} on={dept === d} onClick={() => { setDept(d); setAll(false); }}>
                {d || "All"}
              </Chip>
            ))}
          {cities.length > 1 && (
            <select aria-label="Location" value={city} onChange={(e) => { setCity(e.target.value); setAll(false); }} className={`${inputClass()} w-auto py-1.5`}>
              <option value="">All locations</option>
              {cities.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          )}
        </div>
      )}

      {matching.length === 0 ? (
        <p className="mt-6 text-muted">No roles match these filters.</p>
      ) : (
        shown.map((g) => (
          <div key={g.department} className="mt-8 first:mt-6">
            <div className="text-xs uppercase tracking-wide text-muted">{g.department}</div>
            <ul className="mt-2 divide-y divide-border border-y border-border">
              {g.roles.map((j) => (
                <li key={j.href} className="flex flex-wrap items-baseline gap-x-4 gap-y-1 py-3">
                  <Link href={j.href} className="min-w-0 flex-1 font-medium hover:underline">{j.title}</Link>
                  {j.location && <span className="text-sm text-muted">{j.location}</span>}
                  {/* a fixed column, so cities line up whether a row has «Apply» or not */}
                  <span className="w-16 text-right text-sm">
                    {j.applyHref && (
                      <a href={j.applyHref} target={j.applyHref.startsWith("mailto:") ? undefined : "_blank"} rel="noopener noreferrer" className="underline">
                        Apply ↗
                      </a>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))
      )}

      {!all && matching.length > ROLES_LIMIT && (
        <Button variant="secondary" size="lg" block onClick={() => setAll(true)} className="mt-6">
          Show all {matching.length} roles
        </Button>
      )}
    </div>
  );
}
