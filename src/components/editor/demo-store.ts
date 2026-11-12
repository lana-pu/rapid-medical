"use client";

/**
 * Browser-only stand-in for src/admin/inline.ts, used by the static demo.
 * Edits live in localStorage; "publishing" just flips a flag. Nothing leaves
 * the visitor's browser.
 */
import type { PendingItem, InlineKind } from "@/admin/inline";
import { BASE, withBase } from "@/lib/demo";

const KEY = "rm-demo:v1";
const OFF = "rm-demo:editor-off";

type Entry = { value: string; kind: InlineKind; published: boolean; review?: string; at: string };
type Store = Record<string, Entry>; // "r#id.f" → entry

function load(): Store {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "{}") as Store;
  } catch {
    return {};
  }
}
function save(s: Store) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* private mode */
  }
}
const k = (t: { r: string; id: number; f: string }) => `${t.r}#${t.id}.${t.f}`;

export const demoEditorOff = () => {
  try {
    return localStorage.getItem(OFF) === "1";
  } catch {
    return false;
  }
};
export const setDemoEditorOff = (off: boolean) => {
  try {
    if (off) localStorage.setItem(OFF, "1");
    else localStorage.removeItem(OFF);
  } catch {
    /* ignore */
  }
};

/** Push stored values into the DOM (text, rich HTML, links, media). Call after hydration and after each save. */
export function applyDemoState() {
  const s = load();
  const entries = Object.entries(s);
  if (!entries.length) return;
  document.querySelectorAll<HTMLElement>("[data-e]").forEach((el) => {
    let tag: { r: string; id: number; f: string; k: string; fh?: string; fv?: string };
    try {
      tag = JSON.parse(el.getAttribute("data-e") || "");
    } catch {
      return;
    }
    const main = s[k(tag)];
    if (tag.k === "text" && main && !el.isContentEditable) el.innerText = main.value;
    else if (tag.k === "rich" && main) {
      const prose = el.querySelector<HTMLElement>(".prose-rm") ?? el;
      prose.innerHTML = main.value;
    } else if (tag.k === "link") {
      if (main) el.innerText = main.value;
      const href = tag.fh ? s[k({ ...tag, f: tag.fh })] : null;
      const a = el.closest("a");
      if (href && a) a.setAttribute("href", withBase(href.value));
    } else if (tag.k === "media") {
      const vid = tag.fv ? s[k({ ...tag, f: tag.fv })] : null;
      const img = main;
      const v = el.querySelector("video");
      const i = el.querySelector("img");
      if (vid && vid.value) {
        if (v) v.src = withBase(vid.value);
        else el.innerHTML = `<video class="w-full rounded" src="${withBase(vid.value)}" autoplay muted loop playsinline controls></video>`;
      } else if (vid && !vid.value && v && img?.value) {
        el.innerHTML = `<img class="w-full rounded" src="${withBase(img.value)}" alt="">`;
      } else if (img) {
        if (i) {
          i.removeAttribute("srcset");
          i.style.backgroundImage = "";
          i.src = img.value ? withBase(img.value) : "";
        } else if (!v && img.value) el.innerHTML = `<img class="w-full rounded" src="${withBase(img.value)}" alt="">`;
      }
    }
  });
}

export const demoApi = {
  async readField(t: { r: string; id: number; f: string }): Promise<{ value: unknown; label: string }> {
    const e = load()[k(t)];
    if (e) return { value: e.value, label: t.f };
    // fall back to what is on the page
    const el = Array.from(document.querySelectorAll<HTMLElement>("[data-e]")).find((x) => {
      try {
        const tag = JSON.parse(x.getAttribute("data-e") || "");
        return tag.r === t.r && tag.id === t.id && (tag.f === t.f || tag.fh === t.f);
      } catch {
        return false;
      }
    });
    if (!el) return { value: "", label: t.f };
    const tag = JSON.parse(el.getAttribute("data-e") || "{}");
    if (tag.fh === t.f) return { value: el.closest("a")?.getAttribute("href") ?? "", label: t.f };
    if (tag.k === "rich") return { value: (el.querySelector(".prose-rm") ?? el).innerHTML, label: t.f };
    return { value: el.innerText, label: t.f };
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async saveField(t: { r: string; id: number; f: string }, kind: InlineKind, raw: unknown, _base?: string): Promise<{ pending: boolean; version?: string; conflict?: string }> {
    const s = load();
    s[k(t)] = { value: raw == null ? "" : String(raw), kind, published: false, at: new Date().toISOString() };
    save(s);
    applyDemoState();
    return { pending: true };
  },
  async pendingFor(targets: { r: string; id: number }[]) {
    const s = load();
    const items: PendingItem[] = [];
    const seen = new Set<string>();
    for (const t of targets) {
      const key = `${t.r}#${t.id}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const mine = Object.entries(s).filter(([kk, e]) => kk.startsWith(key + ".") && !e.published);
      if (!mine.length) continue;
      const latest = mine.map(([, e]) => e).sort((a, b) => (a.at < b.at ? 1 : -1))[0];
      items.push({ r: t.r, id: t.id, label: `${t.r.replace("settings:", "page settings: ")}${t.id ? ` #${t.id}` : ""} — ${mine.length} field${mine.length > 1 ? "s" : ""}`, href: withBase(t.r.startsWith("settings:") ? `/admin/settings?group=${t.r.slice(9)}` : `/admin/${t.r}/${t.id}`), by: "you (demo)", at: latest.at, reviewStatus: latest.review ?? "editing", publishAt: null });
    }
    return { items, canPublishAll: true, requireApproval: false, user: { name: "Demo editor", role: "admin" } };
  },
  async publishTargets(targets: { r: string; id: number }[]) {
    const s = load();
    let n = demoPublishSections();
    for (const t of targets) for (const [kk, e] of Object.entries(s)) if (kk.startsWith(`${t.r}#${t.id}.`) && !e.published) { e.published = true; n++; }
    save(s);
    return { published: n, blocked: [] as string[] };
  },
  async discardTargets(targets: { r: string; id: number }[]) {
    const s = load();
    let n = demoDiscardSections();
    for (const t of targets) for (const kk of Object.keys(s)) if (kk.startsWith(`${t.r}#${t.id}.`) && !s[kk].published) { delete s[kk]; n++; }
    save(s);
    if (n) setTimeout(() => location.reload(), 300); // originals come back from the static page
    return n;
  },
  async submitTargetsForReview(targets: { r: string; id: number }[]) {
    const s = load();
    let n = 0;
    for (const t of targets) for (const [kk, e] of Object.entries(s)) if (kk.startsWith(`${t.r}#${t.id}.`) && !e.published) { e.review = "in_review"; n++; }
    save(s);
    return n;
  },
};

/* ------------------------------------------------------------------ */
/*  Page editor (sections) in the demo                                 */
/* ------------------------------------------------------------------ */

/*
 * No server: sections are moved, copied and removed in the page itself, new ones are copied from the style guide
 * (/style-guide has every block variant on sample content). The operations are kept per page in this browser and
 * replayed on load. Copies and new sections show sample content and are not editable in the demo; changing a
 * section's layout, History and region comparison need the server and are not offered.
 */

type PageApi = typeof import("@/admin/page-editor");
type Op = { op: "move"; id: string; dir: -1 | 1 } | { op: "remove"; id: string } | { op: "duplicate"; id: string; newId: string } | { op: "add"; at: number; type: string; variant: string; newId: string; name: string };
type SectionsState = { ops: Op[]; published: number };

const secKey = () => `rm-demo:sections:${location.pathname}`;
function loadSections(): SectionsState {
  try {
    return { ops: [], published: 0, ...(JSON.parse(localStorage.getItem(secKey()) || "{}") as Partial<SectionsState>) };
  } catch {
    return { ops: [], published: 0 };
  }
}
function saveSections(st: SectionsState) {
  try {
    localStorage.setItem(secKey(), JSON.stringify(st));
  } catch {
    /* private mode */
  }
}

type MarkInfo = { id: string; t?: string; v?: string; n?: string; p?: boolean };
const marks = () => Array.from(document.querySelectorAll<HTMLElement>("[data-rm-b]")).filter((m) => (JSON.parse(m.getAttribute("data-rm-b") || "{}") as MarkInfo).id !== "end");
const info = (m: Element) => JSON.parse(m.getAttribute("data-rm-b") || "{}") as MarkInfo;
const markOf = (id: string) => marks().find((m) => info(m).id === id) ?? null;
const endMark = () => Array.from(document.querySelectorAll<HTMLElement>("[data-rm-b]")).find((m) => info(m).id === "end") ?? null;

/** The DOM of one section: its own band when it is alone in it, else the mark and its siblings up to the next mark. */
function unitOf(mark: HTMLElement): Node[] {
  const host = endMark()?.parentElement;
  if (host && mark.parentElement !== host) {
    let a: HTMLElement | null = mark;
    while (a && a.parentElement !== host) a = a.parentElement;
    if (a && a.querySelectorAll("[data-rm-b]").length === 1) return [a];
  }
  const out: Node[] = [mark];
  // up to the next section: a mark, or an element that holds marks (a band of stacked sections)
  for (let n = mark.nextSibling; n && !(n instanceof HTMLElement && (n.hasAttribute("data-rm-b") || n.querySelector("[data-rm-b]"))); n = n.nextSibling) out.push(n);
  return out;
}
const insertBefore = (nodes: Node[], ref: Node) => nodes.forEach((n) => ref.parentNode?.insertBefore(n, ref));
const insertAfter = (nodes: Node[], ref: Node) => [...nodes].reverse().forEach((n) => ref.parentNode?.insertBefore(n, ref.nextSibling));

function setMark(el: HTMLElement, id: string, name: string, type: string, variant: string) {
  el.setAttribute("data-rm-b", JSON.stringify({ i: 0, id, t: type, v: variant, n: name, p: false }));
}

let presetDoc: Promise<Document> | null = null;
async function presetNodes(type: string, variant: string): Promise<Node[]> {
  presetDoc ??= fetch(withBase("/style-guide/")).then(async (r) => new DOMParser().parseFromString(await r.text(), "text/html"));
  const box = (await presetDoc).querySelector(`[data-rm-preset="${CSS.escape(`${type}:${variant}`)}"]`);
  if (!box) throw new Error("This section is not in the demo");
  return Array.from(box.childNodes).map((n) => document.importNode(n, true));
}

async function apply(op: Op): Promise<void> {
  if (op.op === "add") {
    const list = marks();
    const ref = list[op.at] ?? endMark();
    if (!ref) return;
    const mark = document.createElement("i");
    mark.hidden = true;
    setMark(mark, op.newId, op.name, op.type, op.variant);
    const nodes = [mark, ...(await presetNodes(op.type, op.variant))];
    const refUnit = list[op.at] ? unitOf(list[op.at]) : [ref];
    insertBefore(nodes, refUnit[0]);
    return;
  }
  const m = markOf(op.id);
  if (!m) return;
  const unit = unitOf(m);
  if (op.op === "remove") unit.forEach((n) => n.parentNode?.removeChild(n));
  else if (op.op === "duplicate") {
    const copy = unit.map((n) => n.cloneNode(true));
    const first = copy[0] as HTMLElement;
    const mk = first.hasAttribute?.("data-rm-b") ? first : (first.querySelector?.("[data-rm-b]") as HTMLElement | null);
    const src = info(m);
    if (mk) setMark(mk, op.newId, `${src.n ?? "Section"} (copy)`, src.t ?? "", src.v ?? "");
    copy.forEach((n) => n instanceof HTMLElement && [n, ...Array.from(n.querySelectorAll("[data-e]"))].forEach((e) => e.removeAttribute("data-e")));
    insertAfter(copy, unit[unit.length - 1]);
  } else if (op.op === "move") {
    const list = marks();
    const i = list.indexOf(m);
    const other = list[i + op.dir];
    if (!other) return;
    const ou = unitOf(other);
    if (op.dir < 0) insertBefore(unit, ou[0]);
    else insertAfter(unit, ou[ou.length - 1]);
  }
}

/** Replay this page's section changes (after load). */
export async function applyDemoSections(): Promise<void> {
  if (document.documentElement.dataset.rmSections === "applied") return;
  document.documentElement.dataset.rmSections = "applied";
  for (const op of loadSections().ops) await apply(op);
}

const sectionsNow = () =>
  marks().map((m) => {
    const x = info(m);
    return { id: x.id, type: x.t ?? "", name: x.n ?? "Section", variant: x.v ?? "", variants: [], pinned: !!x.p, fromRecords: false };
  });

const describe = (op: Op): string => {
  const name = op.op === "add" ? op.name : (info(markOf(op.id) ?? document.createElement("i")).n ?? "a section");
  return op.op === "add" ? `Added section ${op.name}` : op.op === "remove" ? "Removed a section" : op.op === "duplicate" ? `Copied ${name}` : `Moved ${name}`;
};

/** Browser-only stand-in for src/admin/page-editor.ts. */
export const demoPageApi: { [K in keyof PageApi]: (...args: Parameters<PageApi[K]>) => Promise<Awaited<ReturnType<PageApi[K]>>> } = {
  async pageInfo(ref) {
    const st = loadSections();
    const presets = JSON.parse(document.querySelector("[data-rm-page]")?.getAttribute("data-rm-presets") || "[]");
    return {
      ref,
      title: document.title.split(/\s[|–]\s/)[0],
      type: "Page",
      region: null,
      regions: [],
      status: st.ops.length > st.published ? "changed" : "live",
      changedBy: st.ops.length > st.published ? "you (demo)" : null,
      changedAt: null,
      version: "demo",
      livePath: location.pathname.replace(BASE, "") || "/",
      adminHref: withBase(`/admin/${ref.r}/${ref.id}`),
      sections: sectionsNow(),
      presets,
      canPublish: true,
      requireApproval: false,
      user: "Demo editor",
    };
  },
  async editBlocks(_ref, op) {
    const st = loadSections();
    const before = sectionsNow();
    let rec: Op;
    if (op.op === "set") {
      // undo: drop the last change and replay the rest
      st.ops.pop();
      st.published = Math.min(st.published, st.ops.length);
      saveSections(st);
      setTimeout(() => location.reload(), 300);
      return { version: "demo", sections: before, undo: [] };
    }
    if (op.op === "variant") return { error: "Changing the layout needs the server; not in the demo" };
    const target = "id" in op ? before.find((x) => x.id === op.id) : null;
    if (target?.pinned) return { error: "This section stays at the end of the page" };
    const newId = Math.random().toString(16).slice(2, 12);
    if (op.op === "add") {
      const p = (JSON.parse(document.querySelector("[data-rm-page]")?.getAttribute("data-rm-presets") || "[]") as { type: string; variant: string; name: string }[]).find((x) => x.type === op.type && x.variant === op.variant);
      rec = { op: "add", at: op.at, type: op.type, variant: op.variant, newId, name: p?.name ?? op.type };
    } else if (op.op === "duplicate") rec = { op: "duplicate", id: op.id, newId };
    else rec = op;
    try {
      await apply(rec);
    } catch (e) {
      return { error: (e as Error).message };
    }
    st.ops.push(rec);
    saveSections(st);
    return { version: "demo", sections: sectionsNow(), added: "newId" in rec ? rec.newId : undefined, undo: [] };
  },
  async pageChanges() {
    const st = loadSections();
    return { items: st.ops.slice(st.published).map(describe), by: null, at: null };
  },
  pageHistory: async () => ({ error: "History needs the server; not in the demo" }),
  restorePage: async () => ({ error: "History needs the server; not in the demo" }),
  compareWith: async () => ({ error: "Comparing regions needs the server; not in the demo" }),
  currentPageVersion: async () => ({ version: "demo" }),
  createPage: async () => ({ error: "New pages need the server; the demo has none" }),
};

/** Publish / discard in the demo also cover the page's sections. */
export function demoPublishSections(): number {
  const st = loadSections();
  const n = st.ops.length - st.published;
  st.published = st.ops.length;
  saveSections(st);
  return n;
}
export function demoDiscardSections(): number {
  const st = loadSections();
  const n = st.ops.length - st.published;
  st.ops = st.ops.slice(0, st.published);
  saveSections(st);
  return n;
}
