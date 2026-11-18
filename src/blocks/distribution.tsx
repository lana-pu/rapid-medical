import { Section, SharedLine } from "@/components/site/primitives";
import { SeriesSwitch } from "@/components/site/SeriesSwitch";
import { F } from "./edit";
import type { BlockDef, BlockProps } from "./types";

export type DistributionVariant = "default";

/** DESIGN.md → Набор инфографики → Распределение по времени: a stacked bar per time point, a switch between series. */
export type DistributionData = {
  title?: string | null;
  /** what the scale is (e.g. «Modified Rankin Scale at 90 days») */
  caption?: string | null;
  /** the scale's categories, best first */
  scale: string[];
  series: { label: string; points: { label: string; n?: string | null; values: string[]; quote?: string | null }[] }[];
};

const num = (v: string) => Number(String(v).replace(",", ".").replace(/[^\d.]/g, "")) || 0;
/** shades of --accent by the step of the scale: the first category full, then lighter (DESIGN.md) */
const SHADES = ["bg-accent", "bg-accent/80", "bg-accent/65", "bg-accent/50", "bg-accent/35", "bg-accent/25", "bg-accent/15"];
const shade = (k: number, of: number) => SHADES[Math.min(SHADES.length - 1, Math.round((k * (SHADES.length - 1)) / Math.max(1, of - 1)))];

function Distribution({ data: d, edit: e, nested }: BlockProps<"distribution">) {
  const scale = d.scale ?? [];
  const series = (d.series ?? []).filter((s) => s.points?.length);
  if (scale.length < 2 || !series.length) return null;
  const inner = (
    <SharedLine title={<F e={e} k="title">{d.title || "Distribution"}</F>} className="mt-16">
      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs" aria-label="Scale">
        {scale.map((c, k) => (
          <li key={k} className="flex items-center gap-1.5">
            <span className={`h-3 w-3 rounded-sm ${shade(k, scale.length)}`} aria-hidden />
            <F e={e} k={`scale.${k}`}>{c}</F>
          </li>
        ))}
      </ul>
      <SeriesSwitch labels={series.map((s) => s.label)}>
        {series.map((s, si) => (
          <ul key={si} className="mt-5 space-y-4">
            {s.points.map((p, pi) => (
              <li key={pi} className="grid grid-cols-[minmax(0,8rem)_minmax(0,1fr)] items-center gap-4">
                <div className="text-sm">
                  <div className="font-medium"><F e={e} k={`series.${si}.points.${pi}.label`}>{p.label}</F></div>
                  {p.n && <div className="text-xs text-muted">n = <F e={e} k={`series.${si}.points.${pi}.n`}>{p.n}</F></div>}
                </div>
                <div className="flex h-7 overflow-hidden rounded" role="img" aria-label={scale.map((c, k) => `${c}: ${p.values[k] ?? "—"}`).join(", ")}>
                  {p.values.map((v, k) => (
                    <div key={k} className={`flex items-center justify-center text-xs tabular-nums ${shade(k, scale.length)} ${k * 2 < scale.length ? "text-accent-foreground" : "text-foreground"}`} style={{ width: `${Math.min(100, num(v))}%` }}>
                      {num(v) >= 8 && <F e={e} k={`series.${si}.points.${pi}.values.${k}`}>{v.includes("%") ? v : `${v}%`}</F>}
                    </div>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        ))}
      </SeriesSwitch>
      {d.caption && <p className="mt-5 text-xs text-muted"><F e={e} k="caption">{d.caption}</F></p>}
    </SharedLine>
  );
  return nested ? inner : <Section>{inner}</Section>;
}

export const distribution: BlockDef<"distribution"> = {
  type: "distribution",
  name: "Distribution over time",
  description: "Shares on a scale (mRS, occlusion grades) as a stacked bar per time point, n on each; a switch between groups — values from the approved document.",
  category: "content",
  variants: [{ id: "default", label: "Default", description: "Shared line: the title on the left, the legend and a bar per time point on the right" }],
  fields: [
    { key: "title", label: "Title", kind: "text" },
    { key: "scale", label: "Scale: categories, best first (required)", kind: "items", required: true },
    { key: "series", label: "Series: label, points (label, n, values in %)", kind: "items", required: true },
    { key: "caption", label: "What the scale is", kind: "text" },
  ],
  example: {
    title: "Occlusion over follow-up",
    caption: "Sample scale: grade I is the best result.",
    scale: ["Grade I", "Grade II", "Grade III"],
    series: [
      { label: "All patients", points: [{ label: "After the procedure", n: "90", values: ["60", "26", "14"] }, { label: "12 months", n: "80", values: ["80", "15", "5"] }] },
      { label: "Wide-necked", points: [{ label: "After the procedure", n: "40", values: ["55", "30", "15"] }, { label: "12 months", n: "35", values: ["77", "17", "6"] }] },
    ],
  },
  Component: Distribution,
};
