"use client";

import { Fragment, useEffect, useMemo, useState, type ReactNode } from "react";
import { BLOCK_DEFS, READY, SECTION_OPTS, START, colCount, colKey, levels, newBlock, CLICK, EDITOR_KEYS, clickOf, optsFor, tabKey, uid, type Block, type BlockType, type Level, type Opt, type Section, type Tab } from "./model";
import { LANGS, SectionView, asset, drag, embedOf, fileOf, safeHref, setPreviewMode, type DropAt, type LabData, type LabFile } from "./render";
import { MediaLibrary, MediaPopover, Preview } from "./Library";
import { Control, ICON, INPUT, IconButton, More, Section as Group, TypeIcon } from "./Inspector";

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
          className="grid cursor-grab justify-items-center gap-0.5 rounded-md bg-surface px-1 pb-1 pt-1.5 text-muted hover:bg-border hover:text-foreground [&_svg]:h-4 [&_svg]:w-6">
          <TypeIcon kind={t} /><span className="text-[11px] leading-tight">{BLOCK_DEFS[t].name}</span>
        </button>
      ))}
    </div>
  );
}

/** Delete: a quiet text action at the bottom of the panel, not a big red box. */
const danger = "flex h-7 items-center gap-1.5 rounded-md px-2 -mx-2 text-xs text-danger hover:bg-danger/10";

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

  /** May this role change this option: an editor — the content (EDITOR_KEYS), a designer — everything. */
  const can = (key: string) => designer || EDITOR_KEYS.has(key);
  /** One setting of a block, or nothing when the role may not change it. */
  const ctl = (b: Block, key: string): ReactNode => {
    const o = optsFor(b).find((x) => x.key === key);
    return o && can(key) ? <Control block={b.type} opt={o} value={b.o[key]} onPick={(v) => setOpt(b.id, key, v)} /> : null;
  };
  const sctl = (i: number, s: Section, key: string): ReactNode => {
    const o = SECTION_OPTS.find((x) => x.key === key);
    return o && designer ? <Control block="section" opt={o} value={(s as unknown as Record<string, string>)[key]} onPick={(v) => setSectionOpt(i, key, v)} /> : null;
  };
  /**
   * A group of the panel: one subject (everything about a picture in «Картинка»), its fine-tuning folded under «Ещё» right
   * in it. A group with nothing the role may change is not shown at all.
   */
  const group = (title: string, main: ReactNode[], more: ReactNode[] = [], aside?: ReactNode): ReactNode => {
    const m = main.filter(Boolean), x = more.filter(Boolean);
    if (!m.length && !x.length) return null;
    return (
      <Group key={title} title={title} aside={aside}>
        {m.map((n, k) => <Fragment key={k}>{n}</Fragment>)}
        {x.length > 0 && <More count={x.length}>{x.map((n, k) => <Fragment key={k}>{n}</Fragment>)}</More>}
      </Group>
    );
  };
  /** A named piece inside a group (a file, a description, a focal point). */
  const field = (label: string, children: ReactNode) => <div className="grid gap-1.5 pt-1"><div className="text-xs text-muted">{label}</div>{children}</div>;

  /** Quick actions of the selected thing (move, copy): an editor has them only for sections. */
  const actionsOf = (): ReactNode => {
    if (!here) return null;
    const b = here.kind === "block" ? blockOf(here.id) : null;
    if (here.kind === "section") {
      const i = here.s;
      return (<>
        <IconButton label="Выше" disabled={i === 0} onClick={() => moveSection(i, -1)}>{ICON.up}</IconButton>
        <IconButton label="Ниже" disabled={i === sections.length - 1} onClick={() => moveSection(i, 1)}>{ICON.down}</IconButton>
        <IconButton label="Копия секции" onClick={() => addSection(sections[i])}>{ICON.copy}</IconButton>
      </>);
    }
    if (here.kind === "block" && designer && b)
      return (<>
        <IconButton label="Выше" onClick={() => moveBlock(b.id, -1)}>{ICON.up}</IconButton>
        <IconButton label="Ниже" onClick={() => moveBlock(b.id, 1)}>{ICON.down}</IconButton>
        <IconButton label="Копия блока" onClick={() => copyBlock(b.id)}>{ICON.copy}</IconButton>
      </>);
    if (here.kind === "tab" && designer) {
      const n = ((blockOf(here.id)?.d.tabs as Tab[]) ?? []).length;
      return (<>
        <IconButton label="Левее" disabled={here.t === 0} onClick={() => { editTabs(here.id, (x) => { [x[here.t - 1], x[here.t]] = [x[here.t], x[here.t - 1]]; }); pick(tabKey(here.id, here.t - 1)); }}>{ICON.left}</IconButton>
        <IconButton label="Правее" disabled={here.t === n - 1} onClick={() => { editTabs(here.id, (x) => { [x[here.t + 1], x[here.t]] = [x[here.t], x[here.t + 1]]; }); pick(tabKey(here.id, here.t + 1)); }}>{ICON.right}</IconButton>
      </>);
    }
    return null;
  };

  /** The panel's header, one line: the way up, what is selected, quick actions. */
  const head = (actions: ReactNode): ReactNode => {
    if (!here) return null;
    const b = here.kind === "block" ? blockOf(here.id) : null;
    const kind: Kind = here.kind === "block" ? (b?.type ?? "text") : here.kind;
    const name = here.kind === "section" ? sections[here.s]?.name || `Секция ${here.s + 1}` : here.kind === "tab" ? `Вкладка ${here.label}` : here.label;
    const parent = chain.length > 1 ? chain[chain.length - 2].label : "Страница";
    return (
      <div className="sticky top-0 z-10 flex items-center gap-2 border-b border-border bg-background px-3 py-2.5">
        <IconButton label={`На уровень выше: ${parent} (Esc)`} onClick={up}>{ICON.parent}</IconButton>
        <TypeIcon kind={kind} className="h-7 w-7 flex-none rounded-md bg-surface text-foreground" />
        <div className="min-w-0 flex-1 truncate text-sm font-semibold">{name}</div>
        <div className="flex">{actions}</div>
      </div>
    );
  };

  /** Open the quick picker beside the settings panel, level with the control that was clicked. */
  const openPick = (el: HTMLElement, kinds: LabFile["kind"][], current: string | undefined, onPick: (f: LabFile) => void) => {
    const panel = el.closest("aside")?.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    setPop({ anchor: new DOMRect(panel?.left ?? r.left, r.top, r.width, r.height), kinds, current, onPick });
  };

  /** A file in a slot: its preview, name and size; «Заменить» opens the quick picker for that slot. */
  function FileCard({ src, want, onPick }: { src: unknown; want?: LabFile["kind"]; onPick: (f: LabFile) => void }) {
    const f = fileOf(data, src) ?? (typeof src === "number" ? data.library.find((x) => x.url === data.images[src % Math.max(1, data.images.length)]?.url) ?? null : null);
    return (
      <div className="flex min-w-0 items-center gap-2.5">
        <div className="h-9 w-12 flex-none overflow-hidden rounded bg-surface">{f ? <Preview f={f} /> : null}</div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-xs">{f?.filename ?? "Не выбран"}</div>
          {f && <div className="truncate text-[11px] text-muted">{f.width ? `${f.width}×${f.height} · ` : ""}{f.kind === "document" && f.pages ? `${f.pages} стр. · ` : ""}{f.size > 1024 * 1024 ? `${(f.size / 1024 / 1024).toFixed(1)} МБ` : `${Math.max(1, Math.round(f.size / 1024))} КБ`}</div>}
        </div>
        <button type="button" onClick={(e) => openPick(e.currentTarget, want ? [want] : ["image", "video", "document"], f?.url, onPick)} className="h-7 flex-none rounded-md bg-surface px-2 text-xs hover:bg-border">Заменить</button>
      </div>
    );
  }

  /* -- the media block: everything about the file in its own group -- */

  /** The file — its kind decides the group; a video can come from YouTube / Vimeo instead. */
  const fileField = (b: Block): ReactNode => (
    <>
      <FileCard src={b.d.src} onPick={(f) => {
        if (f.kind === "other") return;
        update((d) => { const l = locate(d, b.id); if (!l) return; const x = l.list[l.i]; x.o = { ...x.o, kind: f.kind, ...(f.kind === "video" && x.o.kind !== "video" ? { mode: "ambient" } : {}) }; x.d = { ...x.d, src: f.url, alt: undefined, title: undefined, poster: undefined, focal: "50% 50%" }; });
      }} />
      {b.o.kind === "video" && (
        <>
          <input aria-label="Или видео по ссылке YouTube / Vimeo" value={String(b.d.embed ?? "")} placeholder="или ссылка YouTube / Vimeo"
            onChange={(e) => { const v = e.target.value; onData(b.id, { embed: v || undefined }); }}
            className={`${INPUT} ${b.d.embed && !embedOf(String(b.d.embed), false) ? "border-danger" : ""}`} />
          {!!b.d.embed && !embedOf(String(b.d.embed), false) && <p className="text-[11px] text-danger">Это не ссылка на YouTube или Vimeo.</p>}
        </>
      )}
    </>
  );

  /** A picture's description: without it a picture says nothing to a screen reader or a search engine. */
  const altField = (b: Block): ReactNode => {
    const f = fileOf(data, b.d.src);
    const d = b.d as { alt?: string; decorative?: boolean };
    const alt = d.alt ?? f?.alt ?? "";
    const missing = !d.decorative && !alt.trim();
    return field("Описание", <>
      <textarea aria-label="Описание картинки" rows={2} disabled={!!d.decorative} value={d.decorative ? "" : alt} onChange={(e) => onData(b.id, { alt: e.target.value })}
        placeholder="Что на картинке" className={`${INPUT} h-auto py-1.5 disabled:opacity-40 ${missing ? "border-danger" : ""}`} />
      {missing && <p className="text-[11px] text-danger">Опишите картинку или отметьте декоративной.</p>}
      <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={!!d.decorative} onChange={(e) => onData(b.id, { decorative: e.target.checked })} /> Декоративная (узор, фон)</label>
    </>);
  };

  /** What a click on the picture does (in «Картинка»): nothing, a link, or zoom — one of the three. */
  const clickRows = (b: Block): ReactNode => {
    const d = b.d as { href?: string; newTab?: boolean };
    const c = clickOf(b);
    return (<>
      <Control block="media" opt={CLICK} value={c} onPick={(v) => update((x) => { const l = locate(x, b.id); if (l) l.list[l.i].o = { ...l.list[l.i].o, click: v, zoom: v === "zoom" ? "on" : "off" }; })} />
      {c === "link" && <>
        <input aria-label="Куда ведёт картинка" value={d.href ?? ""} onChange={(e) => onData(b.id, { href: e.target.value || undefined })} placeholder="/us/therapies или https://…" className={`${INPUT} ${d.href && !safeHref(d.href) ? "border-danger" : ""}`} />
        {!!d.href && !safeHref(d.href) && <p className="text-[11px] text-danger">Нужен адрес на сайте (/…) или https://….</p>}
        <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={!!d.newTab} onChange={(e) => onData(b.id, { newTab: e.target.checked })} /> В новой вкладке</label>
      </>}
    </>);
  };

  /** Where the crop keeps the subject: a click on the main thing in the picture. */
  const focalField = (b: Block): ReactNode => {
    const f = fileOf(data, b.d.src);
    if (!f || b.o.fit === "contain" || b.o.ratio === "natural") return null;
    const [fx, fy] = (String(b.d.focal ?? "50% 50%")).split(" ").map((x) => parseFloat(x));
    return field("Точка фокуса — что остаётся при обрезке",
      <button type="button" aria-label="Поставить точку фокуса" className="relative overflow-hidden rounded-md bg-surface"
        onClick={(e) => { const r = e.currentTarget.getBoundingClientRect(); onData(b.id, { focal: `${Math.round(((e.clientX - r.left) / r.width) * 100)}% ${Math.round(((e.clientY - r.top) / r.height) * 100)}%` }); }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={asset(f.url)} alt="" className="block w-full" />
        <span aria-hidden className="absolute h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-background bg-foreground/40 shadow" style={{ left: `${fx}%`, top: `${fy}%` }} />
      </button>);
  };

  /** Another crop for screens up to 767 px; without it the phone shows the main picture. */
  const phoneField = (b: Block): ReactNode => {
    const m = (b.d as { srcMobile?: string }).srcMobile;
    return field("Для телефона", <>
      <FileCard src={m} want="image" onPick={(x) => onData(b.id, { srcMobile: x.url })} />
      {m && <button type="button" className="justify-self-start text-xs underline" onClick={() => onData(b.id, { srcMobile: undefined })}>Убрать — показывать основную</button>}
    </>);
  };

  /** A video's poster: its own picture or the video's frame. */
  const posterField = (b: Block): ReactNode => {
    if (b.d.embed) return null;
    const d = b.d as { poster?: string };
    const poster = d.poster ?? fileOf(data, b.d.src)?.poster ?? null;
    const pf = poster ? data.library.find((x) => x.url === poster) ?? null : null;
    return field("Обложка", <>
      <div className="flex items-center gap-3">
        <div className="h-9 w-12 flex-none overflow-hidden rounded bg-surface">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {poster ? (pf ? <Preview f={pf} /> : <img src={asset(poster)} alt="" className="h-full w-full object-cover" />) : null}
        </div>
        <div className="min-w-0 flex-1 text-xs text-muted">{d.poster ? "своя картинка" : poster ? "кадр из видео" : "нет"}</div>
        <button type="button" onClick={(e) => openPick(e.currentTarget, ["image"], d.poster, (x) => onData(b.id, { poster: x.url }))} className="h-7 flex-none rounded-md bg-surface px-2 text-xs hover:bg-border">Выбрать</button>
      </div>
      {d.poster && <button type="button" className="justify-self-start text-xs underline" onClick={() => onData(b.id, { poster: undefined })}>Вернуть кадр из видео</button>}
    </>);
  };

  /** Subtitles of a video file: a WebVTT file per language (the first is on by default). */
  const subtitlesField = (b: Block): ReactNode => {
    if (b.d.embed) return null;
    const tracks = (b.d.tracks as { src: string; lang: string }[] | undefined) ?? [];
    const bad = !!track.src && (!/\.vtt(\?|$)/i.test(track.src) || !safeHref(track.src));
    return field("Субтитры (.vtt)", <>
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
        <select aria-label="Язык субтитров" value={track.lang} onChange={(e) => setTrack((t) => ({ ...t, lang: e.target.value }))} className={`${INPUT} w-auto px-1`}>
          {Object.entries(LANGS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <input aria-label="Адрес файла .vtt" value={track.src} onChange={(e) => setTrack((t) => ({ ...t, src: e.target.value }))} placeholder="/uploads/…/clip.en.vtt" className={`${INPUT} flex-1 ${bad ? "border-danger" : ""}`} />
        <button type="button" disabled={!track.src || bad} onClick={() => { onData(b.id, { tracks: [...tracks, { src: track.src.trim(), lang: track.lang }] }); setTrack((t) => ({ ...t, src: "" })); }} className="h-7 rounded-md bg-foreground px-2.5 text-xs text-background disabled:opacity-40">+</button>
      </div>
      {bad && <p className="text-[11px] text-danger">Нужен файл .vtt: /… или https://….</p>}
    </>);
  };

  /** The block's groups, one per subject; for an editor only what is content. */
  const blockGroups = (b: Block): ReactNode[] => {
    switch (b.type) {
      case "heading": return [group("Заголовок", [ctl(b, "level"), ctl(b, "align"), ctl(b, "eyebrow")], [ctl(b, "rule")])];
      case "text": return [group("Текст", [ctl(b, "size"), ctl(b, "align")], [ctl(b, "cols")])];
      case "buttons": return [group("Кнопки", [ctl(b, "count"), ctl(b, "style"), ctl(b, "align")])];
      case "numbers": return [group("Цифры", [ctl(b, "count"), ctl(b, "style"), ctl(b, "align")])];
      case "facts": return [group("Факты", [ctl(b, "rows")], [ctl(b, "layout")])];
      case "list": return [group("Список", [ctl(b, "source"), ctl(b, "view"), ctl(b, "count")])];
      case "quote": return [group("Цитата", [ctl(b, "size"), ctl(b, "photo"), b.o.photo === "on" && field("Фото", <FileCard src={b.d.src} want="image" onPick={(f) => onData(b.id, { src: f.url })} />)])];
      case "cards": {
        const pics = (b.o.style === "image" || b.o.style === "link") && field("Картинки — клик, чтобы заменить",
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
          </div>);
        return [group("Карточки", [ctl(b, "count"), ctl(b, "style"), pics], [ctl(b, "frame")])];
      }
      case "tabs":
        return [group("Вкладки", [designer && <Inside items={(b.d.tabs as Tab[]).map((t, k) => ({ key: tabKey(b.id, k), label: t.label, kind: "tab" as Kind }))} onOpen={pick} />], [ctl(b, "style")],
          designer ? <button type="button" className="text-xs underline" onClick={() => editTabs(b.id, (x) => { x.push({ label: "New tab", blocks: [] }); })}>+ Вкладка</button> : undefined)];
      case "media":
        if (b.o.kind === "video")
          // a video plays silently in a loop; «with sound» is the rare case — last of all
          return [group("Видео", [fileField(b), ctl(b, "ratio"), ctl(b, "play")], [ctl(b, "fit"), ctl(b, "caption"), posterField(b), subtitlesField(b), ctl(b, "mode")])];
        if (b.o.kind === "document") return [group("Документ", [fileField(b), ctl(b, "show")], [ctl(b, "caption")])];
        return [group("Картинка", [fileField(b), altField(b), ctl(b, "ratio"), ctl(b, "caption"), clickRows(b)], [ctl(b, "fit"), focalField(b), phoneField(b)])];
    }
  };

  /**
   * A section's background in one group: colour swatches and «Фото / видео» (its swatch shows the file and opens the
   * quick picker), the file, the overlay; how the file fills the band and the video's Play / Pause folded under «Ещё».
   * An editor only replaces the file of a photo or video background.
   */
  const background = (i: number, s: Section): ReactNode => {
    const file = s.bg === "image" ? fileOf(data, s.bgSrc) ?? data.library.find((x) => x.url === data.images[0]?.url) ?? null : null;
    const setBg = (patch: Partial<Section>) => update((d) => { Object.assign(d[i], patch); });
    const pickMedia = (el: HTMLElement) => openPick(el, ["image", "video"], file?.url, (f) => (f.kind === "image" || f.kind === "video") && setBg({ bg: "image", bgSrc: f.url, ...(f.kind === "video" && s.bgFit === "tile" ? { bgFit: "cover" } : {}) }));
    const video = file?.kind === "video";
    const overlay: Opt = { key: "bgOverlay", label: "Затемнение", values: [{ id: "none", label: "Нет" }, { id: "light", label: "Лёгкое" }, { id: "medium", label: "Среднее" }, { id: "strong", label: "Сильное" }] };
    const fit: Opt = { key: "bgFit", label: "Заполнение", values: video ? [{ id: "cover", label: "Заполнить" }, { id: "contain", label: "Целиком" }] : [{ id: "cover", label: "Заполнить" }, { id: "contain", label: "Целиком" }, { id: "tile", label: "Плиткой" }] };
    const playOpt: Opt = { key: "bgPlay", label: "Кнопка Play / Пауза", values: [{ id: "on", label: "Есть" }, { id: "off", label: "Нет" }] };
    const sw = "relative h-6 w-6 overflow-hidden rounded-full border border-border";
    const on = "ring-2 ring-foreground ring-offset-1 ring-offset-background";
    const swatches = designer && (
      <div className="flex flex-wrap items-center gap-2.5" role="group" aria-label="Фон">
        {([["white", "Белый", "bg-background"], ["grey", "Серый", "bg-surface"], ["dark", "Тёмный", "bg-inverse"]] as const).map(([id, label, cls]) => (
          <button key={id} type="button" aria-label={label} title={label} aria-pressed={s.bg === id} onClick={() => setBg({ bg: id })} className={`${sw} ${cls} ${s.bg === id ? on : ""}`} />
        ))}
        <button type="button" aria-label="Фото / видео" title="Фото или видео из медиатеки" aria-pressed={s.bg === "image"} onClick={(e) => pickMedia(e.currentTarget)} className={`${sw} bg-surface ${s.bg === "image" ? on : ""}`}>
          {s.bg === "image" && file ? <Preview f={file} /> : <svg viewBox="0 0 32 32" className="absolute inset-0 h-full w-full text-muted" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden><path d="M8 21l5-5 4 4 3-3 4 4" /><circle cx="20" cy="12" r="2" /></svg>}
        </button>
      </div>
    );
    const img = s.bg === "image";
    return group("Фон", [
      swatches,
      img && <button type="button" onClick={(e) => pickMedia(e.currentTarget)} className="flex min-w-0 items-center gap-2 rounded-md text-left text-xs text-muted hover:text-foreground">
        <span className="min-w-0 truncate">{file ? `${video ? "Видео" : "Картинка"}: ${file.filename}` : "Выберите файл"}</span><span className="flex-none underline">заменить</span>
      </button>,
      img && designer && <Control block="section" opt={overlay} value={s.bgOverlay ?? "medium"} onPick={(v) => setBg({ bgOverlay: v })} />,
    ], img && designer ? [
      <Control key="fit" block="section" opt={fit} value={s.bgFit ?? "cover"} onPick={(v) => setBg({ bgFit: v })} />,
      video && <Control key="play" block="section" opt={playOpt} value={s.bgPlay === false ? "off" : "on"} onPick={(v) => setBg({ bgPlay: v === "on" })} />,
    ] : []);
  };

  /** What the panel holds for the selected thing; empty — the panel is folded away. */
  const panel = (): ReactNode[] => {
    if (!here) return [];
    if (here.kind === "section") {
      const i = here.s;
      const s = sections[i];
      if (!s) return [];
      const hidden = s.cols.map((_, k) => k).filter((k) => k >= colCount(s.layout));
      return [
        background(i, s),
        group("Раскладка", [sctl(i, s, "layout"), sctl(i, s, "space"),
          designer && hidden.length > 0 && <p className="text-xs text-muted">{hidden.map((k) => `Колонка ${k + 1}`).join(", ")} скрыта — блоки сохранены. <button type="button" className="underline" onClick={() => pick(colKey(s.id, hidden[0]))}>Открыть</button></p>,
        ], [sctl(i, s, "valign")]),
        designer && s.cols.length === 1 && group("Добавить блок", [<AddBlock key="add" onAdd={(t) => addBlock((d) => d[i].cols[0], t)} />]),
        designer && group("Сохранить как готовую", [
          // not a <form>: the demo build catches every form submit (DemoShell)
          <div key="save" className="flex gap-1.5">
            <input id="lab-ready-name" aria-label="Название готовой секции" value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && saveReady(s)} placeholder="Название" className={`${INPUT} flex-1`} />
            <button type="button" className="h-7 rounded-md bg-foreground px-2.5 text-xs text-background disabled:opacity-40" disabled={!name.trim()} onClick={() => saveReady(s)}>Сохранить</button>
          </div>,
        ]),
        <div key="del" className="border-t border-border px-4 py-3"><button type="button" className={danger} onClick={() => removeSection(i)}>Удалить секцию</button></div>,
      ].filter(Boolean);
    }
    if (here.kind === "column") {
      if (!designer) return [];
      const sec = sections[here.s];
      const hidden = !!sec && here.c >= colCount(sec.layout);
      return [
        hidden && <p key="hidden" className="mx-4 mb-1 mt-4 rounded-md bg-surface p-3 text-xs text-muted">Скрыта: в раскладке её нет. Выберите раскладку с {here.c + 1} колонками — встанет на место.</p>,
        group("Добавить блок", [<AddBlock key="add" onAdd={(t) => addBlock((d) => d[here.s].cols[here.c], t)} />]),
      ].filter(Boolean);
    }
    if (here.kind === "tab") {
      const all = (blockOf(here.id)?.d.tabs as Tab[] | undefined) ?? [];
      const t = all[here.t];
      if (!t) return [];
      return [
        group("Вкладка", [<input key={here.key} id="lab-tab-label" aria-label="Название вкладки" defaultValue={t.label} onBlur={(e) => e.target.value.trim() && e.target.value.trim() !== t.label && editTabs(here.id, (x) => { x[here.t].label = e.target.value.trim(); })} onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()} className={INPUT} />]),
        designer && group("Добавить блок", [<AddBlock key="add" nested onAdd={(type) => addBlock((d) => tabsOf(d, here.id)?.[here.t]?.blocks, type)} />]),
        designer && all.length > 1 && <div key="del" className="border-t border-border px-4 py-3"><button type="button" className={danger} onClick={() => { editTabs(here.id, (x) => { x.splice(here.t, 1); }); setTabs((m) => ({ ...m, [here.id]: 0 })); setSel(here.id); }}>Удалить вкладку</button></div>,
      ].filter(Boolean);
    }
    const b = blockOf(here.id);
    if (!b) return [];
    return [
      ...blockGroups(b),
      designer && <div key="del" className="border-t border-border px-4 py-3"><button type="button" className={danger} onClick={() => removeBlock(b.id)}>Удалить блок</button></div>,
    ].filter(Boolean);
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
  // the settings panel is there only when the selected thing has something to change; otherwise the page takes the width
  const actions = actionsOf();
  const body = panel();
  const open = !!here && (!!actions || body.length > 0);
  // the page changes width when the panel opens or folds: keep the selected thing in view
  useEffect(() => {
    if (sel) document.querySelector(`[data-lab="${CSS.escape(sel)}"]`)?.scrollIntoView({ block: "nearest" });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only on the panel opening or folding
  }, [open]);

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

      <div className={`grid min-h-0 flex-1 ${open ? "lg:grid-cols-[17rem_minmax(0,1fr)_18rem]" : "lg:grid-cols-[17rem_minmax(0,1fr)]"}`}>
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

        {open && (
          <aside className="min-h-0 overflow-auto border-l border-border" aria-label="Настройки">
            {head(actions)}
            {body}
          </aside>
        )}
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
