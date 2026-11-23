"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { withBase } from "@/lib/demo";
import { BLOCK_DEFS, READY, SECTION_OPTS, START, colCount, colKey, levels, newBlock, tabKey, uid, type Block, type BlockType, type Level, type Section, type Tab } from "./model";
import { SectionView, drag, type DropAt, type LabData } from "./render";
import { ICON, IconButton, Options, Section as Group, TypeIcon } from "./Inspector";

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
    case "media": return optLabel(b, "kind");
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
  const [name, setName] = useState("");
  const [loaded, setLoaded] = useState(false);
  const designer = role === "designer";

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
      if (e.key !== "Escape") return;
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
          <Options block="section" opts={opts} values={s as unknown as Record<string, string>} onPick={(k, v) => setSectionOpt(i, k, v)} />
          <Group title={s.cols.length > 1 ? "Колонки" : "Внутри"}>
            <Inside items={s.cols.length > 1 ? s.cols.map((c, k) => {
              const hidden = k >= colCount(s.layout);
              const what = c.map((b) => BLOCK_DEFS[b.type].name).join(", ") || "пусто";
              return { key: colKey(s.id, k), label: `Колонка ${k + 1}`, hint: hidden ? `скрыта: в раскладке её нет · ${what}` : what, kind: "column" as Kind, muted: hidden };
            }) : kids(s.cols[0] ?? [])} onOpen={pick} />
          </Group>
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
        <Options block={b.type} opts={BLOCK_DEFS[b.type].opts} values={b.o} onPick={(k, v) => setOpt(b.id, k, v)} />
        {(b.type === "media" || b.type === "quote") && (
          <Group title="Картинка">
            <div className="grid grid-cols-4 gap-1.5">
              {data.images.slice(0, 12).map((im, k) => (
                <button key={k} type="button" aria-label={im.alt || `Picture ${k + 1}`} aria-pressed={Number(b.d.src) === k} onClick={() => onData(b.id, { src: k })}
                  className={`aspect-square overflow-hidden rounded-md ${Number(b.d.src) === k ? "ring-2 ring-foreground ring-offset-2 ring-offset-background" : "opacity-80 hover:opacity-100"}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={withBase(im.url)} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
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

  return (
    <div className="flex h-dvh flex-col bg-background text-foreground">
      <header className="flex flex-wrap items-center gap-x-6 gap-y-2 bg-inverse px-4 py-2 text-sm text-inverse-foreground">
        <strong>Песочница блоков</strong>
        <span className="opacity-70">предложение, не редактор: правки остаются в этом браузере</span>
        <span className="flex-1" />
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
            <div className="mx-auto max-w-[1280px] bg-background shadow-sm">
              {sections.map((s, i) => (
                <SectionView key={s.id} s={s} index={i} c={{ data, sel, trail, hover, onHover: setHover, onPick: pick, onData, activeTab: (id) => tabs[id] ?? 0, drop: dropAt, onDragAt: setDropAt, onDropHere: commitDrop, canDragBlocks: designer }} />
              ))}
              {!sections.length && <p className="p-16 text-center text-muted">Страница пуста. Добавьте готовую секцию слева.</p>}
            </div>
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
