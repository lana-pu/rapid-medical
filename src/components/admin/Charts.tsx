import type { Count } from "@/lib/analytics";
import { Tip } from "./ui";

/**
 * Small, plain charts for the Analytics screen (docs/screens/admin-analytics.md): one series, one colour, numbers as
 * text beside the marks, a tooltip on hover. Admin chrome: the neutral admin palette, one accent for data.
 */

/**
 * Rows with a light bar as long as the value, the name over it, the numbers right; their columns are named above
 * them (docs/screens/admin-analytics.md → «Панели»). A second number (requests) is the main one: dark and bolder.
 */
export function BarList({ rows, valueLabel, extraLabel, empty, note }: { rows: Count[]; valueLabel: string; extraLabel?: string; empty: string; note?: string }) {
  const foot = note && <p className="mt-2 text-xs text-neutral-500">{note}</p>;
  if (!rows.length) return <><p className="py-3 text-sm text-neutral-500">{empty}</p>{foot}</>;
  const max = Math.max(...rows.map((r) => r.value), 1);
  const num = "w-16 py-0.5 pl-2 text-right tabular-nums";
  return (
    <>
      <table className="w-full table-fixed text-[13px]">
        <thead>
          <tr className="text-xs font-medium text-neutral-500">
            <th className="pb-1 text-left font-medium"><span className="sr-only">Name</span></th>
            <th className={`${num} font-medium`}>{valueLabel}</th>
            {extraLabel && <th className={`${num} font-medium`}>{extraLabel}</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.label} title={`${r.label}: ${r.value} ${valueLabel.toLowerCase()}${extraLabel ? `, ${r.extra ?? 0} ${extraLabel.toLowerCase()}` : ""}`}>
              <td className="py-0.5">
                <div className="relative h-[26px] overflow-hidden rounded-[5px]">
                  <div aria-hidden className="absolute inset-y-0 left-0 rounded-[5px] bg-blue-100" style={{ width: `${Math.max((r.value / max) * 100, 2)}%` }} />
                  <span className="relative block truncate px-2 leading-[26px] text-neutral-900">{r.label}</span>
                </div>
              </td>
              <td className={`${num} ${extraLabel ? "text-neutral-600" : "font-semibold text-neutral-900"}`}>{r.value.toLocaleString("en-US")}</td>
              {extraLabel && <td className={`${num} font-semibold text-neutral-900`}>{r.extra ?? 0}</td>}
            </tr>
          ))}
        </tbody>
      </table>
      {foot}
    </>
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

/* ------------------------------------------------------------------ */
/*  The dashboard's small infographics (docs/screens/admin-home.md)    */
/* ------------------------------------------------------------------ */

/** Categorical slots in their fixed, colour-blind-checked order (dataviz reference palette); the rest fold into «Other». */
const SERIES = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100"];
const OTHER = "#a3a3a3";
const dayName = (d: string) => new Date(`${d}T12:00:00Z`).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });

/** Seven small columns, one per day, a tooltip on each; the figure says the total in words for screen readers. */
export function MiniBars({ days, label }: { days: { day: string; value: number }[]; label: string }) {
  const max = Math.max(...days.map((d) => d.value), 1);
  const total = days.reduce((s, d) => s + d.value, 0);
  return (
    <figure aria-label={`${label} by day: ${total} in ${days.length} days`} className="mt-3">
      <div className="flex h-10 items-end gap-[2px]">
        {days.map((d, i) => (
          <Tip key={d.day} tip={`${dayName(d.day)}: ${d.value} ${label.toLowerCase()}`} align={i < 2 ? "start" : i >= days.length - 2 ? "end" : "center"} className="h-full flex-1 items-end">
            <span className="block w-full rounded-t-[3px] bg-[#2a78d6] transition-opacity hover:opacity-80" style={{ height: d.value ? `${Math.max((d.value / max) * 100, 8)}%` : "2px", opacity: d.value ? 1 : 0.2 }} />
          </Tip>
        ))}
      </div>
      <figcaption className="mt-1 flex justify-between text-[11px] text-neutral-400">
        <span>{days[0] ? dayName(days[0].day) : ""}</span>
        <span>today</span>
      </figcaption>
    </figure>
  );
}

/** Shares of one whole as a single bar with a 2px gap between parts, a legend under it and a tooltip on each part. */
export function ShareBar({ title, rows, unit }: { title: string; rows: Count[]; unit: [string, string] }) {
  const total = rows.reduce((s, r) => s + r.value, 0);
  if (!total) return null;
  const top = rows.filter((r) => r.value > 0).slice(0, SERIES.length);
  const rest = total - top.reduce((s, r) => s + r.value, 0);
  const parts = [...top.map((r, i) => ({ label: r.label, value: r.value, color: SERIES[i] })), ...(rest ? [{ label: "Other", value: rest, color: OTHER }] : [])];
  const pct = (v: number) => Math.round((v / total) * 100);
  const of = (v: number) => `${v} ${v === 1 ? unit[0] : unit[1]}`;
  return (
    <figure aria-label={`${title}: ${parts.map((p) => `${p.label} ${of(p.value)}`).join(", ")}`}>
      <figcaption className="mb-1.5 text-xs font-medium text-neutral-700">{title}</figcaption>
      {/* no overflow-hidden here: it would cut the tooltips; the ends are rounded on the parts themselves */}
      <div className="flex h-2.5 gap-[2px]">
        {parts.map((p, i) => (
          <Tip key={p.label} tip={`${p.label}: ${of(p.value)} · ${pct(p.value)}%`} align={i === 0 ? "start" : i === parts.length - 1 ? "end" : "center"} className="h-full min-w-[6px]" style={{ flexGrow: p.value, flexBasis: 0 }}>
            <span className={`block h-full w-full ${i === 0 ? "rounded-l-full" : ""} ${i === parts.length - 1 ? "rounded-r-full" : ""}`} style={{ background: p.color }} />
          </Tip>
        ))}
      </div>
      <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-neutral-600">
        {parts.map((p) => (
          <li key={p.label} className="flex min-w-0 items-center gap-1.5">
            <span aria-hidden className="h-2 w-2 shrink-0 rounded-full" style={{ background: p.color }} />
            <span className="max-w-[12rem] truncate">{p.label}</span>
            <span className="tabular-nums text-neutral-900">{p.value}</span>
          </li>
        ))}
      </ul>
    </figure>
  );
}

/** A thin bar of value out of total; amber when it needs attention, green when it does not (the caller says which). */
export function Meter({ value, total, warn, tip }: { value: number; total: number; warn: boolean; tip: string }) {
  const share = total ? Math.min(value / total, 1) : 1;
  return (
    <Tip tip={tip} focusable className="block w-full">
      <span role="meter" aria-valuemin={0} aria-valuemax={total} aria-valuenow={Math.min(value, total)} aria-label={tip} className="block h-1.5 w-full overflow-hidden rounded-full bg-neutral-200">
        <span className={`block h-full rounded-full ${warn ? "bg-amber-500" : "bg-emerald-500"}`} style={{ width: `${Math.max(share * 100, share > 0 ? 2 : 0)}%` }} />
      </span>
    </Tip>
  );
}
