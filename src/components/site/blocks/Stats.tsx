import type { ReactNode } from "react";
import type { Stat } from "@/db";
import { Img } from "../primitives";

/** Home-page style counters: icon + big number + label, in a row. */
export function StatRow({ items, render }: { items: Stat[]; render?: (s: Stat, i: number, part: "value" | "label") => ReactNode }) {
  return (
    <dl className="grid gap-10 sm:grid-cols-3">
      {items.map((s, i) => (
        <div key={i} className="flex items-center gap-4">
          {s.iconUrl && <Img src={s.iconUrl} alt="" className="h-14 w-14 flex-none text-accent" />}
          <div>
            <dd className="text-4xl font-semibold tracking-tight md:text-5xl">{render ? render(s, i, "value") : s.value}</dd>
            <dt className="mt-1 text-sm text-muted">{render ? render(s, i, "label") : s.label}</dt>
          </div>
        </div>
      ))}
    </dl>
  );
}

/** Single badge: icon + number + label (evidence "85+ clinical publications"). */
export function StatBadge({ stat, render }: { stat: Stat; render?: (part: "value" | "label") => ReactNode }) {
  return (
    <div className="inline-flex items-center gap-4 rounded border border-border px-6 py-4">
      {stat.iconUrl && <Img src={stat.iconUrl} alt="" className="h-12 w-12 flex-none text-accent" />}
      <div>
        <div className="text-4xl font-semibold tracking-tight">{render ? render("value") : stat.value}</div>
        <div className="text-sm text-muted">{render ? render("label") : stat.label}</div>
      </div>
    </div>
  );
}

/** Proof points: big circles with a number and a caption ("47% FPE", "0% ENT"). */
export function StatCircles({ items, caption, render }: { items: Stat[]; caption?: ReactNode; render?: (s: Stat, i: number, part: "value" | "label" | "note") => ReactNode }) {
  return (
    <figure>
      <div className="flex flex-wrap items-center justify-center gap-6">
        {items.map((s, i) => (
          <div key={i} className="flex aspect-square w-44 flex-col items-center justify-center rounded-full border-2 border-foreground text-center md:w-52">
            <div className="text-4xl font-light leading-none md:text-5xl">{render ? render(s, i, "value") : s.value}</div>
            <div className="mt-1 text-xl font-semibold uppercase leading-tight">{render ? render(s, i, "label") : s.label}</div>
            {s.note && <div className="mt-1 text-xs text-muted">{render ? render(s, i, "note") : s.note}</div>}
          </div>
        ))}
      </div>
      {caption && <figcaption className="mt-6 text-center text-lg font-medium">{caption}</figcaption>}
    </figure>
  );
}
