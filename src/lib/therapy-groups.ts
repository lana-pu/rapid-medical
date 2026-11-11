/**
 * Therapy groups: how the "Therapies" menu and the regional overview are organised
 * (spec.md → Регионы и URL, decision 2026-11-10). Stored on `solutions.therapy_group`.
 */
export const THERAPY_GROUPS = [
  { value: "ischemic", label: "Ischemic stroke" },
  { value: "hemorrhagic", label: "Hemorrhagic stroke" },
  { value: "access", label: "Access" },
] as const;

export type TherapyGroup = (typeof THERAPY_GROUPS)[number]["value"];

/** Default group for the known therapy slugs (seed and migration backfill use the same mapping). */
export function groupForSlug(slug: string): TherapyGroup | "" {
  if (slug === "lvo" || slug === "mvo") return "ischemic";
  if (slug === "aneurysm" || slug === "vasospasm") return "hemorrhagic";
  if (slug === "drivewire" || slug === "hyperdrive" || slug === "access") return "access";
  return "";
}

/** Items bucketed by group in menu order; ungrouped items go to a trailing bucket without a label. */
export function groupTherapies<T extends { therapyGroup?: string | null }>(items: T[]): { value: string; label: string; items: T[] }[] {
  const buckets: { value: string; label: string; items: T[] }[] = THERAPY_GROUPS.map((g) => ({ value: g.value, label: g.label, items: [] }));
  const rest: T[] = [];
  for (const it of items) {
    const b = buckets.find((g) => g.value === it.therapyGroup);
    if (b) b.items.push(it);
    else rest.push(it);
  }
  if (rest.length) buckets.push({ value: "", label: "", items: rest });
  return buckets.filter((b) => b.items.length > 0);
}
