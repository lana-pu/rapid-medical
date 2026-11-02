"use client";

import { useEffect, useRef, useState } from "react";
import { geoEqualEarth, geoPath } from "d3-geo";
import { feature, mesh, merge } from "topojson-client";
import type { Topology, GeometryCollection, Polygon, MultiPolygon } from "topojson-specification";
import type { FeatureCollection, Geometry } from "geojson";

/**
 * Interactive world map from the About page (ported from the Duda custom-HTML
 * widget). Hovering highlights a sales region; clicking opens that region's
 * contact page. Offices are drawn as glowing pins.
 *
 * Topology is loaded from /map/countries-50m.json (world-atlas, 740 KB) on
 * first render; the static fallback image is shown until then.
 */

export type MapRegionKey = "usa" | "canada" | "latam" | "europe" | "middleeast" | "asia" | "australia";

export type WorldMapProps = {
  offices: { lat: number; lon: number; label?: string }[];
  /** region key → href */
  links: Record<MapRegionKey, string>;
  fallbackImageUrl?: string | null;
  className?: string;
};

const W = 1200, H = 560;

/* ISO-3166 numeric ids, as in the original widget */
const EUROPE_IDS = [8, 20, 40, 56, 70, 100, 112, 191, 196, 203, 208, 233, 246, 250, 276, 300, 348, 352, 372, 380, 428, 440, 442, 470, 492, 498, 499, 528, 578, 616, 620, 642, 674, 688, 703, 705, 724, 752, 756, 804, 807, 826];
const MIDEAST_IDS = [376, 682, 784, 634, 48, 414, 512, 368, 364, 400, 422, 760, 792, 275, 818, 887];
const AUS_IDS = [36];
const LATAM_IDS = [484, 84, 188, 222, 320, 340, 558, 591, 68, 76, 152, 170, 218, 328, 600, 604, 740, 858, 862, 32, 192, 214, 332, 388, 780];
const ASIA_IDS_RAW = [4, 31, 50, 64, 96, 104, 116, 144, 156, 158, 356, 360, 392, 398, 408, 410, 417, 418, 458, 462, 496, 524, 586, 608, 643, 702, 704, 762, 764, 795, 860, 626];

const LABELS: { text: string; lat: number; lon: number; small?: boolean; faint?: boolean }[] = [
  { text: "UNITED STATES AND CANADA", lat: 45, lon: -100 },
  { text: "LATIN AMERICA", lat: -18, lon: -60 },
  { text: "EUROPE", lat: 54, lon: 15, small: true },
  { text: "ASIA", lat: 45, lon: 90 },
  { text: "AUSTRALIA", lat: -23, lon: 135 },
  { text: "MIDDLE EAST", lat: 28, lon: 45, small: true, faint: true },
];

type Region = { key: MapRegionKey; label: string; d: string; clip?: boolean };

export function WorldMap({ offices, links, fallbackImageUrl, className = "" }: WorldMapProps) {
  const [data, setData] = useState<{ land: string; borders: string; regions: Region[]; clip: { x: number; y: number; w: number; h: number } } | null>(null);
  const [active, setActive] = useState<MapRegionKey | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const projection = geoEqualEarth().fitExtent([[0, 0], [W, H]], { type: "Sphere" });
  const path = geoPath(projection);
  const project = (lat: number, lon: number) => projection([lon, lat]) ?? [0, 0];

  useEffect(() => {
    let cancelled = false;
    fetch("/map/countries-50m.json")
      .then((r) => r.json())
      .then((topo: Topology<{ countries: GeometryCollection }>) => {
        if (cancelled) return;
        const countries = feature(topo, topo.objects.countries) as unknown as FeatureCollection<Geometry>;
        const valid = new Set(countries.features.map((f) => +String(f.id)));
        const exclude = new Set([...MIDEAST_IDS, ...EUROPE_IDS, ...AUS_IDS, 840, 124, ...LATAM_IDS]);
        const asia = ASIA_IDS_RAW.filter((id) => valid.has(id) && !exclude.has(id));
        const geomFor = (ids: number[]) => merge(topo, topo.objects.countries.geometries.filter((g) => ids.includes(+String(g.id))) as (Polygon | MultiPolygon)[]);
        const defs: { key: MapRegionKey; label: string; ids: number[]; clip?: boolean }[] = [
          { key: "europe", label: "Europe", ids: EUROPE_IDS, clip: true },
          { key: "middleeast", label: "Middle East", ids: MIDEAST_IDS },
          { key: "australia", label: "Australia", ids: AUS_IDS },
          { key: "latam", label: "Latin America", ids: LATAM_IDS },
          { key: "asia", label: "Asia", ids: asia },
          { key: "usa", label: "United States", ids: [840] },
          { key: "canada", label: "Canada", ids: [124] },
        ];
        const [px1, py1] = projection([-26, 34]) ?? [0, 0];
        const [px2, py2] = projection([45, 72]) ?? [0, 0];
        setData({
          land: countries.features.map((f) => path(f) ?? "").join(" "),
          borders: path(mesh(topo, topo.objects.countries, (a, b) => a !== b)) ?? "",
          regions: defs.map((d) => ({ key: d.key, label: d.label, clip: d.clip, d: path(geomFor(d.ids)) ?? "" })),
          clip: { x: Math.min(px1, px2), y: Math.min(py1, py2), w: Math.abs(px2 - px1), h: Math.abs(py2 - py1) },
        });
      })
      .catch(() => {});
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const enter = (k: MapRegionKey) => { if (timer.current) clearTimeout(timer.current); setActive(k); };
  const leave = (k: MapRegionKey) => { timer.current = setTimeout(() => setActive((cur) => (cur === k ? null : cur)), 60); };

  if (!data) {
    return fallbackImageUrl ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={fallbackImageUrl} alt="Rapid Medical regions" className={`w-full rounded-2xl ${className}`} />
    ) : (
      <div className={`aspect-[1200/560] w-full rounded-2xl bg-neutral-900 ${className}`} />
    );
  }

  return (
    <div className={`relative overflow-hidden rounded-2xl ${className}`} style={{ background: "linear-gradient(180deg,#0b1420 0%,#121b29 100%)" }}>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" className="block h-auto w-full select-none" onPointerLeave={() => setActive(null)}>
        <defs>
          <clipPath id="rm-clip-europe"><rect x={data.clip.x} y={data.clip.y} width={data.clip.w} height={data.clip.h} /></clipPath>
        </defs>
        <path d={data.land} fill="#26354d" />
        <g>
          {data.regions.map((r) => (
            <path key={r.key} d={r.d} fill="#289988" style={{ opacity: active === r.key ? 1 : 0, transition: "opacity .14s ease", pointerEvents: "none" }} clipPath={r.clip ? "url(#rm-clip-europe)" : undefined} />
          ))}
        </g>
        <g>
          {data.regions.map((r) => (
            <a key={r.key} href={links[r.key]} aria-label={`Contact ${r.label}`} style={{ clipPath: r.clip ? "url(#rm-clip-europe)" : undefined }}>
              <path d={r.d} fill="#fff" fillOpacity={0.001} style={{ cursor: "pointer" }} onPointerEnter={() => enter(r.key)} onPointerLeave={() => leave(r.key)} />
              <path d={r.d} fill="none" stroke="rgba(0,0,0,0)" strokeWidth={26} style={{ pointerEvents: "stroke", cursor: "pointer" }} onPointerEnter={() => enter(r.key)} onPointerLeave={() => leave(r.key)} />
            </a>
          ))}
        </g>
        <path d={data.borders} fill="none" stroke="rgba(233,238,246,.18)" strokeWidth={0.6} vectorEffect="non-scaling-stroke" style={{ pointerEvents: "none" }} />
        <g style={{ pointerEvents: "none" }}>
          {LABELS.map((l) => {
            const [x, y] = project(l.lat, l.lon);
            return (
              <text key={l.text} x={x} y={y} textAnchor="middle" fill="#fff" fontWeight={700} fontSize={16} letterSpacing={0.5} opacity={l.faint ? 0.85 : l.small ? 0.9 : 1} style={{ textTransform: "uppercase" }}>
                {l.text}
              </text>
            );
          })}
        </g>
        <g style={{ pointerEvents: "none" }}>
          {offices.map((o, i) => {
            const [x, y] = project(o.lat, o.lon);
            return (
              <g key={i} transform={`translate(${x},${y})`}>
                <title>{o.label}</title>
                <circle r={32} fill="#2fd17b" opacity={0.1} />
                <circle r={14} fill="#2fd17b" opacity={0.18} />
                <circle r={2} fill="#fff" />
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}
