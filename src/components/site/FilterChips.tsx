"use client";

/** One look for every chip on the site: on — filled with the text colour, off — a hairline (DESIGN.md → Evidence). */
export const chipClass = (on: boolean) => `rounded-full border px-3 py-1.5 text-sm ${on ? "border-foreground bg-foreground text-background" : "border-border hover:border-foreground"}`;

export type FilterOption = { id: string; label: string; count: number };

/**
 * A filter by product with counts: «All n» and one chip per option (Evidence archive, Webinars). `id` "" is «All».
 */
export function FilterChips({ options, total, value, onChange, label = "Product" }: { options: FilterOption[]; total: number; value: string; onChange: (id: string) => void; label?: string }) {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label={label}>
      {[{ id: "", label: "All", count: total }, ...options].map((p) => (
        <button key={p.id || "all"} type="button" aria-pressed={value === p.id} className={chipClass(value === p.id)} onClick={() => onChange(p.id)}>
          {p.label} <span className="opacity-60">{p.count}</span>
        </button>
      ))}
    </div>
  );
}
