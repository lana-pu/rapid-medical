"use client";

import { useEffect, useRef, useState } from "react";
import type { Region } from "@/db/schema";
import { REGION_CHOICES } from "@/lib/regions";
import { DEMO, withBase } from "@/lib/demo";
import { RegionPicker, type RegionOption, type RegionSourceKind } from "./RegionPicker";

const NEXT = /^[a-z-]+(\/[a-z0-9-]+)?$/; // «evidence», «therapies/lvo» — as CHOOSER_NEXT

/** Where each region's button leads: back to the same page in that region, or on to the section asked for. */
export function regionTargets({ next, back }: { next?: string | null; back?: string | null }): RegionOption[] {
  const page = next && NEXT.test(next) ? next : "therapies";
  return REGION_CHOICES.map((c) => ({
    region: c.region,
    label: c.label,
    href: DEMO
      ? withBase(`/${c.region}/${page}`)
      : `/api/region?to=${c.region}&back=${encodeURIComponent(back && back.startsWith("/") ? back : `/${c.region}/${page}`)}`,
  }));
}

/**
 * «Choose your location» as a window (DESIGN.md → Выбор региона): every link to /choose-your-location opens it instead —
 * the header switcher (`?back=` the page) and links to regional pages while the region is unknown (`?next=`). Nothing
 * opens on the first visit. Without JavaScript the links lead to the page with the same content.
 */
export function RegionModal({ region, source }: { region: Region | null; source: RegionSourceKind }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [target, setTarget] = useState<{ next?: string | null; back?: string | null } | null>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a) return;
      const url = new URL(a.href, window.location.href);
      if (url.origin !== window.location.origin || !url.pathname.endsWith("/choose-your-location")) return;
      // before next/link's own handler (capture phase): it would navigate to the page instead
      e.preventDefault();
      e.stopPropagation();
      const back = url.searchParams.get("back");
      // the open tab (#…) is known only here
      setTarget({ next: url.searchParams.get("next"), back: back ? back + (back === window.location.pathname ? window.location.hash : "") : null });
      ref.current?.showModal();
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  const current = region && target?.back ? { label: REGION_CHOICES.find((c) => c.region === region)?.label ?? region, source } : null;
  return (
    <dialog
      ref={ref}
      aria-labelledby="region-modal-title"
      onClick={(e) => { if (e.target === ref.current) ref.current?.close(); }} // a click on the backdrop closes
      onClose={() => setTarget(null)}
      className="bg-background p-0 text-foreground backdrop:bg-foreground/40 max-md:m-0 max-md:h-full max-md:max-h-none max-md:w-full max-md:max-w-none md:m-auto md:w-full md:max-w-4xl md:rounded"
    >
      {target && (
        <div className="p-6 md:p-8">
          <div className="flex items-start justify-between gap-4">
            <h2 id="region-modal-title" className="text-2xl font-semibold">Choose your location</h2>
            <button type="button" onClick={() => ref.current?.close()} aria-label="Close" className="-m-2 p-2 text-xl leading-none">×</button>
          </div>
          <div className="mt-3">
            <RegionPicker options={regionTargets(target)} current={current} />
          </div>
        </div>
      )}
    </dialog>
  );
}
