import type { Count } from "@/lib/analytics";

/**
 * Small, plain charts for the Analytics screen (docs/screens/admin-analytics.md): one series, one colour, numbers as
 * text beside the marks, a tooltip on hover. Admin chrome: the neutral admin palette, one accent for data.
 */

/** Rows with a bar as long as the value; an optional second number (e.g. leads) in its own column. */
export function BarList({ rows, valueLabel, extraLabel, empty }: { rows: Count[]; valueLabel: string; extraLabel?: string; empty: string }) {
  if (!rows.length) return <p className="py-3 text-sm text-neutral-500">{empty}</p>;
  const max = Math.max(...rows.map((r) => r.value), 1);
  return (
    <table className="w-full text-sm">
      <thead className="sr-only">
        <tr><th>Name</th><th>{valueLabel}</th>{extraLabel && <th>{extraLabel}</th>}</tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.label} title={`${r.label}: ${r.value} ${valueLabel.toLowerCase()}${extraLabel ? `, ${r.extra ?? 0} ${extraLabel.toLowerCase()}` : ""}`}>
            <td className="py-1 pr-3">
              <div className="relative h-7 overflow-hidden rounded">
                <div aria-hidden className="absolute inset-y-0 left-0 rounded bg-blue-100" style={{ width: `${Math.max((r.value / max) * 100, 2)}%` }} />
                <span className="relative block truncate px-2 leading-7">{r.label}</span>
              </div>
            </td>
            <td className="w-16 py-1 text-right tabular-nums text-neutral-900">{r.value}</td>
            {extraLabel && <td className="w-16 py-1 text-right tabular-nums text-neutral-500">{r.extra ?? 0}</td>}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** Visits by day as columns; the first and last dates under them. */
export function DailyBars({ days, label }: { days: { day: string; value: number }[]; label: string }) {
  const max = Math.max(...days.map((d) => d.value), 1);
  const fmt = (d: string) => new Date(`${d}T12:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  const total = days.reduce((s, d) => s + d.value, 0);
  return (
    <figure aria-label={`${label}: ${total} in ${days.length} days`}>
      <div className="flex h-32 items-end gap-[2px]">
        {days.map((d) => (
          <div key={d.day} title={`${fmt(d.day)}: ${d.value}`} className="group flex h-full flex-1 items-end">
            <div className="w-full rounded-t-[4px] bg-blue-500 group-hover:bg-blue-700" style={{ height: d.value ? `${Math.max((d.value / max) * 100, 3)}%` : "1px", opacity: d.value ? 1 : 0.25 }} />
          </div>
        ))}
      </div>
      <figcaption className="mt-1 flex justify-between text-xs text-neutral-500">
        <span>{days[0] ? fmt(days[0].day) : ""}</span>
        <span>{days.length ? fmt(days[days.length - 1].day) : ""}</span>
      </figcaption>
    </figure>
  );
}

/** A headline number with the change against the period before, in words. */
export function Tile({ label, value, prev, days, suffix = "" }: { label: string; value: number; prev: number; days: number; suffix?: string }) {
  const diff = value - prev;
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-5">
      <div className="text-sm text-neutral-500">{label}</div>
      <div className="mt-1 text-3xl font-semibold tabular-nums">{value}{suffix}</div>
      <div className="mt-1 text-xs text-neutral-500">{diff === 0 ? "same as" : `${diff > 0 ? "+" : ""}${Math.round(diff * 10) / 10}${suffix} vs`} previous {days} days</div>
    </div>
  );
}
