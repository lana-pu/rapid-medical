import type { ReactNode } from "react";
import type { Block, Section, Tab } from "./model";

/**
 * A section drawn small, from its own blocks (left panel, «Секции»): the background, the columns, and each block as a
 * shape — a heading as a thick bar, text as thin lines, buttons as pills, a picture as a filled box. Built from the data,
 * so a section a designer saves gets its own picture too.
 */
const BG: Record<string, string> = { white: "bg-background", grey: "bg-surface", dark: "bg-inverse text-inverse-foreground", image: "bg-inverse text-inverse-foreground" };
const FLEX: Record<string, number[]> = { "1": [1], "1-1": [1, 1], "2-1": [2, 1], "1-2": [1, 2], "1-1-1": [1, 1, 1] };

const bar = (w: string, h = "h-[3px]", o = "opacity-70") => <span className={`block ${h} ${w} rounded-full bg-current ${o}`} />;
const many = (n: number, f: (k: number) => ReactNode) => Array.from({ length: n }, (_, k) => <span key={k} className="min-w-0 flex-1">{f(k)}</span>);

function Shape({ b }: { b: Block }) {
  const n = Number(b.o.count ?? b.o.rows ?? 3);
  const center = b.o.align === "center" ? "items-center" : "items-start";
  switch (b.type) {
    case "heading": return <span className={`flex flex-col gap-[3px] ${center}`}>{b.o.eyebrow === "on" && bar("w-1/3", "h-[2px]", "opacity-40")}{bar(b.o.level === "h1" ? "w-4/5" : "w-3/5", b.o.level === "h1" ? "h-[5px]" : "h-[4px]", "opacity-90")}</span>;
    case "text": return <span className={`flex flex-col gap-[3px] ${center}`}>{bar("w-full", "h-[2px]", "opacity-40")}{bar("w-4/5", "h-[2px]", "opacity-40")}</span>;
    case "buttons": return <span className={`flex gap-1 ${b.o.align === "center" ? "justify-center" : ""}`}>{Array.from({ length: Math.min(n, 3) }, (_, k) => <span key={k} className={`block h-[6px] w-5 rounded-full ${k === 0 && b.o.style !== "link" ? "bg-current opacity-80" : "border border-current opacity-50"}`} />)}</span>;
    case "media": return <span className="block aspect-[16/10] w-full rounded-[2px] bg-current opacity-25" />;
    case "numbers": return <span className="flex gap-1.5">{many(Math.min(n, 4), () => <span className="flex flex-col gap-[3px]">{bar("w-3/4", "h-[5px]", "opacity-90")}{bar("w-full", "h-[2px]", "opacity-40")}</span>)}</span>;
    case "cards": return <span className="flex gap-1">{many(Math.min(n, 4), () => <span className="flex flex-col gap-[3px] rounded-[2px] border border-current/30 p-[3px]">{(b.o.style === "image" || b.o.style === "link") && <span className="block aspect-[4/3] w-full rounded-[1px] bg-current opacity-25" />}{bar("w-3/4", "h-[3px]", "opacity-80")}{bar("w-full", "h-[2px]", "opacity-40")}</span>)}</span>;
    case "facts": return <span className="flex flex-col gap-[3px]">{Array.from({ length: Math.min(n, 4) }, (_, k) => <span key={k} className="flex gap-1.5">{bar("w-1/3", "h-[2px]", "opacity-40")}{bar("w-1/2", "h-[2px]", "opacity-80")}</span>)}</span>;
    case "quote": return <span className="flex flex-col items-center gap-[3px]"><span className="text-sm font-semibold leading-none opacity-60">“</span>{bar("w-4/5", "h-[3px]", "opacity-70")}{bar("w-3/5", "h-[3px]", "opacity-70")}</span>;
    case "list": return b.o.view === "rows"
      ? <span className="flex flex-col gap-[4px]">{Array.from({ length: Math.min(n, 4) }, (_, k) => <span key={k} className="block border-b border-current/25 pb-[3px]">{bar("w-4/5", "h-[2px]", "opacity-60")}</span>)}</span>
      : <span className="flex gap-1">{many(Math.min(n, 3), () => <span className="flex flex-col gap-[3px]"><span className="block aspect-[4/3] w-full rounded-[1px] bg-current opacity-25" />{bar("w-full", "h-[2px]", "opacity-60")}</span>)}</span>;
    case "tabs": {
      const tabs = (b.d.tabs as Tab[]) ?? [];
      return <span className="flex flex-col gap-1"><span className="flex gap-1">{tabs.slice(0, 3).map((_, k) => <span key={k} className={`block h-[5px] w-5 rounded-full ${k === 0 ? "bg-current opacity-80" : "border border-current opacity-40"}`} />)}</span><span className="block h-5 w-full rounded-[2px] border border-current/30" /></span>;
    }
  }
}

export function SectionThumb({ s }: { s: Section }) {
  const flex = FLEX[s.layout] ?? [1];
  return (
    <span aria-hidden className={`flex aspect-[16/10] w-full items-center overflow-hidden rounded-md border border-border px-2.5 ${BG[s.bg] ?? BG.white} ${s.space === "large" ? "py-3" : "py-2"}`}>
      <span className={`flex w-full gap-2 ${s.valign === "center" || s.layout !== "1" ? "items-center" : "items-start"}`}>
        {flex.map((f, k) => (
          <span key={k} className="flex min-w-0 flex-col gap-1.5" style={{ flex: f }}>
            {(s.cols[k] ?? []).map((b) => <Shape key={b.id} b={b} />)}
          </span>
        ))}
      </span>
    </span>
  );
}
