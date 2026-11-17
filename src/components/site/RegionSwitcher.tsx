"use client";

import { usePathname } from "next/navigation";
import type { Region } from "@/db/schema";
import { REGION_CHOICES } from "@/lib/regions";
import { withBase } from "@/lib/demo";

/**
 * Region switcher in the header top bar: the current region by name. It opens the «Choose your location» window
 * (RegionModal, DESIGN.md → Выбор региона); without JavaScript it is a plain link to the page with the same content.
 * The choice returns the visitor to the same page in the new region (/api/region).
 */
export function RegionSwitcher({ region }: { region: Region | null }) {
  const pathname = usePathname() || "/";
  const current = REGION_CHOICES.find((c) => c.region === region);
  return (
    <a
      href={withBase(`/choose-your-location?back=${encodeURIComponent(pathname)}`)}
      aria-label={current ? `Region: ${current.label}. Change region` : "Choose your location"}
      aria-haspopup="dialog"
      className="rounded border border-border px-2 py-0.5"
    >
      🌐 {current ? current.label : "Choose location"} <span aria-hidden>▾</span>
    </a>
  );
}
