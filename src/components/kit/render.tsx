"use client";

import { useLayoutEffect, useRef, type ReactNode, type CSSProperties } from "react";
import { selectionColours } from "./contrast";
import { Eyebrow, H1, H2, KeyValue } from "@/components/site/layout-primitives";
import { buttonClass } from "@/components/site/ui-classes";
import { withBase } from "@/lib/demo";
import { BLOCK_DEFS, colKey, tabKey, type Block, type Section, type Tab } from "./model";

/**
 * The sandbox's blocks (/lab/blocks), drawn with the site's primitives, classes and tokens — the same look the site has
 * today, so a section built here can be compared with the page it stands for. Texts are edited in place.
 */

export type LabData = {
  images: { url: string; alt: string }[];
  news: { title: string; date: string; source: string; image: string | null }[];
  publications: { title: string; journal: string; date: string }[];
  webinars: { title: string; speaker: string; image: string | null }[];
  jobs: { title: string; department: string; location: string }[];
};

export type Ctx = {
  data: LabData;
  dark: boolean;
  /** the selected element's key and the keys above it (drawn dashed) */
  sel: string | null;
  trail: Set<string>;
  /** the innermost element under the pointer: only it gets the thin line and its name */
  hover: string | null;
  onHover: (key: string | null) => void;
  onPick: (key: string) => void;
  onData: (id: string, patch: Record<string, unknown>) => void;
  activeTab: (tabsId: string) => number;
};

/** The outline and name tag of a selectable element: solid when selected, dashed when it holds the selection, on hover a thin line. */
function Frame({ k, name, c, children, className = "", inset = false }: { k: string; name: string; c: Pick<Ctx, "sel" | "trail" | "onPick" | "hover" | "onHover">; children: ReactNode; className?: string; inset?: boolean }) {
  const on = c.sel === k;
  const up = c.trail.has(k);
  const hot = !on && c.hover === k;
  const ref = useRef<HTMLDivElement>(null);
  // the outline's colour is worked out from the background really behind it (contrast.ts); re-read on every render
  // while marked, so a changed section background or palette is picked up at once
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || !(on || hot || up)) return;
    const { line, text } = selectionColours(inset ? el : (el.parentElement ?? el));
    el.style.setProperty("--lab-line", line);
    el.style.setProperty("--lab-text", text);
  });
  const line = on ? "outline outline-2" : hot ? "outline outline-1" : up ? "outline outline-1 outline-dashed" : "";
  return (
    <div ref={ref} data-lab={k} onClick={(e) => { e.stopPropagation(); c.onPick(k); }} onMouseOver={(e) => { e.stopPropagation(); if (c.hover !== k) c.onHover(k); }}
      style={{ outlineColor: "var(--lab-line)" }}
      className={`relative ${inset ? "-outline-offset-2" : "outline-offset-4"} ${line} ${className}`}>
      {(on || hot) && (
        <span style={{ background: "var(--lab-line)", color: "var(--lab-text)" }}
          className={`pointer-events-none absolute z-10 whitespace-nowrap rounded-sm px-1.5 py-0.5 text-[11px] font-medium leading-none ${inset ? "top-1" : "-top-5"} ${on ? (inset ? "left-1" : "left-0") : `${inset ? "right-1" : "right-0"} opacity-80`}`}>{name}</span>
      )}
      {children}
    </div>
  );
}

/** A text edited in place: click, type, leave the field. */
function E({ v, onSet, className = "", as = "span", style }: { v: string; onSet: (t: string) => void; className?: string; as?: "span" | "div" | "p" | "h1" | "h2" | "h3" | "blockquote"; style?: CSSProperties }) {
  const Tag = as;
  return (
    <Tag
      contentEditable
      suppressContentEditableWarning
      spellCheck={false}
      className={`rounded-sm outline-none focus:ring-2 focus:ring-accent/60 ${className}`}
      style={style}
      onBlur={(e) => {
        const t = (e.currentTarget as HTMLElement).innerText.trim();
        if (t !== v) onSet(t);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" && !e.shiftKey && as !== "p" && as !== "div") {
          e.preventDefault();
          (e.currentTarget as HTMLElement).blur();
        }
      }}
    >
      {v}
    </Tag>
  );
}

const img = (data: LabData, i: unknown) => data.images.length ? data.images[Math.abs(Number(i) || 0) % data.images.length] : null;
const RATIO: Record<string, string> = { wide: "aspect-video", photo: "aspect-[4/3]", square: "aspect-square", pano: "aspect-[21/9]" };
const muted = (dark: boolean) => (dark ? "opacity-80" : "text-muted");
const center = (o: Block["o"]) => o.align === "center";

function Heading({ b, c }: { b: Block; c: Ctx }) {
  const d = b.d as { eyebrow: string; title: string; sub: string };
  const set = (k: string) => (t: string) => c.onData(b.id, { [k]: t });
  const rule = b.o.rule === "below" ? "border-b border-border pb-6" : b.o.rule === "above" ? "border-t border-border pt-6" : "";
  const title = <E v={d.title} onSet={set("title")} />;
  return (
    <div className={`${center(b.o) ? "mx-auto text-center" : ""} ${rule}`}>
      {b.o.eyebrow === "on" && <div className={c.dark ? "opacity-80" : ""}><Eyebrow><E v={d.eyebrow} onSet={set("eyebrow")} /></Eyebrow></div>}
      {b.o.level === "h1" ? <H1>{title}</H1> : b.o.level === "h2" ? <H2>{title}</H2> : <h3 className="text-xl font-semibold leading-tight tracking-tight">{title}</h3>}
    </div>
  );
}

function Text({ b, c }: { b: Block; c: Ctx }) {
  const size = { normal: "text-base", lead: `text-lg ${muted(c.dark)}`, large: "text-xl md:text-2xl", small: `text-sm ${muted(c.dark)}` }[b.o.size] ?? "";
  return <E as="p" v={String(b.d.body ?? "")} onSet={(t) => c.onData(b.id, { body: t })} className={`block ${size} ${b.o.cols === "2" ? "md:columns-2 md:gap-10" : "max-w-3xl"} ${center(b.o) ? "mx-auto text-center" : ""}`} />;
}

function Buttons({ b, c }: { b: Block; c: Ctx }) {
  const items = (b.d.items as string[]) ?? [];
  const n = Number(b.o.count) || 1;
  const set = (i: number) => (t: string) => c.onData(b.id, { items: items.map((x, k) => (k === i ? t : x)) });
  return (
    <div className={`flex flex-wrap items-center gap-3 ${center(b.o) ? "justify-center" : ""}`}>
      {Array.from({ length: n }, (_, i) => {
        const label = <E v={items[i] || "Learn more"} onSet={set(i)} />;
        if (b.o.style === "link") return <span key={i} className="font-medium underline underline-offset-4">{label} →</span>;
        return <span key={i} className={buttonClass({ variant: b.o.style === "outline" || i > 0 ? "secondary" : "primary", onDark: c.dark })}>{label}</span>;
      })}
    </div>
  );
}

function Media({ b, c }: { b: Block; c: Ctx }) {
  const pic = img(c.data, b.d.src);
  const ratio = RATIO[b.o.ratio] ?? "aspect-video";
  const body =
    b.o.kind === "document" ? (
      <div className="flex items-center gap-5 rounded border border-border p-5">
        <div className="aspect-[3/4] w-20 flex-none overflow-hidden rounded bg-surface">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {pic && <img src={withBase(pic.url)} alt="" className="h-full w-full object-cover opacity-60" />}
        </div>
        <div>
          <div className="font-semibold">Instructions for use</div>
          <div className={`text-sm ${muted(c.dark)}`}>PDF · 2.4 MB</div>
          <span className={`mt-3 ${buttonClass({ variant: "secondary", size: "sm", onDark: c.dark })}`}>Download PDF</span>
        </div>
      </div>
    ) : (
      <div className={`relative w-full overflow-hidden rounded bg-surface ${ratio}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {pic && <img src={withBase(pic.url)} alt={pic.alt} className="h-full w-full object-cover" />}
        {b.o.kind === "video" && <span className="absolute inset-0 m-auto flex h-16 w-16 items-center justify-center rounded-full bg-background/90 text-2xl text-foreground">▶</span>}
      </div>
    );
  return (
    <figure>
      {body}
      {b.o.caption === "on" && <figcaption className={`mt-2 text-sm ${muted(c.dark)}`}><E v={String(b.d.caption ?? "")} onSet={(t) => c.onData(b.id, { caption: t })} /></figcaption>}
    </figure>
  );
}

type Stat = { value: string; label: string; note: string };
function Numbers({ b, c }: { b: Block; c: Ctx }) {
  const items = ((b.d.items as Stat[]) ?? []).slice(0, Number(b.o.count) || 1);
  const all = (b.d.items as Stat[]) ?? [];
  const set = (i: number, k: keyof Stat) => (t: string) => c.onData(b.id, { items: all.map((x, j) => (j === i ? { ...x, [k]: t } : x)) });
  const cols = { 1: "", 2: "sm:grid-cols-2", 3: "sm:grid-cols-3", 4: "sm:grid-cols-2 md:grid-cols-4" }[items.length] ?? "";
  if (b.o.style === "circles")
    return (
      <div className={`flex flex-wrap items-center gap-6 ${center(b.o) ? "justify-center" : ""}`}>
        {items.map((s, i) => (
          <div key={i} className={`flex aspect-square w-40 flex-col items-center justify-center rounded-full border-2 text-center md:w-44 ${c.dark ? "border-inverse-foreground" : "border-foreground"}`}>
            <E v={s.value} onSet={set(i, "value")} className="text-4xl font-light leading-none" />
            <E v={s.label} onSet={set(i, "label")} className="mt-1 text-lg font-semibold uppercase leading-tight" />
            {s.note && <E v={s.note} onSet={set(i, "note")} className={`mt-1 text-xs ${muted(c.dark)}`} />}
          </div>
        ))}
      </div>
    );
  if (b.o.style === "badge")
    return (
      <div className={`flex flex-wrap gap-4 ${center(b.o) ? "justify-center" : ""}`}>
        {items.map((s, i) => (
          <div key={i} className="inline-flex items-center gap-4 rounded border border-border px-6 py-4">
            <E v={s.value} onSet={set(i, "value")} className="text-4xl font-semibold tracking-tight" />
            <E v={s.label} onSet={set(i, "label")} className={`text-sm ${muted(c.dark)}`} />
          </div>
        ))}
      </div>
    );
  return (
    <dl className={`grid gap-8 ${cols} ${center(b.o) ? "text-center" : ""}`}>
      {items.map((s, i) => (
        <div key={i} className={b.o.style === "line" ? "border-t border-border pt-4" : ""}>
          <dd><E v={s.value} onSet={set(i, "value")} className="text-4xl font-semibold tracking-tight md:text-5xl" /></dd>
          <dt className="mt-1 text-sm"><E v={s.label} onSet={set(i, "label")} className="font-medium" /></dt>
          {s.note && <dd className={`text-xs ${muted(c.dark)}`}><E v={s.note} onSet={set(i, "note")} /></dd>}
        </div>
      ))}
    </dl>
  );
}

type Card = { title: string; body: string };
function Cards({ b, c }: { b: Block; c: Ctx }) {
  const all = (b.d.items as Card[]) ?? [];
  const items = all.slice(0, Number(b.o.count) || 3);
  const set = (i: number, k: keyof Card) => (t: string) => c.onData(b.id, { items: all.map((x, j) => (j === i ? { ...x, [k]: t } : x)) });
  const cols = { 2: "sm:grid-cols-2", 3: "sm:grid-cols-2 md:grid-cols-3", 4: "sm:grid-cols-2 md:grid-cols-4" }[items.length] ?? "";
  const frame = b.o.frame === "line" ? "border-t border-border pt-6" : b.o.frame === "box" ? "rounded border border-border p-6" : "";
  return (
    <div className={`grid gap-8 ${cols}`}>
      {items.map((it, i) => {
        const pic = img(c.data, i + 2);
        return (
          <div key={i} className={frame}>
            {b.o.style === "steps" && <div className="mb-3 text-5xl font-semibold leading-none text-accent">{i + 1}</div>}
            {(b.o.style === "image" || b.o.style === "link") && (
              <div className="mb-4 aspect-video overflow-hidden rounded bg-surface">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {pic && <img src={withBase(pic.url)} alt="" className="h-full w-full object-cover" />}
              </div>
            )}
            <E as="h3" v={it.title} onSet={set(i, "title")} className="block text-lg font-semibold" />
            <E as="p" v={it.body} onSet={set(i, "body")} className={`mt-2 block text-sm ${muted(c.dark)}`} />
            {b.o.style === "link" && <span className="mt-3 inline-block text-sm font-medium underline underline-offset-4">Explore →</span>}
          </div>
        );
      })}
    </div>
  );
}

function Facts({ b, c }: { b: Block; c: Ctx }) {
  const all = (b.d.rows as [string, string][]) ?? [];
  const rows = all.slice(0, Number(b.o.rows) || 3);
  const set = (i: number, k: 0 | 1) => (t: string) => c.onData(b.id, { rows: all.map((r, j) => (j === i ? (k ? [r[0], t] : [t, r[1]]) : r)) });
  if (b.o.layout === "top")
    return (
      <dl className="grid gap-5 sm:grid-cols-2">
        {rows.map((r, i) => (
          <div key={i} className="border-t border-border pt-3">
            <dt className={`text-sm ${muted(c.dark)}`}><E v={r[0]} onSet={set(i, 0)} /></dt>
            <dd className="mt-1 text-lg font-semibold"><E v={r[1]} onSet={set(i, 1)} /></dd>
          </div>
        ))}
      </dl>
    );
  return <KeyValue rows={rows.map((r, i) => ({ label: <E v={r[0]} onSet={set(i, 0)} />, value: <E v={r[1]} onSet={set(i, 1)} /> }))} />;
}

function Quote({ b, c }: { b: Block; c: Ctx }) {
  const pic = img(c.data, b.d.src);
  return (
    <figure className="flex gap-6">
      {b.o.photo === "on" && (
        <div className="h-16 w-16 flex-none overflow-hidden rounded-full bg-surface md:h-20 md:w-20">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {pic && <img src={withBase(pic.url)} alt="" className="h-full w-full object-cover" />}
        </div>
      )}
      <div>
        <E as="blockquote" v={String(b.d.text ?? "")} onSet={(t) => c.onData(b.id, { text: t })} className={`block ${b.o.size === "large" ? "text-2xl md:text-3xl" : "text-lg"} leading-snug`} />
        <figcaption className={`mt-3 text-sm ${muted(c.dark)}`}><E v={String(b.d.who ?? "")} onSet={(t) => c.onData(b.id, { who: t })} /></figcaption>
      </div>
    </figure>
  );
}

function List({ b, c }: { b: Block; c: Ctx }) {
  const n = Number(b.o.count) || 3;
  const src = b.o.source;
  const rows: { title: string; lead: string; meta: string; image: string | null }[] =
    src === "publications" ? c.data.publications.map((p) => ({ title: p.title, lead: p.date, meta: p.journal, image: null }))
    : src === "webinars" ? c.data.webinars.map((w) => ({ title: w.title, lead: "Webinar", meta: w.speaker, image: w.image }))
    : src === "jobs" ? c.data.jobs.map((j) => ({ title: j.title, lead: j.department, meta: j.location, image: null }))
    : c.data.news.map((x) => ({ title: x.title, lead: x.date, meta: x.source, image: x.image }));
  const items = rows.slice(0, n);
  if (!items.length) return <p className={`text-sm ${muted(c.dark)}`}>No records of this kind in the database.</p>;
  const pic = (i: number, url: string | null) => url ?? img(c.data, i)?.url ?? null;
  const card = (r: (typeof items)[number], i: number, big = false) => (
    <div key={i}>
      <div className={`mb-4 overflow-hidden rounded bg-surface ${big ? "aspect-[16/9]" : "aspect-video"}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {pic(i, r.image) && <img src={withBase(pic(i, r.image)!)} alt="" className="h-full w-full object-cover" />}
      </div>
      <div className={`text-xs uppercase tracking-wide ${muted(c.dark)}`}>{r.lead}{r.meta ? ` · ${r.meta}` : ""}</div>
      <div className={`mt-2 font-semibold leading-tight ${big ? "text-2xl" : "text-lg"}`}>{r.title}</div>
    </div>
  );
  const row = (r: (typeof items)[number], i: number) => (
    <li key={i} className="grid gap-1 py-4 sm:grid-cols-[7rem_minmax(0,1fr)] sm:gap-6">
      <span className={`text-sm ${muted(c.dark)}`}>{r.lead}</span>
      <span><span className="font-medium">{r.title}</span>{r.meta && <span className={`block text-sm ${muted(c.dark)}`}>{r.meta}</span>}</span>
    </li>
  );
  if (b.o.view === "rows") return <ul className="divide-y divide-border border-y border-border">{items.map(row)}</ul>;
  if (b.o.view === "featured")
    return (
      <div className="grid gap-8 md:grid-cols-12 md:gap-10">
        <div className="md:col-span-7">{card(items[0], 0, true)}</div>
        <ul className="divide-y divide-border md:col-span-5">{items.slice(1).map(row)}</ul>
      </div>
    );
  return <div className={`grid gap-8 sm:grid-cols-2 ${n >= 3 ? "md:grid-cols-3" : ""}`}>{items.map((r, i) => card(r, i))}</div>;
}

function Tabs({ b, c }: { b: Block; c: Ctx }) {
  const tabs = (b.d.tabs as Tab[]) ?? [];
  const at = Math.min(c.activeTab(b.id), Math.max(0, tabs.length - 1));
  const cur = tabs[at];
  const pill = b.o.style === "pills";
  return (
    <div>
      <div role="tablist" className={`flex flex-wrap gap-2 ${pill ? "" : "border-b border-border"}`}>
        {tabs.map((t, i) => {
          const on = i === at;
          const cls = pill
            ? `rounded-full border px-4 py-2 text-sm font-medium ${on ? (c.dark ? "border-inverse-foreground bg-inverse-foreground text-inverse" : "border-foreground bg-foreground text-background") : "border-border"}`
            : `-mb-px border-b-2 px-3 py-2 text-sm font-medium ${on ? (c.dark ? "border-inverse-foreground" : "border-foreground") : `border-transparent ${muted(c.dark)}`}`;
          // a click on a tab opens it and selects it (its label and its blocks are edited there)
          return <button key={i} role="tab" aria-selected={on} type="button" className={cls} onClick={(e) => { e.stopPropagation(); c.onPick(tabKey(b.id, i)); }}>{t.label}</button>;
        })}
      </div>
      {cur && (
        <Frame k={tabKey(b.id, at)} name={`Вкладка «${cur.label}»`} c={c} className="mt-6 rounded-sm">
          <div className="flex min-h-16 flex-col gap-6 py-2">
            {cur.blocks.length ? cur.blocks.map((x) => <BlockView key={x.id} b={x} c={c} />) : <p className={`text-sm ${muted(c.dark)}`}>Пустая вкладка: блоки в неё кладёт дизайнер.</p>}
          </div>
        </Frame>
      )}
    </div>
  );
}

const VIEWS = { heading: Heading, text: Text, buttons: Buttons, media: Media, numbers: Numbers, cards: Cards, facts: Facts, quote: Quote, list: List } as const;

export function BlockView({ b, c }: { b: Block; c: Ctx }) {
  const inner = b.type === "tabs" ? <Tabs b={b} c={c} /> : (() => { const V = VIEWS[b.type]; return <V b={b} c={c} />; })();
  return <Frame k={b.id} name={BLOCK_DEFS[b.type].name} c={c} className="rounded-sm">{inner}</Frame>;
}

const BG: Record<string, string> = { white: "bg-background", grey: "bg-surface", dark: "bg-inverse text-inverse-foreground", image: "relative overflow-hidden bg-inverse text-inverse-foreground" };
const GRID: Record<string, string> = { "1": "", "1-1": "md:grid-cols-2", "2-1": "md:grid-cols-[2fr_1fr]", "1-2": "md:grid-cols-[1fr_2fr]", "1-1-1": "md:grid-cols-3" };

export function SectionView({ s, c, index }: { s: Section; c: Omit<Ctx, "dark">; index: number }) {
  const dark = s.bg === "dark" || s.bg === "image";
  const ctx: Ctx = { ...c, dark };
  const pic = s.bg === "image" ? img(c.data, 0) : null;
  const many = s.cols.length > 1;
  return (
    <Frame k={s.id} name={`Секция ${index + 1}${s.name ? ` · ${s.name}` : ""}`} c={c} inset className={BG[s.bg] ?? ""}>
      <section>
        {pic && (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={withBase(pic.url)} alt="" className="pointer-events-none absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-scrim/50" />
          </>
        )}
        <div className={`relative mx-auto w-full max-w-6xl px-4 ${s.space === "large" ? "py-20 md:py-28" : "py-12 md:py-16"}`}>
          <div className={`grid gap-10 ${GRID[s.layout] ?? ""} ${s.valign === "center" ? "items-center" : "items-start"}`}>
            {s.cols.map((col, i) => {
              const body = (
                <div className="flex min-w-0 flex-col gap-5">
                  {col.length ? col.map((b) => <BlockView key={b.id} b={b} c={ctx} />) : <div className="rounded border border-dashed border-border p-6 text-center text-sm opacity-70">Пустая колонка</div>}
                </div>
              );
              return many ? <Frame key={i} k={colKey(s.id, i)} name={`Колонка ${i + 1}`} c={c} className="min-w-0 rounded-sm">{body}</Frame> : <div key={i} className="min-w-0">{body}</div>;
            })}
          </div>
        </div>
      </section>
    </Frame>
  );
}
