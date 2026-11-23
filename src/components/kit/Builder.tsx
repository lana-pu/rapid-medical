"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { withBase } from "@/lib/demo";
import { BLOCK_DEFS, READY, SECTION_OPTS, START, colCount, colKey, levels, newBlock, tabKey, uid, type Block, type BlockType, type Level, type Opt, type Section, type Tab } from "./model";
import { SectionView, type LabData } from "./render";

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
const caption = "text-xs font-semibold uppercase tracking-widest text-muted";

function Seg({ opt, value, onPick }: { opt: Opt; value: string; onPick: (v: string) => void }) {
  return (
    <div className="grid gap-1.5">
      <div className="text-xs text-muted">{opt.label}</div>
      <div className="flex flex-wrap gap-1" role="group" aria-label={opt.label}>
        {opt.values.map((v) => (
          <button key={v.id} type="button" aria-pressed={value === v.id} onClick={() => onPick(v.id)}
            className={`rounded border px-2 py-1 text-xs ${value === v.id ? "border-foreground bg-foreground text-background" : "border-border bg-background hover:border-foreground"}`}>{v.label}</button>
        ))}
      </div>
    </div>
  );
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return <div className="grid gap-3 border-t border-border pt-4"><div className={caption}>{title}</div>{children}</div>;
}

/** Children of the selected thing: click one to go down a level. */
function Inside({ items, onOpen }: { items: { key: string; label: string; hint?: string }[]; onOpen: (key: string) => void }) {
  if (!items.length) return <p className="text-sm text-muted">Пусто.</p>;
  return (
    <ul className="grid gap-1">
      {items.map((x) => (
        <li key={x.key}>
          <button type="button" onClick={() => onOpen(x.key)} className="flex w-full items-center justify-between gap-2 rounded border border-border px-3 py-2 text-left text-sm hover:border-foreground">
            <span>{x.label}{x.hint && <span className="block text-xs text-muted">{x.hint}</span>}</span><span aria-hidden className="text-muted">›</span>
          </button>
        </li>
      ))}
    </ul>
  );
}

function AddBlock({ onAdd, nested }: { onAdd: (t: BlockType) => void; nested?: boolean }) {
  const types = (Object.keys(BLOCK_DEFS) as BlockType[]).filter((t) => !nested || BLOCK_DEFS[t].nestable);
  return (
    <div className="grid grid-cols-2 gap-1">
      {types.map((t) => <button key={t} type="button" className={`${btn} text-left`} onClick={() => onAdd(t)} title={BLOCK_DEFS[t].hint}>+ {BLOCK_DEFS[t].name}</button>)}
    </div>
  );
}

const blockHint = (b: Block) => BLOCK_DEFS[b.type].opts.map((o) => o.values.find((v) => v.id === b.o[o.key])?.label).filter(Boolean).join(" · ");

export function Builder({ data }: { data: LabData }) {
  const [store, setStore] = useState<Store>(() => ({ sections: start(), custom: [] }));
  const [role, setRole] = useState<Role>("editor");
  const [sel, setSel] = useState<string | null>(null);
  const [tabs, setTabs] = useState<Record<string, number>>({});
  const [left, setLeft] = useState<"add" | "tree">("add");
  const [hover, setHover] = useState<string | null>(null);
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
  const update = (fn: (d: Section[]) => void) => setStore((st) => { const d = clone(st.sections); fn(d); return { ...st, sections: d }; });
  const onData = (id: string, patch: Record<string, unknown>) => update((d) => { const l = locate(d, id); if (l) l.list[l.i].d = { ...l.list[l.i].d, ...patch }; });
  const setOpt = (id: string, key: string, value: string) => update((d) => { const l = locate(d, id); if (l) l.list[l.i].o = { ...l.list[l.i].o, [key]: value }; });

  const addSection = (s: Section, nm?: string) => {
    const f = fresh(s, nm);
    const at = chain[0]?.kind === "section" ? chain[0].s + 1 : sections.length;
    update((d) => { d.splice(at, 0, f); });
    setSel(f.id);
  };
  const moveSection = (i: number, dir: -1 | 1) => { const j = i + dir; if (j < 0 || j >= sections.length) return; update((d) => { [d[i], d[j]] = [d[j], d[i]]; }); };
  const removeSection = (i: number) => { update((d) => { d.splice(i, 1); }); setSel(null); };
  const setSectionOpt = (i: number, key: string, value: string) => update((d) => {
    const s = d[i];
    if (key === "layout") {
      const n = colCount(value);
      const cols = s.cols.slice(0, n);
      if (s.cols.length > n) cols[n - 1] = [...cols[n - 1], ...s.cols.slice(n).flat()]; // nothing is lost: extra columns go into the last one
      while (cols.length < n) cols.push([]);
      s.cols = cols;
    }
    (s as unknown as Record<string, string>)[key] = value;
  });
  const addBlock = (into: (d: Section[]) => Block[] | null | undefined, type: BlockType) => { const b = newBlock(type); update((d) => { into(d)?.push(clone(b)); }); setSel(b.id); };
  const moveBlock = (id: string, dir: -1 | 1) => update((d) => { const l = locate(d, id); if (!l) return; const j = l.i + dir; if (j < 0 || j >= l.list.length) return; [l.list[l.i], l.list[j]] = [l.list[j], l.list[l.i]]; });
  const copyBlock = (id: string) => { const ids = Array.from({ length: 64 }, uid); let k = 0; update((d) => { const l = locate(d, id); if (l) l.list.splice(l.i + 1, 0, reid(clone(l.list[l.i]), () => ids[k++ % ids.length])); }); };
  const removeBlock = (id: string) => { update((d) => { const l = locate(d, id); if (l) l.list.splice(l.i, 1); }); up(); };
  const tabsOf = (d: Section[], id: string) => { const l = locate(d, id); return l ? (l.list[l.i].d.tabs as Tab[]) : null; };
  const editTabs = (id: string, fn: (t: Tab[]) => void) => update((d) => { const t = tabsOf(d, id); if (t) fn(t); });

  const saveReady = (s: Section) => {
    if (!name.trim()) return;
    const nm = name.trim();
    setStore((st) => ({ ...st, custom: [...st.custom, { key: uid(), name: nm, section: { ...clone(s), name: nm } }] }));
    setName("");
  };

  /* ---- what the panel shows for the selected thing ---- */
  const blockOf = (id: string) => { const l = locate(sections, id); return l ? l.list[l.i] : null; };
  const blocksItems = (list: Block[]) => list.map((b) => ({ key: b.id, label: BLOCK_DEFS[b.type].name, hint: blockHint(b) }));

  const panel = (): ReactNode => {
    if (!here)
      return (
        <div className="grid gap-4">
          <p className="text-sm text-muted">Кликните секцию или блок на странице — здесь появятся его настройки. Новую секцию добавьте слева.</p>
          <Group title="Секции"><Inside items={sections.map((s, i) => ({ key: s.id, label: `Секция ${i + 1}`, hint: s.name }))} onOpen={pick} /></Group>
        </div>
      );
    if (here.kind === "section") {
      const i = here.s;
      const s = sections[i];
      const opts = SECTION_OPTS.filter((o) => designer || o.key !== "layout");
      return (
        <div className="grid gap-4">
          {opts.map((o) => <Seg key={o.key} opt={o} value={(s as unknown as Record<string, string>)[o.key]} onPick={(v) => setSectionOpt(i, o.key, v)} />)}
          <Group title={s.cols.length > 1 ? "Колонки" : "Блоки"}>
            <Inside items={s.cols.length > 1 ? s.cols.map((c, k) => ({ key: colKey(s.id, k), label: `Колонка ${k + 1}`, hint: c.map((b) => BLOCK_DEFS[b.type].name).join(", ") || "пусто" })) : blocksItems(s.cols[0] ?? [])} onOpen={pick} />
            {designer && s.cols.length === 1 && <AddBlock onAdd={(t) => addBlock((d) => d[i].cols[0], t)} />}
          </Group>
          <Group title="Секция">
            <div className="flex flex-wrap gap-1">
              <button type="button" className={btn} disabled={i === 0} onClick={() => moveSection(i, -1)}>↑ Выше</button>
              <button type="button" className={btn} disabled={i === sections.length - 1} onClick={() => moveSection(i, 1)}>↓ Ниже</button>
              <button type="button" className={btn} onClick={() => addSection(s)}>Копия</button>
              <button type="button" className={btn} onClick={() => removeSection(i)}>Удалить</button>
            </div>
          </Group>
          {designer && (
            <Group title="Готовая секция">
              {/* not a <form>: the demo build catches every form submit (DemoShell) */}
              <label htmlFor="lab-ready-name" className="text-xs text-muted">Сохранить эту секцию как готовую: она появится слева у редактора.</label>
              <div className="flex gap-1">
                <input id="lab-ready-name" value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && saveReady(s)} placeholder="Например, «Три преимущества»" className="min-w-0 flex-1 rounded border border-border px-2 py-1 text-sm" />
                <button type="button" className={btn} disabled={!name.trim()} onClick={() => saveReady(s)}>Сохранить</button>
              </div>
            </Group>
          )}
        </div>
      );
    }
    if (here.kind === "column") {
      const col = sections[here.s].cols[here.c] ?? [];
      return (
        <div className="grid gap-4">
          <Inside items={blocksItems(col)} onOpen={pick} />
          {designer && <Group title="Добавить блок"><AddBlock onAdd={(t) => addBlock((d) => d[here.s].cols[here.c], t)} /></Group>}
        </div>
      );
    }
    if (here.kind === "tab") {
      const all = (blockOf(here.id)?.d.tabs as Tab[] | undefined) ?? [];
      const t = all[here.t];
      if (!t) return null;
      return (
        <div className="grid gap-4">
          <label className="grid gap-1.5 text-xs text-muted" htmlFor="lab-tab-label">Название вкладки
            <input id="lab-tab-label" defaultValue={t.label} key={here.key} onBlur={(e) => e.target.value.trim() && e.target.value.trim() !== t.label && editTabs(here.id, (x) => { x[here.t].label = e.target.value.trim(); })} onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()} className="rounded border border-border px-2 py-1 text-sm text-foreground" />
          </label>
          <Group title="Блоки во вкладке"><Inside items={blocksItems(t.blocks)} onOpen={pick} /></Group>
          {designer && <Group title="Добавить блок"><AddBlock nested onAdd={(type) => addBlock((d) => tabsOf(d, here.id)?.[here.t]?.blocks, type)} /></Group>}
          {designer && (
            <Group title="Вкладка">
              <div className="flex flex-wrap gap-1">
                <button type="button" className={btn} disabled={here.t === 0} onClick={() => { editTabs(here.id, (x) => { [x[here.t - 1], x[here.t]] = [x[here.t], x[here.t - 1]]; }); pick(tabKey(here.id, here.t - 1)); }}>← Левее</button>
                <button type="button" className={btn} disabled={here.t === all.length - 1} onClick={() => { editTabs(here.id, (x) => { [x[here.t + 1], x[here.t]] = [x[here.t], x[here.t + 1]]; }); pick(tabKey(here.id, here.t + 1)); }}>Правее →</button>
                <button type="button" className={btn} disabled={all.length < 2} onClick={() => { editTabs(here.id, (x) => { x.splice(here.t, 1); }); setTabs((m) => ({ ...m, [here.id]: 0 })); setSel(here.id); }}>Удалить вкладку</button>
              </div>
            </Group>
          )}
        </div>
      );
    }
    const b = blockOf(here.id);
    if (!b) return null;
    return (
      <div className="grid gap-4">
        {BLOCK_DEFS[b.type].opts.map((o) => <Seg key={o.key} opt={o} value={b.o[o.key]} onPick={(v) => setOpt(b.id, o.key, v)} />)}
        {(b.type === "media" || b.type === "quote") && (
          <Group title="Картинка">
            <div className="grid grid-cols-4 gap-1">
              {data.images.slice(0, 12).map((im, k) => (
                <button key={k} type="button" aria-label={im.alt || `Picture ${k + 1}`} aria-pressed={Number(b.d.src) === k} onClick={() => onData(b.id, { src: k })}
                  className={`aspect-square overflow-hidden rounded border-2 ${Number(b.d.src) === k ? "border-accent" : "border-transparent"}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={withBase(im.url)} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          </Group>
        )}
        {b.type === "tabs" && (
          <Group title="Вкладки">
            <Inside items={(b.d.tabs as Tab[]).map((t, k) => ({ key: tabKey(b.id, k), label: t.label, hint: t.blocks.map((x) => BLOCK_DEFS[x.type].name).join(", ") || "пусто" }))} onOpen={pick} />
            {designer && <button type="button" className={btn} onClick={() => editTabs(b.id, (x) => { x.push({ label: "New tab", blocks: [] }); })}>+ Вкладка</button>}
          </Group>
        )}
        {b.type !== "tabs" && b.type !== "list" && <p className="text-xs text-muted">Тексты правятся прямо на странице: клик по тексту, Enter — готово.</p>}
        {b.type === "list" && <p className="text-xs text-muted">Записи берутся из коллекции и правятся там; здесь — что показывать и как.</p>}
        {designer && (
          <Group title="Блок">
            <div className="flex flex-wrap gap-1">
              <button type="button" className={btn} onClick={() => moveBlock(b.id, -1)}>↑ Выше</button>
              <button type="button" className={btn} onClick={() => moveBlock(b.id, 1)}>↓ Ниже</button>
              <button type="button" className={btn} onClick={() => copyBlock(b.id)}>Копия</button>
              <button type="button" className={btn} onClick={() => removeBlock(b.id)}>Удалить</button>
            </div>
          </Group>
        )}
      </div>
    );
  };

  /* ---- the structure tree (Webflow's Navigator) ---- */
  const tree = (): ReactNode => {
    const row = (key: string, label: string, depth: number, kids?: ReactNode) => (
      <li key={key}>
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
          s.cols.length > 1 ? s.cols.map((c, k) => row(colKey(s.id, k), `Колонка ${k + 1}`, 1, blocks(c, 2))) : blocks(s.cols[0] ?? [], 1)))}
      </ul>
    );
  };

  const title = here ? (here.kind === "section" ? `Секция ${here.s + 1}` : here.kind === "tab" ? `Вкладка ${here.label}` : here.label) : "Страница";
  const sub = here?.kind === "section" ? sections[here.s]?.name : here?.kind === "block" ? BLOCK_DEFS[blockOf(here.id)?.type ?? "text"].hint : undefined;
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
                <p className="text-xs text-muted">Готовые секции. Клик — секция встаёт после выбранной.</p>
                <ul className="mt-3 grid gap-1" aria-label="Готовые секции">
                  {READY.map((r) => (
                    <li key={r.key}>
                      <button type="button" onClick={() => addSection(r.make(), r.name)} className="w-full rounded border border-border px-3 py-2 text-left hover:border-foreground">
                        <span className="block text-sm font-medium">{r.name}</span><span className="block text-xs text-muted">сейчас: {r.was}</span>
                      </button>
                    </li>
                  ))}
                  {store.custom.map((c) => (
                    <li key={c.key} className="flex gap-1">
                      <button type="button" onClick={() => addSection(c.section, c.name)} className="flex-1 rounded border border-accent px-3 py-2 text-left hover:border-foreground">
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
          <main className="min-h-0 flex-1 overflow-auto bg-surface p-4" onClick={() => setSel(null)} onMouseLeave={() => setHover(null)}>
            <div className="mx-auto max-w-[1280px] bg-background shadow-sm">
              {sections.map((s, i) => (
                <SectionView key={s.id} s={s} index={i} c={{ data, sel, trail, hover, onHover: setHover, onPick: pick, onData, activeTab: (id) => tabs[id] ?? 0 }} />
              ))}
              {!sections.length && <p className="p-16 text-center text-muted">Страница пуста. Добавьте готовую секцию слева.</p>}
            </div>
          </main>
        </div>

        <aside className="min-h-0 overflow-auto border-l border-border p-4" aria-label="Настройки">
          <div className="mb-4 flex items-start gap-2">
            {here && <button type="button" onClick={up} aria-label="На уровень выше" title="На уровень выше (Esc)" className={`${btn} mt-0.5`}>←</button>}
            <div className="min-w-0">
              <div className="text-lg font-semibold leading-tight">{title}</div>
              {sub && <div className="text-xs text-muted">{sub}</div>}
              {here && chain.length > 1 && <div className="mt-0.5 text-xs text-muted">в: {chain[chain.length - 2].label}</div>}
            </div>
          </div>
          {panel()}
        </aside>
      </div>
    </div>
  );
}
