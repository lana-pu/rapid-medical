"use client";

import { Children, useCallback, useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Scroll-snap carousel: arrows, dots, keyboard, touch. One child = one slide.
 * `perView` = slides visible at once (responsive via CSS min-width in `slideClass`).
 */
export function Carousel({
  children,
  dots = "bottom",
  arrows = true,
  slideClass = "w-full",
  className = "",
  ariaLabel = "Carousel",
}: {
  children: ReactNode;
  dots?: "bottom" | "left" | "none";
  arrows?: boolean;
  slideClass?: string;
  className?: string;
  ariaLabel?: string;
}) {
  const slides = Children.toArray(children);
  const track = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);

  const goTo = useCallback((i: number) => {
    const el = track.current;
    if (!el) return;
    const n = slides.length;
    const next = ((i % n) + n) % n;
    const child = el.children[next] as HTMLElement | undefined;
    if (child) el.scrollTo({ left: child.offsetLeft - el.offsetLeft, behavior: "smooth" });
  }, [slides.length]);

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const onScroll = () => {
      const kids = Array.from(el.children) as HTMLElement[];
      const x = el.scrollLeft + el.clientWidth / 2;
      let best = 0;
      kids.forEach((k, i) => {
        if (Math.abs(k.offsetLeft - el.offsetLeft + k.clientWidth / 2 - x) < Math.abs(kids[best].offsetLeft - el.offsetLeft + kids[best].clientWidth / 2 - x)) best = i;
      });
      setIndex(best);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  if (slides.length === 0) return null;
  const Dots = (
    <div className={`flex gap-2 ${dots === "left" ? "flex-col" : "justify-center"}`} role="tablist">
      {slides.map((_, i) => (
        <button key={i} type="button" role="tab" aria-selected={i === index} aria-label={`Slide ${i + 1}`} onClick={() => goTo(i)} className={`h-2.5 w-2.5 rounded-full border border-current transition ${i === index ? "bg-current" : "opacity-40 hover:opacity-80"}`} />
      ))}
    </div>
  );

  return (
    <div className={`relative ${dots === "left" ? "flex items-center gap-6" : ""} ${className}`} aria-roledescription="carousel" aria-label={ariaLabel}>
      {dots === "left" && slides.length > 1 && Dots}
      <div className="relative min-w-0 flex-1">
        <div ref={track} className="flex snap-x snap-mandatory gap-6 overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" tabIndex={0} onKeyDown={(e) => { if (e.key === "ArrowRight") goTo(index + 1); if (e.key === "ArrowLeft") goTo(index - 1); }}>
          {slides.map((s, i) => (
            <div key={i} className={`flex-none snap-start ${slideClass}`} aria-roledescription="slide" aria-label={`${i + 1} of ${slides.length}`}>
              {s}
            </div>
          ))}
        </div>
        {arrows && slides.length > 1 && (
          <>
            <button type="button" aria-label="Previous" onClick={() => goTo(index - 1)} className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-border bg-background px-3 py-2 text-lg shadow hover:bg-surface">‹</button>
            <button type="button" aria-label="Next" onClick={() => goTo(index + 1)} className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 rounded-full border border-border bg-background px-3 py-2 text-lg shadow hover:bg-surface">›</button>
          </>
        )}
      </div>
      {dots === "bottom" && slides.length > 1 && <div className="mt-6">{Dots}</div>}
    </div>
  );
}
