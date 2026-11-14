"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { RichText } from "@/components/admin/RichText";
import type { PageInfo, SectionInfo, HistoryItem } from "@/admin/page-editor";
import type { Preset } from "@/blocks/templates";
import { withBase } from "@/lib/demo";

/**
 * Presentational parts of the page editor (docs/screens/on-page-editor.md): top bar, section toolbar,
 * side panel, dialogs. State and server calls live in EditorOverlay.tsx.
 * The editor is admin chrome over the site, so it uses its own neutral palette, not the site's tokens.
 */

export const BAR_H = 48;

const btn = "rounded px-2.5 py-1.5 text-sm hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-40";
const select = "rounded border border-neutral-700 bg-neutral-900 px-2 py-1 text-sm text-white";

export function statusText(info: PageInfo | null, legacyPending: number): string {
  if (!info) return legacyPending ? `${legacyPending} unpublished change${legacyPending > 1 ? "s" : ""} on this page` : "No unpublished changes";
  if (info.status === "draft") return "Draft — not live yet";
  if (info.status === "changed") return "Live, with unpublished changes";
  return legacyPending ? "Live, with unpublished changes" : "Live";
}

export function TopBar(props: {
  info: PageInfo | null;
  title: string;
  status: string;
  busy: boolean;
  canUndo: boolean;
  canRedo?: boolean;
  onRedo?: () => void;
  hasChanges: boolean;
  compareLabel: string | null;
  pagesHref: string;
  exitHref: string | null;
  demo: boolean;
  onUndo: () => void;
  onHistory: () => void;
  /** open comment threads on this page (null: comments are not available here) */
  comments?: number | null;
  onComments?: () => void;
  onPreview: () => void;
  onPublish: () => void;
  onCompare: (region: string) => void;
  onRegion: (path: string) => void;
  onExit?: () => void;
}) {
  const { info } = props;
  const [menu, setMenu] = useState(false);
  const others = info?.regions.filter((r) => !r.current && r.path) ?? [];
  return (
    <div className="fixed inset-x-0 z-[1000] border-b border-neutral-800 bg-neutral-950 text-white shadow-lg" style={{ top: props.demo ? 24 : 0 }}>
      <div className="flex flex-wrap items-center gap-2 px-3 text-sm md:h-12 md:flex-nowrap" style={{ minHeight: BAR_H }}>
        <a href={props.pagesHref} className={btn}>← Pages</a>
        <div className="order-last w-full truncate pb-1 md:order-none md:w-auto md:max-w-[28ch] md:pb-0">
          <span className="font-semibold">{props.title}</span>
          {info && <span className="text-neutral-400"> · {info.type}</span>}
        </div>
        {info && info.regions.length > 0 && (
          <select aria-label="Region" className={select} value={info.regions.find((r) => r.current)?.region} onChange={(e) => { const r = info.regions.find((x) => x.region === e.target.value); if (r?.path) props.onRegion(r.path); }}>
            {info.regions.map((r) => (
              <option key={r.region} value={r.region} disabled={!r.path}>{r.label}{r.path ? "" : " — no version"}</option>
            ))}
          </select>
        )}
        {others.length > 0 && (
          <select aria-label="Compare with" className={select} value="" onChange={(e) => props.onCompare(e.target.value)}>
            <option value="">{props.compareLabel ? `Comparing with ${props.compareLabel}` : "Compare with…"}</option>
            {others.map((r) => <option key={r.region} value={r.region}>{r.label}</option>)}
            {props.compareLabel && <option value="off">Stop comparing</option>}
          </select>
        )}
        <span className="min-w-0 flex-1 truncate text-xs text-neutral-300" role="status" aria-live="polite">{props.status}</span>
        <button type="button" className={btn} disabled={!props.canUndo || props.busy} onClick={props.onUndo} title="Undo the last change (Ctrl/⌘+Z)">↶ Undo</button>
        <button type="button" className={btn} disabled={!props.canRedo || props.busy} onClick={props.onRedo} title="Redo (Ctrl/⌘+Shift+Z)">↷ Redo</button>
        {info && props.comments != null && <button type="button" className={btn} onClick={props.onComments}>Comment{props.comments ? ` (${props.comments})` : ""}</button>}
        {info && !props.demo && <button type="button" className={btn} onClick={props.onHistory}>History</button>}
        <button type="button" className={btn} onClick={props.onPreview}>Preview</button>
        <button type="button" disabled={!props.hasChanges || props.busy} onClick={props.onPublish} className="rounded bg-emerald-500 px-3 py-1.5 text-sm font-semibold text-black hover:bg-emerald-400 disabled:bg-neutral-700 disabled:text-neutral-400">
          Publish
        </button>
        <div className="relative">
          <button type="button" className={btn} aria-label="More" onClick={() => setMenu((m) => !m)}>⋯</button>
          {menu && (
            <div className="absolute right-0 top-full mt-1 w-48 overflow-hidden rounded border border-neutral-700 bg-neutral-900 text-sm shadow-xl" onMouseLeave={() => setMenu(false)}>
              {info && <a href={info.adminHref} className="block px-3 py-2 hover:bg-neutral-800">Page settings (SEO, address)</a>}
              {props.exitHref ? <a href={props.exitHref} className="block px-3 py-2 hover:bg-neutral-800">Exit editor</a> : <button type="button" onClick={props.onExit} className="block w-full px-3 py-2 text-left hover:bg-neutral-800">View as visitor</button>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function PreviewBar({ demo, onBack }: { demo: boolean; onBack: () => void }) {
  return (
    <div className="fixed right-4 z-[1000] flex items-center gap-3 rounded-full bg-neutral-950 px-4 py-2 text-sm text-white shadow-xl" style={{ top: (demo ? 24 : 0) + 12 }}>
      <span className="text-neutral-300">Preview — as visitors will see it after Publish</span>
      <button type="button" onClick={onBack} className="rounded-full bg-white px-3 py-1 font-semibold text-black">Back to editing</button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Section toolbar                                                    */
/* ------------------------------------------------------------------ */

export function SectionToolbar({ s, first, last, busy, style, onVariant, onMove, onCopy, onRemove, onTabs }: { s: SectionInfo; first: boolean; last: boolean; busy: boolean; style: React.CSSProperties; onVariant: (v: string) => void; onMove: (d: -1 | 1) => void; onCopy: () => void; onRemove: () => void; onTabs?: () => void }) {
  const t = "rounded px-2 py-1 text-xs hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40";
  const pinnedNote = "This section stays at the end of the page and cannot be removed";
  return (
    <div id="rm-section-toolbar" className="fixed z-[1002] flex items-center gap-1 rounded-md bg-blue-600 px-2 py-1 text-white shadow-lg" style={style}>
      <span className="max-w-[24ch] truncate px-1 text-xs font-semibold">{s.name}</span>
      {s.variants.length > 1 && (
        <select aria-label="Layout" className="rounded bg-blue-700 px-1 py-0.5 text-xs" value={s.variant} disabled={busy} onChange={(e) => onVariant(e.target.value)}>
          {s.variants.map((v) => <option key={v.id} value={v.id}>{v.label}</option>)}
        </select>
      )}
      <button type="button" className={t} disabled={busy || s.pinned || first} onClick={() => onMove(-1)} title={s.pinned ? pinnedNote : "Move up"} aria-label="Move up">↑</button>
      <button type="button" className={t} disabled={busy || s.pinned || last} onClick={() => onMove(1)} title={s.pinned ? pinnedNote : "Move down"} aria-label="Move down">↓</button>
      <button type="button" className={t} disabled={busy || s.pinned} onClick={onCopy} title={s.pinned ? pinnedNote : "Copy"}>Copy</button>
      <button type="button" className={t} disabled={busy || s.pinned} onClick={onRemove} title={s.pinned ? pinnedNote : "Delete"}>Delete</button>
      {onTabs && <button type="button" className={t} disabled={busy} onClick={onTabs}>Tabs</button>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Side panel and dialogs                                             */
/* ------------------------------------------------------------------ */

export function SidePanel({ title, children, onClose, top }: { title: string; children: ReactNode; onClose: () => void; top: number }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <aside className="fixed bottom-0 right-0 z-[1003] flex w-full max-w-md flex-col border-l border-neutral-200 bg-white text-neutral-900 shadow-2xl" style={{ top }} aria-label={title}>
      <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3">
        <h2 className="text-base font-semibold">{title}</h2>
        <button type="button" onClick={onClose} className="text-neutral-500 hover:text-neutral-900" aria-label="Close">✕</button>
      </div>
      <div className="flex-1 overflow-auto p-4">{children}</div>
    </aside>
  );
}

export function Dialog({ title, children, onClose }: { title: string; children: ReactNode; onClose?: () => void }) {
  useEffect(() => {
    if (!onClose) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-[1004] flex items-start justify-center bg-black/40 p-4 pt-20" onMouseDown={(e) => onClose && e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-label={title} className="max-h-[80vh] w-full max-w-lg overflow-auto rounded-lg bg-white p-5 text-neutral-900 shadow-2xl">
        <h2 className="mb-3 text-lg font-semibold">{title}</h2>
        {children}
      </div>
    </div>
  );
}

const primary = "rounded bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50";
const secondary = "rounded border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-50 disabled:opacity-50";

export function RichForm({ value, onSave, onCancel }: { value: string; onSave: (html: string) => Promise<void>; onCancel: () => void }) {
  const form = useRef<HTMLFormElement>(null);
  return (
    <form
      ref={form}
      onSubmit={(e) => {
        e.preventDefault();
        const html = (form.current?.elements.namedItem("html") as HTMLInputElement | null)?.value ?? "";
        void onSave(html);
      }}
    >
      <RichText name="html" defaultValue={value} minHeight={280} />
      <div className="mt-4 flex justify-end gap-2">
        <button type="button" onClick={onCancel} className={secondary}>Cancel</button>
        <button type="submit" className={primary}>Save</button>
      </div>
    </form>
  );
}

export function LinkForm({ label, href, hasHref, onSave, onCancel }: { label: string; href: string; hasHref: boolean; onSave: (label: string, href: string) => Promise<void>; onCancel: () => void }) {
  const [l, setL] = useState(label);
  const [h, setH] = useState(href);
  return (
    <form onSubmit={(e) => { e.preventDefault(); void onSave(l, h); }} className="space-y-3">
      <label className="block text-sm">
        <span className="mb-1 block text-xs font-medium text-neutral-600">Label</span>
        <input value={l} onChange={(e) => setL(e.target.value)} className="w-full rounded border border-neutral-300 px-2 py-1.5" />
      </label>
      {hasHref && (
        <label className="block text-sm">
          <span className="mb-1 block text-xs font-medium text-neutral-600">Link (URL, mailto: or /path)</span>
          <input value={h} onChange={(e) => setH(e.target.value)} className="w-full rounded border border-neutral-300 px-2 py-1.5" />
        </label>
      )}
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className={secondary}>Cancel</button>
        <button type="submit" className={primary}>Save</button>
      </div>
    </form>
  );
}

export function MediaActions({ image, video, hasVideo, onReplace, onRemoveVideo, onClear }: { image: string; video: string; hasVideo: boolean; onReplace: (kind: "image" | "video") => void; onRemoveVideo: () => void; onClear: () => void }) {
  return (
    <div className="space-y-4 text-sm">
      {/* imported pages sometimes keep a clip in the picture field: show it as a clip, not a broken picture */}
      {video || /\.(mp4|webm|mov)(\?|$)/i.test(image) ? (
        <video src={video || image} className="w-full rounded border border-neutral-200" muted controls />
      ) : image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image} alt="" className="w-full rounded border border-neutral-200" />
      ) : (
        <div className="rounded border border-dashed border-neutral-300 p-6 text-center text-neutral-500">No media</div>
      )}
      <div className="flex flex-wrap gap-2">
        <button type="button" className={primary} onClick={() => onReplace("image")}>Replace image…</button>
        {hasVideo && <button type="button" className={secondary} onClick={() => onReplace("video")}>Replace video…</button>}
        {hasVideo && video && <button type="button" className={secondary} onClick={onRemoveVideo}>Remove video (show image)</button>}
        {image && <button type="button" className={`${secondary} text-red-700`} onClick={onClear}>Clear image</button>}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Preset previews: the variant's sample from /style-guide, scaled    */
/* ------------------------------------------------------------------ */

let styleGuide: Promise<Document> | null = null;
const sampleOf = async (type: string, variant: string): Promise<Element | null> => {
  styleGuide ??= fetch(withBase("/style-guide/")).then(async (r) => new DOMParser().parseFromString(await r.text(), "text/html"));
  return (await styleGuide).querySelector(`[data-rm-preset="${CSS.escape(`${type}:${variant}`)}"]`);
};

/** A small, inert copy of the sample (no links, no ids, no editing marks): what the new section will look like. */
function PresetThumb({ type, variant }: { type: string; variant: string }) {
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let alive = true;
    void sampleOf(type, variant).then((el) => {
      const host = box.current;
      if (!alive || !host || !el) return;
      const copy = document.importNode(el, true) as HTMLElement;
      copy.querySelectorAll("[id]").forEach((n) => n.removeAttribute("id"));
      copy.querySelectorAll("[data-e],[data-rm-b]").forEach((n) => { n.removeAttribute("data-e"); n.removeAttribute("data-rm-b"); });
      copy.querySelectorAll("video").forEach((v) => { v.removeAttribute("autoplay"); v.removeAttribute("src"); });
      host.replaceChildren(copy);
    }).catch(() => undefined);
    return () => { alive = false; };
  }, [type, variant]);
  return (
    <span aria-hidden="true" className="relative block h-[72px] w-[120px] flex-none overflow-hidden rounded border border-neutral-200 bg-neutral-100">
      <span ref={box} inert className="pointer-events-none absolute left-0 top-0 block w-[1200px] origin-top-left scale-[0.1] bg-white" />
    </span>
  );
}

export function PresetList({ presets, onPick, busy }: { presets: Preset[]; onPick: (p: Preset) => void; busy: boolean }) {
  const [q, setQ] = useState("");
  const shown = presets.filter((p) => `${p.name} ${p.label} ${p.description}`.toLowerCase().includes(q.toLowerCase()));
  const groups = [...new Set(shown.map((p) => p.name))];
  return (
    <div className="space-y-4">
      <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search sections" className="w-full rounded border border-neutral-300 px-2 py-1.5 text-sm" />
      {groups.map((g) => (
        <section key={g}>
          <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-neutral-500">{g}</h3>
          <ul className="divide-y divide-neutral-100 rounded border border-neutral-200">
            {shown.filter((p) => p.name === g).map((p) => (
              <li key={`${p.type}:${p.variant}`}>
                <button type="button" disabled={busy} onClick={() => onPick(p)} className="flex w-full gap-3 px-3 py-2 text-left hover:bg-neutral-50 disabled:opacity-50">
                  <PresetThumb type={p.type} variant={p.variant} />
                  <span className="min-w-0">
                    <span className="block text-sm font-medium">{p.label}</span>
                    <span className="block text-xs text-neutral-500">{p.description}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}
      {!shown.length && <p className="text-sm text-neutral-500">Nothing matches “{q}”.</p>}
    </div>
  );
}

const KIND: Record<string, string> = { published: "Published", draft: "Saved", restored: "Restored", created: "Created" };

export function HistoryList({ items, busy, onRestore }: { items: HistoryItem[] | null; busy: boolean; onRestore: (id: number) => void }) {
  if (!items) return <p className="text-sm text-neutral-500">Loading…</p>;
  if (!items.length) return <p className="text-sm text-neutral-500">No versions yet.</p>;
  return (
    <div className="space-y-3">
      <p className="text-xs text-neutral-500">Restore puts a version on the page as unpublished changes. Check it, then Publish — or Undo.</p>
      <ol className="space-y-2">
        {items.map((it, i) => (
          <li key={it.id} className="rounded border border-neutral-200 p-3 text-sm">
            <div className="flex items-center gap-2">
              <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${it.kind === "published" ? "bg-emerald-100 text-emerald-800" : "bg-neutral-100 text-neutral-700"}`}>{KIND[it.kind] ?? it.kind}</span>
              <span className="flex-1 truncate text-neutral-600">{it.by || "—"}, {new Date(it.at).toLocaleString()}</span>
              {i > 0 && <button type="button" disabled={busy} onClick={() => onRestore(it.id)} className="text-xs font-medium underline disabled:opacity-50">Restore this version</button>}
            </div>
            {it.changes.length > 0 && (
              <ul className="mt-1.5 list-disc pl-5 text-xs text-neutral-600">
                {it.changes.slice(0, 4).map((c) => <li key={c}>{c}</li>)}
                {it.changes.length > 4 && <li>and {it.changes.length - 4} more</li>}
              </ul>
            )}
            {it.note && <p className="mt-1 text-xs text-neutral-500">{it.note}</p>}
          </li>
        ))}
      </ol>
    </div>
  );
}

export const buttons = { primary, secondary };

/** The tabs of a Product details block (docs/screens/on-page-editor.md → «Сами вкладки»). */
export function TabsPanel({ tabs, busy, onRename, onMove, onRemove, onLink, onAdd }: {
  tabs: { label: string; href?: string }[];
  busy: boolean;
  onRename: (tab: number, label: string) => void;
  onMove: (tab: number, dir: -1 | 1) => void;
  onRemove: (tab: number) => void;
  onLink: (tab: number, href: string) => void;
  onAdd: (label: string, href?: string) => void;
}) {
  const [label, setLabel] = useState("");
  const [href, setHref] = useState("");
  const [link, setLink] = useState(false);
  const field = "w-full rounded border border-neutral-300 px-2 py-1 text-sm";
  return (
    <div className="space-y-4 text-sm">
      <ol className="space-y-3">
        {tabs.map((t, i) => (
          <li key={`${i}:${t.label}:${t.href ?? ""}`} className="rounded border border-neutral-200 p-2">
            <div className="flex items-center gap-1">
              <input aria-label={`Name of tab ${i + 1}`} defaultValue={t.label} maxLength={60} disabled={busy} className={field} onBlur={(e) => e.target.value.trim() !== t.label && onRename(i, e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()} />
              <button type="button" aria-label={`Move tab ${t.label} up`} disabled={busy || i === 0} onClick={() => onMove(i, -1)} className="px-1 disabled:opacity-30">↑</button>
              <button type="button" aria-label={`Move tab ${t.label} down`} disabled={busy || i === tabs.length - 1} onClick={() => onMove(i, 1)} className="px-1 disabled:opacity-30">↓</button>
              <button type="button" disabled={busy} onClick={() => onRemove(i)} className="px-1 text-red-700">Delete</button>
            </div>
            {t.href !== undefined && (
              <input aria-label={`Link of tab ${t.label}`} defaultValue={t.href} disabled={busy} className={`${field} mt-1 font-mono text-xs`} onBlur={(e) => e.target.value.trim() !== t.href && onLink(i, e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()} />
            )}
            <span className="mt-1 block text-xs text-neutral-500">{t.href !== undefined ? "Link tab — opens another page" : "Tab with sections"}</span>
          </li>
        ))}
      </ol>
      <form
        className="space-y-2 rounded border border-dashed border-neutral-300 p-2"
        onSubmit={(e) => {
          e.preventDefault();
          onAdd(label, link ? href : undefined);
          setLabel("");
          setHref("");
        }}
      >
        <div className="flex gap-3 text-xs">
          <label className="flex items-center gap-1"><input type="radio" checked={!link} onChange={() => setLink(false)} /> Tab with sections</label>
          <label className="flex items-center gap-1"><input type="radio" checked={link} onChange={() => setLink(true)} /> Link tab</label>
        </div>
        <input aria-label="New tab name" value={label} onChange={(e) => setLabel(e.target.value)} maxLength={60} placeholder="Tab name" required className={field} />
        {link && <input aria-label="New tab link" value={href} onChange={(e) => setHref(e.target.value)} placeholder="/us/evidence or https://…" required className={`${field} font-mono text-xs`} />}
        <button type="submit" disabled={busy} className="rounded bg-blue-600 px-3 py-1 text-xs font-semibold text-white disabled:opacity-50">{link ? "+ Add link tab" : "+ Add tab"}</button>
      </form>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Comments (docs/screens/on-page-editor.md → «Комментарии»)          */
/* ------------------------------------------------------------------ */

type CommentItem = import("@/admin/comments").CommentView;

const ago = (iso: string) => new Date(iso).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });

function Reply({ onSend, busy, label = "Reply", autoFocus = false }: { onSend: (text: string) => Promise<boolean>; busy: boolean; label?: string; autoFocus?: boolean }) {
  const [text, setText] = useState("");
  return (
    <form
      className="mt-2 space-y-1"
      onSubmit={async (e) => {
        e.preventDefault();
        if (await onSend(text)) setText("");
      }}
    >
      <textarea aria-label={label} value={text} onChange={(e) => setText(e.target.value)} rows={2} maxLength={2000} autoFocus={autoFocus} className="w-full rounded border border-neutral-300 px-2 py-1 text-sm" placeholder={label === "Reply" ? "Reply…" : "Write a comment…"} />
      <button type="submit" disabled={busy || !text.trim()} className="rounded bg-blue-600 px-3 py-1 text-xs font-semibold text-white disabled:opacity-40">{label === "Reply" ? "Reply" : "Comment"}</button>
    </form>
  );
}

export function CommentsPanel({ items, sectionName, focus, composeFor, picking, busy, onPick, onCompose, onAdd, onResolve, onDelete }: {
  items: CommentItem[];
  /** name of a section by its id (undefined: no longer on the page) */
  sectionName: (anchor: string) => string | undefined;
  /** the thread group to show first */
  focus?: string | null;
  /** writing a new comment on this section ("" = the whole page) */
  composeFor: string | null;
  picking: boolean;
  busy: boolean;
  onPick: () => void;
  onCompose: (anchor: string | null) => void;
  onAdd: (anchor: string | null, text: string, parentId?: number) => Promise<boolean>;
  onResolve: (id: number, resolved: boolean) => void;
  onDelete: (id: number) => void;
}) {
  const [showResolved, setShowResolved] = useState(false);
  const threads = items.filter((c) => !c.parentId && (showResolved || !c.resolvedAt));
  const replies = (id: number) => items.filter((c) => c.parentId === id);
  const where = (a: string | null) => (a ? sectionName(a) ?? "A section that is no longer on the page" : "Page");
  const sorted = [...threads].sort((a, b) => Number(b.anchor === focus) - Number(a.anchor === focus));
  return (
    <div className="space-y-4 text-sm">
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={onPick} className={`rounded px-3 py-1 text-xs font-semibold ${picking ? "bg-amber-500 text-black" : "bg-blue-600 text-white"}`}>{picking ? "Click a section on the page…" : "Comment on a section"}</button>
        <button type="button" onClick={() => onCompose(null)} className="rounded border border-neutral-300 px-3 py-1 text-xs">Comment on the whole page</button>
      </div>
      {composeFor !== null && (
        <div className="rounded border border-blue-300 bg-blue-50 p-2">
          <div className="text-xs font-medium text-blue-900">Comment on {composeFor ? where(composeFor) : "the whole page"}</div>
          <Reply label="Comment" busy={busy} autoFocus onSend={(t) => onAdd(composeFor || null, t)} />
        </div>
      )}
      {sorted.length === 0 && <p className="text-neutral-500">No open comments on this page.</p>}
      <ul className="space-y-3">
        {sorted.map((c) => (
          <li key={c.id} className={`rounded border p-2 ${c.anchor === focus ? "border-blue-400" : "border-neutral-200"} ${c.resolvedAt ? "opacity-60" : ""}`} data-comment={c.id}>
            <div className="text-xs text-neutral-500">{where(c.anchor)}</div>
            <p className="mt-1 whitespace-pre-wrap">{c.body}</p>
            <div className="mt-1 text-xs text-neutral-500">{c.authorName} · {ago(c.at)}{c.resolvedAt && ` · resolved by ${c.resolvedByName}`}</div>
            {replies(c.id).map((r) => (
              <div key={r.id} className="mt-2 border-l-2 border-neutral-200 pl-2">
                <p className="whitespace-pre-wrap">{r.body}</p>
                <div className="text-xs text-neutral-500">{r.authorName} · {ago(r.at)}{r.canDelete && <> · <button type="button" className="underline" onClick={() => onDelete(r.id)}>Delete</button></>}</div>
              </div>
            ))}
            <div className="mt-2 flex gap-3 text-xs">
              <button type="button" className="underline" disabled={busy} onClick={() => onResolve(c.id, !c.resolvedAt)}>{c.resolvedAt ? "Reopen" : "Resolve"}</button>
              {c.canDelete && <button type="button" className="underline" disabled={busy} onClick={() => onDelete(c.id)}>Delete</button>}
            </div>
            {!c.resolvedAt && <Reply busy={busy} onSend={(t) => onAdd(c.anchor, t, c.id)} />}
          </li>
        ))}
      </ul>
      <label className="flex items-center gap-2 text-xs text-neutral-600"><input type="checkbox" checked={showResolved} onChange={(e) => setShowResolved(e.target.checked)} /> Show resolved</label>
    </div>
  );
}
