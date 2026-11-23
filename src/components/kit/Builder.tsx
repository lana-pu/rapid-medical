"use client";

import { useEffect, useMemo, useState } from "react";
import { withBase } from "@/lib/demo";
import { BLOCK_DEFS, READY, SECTION_OPTS, START, colCount, newBlock, uid, type Block, type BlockType, type Opt, type Section } from "./model";
import { SectionView, type LabData } from "./render";

/**
 * Blocks sandbox (/lab/blocks): try the proposed model on the site's own look before it goes into the editor.
 * Editor: adds ready sections, switches options, edits texts and pictures, moves and removes sections.
 * Designer: also changes a section's columns, puts blocks into columns and tabs, saves a section as a ready one.
 * Kept in this browser only (localStorage).
 */

type Role = "editor" | "designer";
type Custom = { key: string; name: string; section: Section };
type Store = { sections: Section[]; custom: Custom[] };
const KEY = "rm-lab:v1";

/** The starting page with ids by position: the server and the browser draw the same markup (no hydration mismatch). */
const start = (): Section[] => {
  let n = 0;
  const re = (b: Block): Block => ({ ...b, id: `b${n++}`, d: b.type === "tabs" ? { ...b.d, tabs: (b.d.tabs as { label: string; blocks: Block[] }[]).map((t) => ({ ...t, blocks: t.blocks.map(re) })) } : b.d });
  return START.map((k, i) => { const s = READY.find((r) => r.key === k)!.make(); return { ...s, id: `s${i}`, cols: s.cols.map((c) => c.map(re)) }; });
};
const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x));
/** New ids for every block (a ready section added twice must not share ids). */
function fresh(s: Section): Section {
  const re = (b: Block): Block => ({ ...b, id: uid(), d: b.type === "tabs" ? { ...b.d, tabs: (b.d.tabs as { label: string; blocks: Block[] }[]).map((t) => ({ ...t, blocks: t.blocks.map(re) })) } : b.d });
  return { ...clone(s), id: uid(), cols: clone(s.cols).map((c) => c.map(re)) };
}

/* ---- walking blocks (columns, then tabs inside) ---- */
type Loc = { list: Block[]; i: number; s: number };
function locate(sections: Section[], id: string): Loc | null {
  const inList = (list: Block[], s: number): Loc | null => {
    for (let i = 0; i < list.length; i++) {
      if (list[i].id === id) return { list, i, s };
      if (list[i].type === "tabs") for (const t of list[i].d.tabs as { blocks: Block[] }[]) { const r = inList(t.blocks, s); if (r) return r; }
    }
    return null;
  };
  for (let s = 0; s < sections.length; s++) for (const col of sections[s].cols) { const r = inList(col, s); if (r) return r; }
  return null;
}

function Seg({ opt, value, onPick, disabled, note }: { opt: Opt; value: string; onPick: (v: string) => void; disabled?: boolean; note?: string }) {
  return (
    <div className="grid gap-1.5">
      <div className="flex items-baseline justify-between text-xs text-muted"><span>{opt.label}</span>{disabled && note && <span>{note}</span>}</div>
      <div className="flex flex-wrap gap-1" role="group" aria-label={opt.label}>
        {opt.values.map((v) => (
          <button key={v.id} type="button" disabled={disabled} aria-pressed={value === v.id} onClick={() => onPick(v.id)}
            className={`rounded border px-2 py-1 text-xs disabled:cursor-not-allowed disabled:opacity-40 ${value === v.id ? "border-foreground bg-foreground text-background" : "border-border bg-background hover:border-foreground"}`}>
            {v.label}
          </button>
        ))}
      </div>
    </div>
  );
}

const small = "rounded border border-border bg-background px-2 py-1 text-xs hover:border-foreground disabled:cursor-not-allowed disabled:opacity-40";
const head = "text-xs font-semibold uppercase tracking-widest text-muted";

export function Builder({ data }: { data: LabData }) {
  const [store, setStore] = useState<Store>(() => ({ sections: start(), custom: [] }));
  const [role, setRole] = useState<Role>("editor");
  const [sel, setSel] = useState<{ s: number; block: string | null }>({ s: 0, block: null });
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
  const update = (fn: (draft: Section[]) => void) => setStore((st) => { const d = clone(st.sections); fn(d); return { ...st, sections: d }; });
  const onData = (id: string, patch: Record<string, unknown>) => update((d) => { const l = locate(d, id); if (l) l.list[l.i].d = { ...l.list[l.i].d, ...patch }; });
  const setOpt = (id: string, key: string, value: string) => update((d) => { const l = locate(d, id); if (l) l.list[l.i].o = { ...l.list[l.i].o, [key]: value }; });

  const cur = sections[sel.s];
  const block = useMemo(() => { if (!sel.block) return null; const l = locate(sections, sel.block); return l ? l.list[l.i] : null; }, [sections, sel.block]);

  // ids and positions are made outside the state updaters: React may run an updater twice
  const addSection = (s: Section) => { const f = fresh(s); const at = Math.min(sel.s + 1, sections.length); update((d) => { d.splice(at, 0, f); }); setSel({ s: at, block: null }); };
  const moveSection = (dir: -1 | 1) => { const i = sel.s, j = i + dir; if (j < 0 || j >= sections.length) return; update((d) => { [d[i], d[j]] = [d[j], d[i]]; }); setSel({ s: j, block: null }); };
  const removeSection = () => { const i = sel.s; update((d) => { d.splice(i, 1); }); setSel({ s: Math.max(0, i - 1), block: null }); };
  const setSectionOpt = (key: string, value: string) => update((d) => {
    const s = d[sel.s];
    if (key === "layout") {
      const n = colCount(value);
      const cols = s.cols.slice(0, n);
      if (s.cols.length > n) cols[n - 1] = [...cols[n - 1], ...s.cols.slice(n).flat()]; // nothing is lost: extra columns go into the last one
      while (cols.length < n) cols.push([]);
      s.cols = cols;
    }
    (s as unknown as Record<string, string>)[key] = value;
  });
  const addBlock = (list: (d: Section[]) => Block[] | null, type: BlockType) => { const b = newBlock(type); update((d) => { list(d)?.push(clone(b)); }); setSel((x) => ({ ...x, block: b.id })); };
  const moveBlock = (dir: -1 | 1) => { const id = sel.block; update((d) => { const l = id && locate(d, id); if (!l) return; const j = l.i + dir; if (j < 0 || j >= l.list.length) return; [l.list[l.i], l.list[j]] = [l.list[j], l.list[l.i]]; }); };
  const removeBlock = () => { const id = sel.block; update((d) => { const l = id && locate(d, id); if (l) l.list.splice(l.i, 1); }); setSel((x) => ({ ...x, block: null })); };

  const saveReady = () => {
    if (!cur || !name.trim()) return;
    setStore((st) => ({ ...st, custom: [...st.custom, { key: uid(), name: name.trim(), section: clone(cur) }] }));
    setName("");
  };
  const reset = () => { setStore({ sections: start(), custom: store.custom }); setSel({ s: 0, block: null }); };

  const BlockPicker = ({ onAdd, nested = false }: { onAdd: (t: BlockType) => void; nested?: boolean }) => (
    <select aria-label="Add a block" className={small} value="" onChange={(e) => e.target.value && onAdd(e.target.value as BlockType)}>
      <option value="">+ Блок…</option>
      {(Object.keys(BLOCK_DEFS) as BlockType[]).filter((t) => !nested || BLOCK_DEFS[t].nestable).map((t) => <option key={t} value={t}>{BLOCK_DEFS[t].name}</option>)}
    </select>
  );

  return (
    <div className="flex h-dvh flex-col bg-background text-foreground">
      <header className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-border bg-inverse px-4 py-2 text-sm text-inverse-foreground">
        <strong>Песочница блоков</strong>
        <span className="opacity-70">предложение, не редактор: правки остаются в этом браузере</span>
        <span className="flex-1" />
        <span role="group" aria-label="Роль" className="flex items-center gap-1">
          <span className="opacity-70">Как</span>
          {(["editor", "designer"] as Role[]).map((r) => (
            <button key={r} type="button" aria-pressed={role === r} onClick={() => setRole(r)} className={`rounded px-2 py-0.5 ${role === r ? "bg-inverse-foreground text-inverse" : "underline"}`}>
              {r === "editor" ? "Editor" : "Designer"}
            </button>
          ))}
        </span>
        <button type="button" onClick={reset} className="underline">Начать заново</button>
      </header>

      <div className="grid min-h-0 flex-1 lg:grid-cols-[17rem_minmax(0,1fr)_20rem]">
        {/* ready sections */}
        <aside className="min-h-0 overflow-auto border-r border-border p-4" aria-label="Добавить секцию">
          <div className={head}>Готовые секции</div>
          <p className="mt-1 text-xs text-muted">Клик — секция встаёт после выбранной.</p>
          <ul className="mt-3 grid gap-1">
            {READY.map((r) => (
              <li key={r.key}>
                <button type="button" onClick={() => addSection(r.make())} className="w-full rounded border border-border px-3 py-2 text-left hover:border-foreground">
                  <span className="block text-sm font-medium">{r.name}</span>
                  <span className="block text-xs text-muted">сейчас: {r.was}</span>
                </button>
              </li>
            ))}
            {store.custom.map((c) => (
              <li key={c.key} className="flex gap-1">
                <button type="button" onClick={() => addSection(c.section)} className="flex-1 rounded border border-accent px-3 py-2 text-left hover:border-foreground">
                  <span className="block text-sm font-medium">{c.name}</span>
                  <span className="block text-xs text-muted">собрана дизайнером</span>
                </button>
                {designer && <button type="button" aria-label={`Удалить ${c.name}`} className={small} onClick={() => setStore((st) => ({ ...st, custom: st.custom.filter((x) => x.key !== c.key) }))}>✕</button>}
              </li>
            ))}
          </ul>
          {designer && (
            <button type="button" className={`mt-3 w-full ${small}`} onClick={() => addSection({ id: uid(), bg: "white", layout: "1", valign: "top", space: "normal", cols: [[]] })}>+ Пустая секция</button>
          )}
        </aside>

        {/* the page */}
        <main className="min-h-0 overflow-auto bg-surface" onClick={() => setSel((x) => ({ ...x, block: null }))}>
          <div className="mx-auto max-w-[1280px] bg-background shadow-sm">
            {sections.map((s, i) => (
              <SectionView key={s.id} s={s} selected={sel.s === i} onSelect={() => setSel((x) => (x.s === i ? x : { s: i, block: null }))}
                c={{ data, selected: sel.block, onSelect: (id) => setSel({ s: i, block: id }), onData }} />
            ))}
            {!sections.length && <p className="p-16 text-center text-muted">Страница пуста. Добавьте готовую секцию слева.</p>}
          </div>
        </main>

        {/* settings */}
        <aside className="min-h-0 overflow-auto border-l border-border p-4" aria-label="Настройки">
          {block && (
            <div className="grid gap-4 border-b border-border pb-5">
              <div>
                <div className={head}>Блок</div>
                <div className="mt-1 text-lg font-semibold">{BLOCK_DEFS[block.type].name}</div>
                <div className="text-xs text-muted">{BLOCK_DEFS[block.type].hint}. Тексты правятся прямо на странице.</div>
              </div>
              {BLOCK_DEFS[block.type].opts.map((o) => <Seg key={o.key} opt={o} value={block.o[o.key]} onPick={(v) => setOpt(block.id, o.key, v)} />)}
              {(block.type === "media" || block.type === "quote") && (
                <div className="grid gap-1.5">
                  <div className="text-xs text-muted">Картинка из медиатеки</div>
                  <div className="grid grid-cols-4 gap-1">
                    {data.images.slice(0, 12).map((im, k) => (
                      <button key={k} type="button" aria-label={im.alt || `Picture ${k + 1}`} aria-pressed={Number(block.d.src) === k} onClick={() => onData(block.id, { src: k })}
                        className={`aspect-square overflow-hidden rounded border-2 ${Number(block.d.src) === k ? "border-accent" : "border-transparent"}`}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={withBase(im.url)} alt="" className="h-full w-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {block.type === "tabs" && (
                <div className="grid gap-2">
                  <div className="text-xs text-muted">Вкладки и блоки в них</div>
                  {(block.d.tabs as { label: string; blocks: Block[] }[]).map((t, k) => (
                    <div key={k} className="rounded border border-border p-2">
                      <div className="flex items-center justify-between text-sm font-medium">{t.label}
                        {designer && <button type="button" className={small} onClick={() => onData(block.id, { tabs: (block.d.tabs as unknown[]).filter((_, j) => j !== k) })}>✕</button>}
                      </div>
                      <ul className="mt-1 text-xs text-muted">{t.blocks.map((x) => <li key={x.id}><button type="button" className="underline" onClick={() => setSel((s) => ({ ...s, block: x.id }))}>{BLOCK_DEFS[x.type].name}</button></li>)}</ul>
                      {designer && <div className="mt-1"><BlockPicker nested onAdd={(type) => addBlock((d) => { const l = locate(d, block.id); return l ? (l.list[l.i].d.tabs as { blocks: Block[] }[])[k].blocks : null; }, type)} /></div>}
                    </div>
                  ))}
                  {designer && <button type="button" className={small} onClick={() => onData(block.id, { tabs: [...(block.d.tabs as unknown[]), { label: "New tab", blocks: [] }] })}>+ Вкладка</button>}
                </div>
              )}
              {designer ? (
                <div className="flex gap-1">
                  <button type="button" className={small} onClick={() => moveBlock(-1)}>↑</button>
                  <button type="button" className={small} onClick={() => moveBlock(1)}>↓</button>
                  <button type="button" className={small} onClick={removeBlock}>Удалить блок</button>
                </div>
              ) : <p className="text-xs text-muted">Двигать и удалять блоки внутри секции — дизайнер.</p>}
            </div>
          )}

          {cur && (
            <div className={`grid gap-4 ${block ? "pt-5" : ""}`}>
              <div>
                <div className={head}>Секция {sel.s + 1} из {sections.length}</div>
                <div className="text-xs text-muted">Клик по пустому месту секции — выбрать её.</div>
              </div>
              {SECTION_OPTS.map((o) => (
                <Seg key={o.key} opt={o} value={(cur as unknown as Record<string, string>)[o.key]} onPick={(v) => setSectionOpt(o.key, v)} disabled={o.key === "layout" && !designer} note="меняет дизайнер" />
              ))}
              <div className="grid gap-2">
                <div className="text-xs text-muted">Колонки и блоки</div>
                {cur.cols.map((col, ci) => (
                  <div key={ci} className="rounded border border-border p-2">
                    <div className="text-xs font-medium">Колонка {ci + 1}</div>
                    <ul className="mt-1 grid gap-0.5 text-sm">
                      {col.map((x) => (
                        <li key={x.id}>
                          <button type="button" onClick={() => setSel((s) => ({ ...s, block: x.id }))} className={`text-left ${sel.block === x.id ? "font-semibold text-accent" : "underline"}`}>{BLOCK_DEFS[x.type].name}</button>
                        </li>
                      ))}
                    </ul>
                    {designer && <div className="mt-1"><BlockPicker onAdd={(type) => addBlock((d) => d[sel.s].cols[ci], type)} /></div>}
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-1">
                <button type="button" className={small} disabled={sel.s === 0} onClick={() => moveSection(-1)}>↑ Выше</button>
                <button type="button" className={small} disabled={sel.s === sections.length - 1} onClick={() => moveSection(1)}>↓ Ниже</button>
                <button type="button" className={small} onClick={() => addSection(cur)}>Копия</button>
                <button type="button" className={small} onClick={removeSection}>Удалить секцию</button>
              </div>
              {designer && (
                // not a <form>: the demo build catches every form submit (DemoShell)
                <div className="grid gap-1.5 border-t border-border pt-4">
                  <label htmlFor="lab-ready-name" className="text-xs text-muted">Сохранить секцию как готовую (появится слева у редактора)</label>
                  <div className="flex gap-1">
                    <input id="lab-ready-name" value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && saveReady()} placeholder="Название, например «Три преимущества»" className="min-w-0 flex-1 rounded border border-border px-2 py-1 text-sm" />
                    <button type="button" className={small} disabled={!name.trim()} onClick={saveReady}>Сохранить</button>
                  </div>
                </div>
              )}
              {!designer && <p className="text-xs text-muted">Редактор переключает варианты блоков, фон и отступы секции, правит тексты и картинки, добавляет готовые секции. Раскладку и состав секции меняет дизайнер — переключите роль сверху.</p>}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
