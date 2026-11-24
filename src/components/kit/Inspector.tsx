"use client";

import { useState, type ReactNode } from "react";
import type { BlockType, Opt } from "./model";

/**
 * The settings panel's controls (best practice of Framer, Webflow, Subframe, Lovable — Mobbin, 2026-11-23): options in
 * named groups, a label on the left and the control on the right; a choice is shown as what it looks like (a small
 * drawing), not as a word; on/off as a switch; colours as swatches. Drawings use currentColor and the site's tokens.
 */

/* ---- small drawings of each choice (44×28) ---- */
const S = ({ children }: { children: ReactNode }) => <svg viewBox="0 0 44 28" className="h-7 w-11" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden>{children}</svg>;
const L = (x1: number, y: number, x2: number, w = 1.6, o = 1) => <line x1={x1} y1={y} x2={x2} y2={y} strokeWidth={w} opacity={o} />;
const R = (x: number, y: number, w: number, h: number, fill = false, r = 1.5) => <rect x={x} y={y} width={w} height={h} rx={r} fill={fill ? "currentColor" : "none"} />;
const C = (cx: number, cy: number, r: number) => <circle cx={cx} cy={cy} r={r} />;

const lines = (x: number[], y: number[], w = 1.6) => y.map((yy, i) => <g key={i}>{L(x[i % x.length], yy, 44 - x[i % x.length], w)}</g>);

const GLYPH: Record<string, () => ReactNode> = {
  "align:left": () => <S>{L(6, 8, 34)}{L(6, 14, 28)}{L(6, 20, 32)}</S>,
  "align:center": () => <S>{L(9, 8, 35)}{L(13, 14, 31)}{L(10, 20, 34)}</S>,
  "level:h1": () => <S>{L(6, 11, 38, 5)}{L(6, 21, 26, 1.4, 0.6)}</S>,
  "level:h2": () => <S>{L(6, 11, 32, 3.4)}{L(6, 20, 26, 1.4, 0.6)}</S>,
  "level:h3": () => <S>{L(6, 11, 26, 2.4)}{L(6, 18, 24, 1.4, 0.6)}</S>,
  "rule:off": () => <S>{L(6, 12, 34, 3)}</S>,
  "rule:below": () => <S>{L(6, 10, 34, 3)}{L(4, 20, 40, 1, 0.6)}</S>,
  "rule:above": () => <S>{L(4, 7, 40, 1, 0.6)}{L(6, 16, 34, 3)}</S>,
  "size:small": () => <S>{lines([10], [9, 13, 17, 21], 1)}</S>,
  "size:normal": () => <S>{lines([8], [8, 13, 18, 23], 1.6)}</S>,
  "size:lead": () => <S>{lines([6], [9, 16, 23], 2.4)}</S>,
  "size:large": () => <S>{lines([5], [9, 19], 4)}</S>,
  "cols:1": () => <S>{lines([6], [8, 13, 18, 23])}</S>,
  "cols:2": () => <S>{[8, 13, 18, 23].map((y) => <g key={y}>{L(5, y, 20)}{L(24, y, 39)}</g>)}</S>,
  "style:button": () => <S>{R(4, 9, 17, 10, true, 2)}{R(23, 9, 17, 10, false, 2)}</S>,
  "style:outline": () => <S>{R(4, 9, 17, 10, false, 2)}{R(23, 9, 17, 10, false, 2)}</S>,
  "style:link": () => <S>{L(4, 16, 18)}{L(24, 16, 38)}<path d="M18 13l2 3-2 3M38 13l2 3-2 3" /></S>,
  "kind:image": () => <S>{R(8, 5, 28, 18)}<path d="M10 21l8-8 6 6 4-4 6 6" />{C(29, 10, 2)}</S>,
  "kind:video": () => <S>{R(8, 5, 28, 18)}<path d="M19 10v8l7-4z" fill="currentColor" /></S>,
  "kind:document": () => <S><path d="M14 4h11l6 6v14H14z" /><path d="M25 4v6h6" />{L(17, 15, 28, 1.2)}{L(17, 19, 26, 1.2)}</S>,
  "ratio:wide": () => <S>{R(6, 5, 32, 18)}</S>,
  "ratio:photo": () => <S>{R(10, 4, 24, 19)}</S>,
  "ratio:square": () => <S>{R(13, 4, 18, 18)}</S>,
  "ratio:pano": () => <S>{R(3, 9, 38, 11)}</S>,
  "ratio:natural": () => <S>{R(12, 3, 16, 22)}<path d="M32 6v16M30 8l2-2 2 2M30 20l2 2 2-2" strokeWidth="1.2" /></S>,
  "fit:cover": () => <S>{R(6, 4, 32, 20)}<path d="M6 18l9-8 7 6 5-4 11 9" /></S>,
  "fit:tile": () => <S>{[4, 16, 28].map((x) => [4, 15].map((y) => <g key={`${x}${y}`}>{R(x, y, 10, 9, false, 1)}</g>))}</S>,
  "fit:contain": () => <S>{R(6, 4, 32, 20)}{R(13, 8, 18, 12, false, 1)}<path d="M13 17l5-4 4 3 3-2 6 5" strokeWidth="1.2" /></S>,
  "mode:player": () => <S>{R(6, 4, 32, 18)}<path d="M19 9v8l6-4z" fill="currentColor" />{L(6, 25, 38, 1.2, 0.6)}{C(18, 25, 1.6)}</S>,
  "mode:ambient": () => <S>{R(6, 4, 32, 20)}<path d="M14 18c3-6 6-6 8 0s5 6 8 0" /><path d="M33 8a3 3 0 1 1-3-3" strokeWidth="1.2" /></S>,
  "show:button": () => <S>{R(6, 5, 10, 14)}{R(20, 9, 18, 7, true, 2)}</S>,
  "show:pages": () => <S>{R(10, 2, 11, 15)}{R(23, 2, 11, 15)}{L(10, 22, 34, 1, 0.5)}{L(14, 26, 30, 1.2, 0.6)}</S>,
  "nstyle:big": () => <S><text x="4" y="18" fontSize="13" fontWeight="700" fill="currentColor" stroke="none">47%</text>{L(5, 23, 20, 1.2, 0.6)}</S>,
  "nstyle:circles": () => <S>{C(12, 14, 9)}{C(32, 14, 9)}</S>,
  "nstyle:line": () => <S>{L(4, 5, 18, 1.2)}{L(24, 5, 40, 1.2)}{L(4, 14, 14, 3.5)}{L(24, 14, 34, 3.5)}{L(4, 21, 16, 1.2, 0.6)}{L(24, 21, 36, 1.2, 0.6)}</S>,
  "nstyle:badge": () => <S>{R(4, 7, 36, 14, false, 2)}{L(9, 14, 17, 3.5)}{L(21, 14, 35, 1.2, 0.6)}</S>,
  "cstyle:plain": () => <S>{[4, 17, 30].map((x) => <g key={x}>{L(x, 8, x + 10, 2.6)}{L(x, 14, x + 10, 1, 0.6)}{L(x, 18, x + 8, 1, 0.6)}</g>)}</S>,
  "cstyle:steps": () => <S>{[4, 17, 30].map((x, i) => <g key={x}><text x={x} y="12" fontSize="9" fontWeight="700" fill="currentColor" stroke="none">{i + 1}</text>{L(x, 17, x + 10, 2)}{L(x, 22, x + 8, 1, 0.6)}</g>)}</S>,
  "cstyle:image": () => <S>{[4, 17, 30].map((x) => <g key={x}>{R(x, 4, 10, 8, true, 1)}{L(x, 17, x + 10, 2)}{L(x, 22, x + 8, 1, 0.6)}</g>)}</S>,
  "cstyle:link": () => <S>{[4, 17, 30].map((x) => <g key={x}>{R(x, 4, 10, 8, true, 1)}{L(x, 16, x + 10, 2)}<path d={`M${x} 22h7l-2-2m2 2l-2 2`} strokeWidth="1.2" /></g>)}</S>,
  "frame:off": () => <S>{[4, 17, 30].map((x) => <g key={x}>{L(x, 10, x + 10, 2.4)}{L(x, 16, x + 9, 1, 0.6)}</g>)}</S>,
  "frame:line": () => <S>{[4, 17, 30].map((x) => <g key={x}>{L(x, 6, x + 10, 1.2)}{L(x, 12, x + 10, 2.4)}{L(x, 18, x + 9, 1, 0.6)}</g>)}</S>,
  "frame:box": () => <S>{[3, 16, 29].map((x) => <g key={x}>{R(x, 4, 12, 20)}{L(x + 3, 11, x + 9, 2)}{L(x + 3, 16, x + 8, 1, 0.6)}</g>)}</S>,
  "flayout:side": () => <S>{[8, 14, 20].map((y) => <g key={y}>{L(5, y, 15, 1.2, 0.6)}{L(28, y, 39, 1.8)}</g>)}</S>,
  "flayout:top": () => <S>{[5, 24].map((x) => <g key={x}>{L(x, 8, x + 10, 1.2, 0.6)}{L(x, 13, x + 13, 2.4)}{L(x, 19, x + 10, 1.2, 0.6)}{L(x, 24, x + 13, 2.4)}</g>)}</S>,
  "tstyle:pills": () => <S>{R(3, 9, 12, 8, true, 4)}{R(17, 9, 12, 8, false, 4)}{R(31, 9, 10, 8, false, 4)}</S>,
  "tstyle:underline": () => <S>{L(4, 12, 14, 1.4)}{L(18, 12, 28, 1.4, 0.6)}{L(32, 12, 40, 1.4, 0.6)}{L(3, 18, 15, 2.4)}{L(15, 18, 41, 0.8, 0.5)}</S>,
  "view:cards": () => <S>{[3, 16, 29].map((x) => <g key={x}>{R(x, 4, 12, 9, true, 1)}{L(x, 18, x + 11, 2)}{L(x, 22, x + 8, 1, 0.6)}</g>)}</S>,
  "view:rows": () => <S>{[7, 14, 21].map((y) => <g key={y}>{L(4, y, 11, 1.2, 0.6)}{L(15, y, 40, 1.8)}</g>)}</S>,
  "view:featured": () => <S>{R(3, 4, 20, 13, true, 1)}{L(3, 22, 20, 2)}{[7, 14, 21].map((y) => <g key={y}>{L(27, y, 41, 1.6)}</g>)}</S>,
  "qsize:normal": () => <S><text x="5" y="12" fontSize="12" fill="currentColor" stroke="none">“</text>{L(13, 10, 38, 1.6)}{L(13, 16, 34, 1.6)}{L(13, 22, 26, 1.2, 0.6)}</S>,
  "qsize:large": () => <S><text x="3" y="14" fontSize="16" fill="currentColor" stroke="none">“</text>{L(13, 10, 40, 3)}{L(13, 18, 36, 3)}</S>,
  "layout:1": () => <S>{R(4, 4, 36, 20)}</S>,
  "layout:1-1": () => <S>{R(4, 4, 17, 20)}{R(23, 4, 17, 20)}</S>,
  "layout:2-1": () => <S>{R(4, 4, 23, 20)}{R(29, 4, 11, 20)}</S>,
  "layout:1-2": () => <S>{R(4, 4, 11, 20)}{R(17, 4, 23, 20)}</S>,
  "layout:1-1-1": () => <S>{R(3, 4, 11, 20)}{R(16.5, 4, 11, 20)}{R(30, 4, 11, 20)}</S>,
  "valign:top": () => <S>{L(4, 4, 40, 1, 0.5)}{R(8, 6, 10, 12, true, 1)}{R(26, 6, 10, 7, true, 1)}</S>,
  "valign:center": () => <S>{L(4, 14, 40, 1, 0.5)}{R(8, 8, 10, 12, true, 1)}{R(26, 10.5, 10, 7, true, 1)}</S>,
  "space:normal": () => <S>{L(4, 3, 40, 1, 0.5)}{R(8, 8, 28, 12, true, 1)}{L(4, 25, 40, 1, 0.5)}</S>,
  "space:large": () => <S>{L(4, 1.5, 40, 1, 0.5)}{R(12, 10, 20, 8, true, 1)}{L(4, 26.5, 40, 1, 0.5)}</S>,
};
/** Option keys that mean different things in different blocks get their own drawing set. */
const glyphKey = (block: string, key: string) => (key === "bgFit" ? "fit" : key === "style" ? { numbers: "nstyle", cards: "cstyle", tabs: "tstyle" }[block] ?? "style" : key === "layout" && block === "facts" ? "flayout" : key === "size" && block === "quote" ? "qsize" : key);

/** Swatches for a section's background: the site's own tokens. */
const SWATCH: Record<string, string> = { white: "bg-background", grey: "bg-surface", dark: "bg-inverse", image: "bg-inverse" };

/** How each option is shown and which group it goes in. */
const TOGGLES = new Set(["eyebrow", "caption", "photo", "zoom", "play", "bgPlay"]);
const COUNTS = new Set(["count", "rows"]);
const LOOK = new Set(["bgFit", "level", "style", "kind", "size", "bg", "frame", "rule", "ratio", "view", "source", "fit", "mode", "show"]);
const GROUP_OF = (key: string) => (TOGGLES.has(key) ? "Показывать" : LOOK.has(key) ? "Вид" : "Расположение");
const GROUP_ORDER = ["Вид", "Расположение", "Показывать"];

/** Tiles in one row when they fit (2–4), else three to a row. */
const TILE_COLS: Record<number, string> = { 2: "grid-cols-2", 3: "grid-cols-3", 4: "grid-cols-4" };

function Row({ label, children, stack }: { label: string; children: ReactNode; stack?: boolean }) {
  return (
    <div className={stack ? "grid gap-2" : "grid grid-cols-[6.5rem_minmax(0,1fr)] items-center gap-3"}>
      {label && <div className="text-xs text-muted">{label}</div>}
      <div className="min-w-0">{children}</div>
    </div>
  );
}

export function Control({ block, opt: o, value, onPick, bare }: { block: string; opt: Opt; value: string; onPick: (v: string) => void; /** the group already says it («Вид» in «Вид») */ bare?: boolean }) {
  const opt = bare ? { ...o, label: "" } : o;
  if (TOGGLES.has(opt.key)) {
    const on = value === "on";
    return (
      <Row label={opt.label}>
        <button type="button" role="switch" aria-checked={on} aria-label={o.label} onClick={() => onPick(on ? "off" : "on")}
          className={`relative h-5 w-9 rounded-full transition-colors ${on ? "bg-foreground" : "bg-border"}`}>
          <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-background shadow transition-all ${on ? "left-[1.125rem]" : "left-0.5"}`} />
        </button>
      </Row>
    );
  }
  if (COUNTS.has(opt.key))
    return (
      <Row label={opt.label}>
        <div className="inline-flex overflow-hidden rounded-md border border-border" role="group" aria-label={o.label}>
          {opt.values.map((v) => (
            <button key={v.id} type="button" aria-pressed={value === v.id} onClick={() => onPick(v.id)}
              className={`h-8 min-w-8 border-l border-border px-2 text-sm tabular-nums first:border-l-0 ${value === v.id ? "bg-foreground text-background" : "hover:bg-surface"}`}>{v.label}</button>
          ))}
        </div>
      </Row>
    );
  if (opt.key === "bg")
    return (
      <Row label={opt.label}>
        <div className="flex flex-wrap gap-2" role="group" aria-label={o.label}>
          {opt.values.map((v) => (
            <button key={v.id} type="button" aria-pressed={value === v.id} aria-label={v.label} title={v.label} onClick={() => onPick(v.id)}
              className={`relative h-8 w-8 rounded-full border border-border ${SWATCH[v.id] ?? ""} ${value === v.id ? "ring-2 ring-foreground ring-offset-2 ring-offset-background" : ""}`}>
              {v.id === "image" && <svg viewBox="0 0 32 32" className="absolute inset-0 h-full w-full text-inverse-foreground" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden><path d="M7 22l6-6 4 4 3-3 5 5" /><circle cx="21" cy="11" r="2" /></svg>}
            </button>
          ))}
        </div>
      </Row>
    );
  const g = glyphKey(block, opt.key);
  const drawn = opt.values.every((v) => GLYPH[`${g}:${v.id}`]);
  if (!drawn)
    return (
      <Row label={opt.label}>
        <div className="flex flex-wrap gap-1" role="group" aria-label={o.label}>
          {opt.values.map((v) => (
            <button key={v.id} type="button" aria-pressed={value === v.id} onClick={() => onPick(v.id)}
              className={`h-8 rounded-md border px-2.5 text-sm ${value === v.id ? "border-foreground bg-foreground text-background" : "border-border hover:border-foreground"}`}>{v.label}</button>
          ))}
        </div>
      </Row>
    );
  // a choice shown as what it looks like; the name under it
  const small = opt.key === "align" || opt.key === "valign";
  return (
    <Row label={opt.label} stack={!small}>
      <div className={small ? "inline-flex overflow-hidden rounded-md border border-border" : `grid gap-1.5 ${TILE_COLS[opt.values.length] ?? "grid-cols-3"}`} role="group" aria-label={o.label}>
        {opt.values.map((v) => {
          const on = value === v.id;
          return small ? (
            <button key={v.id} type="button" aria-pressed={on} aria-label={v.label} title={v.label} onClick={() => onPick(v.id)}
              className={`flex h-8 w-10 items-center justify-center border-l border-border first:border-l-0 [&_svg]:h-5 [&_svg]:w-8 ${on ? "bg-foreground text-background" : "text-muted hover:bg-surface hover:text-foreground"}`}>{GLYPH[`${g}:${v.id}`]()}</button>
          ) : (
            <button key={v.id} type="button" aria-pressed={on} onClick={() => onPick(v.id)}
              className={`grid justify-items-center gap-1 rounded-md border px-1 pb-1.5 pt-2 ${on ? "border-foreground bg-surface text-foreground ring-1 ring-foreground" : "border-border text-muted hover:border-foreground hover:text-foreground"}`}>
              {GLYPH[`${g}:${v.id}`]()}
              <span className="text-[11px] leading-tight">{v.label}</span>
            </button>
          );
        })}
      </div>
    </Row>
  );
}

/** All options of a block or a section, in groups: «Вид», «Расположение», «Показывать». */
export function Options({ block, opts, values, onPick }: { block: string; opts: Opt[]; values: Record<string, string>; onPick: (key: string, v: string) => void }) {
  const groups = GROUP_ORDER.map((name) => ({ name, items: opts.filter((o) => GROUP_OF(o.key) === name) })).filter((g) => g.items.length);
  return (
    <>
      {groups.map((g) => (
        <Section key={g.name} title={g.name}>
          {g.items.map((o) => <Control key={o.key} block={block} opt={o} value={values[o.key]} onPick={(v) => onPick(o.key, v)} bare={g.items.length === 1 && o.label === g.name} />)}
        </Section>
      ))}
    </>
  );
}

/** A named group of the panel: a heading, a hairline above. */
export function Section({ title, children, aside }: { title: string; children: ReactNode; aside?: ReactNode }) {
  return (
    <section className="grid min-w-0 gap-3 border-t border-border px-4 py-4 [&>*]:min-w-0">
      <div className="flex items-center justify-between"><h3 className="text-xs font-semibold text-foreground">{title}</h3>{aside}</div>
      {children}
    </section>
  );
}

/* ---- icons of things (block types, levels) ---- */
const TYPE_GLYPH: Record<string, () => ReactNode> = {
  section: () => <S>{R(4, 6, 36, 16)}{L(8, 11, 24, 2)}{L(8, 16, 30, 1.2, 0.6)}</S>,
  column: () => <S>{R(4, 4, 17, 20, false)}{R(23, 4, 17, 20, true)}</S>,
  tab: () => <S>{R(4, 6, 12, 6, true, 2)}{R(18, 6, 12, 6, false, 2)}{R(4, 14, 36, 10)}</S>,
  heading: () => <S><text x="8" y="20" fontSize="15" fontWeight="700" fill="currentColor" stroke="none">H</text>{L(22, 17, 36, 2.2)}</S>,
  text: () => <S>{lines([8], [8, 13, 18, 23], 1.4)}</S>,
  buttons: () => <S>{R(6, 9, 32, 10, true, 3)}</S>,
  media: () => GLYPH["kind:image"](),
  numbers: () => GLYPH["nstyle:big"](),
  cards: () => GLYPH["frame:box"](),
  facts: () => GLYPH["flayout:side"](),
  quote: () => GLYPH["qsize:normal"](),
  list: () => GLYPH["view:rows"](),
  tabs: () => GLYPH["tstyle:pills"](),
};
export function TypeIcon({ kind, className = "" }: { kind: BlockType | "section" | "column" | "tab"; className?: string }) {
  return <span className={`inline-flex flex-none items-center justify-center [&_svg]:h-5 [&_svg]:w-8 ${className}`}>{TYPE_GLYPH[kind]?.()}</span>;
}

/** An icon button of the panel's header (move, copy) with its name as a tooltip. */
export function IconButton({ label, onClick, disabled, children }: { label: string; onClick: () => void; disabled?: boolean; children: ReactNode }) {
  return (
    <button type="button" aria-label={label} title={label} disabled={disabled} onClick={onClick}
      className="flex h-8 w-8 items-center justify-center rounded-md text-muted hover:bg-surface hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30">
      {children}
    </button>
  );
}
export const ICON = {
  up: <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden><path d="M10 15V5M5 9l5-4 5 4" /></svg>,
  down: <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden><path d="M10 5v10M5 11l5 4 5-4" /></svg>,
  copy: <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden><rect x="7" y="7" width="9" height="9" rx="1.5" /><path d="M13 7V5.5A1.5 1.5 0 0 0 11.5 4h-6A1.5 1.5 0 0 0 4 5.5v6A1.5 1.5 0 0 0 5.5 13H7" /></svg>,
  parent: <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden><path d="M12 15H6a2 2 0 0 1-2-2V5M1 8l3-3 3 3" /></svg>,
  left: <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden><path d="M15 10H5M9 5l-4 5 4 5" /></svg>,
  right: <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden><path d="M5 10h10M11 5l4 5-4 5" /></svg>,
  pointer: <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden><path d="M5 3l13 6.5-5.5 1.8L10.7 17z" /><path d="M14 13l5 5" /></svg>,
};

/**
 * «Дополнительно»: the secondary settings, folded. Stays as the person left it (open or closed) when another element
 * is selected, so someone who works with the details does not reopen it every time.
 */
let advancedOpen = false;
export function Advanced({ count, children }: { count: number; children: ReactNode }) {
  const [open, setOpen] = useState(advancedOpen);
  if (!count) return null;
  return (
    <div className="border-t border-border">
      <button type="button" aria-expanded={open} onClick={() => { advancedOpen = !open; setOpen(!open); }}
        className="flex w-full items-center gap-2 px-4 py-3 text-left text-xs font-semibold hover:bg-surface">
        <svg viewBox="0 0 20 20" className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-90" : ""}`} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><path d="M7 4l6 6-6 6" /></svg>
        Дополнительно <span className="font-normal text-muted">{count}</span>
      </button>
      {open && <div className="bg-surface/40 [&>section:first-child]:border-t-0">{children}</div>}
    </div>
  );
}
