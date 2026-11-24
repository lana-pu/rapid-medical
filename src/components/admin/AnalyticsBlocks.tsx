"use client";

import { useId, useState, type ReactNode } from "react";
import { DailyBars } from "./Charts";

/**
 * The Analytics screen's two kinds of blocks (docs/screens/admin-analytics.md → «Иерархия», 2026-11-24): the headline
 * numbers as the tabs of one chart, and a panel whose lesser lists sit behind tabs. Admin chrome: neutral palette.
 */

export type Metric = {
  key: string;
  label: string;
  /** null: cannot be counted (requests per 100 visits with no visits) */
  value: number | null;
  prev: number | null;
  /** by day: the metric is a tab of the chart */
  series?: { day: string; value: number }[];
  empty?: string;
};

const fmt = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: 1 });

function Change({ m, days }: { m: Metric; days: number }) {
  if (m.value === null || m.prev === null) return <>no visits to compare</>;
  const diff = Math.round((m.value - m.prev) * 10) / 10;
  if (diff === 0) return <>same as previous {days} days</>;
  return (
    <>
      <b className={`font-semibold ${diff > 0 ? "text-emerald-700" : "text-neutral-700"}`}>{diff > 0 ? "+" : "−"}{fmt(Math.abs(diff))}</b> vs previous {days} days
    </>
  );
}

/** Visits · Pages viewed · Requests as the tabs of the chart under them; the rate — a number only. */
export function MetricChart({ metrics, days }: { metrics: Metric[]; days: number }) {
  const id = useId();
  const tabs = metrics.filter((m) => m.series);
  const [on, setOn] = useState(tabs[0]?.key);
  const cur = tabs.find((m) => m.key === on) ?? tabs[0];
  const total = cur?.series?.reduce((s, d) => s + d.value, 0) ?? 0;
  return (
    <section aria-label="The period in numbers" className="mb-6 overflow-hidden rounded-xl border border-neutral-200 bg-white">
      <div role="tablist" aria-label="Chart" className="grid grid-cols-2 border-b border-neutral-100 @4xl:grid-cols-4">
        {metrics.map((m, i) => {
          const body = (
            <>
              <span className="block text-[13px] text-neutral-500">{m.label}</span>
              <span className={`mt-0.5 block text-2xl font-semibold tabular-nums @4xl:text-[26px] ${m.value === null ? "text-neutral-400" : "text-neutral-900"}`}>{m.value === null ? "—" : fmt(m.value)}</span>
              <span className="mt-0.5 block text-xs text-neutral-500"><Change m={m} days={days} /></span>
            </>
          );
          // a 2×2 grid on a phone, one row from 896 px: borders between the cells only
          const cell = `relative px-4 py-3.5 text-left @4xl:px-5 ${i % 2 === 0 ? "border-r border-neutral-100" : ""} ${i < 2 ? "border-b border-neutral-100 @4xl:border-b-0" : ""} ${i === 1 ? "@4xl:border-r" : ""}`;
          if (!m.series) return <div key={m.key} className={cell}>{body}</div>;
          const sel = m.key === cur?.key;
          return (
            <button key={m.key} type="button" role="tab" id={`${id}-${m.key}`} aria-selected={sel} aria-controls={`${id}-chart`} onClick={() => setOn(m.key)} className={`${cell} ${sel ? "bg-neutral-50 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-neutral-900" : "hover:bg-neutral-50"}`}>
              {body}
            </button>
          );
        })}
      </div>
      {cur?.series && (
        <div role="tabpanel" id={`${id}-chart`} aria-labelledby={`${id}-${cur.key}`} className="px-4 pb-3 pt-4 @4xl:px-5">
          {total ? <DailyBars days={cur.series} label={`${cur.label} by day`} /> : <p className="py-3 text-sm text-neutral-500">{cur.empty}</p>}
        </div>
      )}
    </section>
  );
}

/** A titled panel; with more than one list, the lesser ones behind tabs (all rendered, the others hidden). */
export function Panel({ title, tabs }: { title: string; tabs: { label: string; content: ReactNode }[] }) {
  const id = useId();
  const [on, setOn] = useState(0);
  return (
    <section aria-label={title} className="min-w-0 rounded-xl border border-neutral-200 bg-white px-4 pb-4 pt-3.5 @4xl:px-5">
      <h2 className="text-[15px] font-semibold text-neutral-900">{title}</h2>
      {tabs.length > 1 && (
        <div role="tablist" aria-label={title} className="mt-2 flex gap-x-1 overflow-x-auto border-b border-neutral-100 [scrollbar-width:none]">
          {tabs.map((t, i) => (
            <button key={t.label} type="button" role="tab" id={`${id}-t${i}`} aria-selected={on === i} aria-controls={`${id}-p${i}`} onClick={() => setOn(i)} className={`-mb-px whitespace-nowrap border-b-2 px-2 py-1.5 text-[13px] ${on === i ? "border-neutral-900 font-medium text-neutral-900" : "border-transparent text-neutral-500 hover:text-neutral-900"}`}>
              {t.label}
            </button>
          ))}
        </div>
      )}
      {tabs.map((t, i) => (
        <div key={t.label} role={tabs.length > 1 ? "tabpanel" : undefined} id={`${id}-p${i}`} aria-labelledby={tabs.length > 1 ? `${id}-t${i}` : undefined} hidden={on !== i} className="mt-2">
          {t.content}
        </div>
      ))}
    </section>
  );
}
