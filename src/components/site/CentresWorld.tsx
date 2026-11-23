"use client";

import { useEffect, useState } from "react";
import { geoEqualEarth, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import type { Topology, GeometryCollection } from "topojson-specification";
import type { FeatureCollection, Geometry } from "geojson";
import { withBase } from "@/lib/demo";
import { mapCountry } from "@/lib/map-countries";

const W = 1200, H = 560;

/**
 * The world with the study's countries filled (DESIGN.md → Карта центров). The topology (/map/countries-50m.json) loads
 * on first render; until then — and if it fails — nothing is drawn: the list under it says the same.
 */
export function CentresWorld({ countries }: { countries: string[] }) {
  const [paths, setPaths] = useState<{ land: string; on: string } | null>(null);
  const key = JSON.stringify(countries);
  useEffect(() => {
    let cancelled = false;
    const want = new Set((JSON.parse(key) as string[]).map((c) => mapCountry(c).toLowerCase()));
    fetch(withBase("/map/countries-50m.json"))
      .then((r) => r.json())
      .then((topo: Topology<{ countries: GeometryCollection }>) => {
        if (cancelled) return;
        const all = feature(topo, topo.objects.countries) as unknown as FeatureCollection<Geometry, { name: string }>;
        const path = geoPath(geoEqualEarth().fitExtent([[0, 0], [W, H]], { type: "Sphere" }));
        setPaths({
          land: all.features.filter((f) => f.properties.name !== "Antarctica").map((f) => path(f) ?? "").join(" "),
          on: all.features.filter((f) => want.has(f.properties.name.toLowerCase())).map((f) => path(f) ?? "").join(" "),
        });
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [key]);
  if (!paths) return null;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full" aria-hidden>
      <path d={paths.land} className="fill-border stroke-background" strokeWidth={0.6} vectorEffect="non-scaling-stroke" />
      <path d={paths.on} className="fill-accent stroke-background" strokeWidth={0.6} vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
