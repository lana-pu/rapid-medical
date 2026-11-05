import type { Chart } from "@/db";

/**
 * Server-rendered SVG bar chart (horizontal). Replaces the chart screenshots.
 * - kind "bar": one series, one bar per category (highlighted series/bars in accent)
 * - kind "stackedBar": several series stacked per category with in-bar labels
 * Colours come from CSS tokens (currentColor / --accent) so the design pass can restyle it.
 */
export function BarChart({ chart, className = "" }: { chart: Chart; className?: string }) {
  const cats = chart.categories;
  const rowH = 36, gap = 14, labelW = 210, w = 680, padR = 56, padT = 8;
  const h = padT + cats.length * (rowH + gap) + 30;
  const totals = cats.map((_, i) => chart.series.reduce((a, s) => a + (s.values[i] ?? 0), 0));
  const max = chart.max ?? Math.max(...(chart.kind === "stackedBar" ? totals : chart.series.flatMap((s) => s.values)), 1);
  const plotW = w - labelW - padR;
  const x = (v: number) => (v / max) * plotW;
  const ticks = niceTicks(max);
  const shades = ["var(--accent)", "color-mix(in srgb, var(--accent) 45%, white)", "color-mix(in srgb, var(--foreground) 35%, white)", "color-mix(in srgb, var(--foreground) 15%, white)"];

  return (
    <figure className={`rounded border border-border bg-background p-4 ${className}`}>
      {chart.title && <figcaption className="mb-3 text-base font-semibold">{chart.title}{chart.unit ? <span className="font-normal text-muted"> ({chart.unit})</span> : null}</figcaption>}
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full" role="img" aria-label={chart.title ?? "Chart"}>
        {cats.map((c, i) => {
          const y = padT + i * (rowH + gap);
          let acc = 0;
          return (
            <g key={i}>
              <text x={labelW - 10} y={y + rowH / 2} dominantBaseline="middle" textAnchor="end" fontSize="12" fontWeight={chart.highlight?.includes(i) ? 700 : 500} fill="currentColor">
                {splitLabel(c).map((line, k, arr) => <tspan key={k} x={labelW - 10} dy={k === 0 ? `${-(arr.length - 1) * 0.6}em` : "1.2em"}>{line}</tspan>)}
              </text>
              {chart.series.map((s, j) => {
                const v = s.values[i] ?? 0;
                const bx = labelW + x(acc);
                const bw = x(v);
                acc += v;
                const hl = chart.kind === "bar" && !!chart.highlight?.includes(i);
                const fill = chart.kind === "bar" ? (hl ? shades[0] : shades[3]) : shades[j % shades.length];
                return (
                  <g key={j}>
                    <rect x={bx} y={y} width={bw} height={rowH} fill={fill} rx={2} />
                    {chart.kind === "stackedBar" && bw > 28 && <text x={bx + bw / 2} y={y + rowH / 2} dominantBaseline="middle" textAnchor="middle" fontSize="12" fill="white" fontWeight={600}>{v}{chart.unit === "%" ? "%" : ""}</text>}
                    {chart.kind === "bar" && <text x={bx + bw + 6} y={y + rowH / 2} dominantBaseline="middle" fontSize="12" fill="currentColor">{v}{chart.unit === "%" ? "%" : ""}</text>}
                  </g>
                );
              })}
            </g>
          );
        })}
        {/* axis */}
        <line x1={labelW} x2={w - padR} y1={h - 24} y2={h - 24} stroke="currentColor" strokeOpacity={0.3} />
        {ticks.map((t) => (
          <text key={t} x={labelW + x(t)} y={h - 8} textAnchor="middle" fontSize="11" fill="currentColor" fillOpacity={0.6}>{t}</text>
        ))}
      </svg>
      {(chart.series.length > 1 || chart.annotations?.length) && (
        <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted">
          {chart.kind === "stackedBar" && chart.series.map((s, j) => (
            <span key={j} className="inline-flex items-center gap-1.5"><span className="inline-block h-3 w-3 rounded-sm" style={{ background: shades[j % shades.length] }} />{s.name}</span>
          ))}
          {chart.annotations?.map((a, i) => <span key={i} className="italic">{a}</span>)}
        </div>
      )}
      {chart.note && <p className="mt-2 text-xs text-muted">{chart.note}</p>}
    </figure>
  );
}

/** Break a long category label into two lines at " (" or the middle space. */
function splitLabel(c: string): string[] {
  if (c.length <= 18) return [c];
  const i = c.indexOf(" (") > 0 ? c.indexOf(" (") : c.lastIndexOf(" ", Math.ceil(c.length / 2) + 4);
  return i > 0 ? [c.slice(0, i), c.slice(i + 1)] : [c];
}

function niceTicks(max: number): number[] {
  const step = max <= 1.2 ? 0.2 : max <= 12 ? 2 : max <= 60 ? 10 : max <= 120 ? 20 : 50;
  const out: number[] = [];
  for (let t = 0; t <= max + 1e-9; t += step) out.push(Number(t.toFixed(2)));
  return out;
}
