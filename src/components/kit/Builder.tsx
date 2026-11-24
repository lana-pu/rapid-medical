"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { BLOCK_DEFS, READY, SECTION_OPTS, START, colCount, colKey, levels, isAdvanced, newBlock, optsFor, tabKey, uid, type Block, type BlockType, type Level, type Section, type Tab } from "./model";
import { LANGS, SectionView, asset, drag, embedOf, fileOf, safeHref, setPreviewMode, type DropAt, type LabData, type LabFile } from "./render";
import { MediaLibrary, MediaPopover, Preview } from "./Library";
import { Advanced, Control, ICON, IconButton, Options, Section as Group, TypeIcon } from "./Inspector";

/**
 * Blocks sandbox (/lab/blocks): the proposed model on the site's own look, before it goes into the editor.
 * Selection works like Webflow / Framer: one thing is selected at a time — a section, a column, a block or a tab — and
 * the panel shows only what that thing has. Breadcrumbs above the page show where it sits; «←» and Esc go one level up.
 * Editor: ready sections, options, texts and pictures, moving and removing sections. Designer: also columns, blocks in
 * columns and tabs, tabs themselves, saving a section as a ready one. Kept in this browser only (localStorage).
 */

type Role = "editor" | "designer";
type Custom = { key: string; name: string; section: Section };
type Store = { sections: Section[]; custom: Custom[] };
const KEY = "rm-lab:v2";

const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x));
const reid = (b: Block, id: () => string): Block => ({ ...b, id: id(), d: b.type === "tabs" ? { ...b.d, tabs: (b.d.tabs as Tab[]).map((t) => ({ ...t, blocks: t.blocks.map((x) => reid(x, id)) })) } : b.d });
/** The starting page with ids by position: the server and the browser draw the same markup. */
const start = (): Section[] => {
  let n = 0;
  return START.map((k, i) => { const r = READY.find((x) => x.key === k)!; const s = r.make(); return { ...s, id: `s${i}`, name: r.name, cols: s.cols.map((c) => c.map((b) => reid(b, () => `b${n++}`))) }; });
};
/** A copy with new ids (a ready section added twice must not share them). */
const fresh = (s: Section, name?: string): Section => ({ ...clone(s), id: uid(), name: name ?? s.name, cols: clone(s.cols).map((c) => c.map((b) => reid(b, uid))) });

/** Where a block sits: its list (a column or a tab) and its position. */
function locate(sections: Section[], id: string): { list: Block[]; i: number } | null {
  const inList = (list: Block[]): { list: Block[]; i: number } | null => {
    for (let i = 0; i < list.length; i++) {
      if (list[i].id === id) return { list, i };
      if (list[i].type === "tabs") for (const t of list[i].d.tabs as Tab[]) { const r = inList(t.blocks); if (r) return r; }
    }
    return null;
  };
  for (const s of sections) for (const c of s.cols) { const r = inList(c); if (r) return r; }
  return null;
}

/* ---- panel pieces ---- */
const btn = "rounded border border-border bg-background px-2.5 py-1 text-xs hover:border-foreground disabled:cursor-not-allowed disabled:opacity-40";

type Kind = BlockType | "section" | "column" | "tab";
/** What is inside the selected thing: a row per child with its icon; a click goes down a level. */
function Inside({ items, onOpen }: { items: { key: string; label: string; hint?: string; kind: Kind; muted?: boolean }[]; onOpen: (key: string) => void }) {
  if (!items.length) return <p className="text-sm text-muted">Пока пусто.</p>;
  return (
    <ul className="-mx-2 grid">
      {items.map((x) => (
        <li key={x.key}>
          <button type="button" onClick={() => onOpen(x.key)} className={`flex w-full items-center gap-3 rounded-md px-2 py-1.5 text-left hover:bg-surface ${x.muted ? "opacity-50" : ""}`}>
            <TypeIcon kind={x.kind} className="text-muted" />
            <span className="min-w-0 flex-1"><span className="block truncate text-sm">{x.label}</span>{x.hint && <span className="block truncate text-xs text-muted">{x.hint}</span>}</span>
            <span aria-hidden className="text-muted">›</span>
          </button>
        </li>
      ))}
    </ul>
  );
}

/** Adding a block: a tile per kind, with its icon. */
function AddBlock({ onAdd, nested }: { onAdd: (t: BlockType) => void; nested?: boolean }) {
  const types = (Object.keys(BLOCK_DEFS) as BlockType[]).filter((t) => !nested || BLOCK_DEFS[t].nestable);
  return (
    <div className="grid grid-cols-3 gap-1.5">
      {types.map((t) => (
        <button key={t} type="button" onClick={() => onAdd(t)} title={`${BLOCK_DEFS[t].hint}. Клик — в конец, или перетащите на страницу`}
          draggable onDragStart={(e) => { drag.set({ t: "new", type: t }); e.dataTransfer.effectAllowed = "copy"; e.dataTransfer.setData("text/plain", BLOCK_DEFS[t].name); }}
          className="grid cursor-grab justify-items-center gap-1 rounded-md border border-border px-1 pb-1.5 pt-2 text-muted hover:border-foreground hover:text-foreground">
          <TypeIcon kind={t} /><span className="text-[11px] leading-tight">{BLOCK_DEFS[t].name}</span>
        </button>
      ))}
    </div>
  );
}

const danger = "w-full rounded-md border border-danger/40 px-3 py-2 text-sm text-danger hover:bg-danger/10";

/** Under a block's name in «Внутри»: what it says or holds, so blocks of one kind are told apart. */
const cut = (t: unknown, n = 42) => { const x = String(t ?? "").trim(); return x.length > n ? `${x.slice(0, n - 1)}…` : x; };
const optLabel = (b: Block, key: string) => BLOCK_DEFS[b.type].opts.find((o) => o.key === key)?.values.find((v) => v.id === b.o[key])?.label.toLowerCase() ?? "";
function blockHint(b: Block): string {
  const d = b.d as Record<string, unknown>;
  switch (b.type) {
    case "heading": return cut(d.title);
    case "text": return cut(d.body);
    case "buttons": return cut((d.items as string[]).slice(0, Number(b.o.count)).join(", "));
    case "media": return ({ image: "картинка", video: "видео", document: "документ" } as Record<string, string>)[b.o.kind] ?? "";
    case "numbers": return `${b.o.count} · ${optLabel(b, "style")}`;
    case "cards": return `${b.o.count} · ${optLabel(b, "style")}`;
    case "facts": return cut((d.rows as string[][]).slice(0, Number(b.o.rows)).map((r) => r[0]).join(", "));
    case "quote": return cut(d.text);
    case "list": return `${optLabel(b, "source")} · ${optLabel(b, "view")}`;
    case "tabs": return cut((d.tabs as Tab[]).map((t) => t.label).join(", "));
  }
}

export function Builder({ data }: { data: LabData }) {
  const [store, setStore] = useState<Store>(() => ({ sections: start(), custom: [] }));
  const [role, setRole] = useState<Role>("editor");
  const [sel, setSel] = useState<string | null>(null);
  const [tabs, setTabs] = useState<Record<string, number>>({});
  const [left, setLeft] = useState<"add" | "tree">("add");
  const [hover, setHover] = useState<string | null>(null);
  const [dropAt, setDropAt] = useState<DropAt | null>(null);
  /** the media library, open for one slot: what kind it wants, what is there now, what to do with the choice */
  const [track, setTrack] = useState({ src: "", lang: "en" });
  /** «Просмотр»: the page as visitors see it, in a frame of a computer's or a phone's width (real media queries) */
  const [view, setView] = useState<"edit" | "desktop" | "phone">("edit");
  const [frame, setFrame] = useState(false);
  /** the quick picker next to the panel, opened at a control */
  const [pop, setPop] = useState<{ anchor: DOMRect; kinds: LabFile["kind"][]; current?: string; onPick: (f: LabFile) => void } | null>(null);
  const [lib, setLib] = useState<{ want?: LabFile["kind"]; current?: string; onPick: (f: LabFile) => void } | null>(null);
  const [name, setName] = useState("");
  const [loaded, setLoaded] = useState(false);
  const designer = role === "designer";

  useEffect(() => {
    // the preview frame is this same page with ?view=canvas
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the address is known only in the browser
    if (new URLSearchParams(location.search).get("view") === "canvas") setFrame(true);
    const onStorage = (e: StorageEvent) => { if (e.key === KEY && e.newValue) setStore(JSON.parse(e.newValue) as Store); };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- restoring this browser's sandbox after hydration
      if (raw) setStore(JSON.parse(raw) as Store);
      const r = localStorage.getItem(`${KEY}:role`);
      if (r === "designer" || r === "editor") setRole(r);
    } catch { /* private mode: start fresh */ }
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (!loaded) return;
    try { localStorage.setItem(KEY, JSON.stringify(store)); localStorage.setItem(`${KEY}:role`, role); } catch { /* ignore */ }
  }, [store, role, loaded]);

  const sections = store.sections;
  const map = useMemo(() => levels(sections), [sections]);
  const chain: Level[] = (sel && map.get(sel)) || [];
  const here = chain[chain.length - 1] ?? null;
  const up = () => setSel(chain.length > 1 ? chain[chain.length - 2].key : null);

  // a tab that gets selected is also the one shown on the page
  const pick = (key: string | null) => {
    setSel(key);
    const lv = key ? map.get(key) : null;
    lv?.forEach((l) => l.kind === "tab" && setTabs((t) => ({ ...t, [l.id]: l.t })));
  };

  // Esc: leave the text being typed, else one level up
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || document.querySelector("[data-lab-modal]")) return;
      const a = document.activeElement as HTMLElement | null;
      if (a?.isContentEditable || a?.tagName === "INPUT") return a.blur();
      setSel((cur) => { const c = cur ? map.get(cur) : null; return c && c.length > 1 ? c[c.length - 2].key : null; });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [map]);

  /* ---- changes ---- */
  const sIndex = (key: string) => sections.findIndex((s) => s.id === key);
  const update = (fn: (d: Section[]) => void) => setStore((st) => { const d = clone(st.sections); fn(d); return { ...st, sections: d }; });
  const onData = (id: string, patch: Record<string, unknown>) => update((d) => { const l = locate(d, id); if (l) l.list[l.i].d = { ...l.list[l.i].d, ...patch }; });
  const setOpt = (id: string, key: string, value: string) => update((d) => { const l = locate(d, id); if (l) l.list[l.i].o = { ...l.list[l.i].o, [key]: value }; });

  const addSection = (s: Section, nm?: string, index?: number) => {
    const f = fresh(s, nm);
    const at = index ?? (chain[0]?.kind === "section" ? chain[0].s + 1 : sections.length);
    update((d) => { d.splice(at, 0, f); });
    setSel(f.id);
  };
  const moveSection = (i: number, dir: -1 | 1) => { const j = i + dir; if (j < 0 || j >= sections.length) return; update((d) => { [d[i], d[j]] = [d[j], d[i]]; }); };
  const removeSection = (i: number) => { update((d) => { d.splice(i, 1); }); setSel(null); };
  const setSectionOpt = (i: number, key: string, value: string) => update((d) => {
    const s = d[i];
    if (key === "layout") {
      // nothing moves and nothing is lost: columns beyond the layout are hidden, empty ones beyond it are dropped
      const n = colCount(value);
      while (s.cols.length < n) s.cols.push([]);
      while (s.cols.length > n && !s.cols[s.cols.length - 1].length) s.cols.pop();
    }
    (s as unknown as Record<string, string>)[key] = value;
  });
  const addBlock = (into: (d: Section[]) => Block[] | null | undefined, type: BlockType) => { const b = newBlock(type); update((d) => { into(d)?.push(clone(b)); }); setSel(b.id); };
  const moveBlock = (id: string, dir: -1 | 1) => update((d) => { const l = locate(d, id); if (!l) return; const j = l.i + dir; if (j < 0 || j >= l.list.length) return; [l.list[l.i], l.list[j]] = [l.list[j], l.list[l.i]]; });
  const copyBlock = (id: string) => { const ids = Array.from({ length: 64 }, uid); let k = 0; update((d) => { const l = locate(d, id); if (l) l.list.splice(l.i + 1, 0, reid(clone(l.list[l.i]), () => ids[k++ % ids.length])); }); };
  const removeBlock = (id: string) => { update((d) => { const l = locate(d, id); if (l) l.list.splice(l.i, 1); }); up(); };
  const tabsOf = (d: Section[], id: string) => { const l = locate(d, id); return l ? (l.list[l.i].d.tabs as Tab[]) : null; };
  const editTabs = (id: string, fn: (t: Tab[]) => void) => update((d) => { const t = tabsOf(d, id); if (t) fn(t); });

  /** A column («{section}:c{n}») or a tab («{tabs}:t{n}») by its key, in the draft being changed. */
  const listByKey = (d: Section[], key: string): Block[] | null => {
    const i = key.lastIndexOf(":");
    const owner = key.slice(0, i), n = Number(key.slice(i + 2));
    if (key[i + 1] === "c") { const s = d.find((x) => x.id === owner); if (!s) return null; while (s.cols.length <= n) s.cols.push([]); return s.cols[n]; }
    return tabsOf(d, owner)?.[n]?.blocks ?? null;
  };
  /** The drop: move or add a section, move a block, add a new block — where the line showed. */
  const commitDrop = () => {
    const d = drag.get();
    const at = dropAt;
    drag.set(null);
    setDropAt(null);
    if (!d || !at) return;
    if (at.kind === "page") {
      if (d.t === "section") {
        const from = sIndex(d.id);
        const to = from < at.index ? at.index - 1 : at.index;
        if (from < 0 || from === to) return;
        update((x) => { const [m] = x.splice(from, 1); x.splice(to, 0, m); });
        setSel(d.id);
      } else if (d.t === "ready") {
        const r = READY.find((x) => x.key === d.key);
        const c = store.custom.find((x) => x.key === d.key);
        if (r) addSection(r.make(), r.name, at.index);
        else if (c) addSection(c.section, c.name, at.index);
      }
      return;
    }
    if (d.t === "new") {
      const b = newBlock(d.type);
      update((x) => { listByKey(x, at.key)?.splice(at.index, 0, clone(b)); });
      pick(b.id);
    } else if (d.t === "block") {
      update((x) => {
        const src = locate(x, d.id);
        const to = listByKey(x, at.key);
        if (!src || !to) return;
        const [b] = src.list.splice(src.i, 1);
        to.splice(to === src.list && src.i < at.index ? at.index - 1 : at.index, 0, b);
      });
      setSel(d.id);
    }
  };
  useEffect(() => {
    const end = () => { drag.set(null); setDropAt(null); };
    window.addEventListener("dragend", end);
    return () => window.removeEventListener("dragend", end);
  }, []);

  const saveReady = (s: Section) => {
    if (!name.trim()) return;
    const nm = name.trim();
    setStore((st) => ({ ...st, custom: [...st.custom, { key: uid(), name: nm, section: { ...clone(s), name: nm } }] }));
    setName("");
  };

  /* ---- what the panel shows for the selected thing ---- */
  const blockOf = (id: string) => { const l = locate(sections, id); return l ? l.list[l.i] : null; };

  const kids = (list: Block[]) => list.map((b) => ({ key: b.id, label: BLOCK_DEFS[b.type].name, hint: blockHint(b), kind: b.type as Kind }));

  /** The panel's header: what is selected, where it sits, the way up, and quick actions as icons. */
  const head = (): ReactNode => {
    if (!here)
      return (
        <div className="grid justify-items-center gap-2 px-6 py-10 text-center text-muted">
          {ICON.pointer}
          <div className="text-sm font-medium text-foreground">Ничего не выбрано</div>
          <p className="text-xs">Кликните секцию или блок на странице — здесь появятся его настройки.</p>
        </div>
      );
    const b = here.kind === "block" ? blockOf(here.id) : null;
    const kind: Kind = here.kind === "block" ? (b?.type ?? "text") : here.kind;
    const name = here.kind === "section" ? sections[here.s]?.name || `Секция ${here.s + 1}` : here.kind === "tab" ? `Вкладка ${here.label}` : here.label;
    const parent = chain.length > 1 ? chain[chain.length - 2].label : "Страница";
    let actions: ReactNode = null;
    if (here.kind === "section") {
      const i = here.s;
      actions = (<>
        <IconButton label="Выше" disabled={i === 0} onClick={() => moveSection(i, -1)}>{ICON.up}</IconButton>
        <IconButton label="Ниже" disabled={i === sections.length - 1} onClick={() => moveSection(i, 1)}>{ICON.down}</IconButton>
        <IconButton label="Копия секции" onClick={() => addSection(sections[i])}>{ICON.copy}</IconButton>
      </>);
    } else if (here.kind === "block" && designer && b) {
      actions = (<>
        <IconButton label="Выше" onClick={() => moveBlock(b.id, -1)}>{ICON.up}</IconButton>
        <IconButton label="Ниже" onClick={() => moveBlock(b.id, 1)}>{ICON.down}</IconButton>
        <IconButton label="Копия блока" onClick={() => copyBlock(b.id)}>{ICON.copy}</IconButton>
      </>);
    } else if (here.kind === "tab" && designer) {
      const n = ((blockOf(here.id)?.d.tabs as Tab[]) ?? []).length;
      actions = (<>
        <IconButton label="Левее" disabled={here.t === 0} onClick={() => { editTabs(here.id, (x) => { [x[here.t - 1], x[here.t]] = [x[here.t], x[here.t - 1]]; }); pick(tabKey(here.id, here.t - 1)); }}>{ICON.left}</IconButton>
        <IconButton label="Правее" disabled={here.t === n - 1} onClick={() => { editTabs(here.id, (x) => { [x[here.t + 1], x[here.t]] = [x[here.t], x[here.t + 1]]; }); pick(tabKey(here.id, here.t + 1)); }}>{ICON.right}</IconButton>
      </>);
    }
    return (
      <div className="sticky top-0 z-10 border-b border-border bg-background px-4 pb-3 pt-3">
        <button type="button" onClick={up} title="На уровень выше (Esc)" className="mb-2 inline-flex items-center gap-1.5 rounded-md py-0.5 pr-2 text-xs text-muted hover:text-foreground">
          {ICON.parent}<span className="truncate">{parent}</span>
        </button>
        <div className="flex items-center gap-2">
          <TypeIcon kind={kind} className="h-9 w-9 rounded-md bg-surface text-foreground" />
          <div className="min-w-0 flex-1">
            <div className="truncate text-base font-semibold leading-tight">{name}</div>
            <div className="truncate text-xs text-muted">{here.kind === "block" && b ? BLOCK_DEFS[b.type].hint : here.kind === "section" ? `Секция ${here.s + 1} из ${sections.length}` : here.kind === "column" ? "колонка секции" : "вкладка"}</div>
          </div>
          <div className="flex">{actions}</div>
        </div>
      </div>
    );
  };

  /** Open the quick picker beside the settings panel, level with the control that was clicked. */
  const openPick = (el: HTMLElement, kinds: LabFile["kind"][], current: string | undefined, onPick: (f: LabFile) => void) => {
    const panel = el.closest("aside")?.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    setPop({ anchor: new DOMRect(panel?.left ?? r.left, r.top, r.width, r.height), kinds, current, onPick });
  };

  /** A file in a slot: its preview, name and size; «Заменить» opens the media library for that slot. */
  function FileCard({ src, want, onPick }: { src: unknown; want?: LabFile["kind"]; onPick: (f: LabFile) => void }) {
    const f = fileOf(data, src) ?? (typeof src === "number" ? data.library.find((x) => x.url === data.images[src % Math.max(1, data.images.length)]?.url) ?? null : null);
    return (
      <div className="flex min-w-0 items-center gap-3">
        <div className="h-14 w-20 flex-none overflow-hidden rounded-md bg-surface">{f ? <Preview f={f} /> : null}</div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm">{f?.filename ?? "Не выбран"}</div>
          {f && <div className="truncate text-xs text-muted">{f.width ? `${f.width}×${f.height} · ` : ""}{f.kind === "document" && f.pages ? `${f.pages} стр. · ` : ""}{f.size > 1024 * 1024 ? `${(f.size / 1024 / 1024).toFixed(1)} МБ` : `${Math.max(1, Math.round(f.size / 1024))} КБ`}</div>}
        </div>
        <button type="button" onClick={(e) => openPick(e.currentTarget, want ? [want] : ["image", "video", "document"], f?.url, onPick)} className="h-8 flex-none rounded-md border border-border px-2.5 text-xs hover:border-foreground">Заменить</button>
      </div>
    );
  }

  /** Media block: the file first — its kind decides the options below. */
  const mediaFile = (b: Block): ReactNode => (
    <Group title="Файл">
      <FileCard src={b.d.src} onPick={(f) => {
        if (f.kind === "other") return;
        update((d) => { const l = locate(d, b.id); if (!l) return; const x = l.list[l.i]; x.o = { ...x.o, kind: f.kind }; x.d = { ...x.d, src: f.url, alt: undefined, title: undefined, poster: undefined, focal: "50% 50%" }; });
      }} />
      <p className="text-xs text-muted">Картинка, видео или PDF из медиатеки — настройки ниже меняются под тип файла.</p>
      {/* the YouTube / Vimeo field: in view for a video, behind a link for a picture or a document */}
      {b.o.kind !== "video" && b.d.embed === undefined ? (
        <button type="button" className="justify-self-start text-xs underline" onClick={() => onData(b.id, { embed: "" })}>Видео по ссылке YouTube / Vimeo…</button>
      ) : <>
      <label htmlFor={`embed-${b.id}`} className="text-xs text-muted">Или видео по ссылке YouTube / Vimeo</label>
      <input id={`embed-${b.id}`} value={String(b.d.embed ?? "")} placeholder="https://www.youtube.com/watch?v=…"
        onChange={(e) => { const v = e.target.value; update((d) => { const l = locate(d, b.id); if (!l) return; const x = l.list[l.i]; x.d = { ...x.d, embed: v || (x.o.kind === "video" ? undefined : "") }; if (v) x.o = { ...x.o, kind: "video" }; }); }}
        className={`h-8 rounded-md border px-2 text-sm ${b.d.embed && !embedOf(String(b.d.embed), false) ? "border-danger" : "border-border"}`} />
      {!!b.d.embed && !embedOf(String(b.d.embed), false) && <p className="text-xs text-danger">Это не ссылка на YouTube или Vimeo.</p>}
      {!!b.d.embed && embedOf(String(b.d.embed), false) && <p className="text-xs text-muted">Играет видео по ссылке; файл из медиатеки не используется. Очистите поле, чтобы вернуть файл.</p>}
      </>}
    </Group>
  );

  /** Subtitles of a video file: WebVTT files by language (the first one is on by default). */
  const subtitles = (b: Block): ReactNode => {
    const tracks = (b.d.tracks as { src: string; lang: string }[] | undefined) ?? [];
    const bad = !!track.src && (!/\.vtt(\?|$)/i.test(track.src) || !safeHref(track.src));
    return (
      <Group title="Субтитры">
        <p className="text-xs text-muted">Файл WebVTT (.vtt) на каждый язык — для тех, кто смотрит без звука или не слышит. Первый включён сразу.</p>
        {tracks.length > 0 && (
          <ul className="grid gap-1 text-sm">
            {tracks.map((t, k) => (
              <li key={t.src + t.lang} className="flex items-center gap-2">
                <span className="w-20 flex-none text-xs text-muted">{LANGS[t.lang] ?? t.lang}</span>
                <span className="min-w-0 flex-1 truncate text-xs">{t.src}</span>
                <button type="button" aria-label={`Убрать субтитры ${LANGS[t.lang] ?? t.lang}`} className="text-xs text-muted hover:text-foreground" onClick={() => onData(b.id, { tracks: tracks.filter((_, j) => j !== k) })}>✕</button>
              </li>
            ))}
          </ul>
        )}
        <div className="flex gap-1.5">
          <select aria-label="Язык субтитров" value={track.lang} onChange={(e) => setTrack((t) => ({ ...t, lang: e.target.value }))} className="h-8 rounded-md border border-border px-1 text-sm">
            {Object.entries(LANGS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <input aria-label="Адрес файла .vtt" value={track.src} onChange={(e) => setTrack((t) => ({ ...t, src: e.target.value }))} placeholder="/uploads/…/clip.en.vtt" className={`h-8 min-w-0 flex-1 rounded-md border px-2 text-sm ${bad ? "border-danger" : "border-border"}`} />
          <button type="button" disabled={!track.src || bad} onClick={() => { onData(b.id, { tracks: [...tracks, { src: track.src.trim(), lang: track.lang }] }); setTrack((t) => ({ ...t, src: "" })); }} className="h-8 rounded-md bg-foreground px-2.5 text-sm text-background disabled:opacity-40">+</button>
        </div>
        {bad && <p className="text-xs text-danger">Нужен файл .vtt: адрес на сайте (/…) или https://….</p>}
        <p className="text-xs text-muted">В медиатеке пока нет файлов .vtt: загрузка — в админке (нужен сервер).</p>
      </Group>
    );
  };

  /** A picture's description — main: without it a picture says nothing to a screen reader or a search engine. */
  const altGroup = (b: Block): ReactNode => {
    const f = fileOf(data, b.d.src);
    const d = b.d as { alt?: string; decorative?: boolean };
    const alt = d.alt ?? f?.alt ?? "";
    const missing = !d.decorative && !alt.trim();
    return (
          <Group title="Описание картинки">
            <textarea aria-label="Описание картинки" rows={2} disabled={!!d.decorative} value={d.decorative ? "" : alt} onChange={(e) => onData(b.id, { alt: e.target.value })}
              placeholder="Что на картинке — для незрячих и для поиска" className={`rounded-md border px-2 py-1.5 text-sm disabled:opacity-40 ${missing ? "border-danger" : "border-border"}`} />
            {missing && <p className="text-xs text-danger">Нет описания: опишите картинку или отметьте её декоративной.</p>}
            {!missing && f && d.alt === undefined && alt && <p className="text-xs text-muted">Описание из медиатеки. Можно уточнить для этого места.</p>}
            <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={!!d.decorative} onChange={(e) => onData(b.id, { decorative: e.target.checked })} /> Декоративная — без описания (узор, фон)</label>
          </Group>
    );
  };

  /** Groups mediaExtras shows (for the number on «Дополнительно»). */
  const extrasCount = (b: Block) => {
    if (b.type !== "media") return 0;
    if (b.o.kind === "image") return 2 + (b.o.fit !== "contain" && b.o.ratio !== "natural" && fileOf(data, b.d.src) ? 1 : 0);
    if (b.o.kind === "video") return b.d.embed ? 1 : 2;
    return 0;
  };

  /** What only some kinds have: a description and a focal point for a picture, a poster for a video. */
  const mediaExtras = (b: Block): ReactNode => {
    const f = fileOf(data, b.d.src);
    const d = b.d as { alt?: string; decorative?: boolean; focal?: string; poster?: string };
    if (b.o.kind === "image") {
      const focus = b.o.fit !== "contain" && b.o.ratio !== "natural";
      const [fx, fy] = (d.focal ?? "50% 50%").split(" ").map((x) => parseFloat(x));
      return (
        <>
          <Group title="Ссылка">
            <input aria-label="Куда ведёт картинка" value={String((b.d as { href?: string }).href ?? "")} onChange={(e) => onData(b.id, { href: e.target.value || undefined })} placeholder="/us/therapies или https://…" className="h-8 rounded-md border border-border px-2 text-sm" />
            {!!(b.d as { href?: string }).href && !safeHref((b.d as { href?: string }).href) && <p className="text-xs text-danger">Нужен адрес на сайте (/…) или ссылка https://… — такая ссылка не сохранится на странице.</p>}
            <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={!!(b.d as { newTab?: boolean }).newTab} onChange={(e) => onData(b.id, { newTab: e.target.checked })} /> Открывать в новой вкладке</label>
            {(b.d as { href?: string }).href && b.o.zoom === "on" && <p className="text-xs text-muted">Со ссылкой клик ведёт по ссылке — увеличение не работает.</p>}
          </Group>
          <Group title="Картинка для телефона">
            <p className="text-xs text-muted">Другой кадр для экранов до 767 px — например, вертикальный. Нет своей — показывается основная. Проверьте в просмотре «Телефон».</p>
            <FileCard src={(b.d as { srcMobile?: string }).srcMobile} want="image" onPick={(x) => onData(b.id, { srcMobile: x.url })} />
            {(b.d as { srcMobile?: string }).srcMobile && <button type="button" className="justify-self-start text-xs underline" onClick={() => onData(b.id, { srcMobile: undefined })}>Убрать — показывать основную</button>}
          </Group>
          {focus && f && (
            <Group title="Точка фокуса">
              <p className="text-xs text-muted">Что остаётся в кадре при обрезке. Кликните по главному на картинке.</p>
              <button type="button" aria-label="Поставить точку фокуса" className="relative overflow-hidden rounded-md bg-surface"
                onClick={(e) => { const r = e.currentTarget.getBoundingClientRect(); onData(b.id, { focal: `${Math.round(((e.clientX - r.left) / r.width) * 100)}% ${Math.round(((e.clientY - r.top) / r.height) * 100)}%` }); }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={asset(f.url)} alt="" className="block w-full" />
                <span aria-hidden className="absolute h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-background bg-foreground/40 shadow" style={{ left: `${fx}%`, top: `${fy}%` }} />
              </button>
            </Group>
          )}
        </>
      );
    }
    if (b.o.kind === "video") {
      if (b.d.embed) return <Group title="Обложка и субтитры"><p className="text-xs text-muted">У видео по ссылке обложку и субтитры задаёт YouTube или Vimeo.</p></Group>;
      const poster = d.poster ?? f?.poster ?? null;
      const pf = poster ? data.library.find((x) => x.url === poster) ?? null : null;
      return (
        <>
        <Group title="Обложка">
          <p className="text-xs text-muted">{b.o.mode === "ambient" ? "Видна, пока видео загружается." : "Видна до нажатия «Play»."}</p>
          <div className="flex items-center gap-3">
            <div className="h-14 w-20 flex-none overflow-hidden rounded-md bg-surface">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {poster ? (pf ? <Preview f={pf} /> : <img src={asset(poster)} alt="" className="h-full w-full object-cover" />) : null}
            </div>
            <div className="min-w-0 flex-1 text-xs text-muted">{d.poster ? "своя картинка" : poster ? "кадр из видео" : "нет — будет чёрный прямоугольник"}</div>
            <button type="button" onClick={(e) => openPick(e.currentTarget, ["image"], d.poster, (x) => onData(b.id, { poster: x.url }))} className="h-8 flex-none rounded-md border border-border px-2.5 text-xs hover:border-foreground">Выбрать</button>
          </div>
          {d.poster && <button type="button" className="justify-self-start text-xs underline" onClick={() => onData(b.id, { poster: undefined })}>Вернуть кадр из видео</button>}
        </Group>
        {subtitles(b)}
        </>
      );
    }
    return null;
  };

  /**
   * A section's background in one place: colour swatches and «Фото / видео», whose swatch shows the chosen file and
   * opens the quick picker; under it — how the file fills the band and, for a video, the Play / Pause button.
   */
  const background = (i: number, s: Section): ReactNode => {
    const file = s.bg === "image" ? fileOf(data, s.bgSrc) ?? data.library.find((x) => x.url === data.images[0]?.url) ?? null : null;
    const setBg = (patch: Partial<Section>) => update((d) => { Object.assign(d[i], patch); });
    const pickMedia = (el: HTMLElement) => openPick(el, ["image", "video"], file?.url, (f) => (f.kind === "image" || f.kind === "video") && setBg({ bg: "image", bgSrc: f.url, ...(f.kind === "video" && s.bgFit === "tile" ? { bgFit: "cover" } : {}) }));
    const sw = "relative h-9 w-9 overflow-hidden rounded-full border border-border";
    const on = "ring-2 ring-foreground ring-offset-2 ring-offset-background";
    return (
      <Group title="Фон">
        <div className="flex flex-wrap items-center gap-2.5" role="group" aria-label="Фон">
          {([["white", "Белый", "bg-background"], ["grey", "Серый", "bg-surface"], ["dark", "Тёмный", "bg-inverse"]] as const).map(([id, label, cls]) => (
            <button key={id} type="button" aria-label={label} title={label} aria-pressed={s.bg === id} onClick={() => setBg({ bg: id })} className={`${sw} ${cls} ${s.bg === id ? on : ""}`} />
          ))}
          <button type="button" aria-label="Фото / видео" title="Фото или видео из медиатеки" aria-pressed={s.bg === "image"} onClick={(e) => pickMedia(e.currentTarget)} className={`${sw} bg-surface ${s.bg === "image" ? on : ""}`}>
            {s.bg === "image" && file ? <Preview f={file} /> : <svg viewBox="0 0 32 32" className="absolute inset-0 h-full w-full text-muted" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden><path d="M8 21l5-5 4 4 3-3 4 4" /><circle cx="20" cy="12" r="2" /></svg>}
          </button>
        </div>
        {s.bg === "image" && (
          <>
            <button type="button" onClick={(e) => pickMedia(e.currentTarget)} className="flex min-w-0 items-center gap-2 rounded-md text-left text-xs text-muted hover:text-foreground">
              <span className="min-w-0 truncate">{file ? `${file.kind === "video" ? "Видео" : "Картинка"}: ${file.filename}` : "Выберите файл"}</span><span className="flex-none underline">заменить</span>
            </button>
            <p className="text-xs text-muted">Поверх — затемнение, чтобы текст читался.</p>
          </>
        )}
      </Group>
    );
  };

  /** The background's fine-tuning (in «Дополнительно»): how the file fills the band, the video's Play / Pause. */
  const bgAdvanced = (i: number, s: Section): ReactNode => {
    if (s.bg !== "image") return null;
    const file = fileOf(data, s.bgSrc) ?? data.library.find((x) => x.url === data.images[0]?.url) ?? null;
    const setBg = (patch: Partial<Section>) => update((d) => { Object.assign(d[i], patch); });
    const fit: import("./model").Opt = { key: "bgFit", label: "Заполнение", values: file?.kind === "video" ? [{ id: "cover", label: "Заполнить" }, { id: "contain", label: "Целиком" }] : [{ id: "cover", label: "Заполнить" }, { id: "contain", label: "Целиком" }, { id: "tile", label: "Плиткой" }] };
    const playOpt: import("./model").Opt = { key: "bgPlay", label: "Кнопка Play / Пауза", values: [{ id: "on", label: "Есть" }, { id: "off", label: "Нет" }] };
    return (
      <Group title="Фон">
        <Control block="section" opt={fit} value={s.bgFit ?? "cover"} onPick={(v) => setBg({ bgFit: v })} />
        {file?.kind === "video" && <Control block="section" opt={playOpt} value={s.bgPlay === false ? "off" : "on"} onPick={(v) => setBg({ bgPlay: v === "on" })} />}
        {file?.kind === "video" && <p className="text-xs text-muted">Видео без звука и по кругу; кнопка нужна, чтобы его можно было остановить (доступность).</p>}
      </Group>
    );
  };

  const panel = (): ReactNode => {
    if (!here)
      return <Group title="Секции страницы"><Inside items={sections.map((s, i) => ({ key: s.id, label: s.name || `Секция ${i + 1}`, hint: `Секция ${i + 1}`, kind: "section" as Kind }))} onOpen={pick} /></Group>;
    if (here.kind === "section") {
      const i = here.s;
      const s = sections[i];
      if (!s) return null;
      const opts = SECTION_OPTS.filter((o) => designer || o.key !== "layout");
      return (
        <>
          {background(i, s)}
          <Options block="section" opts={opts.filter((o) => o.key !== "bg" && !isAdvanced("section", o.key))} values={s as unknown as Record<string, string>} onPick={(k, v) => setSectionOpt(i, k, v)} />
          <Group title={s.cols.length > 1 ? "Колонки" : "Внутри"}>
            <Inside items={s.cols.length > 1 ? s.cols.map((c, k) => {
              const hidden = k >= colCount(s.layout);
              const what = c.map((b) => BLOCK_DEFS[b.type].name).join(", ") || "пусто";
              return { key: colKey(s.id, k), label: `Колонка ${k + 1}`, hint: hidden ? `скрыта: в раскладке её нет · ${what}` : what, kind: "column" as Kind, muted: hidden };
            }) : kids(s.cols[0] ?? [])} onOpen={pick} />
          </Group>
          <Advanced count={opts.filter((o) => isAdvanced("section", o.key)).length + (s.bg === "image" ? 1 : 0)}>
            {bgAdvanced(i, s)}
            <Options block="section" opts={opts.filter((o) => isAdvanced("section", o.key))} values={s as unknown as Record<string, string>} onPick={(k, v) => setSectionOpt(i, k, v)} />
          </Advanced>
          {designer && s.cols.length === 1 && <Group title="Добавить блок"><AddBlock onAdd={(t) => addBlock((d) => d[i].cols[0], t)} /></Group>}
          {designer && (
            <Group title="Сохранить как готовую">
              {/* not a <form>: the demo build catches every form submit (DemoShell) */}
              <p className="text-xs text-muted">Секция появится слева в «Добавить» у редактора.</p>
              <div className="flex gap-1.5">
                <input id="lab-ready-name" aria-label="Название готовой секции" value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && saveReady(s)} placeholder="Например, «Три преимущества»" className="h-8 min-w-0 flex-1 rounded-md border border-border px-2 text-sm" />
                <button type="button" className="h-8 rounded-md bg-foreground px-3 text-sm text-background disabled:opacity-40" disabled={!name.trim()} onClick={() => saveReady(s)}>Сохранить</button>
              </div>
            </Group>
          )}
          <div className="px-4 py-4"><button type="button" className={danger} onClick={() => removeSection(i)}>Удалить секцию</button></div>
        </>
      );
    }
    if (here.kind === "column") {
      const sec = sections[here.s];
      const col = sec?.cols[here.c] ?? [];
      const hidden = !!sec && here.c >= colCount(sec.layout);
      return (
        <>
          {hidden && (
            <div className="mx-4 mb-1 mt-4 rounded-md bg-surface p-3 text-xs text-muted">
              Колонка скрыта: в раскладке «{SECTION_OPTS[1].values.find((v) => v.id === sec.layout)?.label}» её нет. Блоки сохранены — выберите раскладку с {here.c + 1} колонками, и она встанет на своё место.
            </div>
          )}
          <Group title="Внутри"><Inside items={kids(col)} onOpen={pick} /></Group>
          {designer && <Group title="Добавить блок"><AddBlock onAdd={(t) => addBlock((d) => d[here.s].cols[here.c], t)} /></Group>}
        </>
      );
    }
    if (here.kind === "tab") {
      const all = (blockOf(here.id)?.d.tabs as Tab[] | undefined) ?? [];
      const t = all[here.t];
      if (!t) return null;
      return (
        <>
          <Group title="Название">
            <input id="lab-tab-label" aria-label="Название вкладки" defaultValue={t.label} key={here.key} onBlur={(e) => e.target.value.trim() && e.target.value.trim() !== t.label && editTabs(here.id, (x) => { x[here.t].label = e.target.value.trim(); })} onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()} className="h-8 rounded-md border border-border px-2 text-sm" />
          </Group>
          <Group title="Внутри"><Inside items={kids(t.blocks)} onOpen={pick} /></Group>
          {designer && <Group title="Добавить блок"><AddBlock nested onAdd={(type) => addBlock((d) => tabsOf(d, here.id)?.[here.t]?.blocks, type)} /></Group>}
          {designer && all.length > 1 && <div className="px-4 py-4"><button type="button" className={danger} onClick={() => { editTabs(here.id, (x) => { x.splice(here.t, 1); }); setTabs((m) => ({ ...m, [here.id]: 0 })); setSel(here.id); }}>Удалить вкладку</button></div>}
        </>
      );
    }
    const b = blockOf(here.id);
    if (!b) return null;
    return (
      <>
        {b.type === "media" && mediaFile(b)}
        <Options block={b.type} opts={optsFor(b).filter((o) => !isAdvanced(b, o.key))} values={b.o} onPick={(k, v) => setOpt(b.id, k, v)} />
        {b.type === "media" && b.o.kind === "image" && altGroup(b)}
        {b.type === "quote" && (
          <Group title="Фото">
            <FileCard src={b.d.src} want="image" onPick={(f) => onData(b.id, { src: f.url })} />
          </Group>
        )}
        {b.type === "cards" && (b.o.style === "image" || b.o.style === "link") && (
          <Group title="Картинки карточек">
            <div className="grid grid-cols-4 gap-1.5">
              {((b.d.items as { title: string; img?: string }[]) ?? []).slice(0, Number(b.o.count)).map((it, k) => {
                const f = fileOf(data, it.img);
                return (
                  <button key={k} type="button" title={`${it.title} — заменить картинку`} onClick={(e) => openPick(e.currentTarget, ["image"], it.img, (x) => onData(b.id, { items: (b.d.items as object[]).map((y, j) => (j === k ? { ...y, img: x.url } : y)) }))}
                    className="aspect-square overflow-hidden rounded-md bg-surface hover:ring-2 hover:ring-foreground">
                    {f ? <Preview f={f} /> : <span className="flex h-full items-center justify-center text-[11px] text-muted">{k + 1}</span>}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-muted">Клик по картинке — выбрать другую из медиатеки.</p>
          </Group>
        )}
        {b.type === "tabs" && (
          <Group title="Вкладки" aside={designer ? <button type="button" className="text-xs underline" onClick={() => editTabs(b.id, (x) => { x.push({ label: "New tab", blocks: [] }); })}>+ Вкладка</button> : undefined}>
            <Inside items={(b.d.tabs as Tab[]).map((t, k) => ({ key: tabKey(b.id, k), label: t.label, hint: t.blocks.map((x) => BLOCK_DEFS[x.type].name).join(", ") || "пусто", kind: "tab" as Kind }))} onOpen={pick} />
          </Group>
        )}
        <Group title="Текст">
          <p className="text-xs text-muted">{b.type === "list" ? "Записи берутся из коллекции и правятся там; здесь — что показывать и как." : b.type === "tabs" ? "Названия вкладок — внутри каждой вкладки." : "Тексты правятся прямо на странице: клик по тексту, Enter — готово."}</p>
        </Group>
        <Advanced count={optsFor(b).filter((o) => isAdvanced(b, o.key)).length + extrasCount(b)}>
          <Options block={b.type} opts={optsFor(b).filter((o) => isAdvanced(b, o.key))} values={b.o} onPick={(k, v) => setOpt(b.id, k, v)} />
          {b.type === "media" && mediaExtras(b)}
        </Advanced>
        {designer && <div className="px-4 py-4"><button type="button" className={danger} onClick={() => removeBlock(b.id)}>Удалить блок</button></div>}
      </>
    );
  };

  /* ---- the structure tree (Webflow's Navigator) ---- */
  const tree = (): ReactNode => {
    const row = (key: string, label: string, depth: number, kids?: ReactNode, muted = false) => (
      <li key={key} className={muted ? "opacity-50" : ""}>
        <button type="button" onClick={() => pick(key)} style={{ paddingLeft: 8 + depth * 14 }}
          className={`block w-full truncate rounded py-1 pr-2 text-left text-sm ${sel === key ? "bg-foreground text-background" : chain.some((l) => l.key === key) ? "font-semibold" : "hover:bg-surface"}`}>{label}</button>
        {kids && <ul>{kids}</ul>}
      </li>
    );
    const blocks = (list: Block[], depth: number): ReactNode => list.map((b) => row(b.id, BLOCK_DEFS[b.type].name, depth,
      b.type === "tabs" ? (b.d.tabs as Tab[]).map((t, k) => row(tabKey(b.id, k), `Вкладка «${t.label}»`, depth + 1, blocks(t.blocks, depth + 2))) : undefined));
    return (
      <ul className="grid gap-0.5" aria-label="Структура страницы">
        {sections.map((s, i) => row(s.id, `Секция ${i + 1}${s.name ? ` · ${s.name}` : ""}`, 0,
          s.cols.length > 1 ? s.cols.map((c, k) => row(colKey(s.id, k), `Колонка ${k + 1}${k >= colCount(s.layout) ? " · скрыта" : ""}`, 1, blocks(c, 2), k >= colCount(s.layout))) : blocks(s.cols[0] ?? [], 1)))}
      </ul>
    );
  };

  const trail = new Set(chain.slice(0, -1).map((l) => l.key));

  if (frame) return <PreviewCanvas sections={sections} data={data} />;

  return (
    <div className="flex h-dvh flex-col bg-background text-foreground">
      {pop && <MediaPopover files={data.library} kinds={pop.kinds} current={pop.current} anchor={pop.anchor} onClose={() => setPop(null)}
        onPick={(f) => { pop.onPick(f); setPop(null); }}
        onAll={() => { const p = pop; setPop(null); setLib({ want: p.kinds.length === 1 ? p.kinds[0] : undefined, current: p.current, onPick: p.onPick }); }} />}
      {lib && <MediaLibrary files={data.library} want={lib.want} current={lib.current} onPick={(f) => { lib.onPick(f); setLib(null); }} onClose={() => setLib(null)} />}
      <header className="flex flex-wrap items-center gap-x-6 gap-y-2 bg-inverse px-4 py-2 text-sm text-inverse-foreground">
        <strong>Песочница блоков</strong>
        <span className="opacity-70">предложение, не редактор: правки остаются в этом браузере</span>
        <span className="flex-1" />
        <span role="group" aria-label="Режим" className="flex items-center gap-1">
          {([["edit", "Правка"], ["desktop", "Просмотр: компьютер"], ["phone", "Телефон"]] as const).map(([k, l]) => (
            <button key={k} type="button" aria-pressed={view === k} onClick={() => setView(k)} className={`rounded px-2 py-0.5 ${view === k ? "bg-inverse-foreground text-inverse" : "underline"}`}>{l}</button>
          ))}
        </span>
        <span role="group" aria-label="Роль" className="flex items-center gap-1">
          <span className="opacity-70">Как</span>
          {(["editor", "designer"] as Role[]).map((r) => (
            <button key={r} type="button" aria-pressed={role === r} onClick={() => setRole(r)} className={`rounded px-2 py-0.5 ${role === r ? "bg-inverse-foreground text-inverse" : "underline"}`}>{r === "editor" ? "Editor" : "Designer"}</button>
          ))}
        </span>
        <button type="button" onClick={() => { setStore({ sections: start(), custom: store.custom }); setSel(null); }} className="underline">Начать заново</button>
      </header>

      <div className="grid min-h-0 flex-1 lg:grid-cols-[17rem_minmax(0,1fr)_20rem]">
        <aside className="flex min-h-0 flex-col border-r border-border" aria-label="Добавить и структура">
          <div role="tablist" className="flex border-b border-border text-sm">
            {([["add", "Добавить"], ["tree", "Структура"]] as const).map(([k, l]) => (
              <button key={k} role="tab" type="button" aria-selected={left === k} onClick={() => setLeft(k)} className={`-mb-px flex-1 border-b-2 px-3 py-2 ${left === k ? "border-foreground font-medium" : "border-transparent text-muted"}`}>{l}</button>
            ))}
          </div>
          <div className="min-h-0 flex-1 overflow-auto p-4">
            {left === "tree" ? tree() : (
              <>
                <p className="text-xs text-muted">Готовые секции. Клик — встаёт после выбранной; или перетащите на нужное место страницы.</p>
                <ul className="mt-3 grid gap-1" aria-label="Готовые секции">
                  {READY.map((r) => (
                    <li key={r.key}>
                      <button type="button" onClick={() => addSection(r.make(), r.name)} title="Клик — после выбранной секции, или перетащите на страницу"
                        draggable onDragStart={(e) => { drag.set({ t: "ready", key: r.key }); e.dataTransfer.effectAllowed = "copy"; e.dataTransfer.setData("text/plain", r.name); }}
                        className="w-full cursor-grab rounded border border-border px-3 py-2 text-left hover:border-foreground">
                        <span className="block text-sm font-medium">{r.name}</span><span className="block text-xs text-muted">сейчас: {r.was}</span>
                      </button>
                    </li>
                  ))}
                  {store.custom.map((c) => (
                    <li key={c.key} className="flex gap-1">
                      <button type="button" onClick={() => addSection(c.section, c.name)}
                        draggable onDragStart={(e) => { drag.set({ t: "ready", key: c.key }); e.dataTransfer.effectAllowed = "copy"; e.dataTransfer.setData("text/plain", c.name); }}
                        className="flex-1 cursor-grab rounded border border-accent px-3 py-2 text-left hover:border-foreground">
                        <span className="block text-sm font-medium">{c.name}</span><span className="block text-xs text-muted">собрана дизайнером</span>
                      </button>
                      {designer && <button type="button" aria-label={`Удалить ${c.name}`} className={btn} onClick={() => setStore((st) => ({ ...st, custom: st.custom.filter((x) => x.key !== c.key) }))}>✕</button>}
                    </li>
                  ))}
                </ul>
                {designer && <button type="button" className={`mt-3 w-full ${btn}`} onClick={() => addSection({ id: uid(), name: "Пустая", bg: "white", layout: "1", valign: "top", space: "normal", cols: [[]] })}>+ Пустая секция</button>}
              </>
            )}
          </div>
        </aside>

        <div className="flex min-h-0 flex-col">
          {/* where the selection sits; each step selects that level */}
          <nav aria-label="Где выбрано" className="flex min-h-10 flex-wrap items-center gap-1 border-b border-border bg-background px-4 py-2 text-sm">
            <button type="button" onClick={() => setSel(null)} className={here ? "text-muted underline-offset-4 hover:underline" : "font-medium"}>Страница</button>
            {chain.map((l, i) => (
              <span key={l.key} className="flex items-center gap-1">
                <span aria-hidden className="text-muted">›</span>
                <button type="button" onClick={() => pick(l.key)} aria-current={i === chain.length - 1 ? "true" : undefined} className={i === chain.length - 1 ? "font-medium" : "text-muted underline-offset-4 hover:underline"}>{l.label}</button>
              </span>
            ))}
          </nav>
          <main className="min-h-0 flex-1 overflow-auto bg-surface p-4" onClick={() => setSel(null)} onMouseLeave={() => setHover(null)}
            onDragOver={(e) => {
              // below the last section: a section goes to the end of the page
              const d = drag.get();
              if (!d || (d.t !== "section" && d.t !== "ready") || e.target !== e.currentTarget || !sections.length) return;
              e.preventDefault();
              const last = sections[sections.length - 1].id;
              if (dropAt?.at !== last || dropAt.side !== "after") setDropAt({ kind: "page", index: sections.length, at: last, side: "after" });
            }}
            onDrop={(e) => { if (!dropAt) return; e.preventDefault(); commitDrop(); }}>
            {view !== "edit" ? (
              <iframe title="Просмотр страницы" src={`${location.pathname}?view=canvas`} className={`mx-auto block h-full border-0 bg-background shadow-sm ${view === "phone" ? "w-[390px] rounded-[2rem] border-8 border-inverse" : "w-full max-w-[1280px]"}`} />
            ) : (
            <div className="mx-auto max-w-[1280px] bg-background shadow-sm">
              {sections.map((s, i) => (
                <SectionView key={s.id} s={s} index={i} c={{ data, sel, trail, hover, onHover: setHover, onPick: pick, onData, activeTab: (id) => tabs[id] ?? 0, drop: dropAt, onDragAt: setDropAt, onDropHere: commitDrop, canDragBlocks: designer }} />
              ))}
              {!sections.length && <p className="p-16 text-center text-muted">Страница пуста. Добавьте готовую секцию слева.</p>}
            </div>
            )}
          </main>
        </div>

        <aside className="min-h-0 overflow-auto border-l border-border" aria-label="Настройки">
          {head()}
          {panel()}
        </aside>
      </div>
    </div>
  );
}

/** The page as visitors see it (inside the preview frame): no frames, no editing; tabs switch; follows the editor's changes. */
function PreviewCanvas({ sections, data }: { sections: Section[]; data: LabData }) {
  const [tabs, setTabs] = useState<Record<string, number>>({});
  setPreviewMode(true);
  const pick = (key: string) => { const m = key.match(/^(.*):t(\d+)$/); if (m) setTabs((t) => ({ ...t, [m[1]]: Number(m[2]) })); };
  return (
    <div className="bg-background text-foreground">
      {sections.map((s, i) => (
        <SectionView key={s.id} s={s} index={i} c={{ data, sel: null, trail: new Set(), hover: null, onHover: () => {}, onPick: pick, onData: () => {}, activeTab: (id) => tabs[id] ?? 0, drop: null, onDragAt: () => {}, onDropHere: () => {}, canDragBlocks: false, readOnly: true }} />
      ))}
    </div>
  );
}
