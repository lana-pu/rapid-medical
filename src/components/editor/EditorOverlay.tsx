"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter, usePathname } from "next/navigation";
import * as live from "@/admin/inline";
import * as pageLive from "@/admin/page-editor";
import type { PendingItem, InlineKind } from "@/admin/inline";
import type { PageInfo, HistoryItem } from "@/admin/page-editor";
import type { BlockOp } from "@/blocks/ops";
import type { RegionDiff } from "@/blocks/diff";
import type { StoredBlock } from "@/db/schema";
import { MediaPicker } from "@/components/admin/MediaPicker";
import { DEMO, withBase } from "@/lib/demo";
import { demoApi, demoPageApi, applyDemoState, applyDemoSections, demoEditorOff, setDemoEditorOff } from "./demo-store";
import { BAR_H, buttons, Dialog, HistoryList, LinkForm, MediaActions, PresetList, PreviewBar, RichForm, SectionToolbar, SidePanel, TabsPanel, TopBar, statusText } from "./editor-ui";

/**
 * The page editor (docs/screens/on-page-editor.md, ADR-006/007), loaded only in editor mode.
 * - Fields: elements with `data-e` (text in place; rich text, links and media in the side panel).
 * - Sections: invisible marks `data-rm-b` before each stored block; the page record is in `data-rm-page`.
 * Static demo build: everything is kept in the visitor's browser (demo-store.ts).
 */
const api = DEMO ? demoApi : live;
const pageApi = DEMO ? demoPageApi : pageLive;

type Tag = { r: string; id: number; f: string; k: "text" | "rich" | "link" | "media"; fh?: string; fv?: string };
type Ref = { r: string; id: number };
type Box = { id: string; i: number; l: string; top: number; left: number; width: number; height: number };
type Undo = { kind: "field"; t: { r: string; id: number; f: string }; k: InlineKind; prev: string; label: string } | { kind: "blocks"; prev: StoredBlock[]; label: string };
type Panel =
  | { k: "rich"; tag: Tag; value: string; label: string }
  | { k: "link"; tag: Tag; label: string; href: string }
  | { k: "media"; tag: Tag; image: string; video: string }
  | { k: "add"; at: number; list: string }
  | { k: "history"; items: HistoryItem[] | null }
  | { k: "tabs"; id: string }
  | null;
type Modal = { k: "review"; items: string[]; others: string[]; confirmDiscard: boolean } | { k: "live"; path: string } | { k: "conflict"; message: string } | null;
type Legacy = { items: PendingItem[]; user: { name: string; role: string } };

const STYLE = (top: number, preview: boolean) =>
  preview
    ? `body{padding-top:${top - BAR_H}px}`
    : `
[data-e]{outline:1px dashed rgba(37,99,235,.55);outline-offset:3px;cursor:pointer;border-radius:2px;transition:outline-color .12s}
[data-e]:hover{outline:2px solid #2563eb;background:rgba(37,99,235,.06)}
[data-e][contenteditable]{outline:2px solid #f59e0b;background:#fff;color:#111;cursor:text;min-width:2ch;white-space:pre-wrap}
.rm-e-media{position:relative;display:block}
.rm-e-media:hover::after{content:"Change media";position:absolute;top:8px;left:8px;background:#2563eb;color:#fff;font:600 11px/1 system-ui;padding:6px 8px;border-radius:4px;pointer-events:none}
body{padding-top:${top}px}
`;

function parse(el: Element): Tag | null {
  try {
    return JSON.parse(el.getAttribute("data-e") || "") as Tag;
  } catch {
    return null;
  }
}

function readPageRef(): Ref | null {
  const el = document.querySelector("[data-rm-page]");
  if (!el) return null;
  try {
    return JSON.parse(el.getAttribute("data-rm-page") || "") as Ref;
  } catch {
    return null;
  }
}

/**
 * Each section spans from its mark to the next mark of its list (the marks are invisible; no wrappers around blocks).
 * Lists: "" — the page; inside Product details tabs `{block}/{tab}` and groups `{block}/{tab}/{j}` — a section in a tab
 * also ends where a group starts. Sections in a closed tab have no size and are left out.
 */
function measure(): Box[] {
  // document order (the static demo moves sections in the page)
  const marks = Array.from(document.querySelectorAll<HTMLElement>("[data-rm-b]")).map((el, k) => ({ el, l: "", ...(JSON.parse(el.getAttribute("data-rm-b") || "{}") as { id: string; l?: string }), i: k }));
  const out: Box[] = [];
  for (let k = 0; k < marks.length - 1; k++) {
    const m = marks[k];
    if (m.id === "end") continue;
    const end = marks.slice(k + 1).find((x) => x.l === m.l || (m.l !== "" && x.l.startsWith(`${m.l}/`)));
    if (!end) continue;
    const range = document.createRange();
    range.setStartAfter(m.el);
    range.setEndBefore(end.el);
    const r = range.getBoundingClientRect();
    if (m.l && r.width === 0 && r.height === 0) continue;
    out.push({ id: m.id, i: m.i, l: m.l, top: r.top + window.scrollY, left: r.left + window.scrollX, width: r.width, height: Math.max(r.height, 16) });
  }
  return out;
}

/** The innermost section under the pointer (a section inside a tab before its Product details block). */
function hitTest(boxes: Box[], x: number, y: number): Box | undefined {
  const slack = (b: Box) => (b.l ? 0 : 40);
  return boxes
    .filter((b) => y >= b.top && y <= b.top + b.height && x >= b.left - slack(b) && x <= b.left + b.width + slack(b))
    .sort((a, b) => a.width * a.height - b.width * b.height)[0];
}

export default function EditorOverlay() {
  const router = useRouter();
  const pathname = usePathname();
  const [refreshing, startRefresh] = useTransition();
  const [off, setOff] = useState(false);
  const [page, setPage] = useState<Ref | null>(null);
  const [info, setInfo] = useState<PageInfo | null>(null);
  const [legacy, setLegacy] = useState<Legacy | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [boxes, setBoxes] = useState<Box[]>([]);
  const [hovered, setHovered] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [panel, setPanel] = useState<Panel>(null);
  const [picker, setPicker] = useState<{ tag: Tag; kind: "image" | "video" } | null>(null);
  const [modal, setModal] = useState<Modal>(null);
  const [compare, setCompare] = useState<{ label: string; sections: RegionDiff[] } | null>(null);
  const [preview, setPreview] = useState(false);
  const [scroll, setScroll] = useState(0);
  const [undoCount, setUndoCount] = useState(0);
  const version = useRef("");
  const undo = useRef<Undo[]>([]);
  const editing = useRef<{ el: HTMLElement; tag: Tag; original: string } | null>(null);
  const selectAfter = useRef<string | null>(null);
  const boxesRef = useRef<Box[]>([]); // for event handlers
  useEffect(() => {
    boxesRef.current = boxes;
  }, [boxes]);
  const top = BAR_H + (DEMO ? 24 : 0);

  const say = useCallback((m: string, sticky = false) => {
    setMsg(m);
    if (!sticky) setTimeout(() => setMsg((t) => (t === m ? null : t)), 4000);
  }, []);

  const targetsOnPage = useCallback(() => {
    const out: Ref[] = [];
    document.querySelectorAll("[data-e]").forEach((el) => {
      const t = parse(el);
      if (t) out.push({ r: t.r, id: t.id });
    });
    const p = readPageRef();
    if (p) out.push(p);
    return out;
  }, []);

  const loadInfo = useCallback(async () => {
    const ref = readPageRef();
    setPage(ref);
    if (!ref) {
      setInfo(null);
      return;
    }
    const res = await pageApi.pageInfo(ref);
    if ("error" in res) return say(`Could not load the page: ${res.error}`, true);
    setInfo(res);
    version.current = res.version;
  }, [say]);

  const loadLegacy = useCallback(async () => {
    try {
      setLegacy(await api.pendingFor(targetsOnPage()));
    } catch (e) {
      say((e as Error).message);
    }
  }, [targetsOnPage, say]);

  const remeasure = useCallback(() => setBoxes(measure()), []);

  /* ---- load on every page ---- */
  useEffect(() => {
    const t = setTimeout(async () => {
      if (DEMO) {
        await applyDemoSections(); // this browser's section changes, replayed on the static page
        applyDemoState();
        setOff(demoEditorOff());
      }
      undo.current = [];
      setUndoCount(0);
      setSelected(null);
      setCompare(null);
      void loadInfo();
      void loadLegacy();
      remeasure();
    }, 50);
    return () => clearTimeout(t);
  }, [pathname, loadInfo, loadLegacy, remeasure]);

  /* ---- after a server refresh: new marks, maybe a section to select ---- */
  useEffect(() => {
    if (refreshing) return;
    const t = setTimeout(() => {
      if (DEMO) applyDemoState();
      const b = measure();
      setBoxes(b);
      const want = selectAfter.current;
      const box = want ? b.find((x) => x.id === want) : null;
      if (box) {
        selectAfter.current = null;
        setSelected(box.id);
        window.scrollTo({ top: Math.max(0, box.top - top - 80), behavior: "smooth" });
      }
    }, 30);
    return () => clearTimeout(t);
  }, [refreshing, top]);

  /* ---- geometry follows the page (images load, window resizes, scroll) ---- */
  useEffect(() => {
    const ro = new ResizeObserver(() => remeasure());
    ro.observe(document.body);
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setScroll(window.scrollY));
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    const onMove = (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest?.("#rm-editor-ui")) return;
      const x = e.pageX;
      const y = e.pageY;
      setHovered((cur) => {
        const hit = hitTest(boxesRef.current, x, y);
        return hit?.id ?? (cur && (e.target as HTMLElement).closest?.("[data-rm-plus]") ? cur : null);
      });
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => {
      ro.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("mousemove", onMove);
    };
  }, [remeasure]);

  const refresh = useCallback(() => {
    if (DEMO) {
      applyDemoState();
      remeasure();
    } else startRefresh(() => router.refresh());
  }, [router, remeasure]);

  const afterChange = useCallback(async () => {
    refresh();
    await Promise.all([loadInfo(), loadLegacy()]);
  }, [refresh, loadInfo, loadLegacy]);

  const pushUndo = (u: Undo) => {
    undo.current.push(u);
    if (undo.current.length > 50) undo.current.shift();
    setUndoCount(undo.current.length);
  };

  /* ---- saving a field ---- */
  const save = useCallback(
    async (tag: { r: string; id: number; f: string }, kind: InlineKind, value: unknown, prev?: { value: string; label: string }) => {
      setBusy(true);
      say("Saving…", true);
      try {
        const ref = readPageRef();
        const mine = ref && tag.r === ref.r && tag.id === ref.id;
        const res = await api.saveField(tag, kind, value, mine ? version.current : undefined);
        if ("conflict" in res && res.conflict) {
          setModal({ k: "conflict", message: res.conflict });
          setMsg(null);
          return false;
        }
        if (mine && "version" in res && res.version) version.current = res.version;
        if (prev) pushUndo({ kind: "field", t: tag, k: kind, prev: prev.value, label: prev.label });
        say(DEMO ? "Saved in this browser (demo)" : res.pending ? "Saved. Not live yet" : "Saved");
        await afterChange();
        return true;
      } catch (e) {
        say(`Not saved: ${(e as Error).message}`, true);
        return false;
      } finally {
        setBusy(false);
      }
    },
    [afterChange, say],
  );

  /* ---- section operations ---- */
  const runOp = useCallback(
    async (op: BlockOp, label: string, record = true) => {
      const ref = readPageRef();
      if (!ref) return;
      setBusy(true);
      say("Saving…", true);
      try {
        const res = await pageApi.editBlocks(ref, op, version.current);
        if ("error" in res) {
          if (res.conflict) setModal({ k: "conflict", message: res.error });
          else say(res.error, true);
          return;
        }
        version.current = res.version;
        if (record) pushUndo({ kind: "blocks", prev: res.undo, label });
        if (res.added) selectAfter.current = res.added;
        if (op.op === "remove" || ((op.op === "set" || op.op === "tab") && selected?.includes("/"))) setSelected(null);
        say(DEMO ? "Saved in this browser (demo)" : `${label}. Not live yet`);
        await afterChange();
      } finally {
        setBusy(false);
      }
    },
    [afterChange, say, selected],
  );

  const doUndo = useCallback(async () => {
    const u = undo.current.pop();
    setUndoCount(undo.current.length);
    if (!u) return;
    if (u.kind === "field") await save(u.t, u.k, u.prev);
    else await runOp({ op: "set", blocks: u.prev }, `Undone: ${u.label}`, false);
  }, [save, runOp]);

  /* ---- inline plain text ---- */
  const commitText = useCallback(async () => {
    const cur = editing.current;
    if (!cur) return;
    editing.current = null;
    const { el, tag, original } = cur;
    el.removeAttribute("contenteditable");
    const value = el.innerText;
    if (value === original) return;
    const ok = await save(tag, "text", value, { value: original, label: "text change" });
    if (!ok) el.innerText = original;
  }, [save]);

  const startText = useCallback(
    (el: HTMLElement, tag: Tag) => {
      if (editing.current?.el === el) return;
      editing.current = { el, tag, original: el.innerText };
      // plaintext-only keeps paste clean; older Firefox falls back to "true"
      el.setAttribute("contenteditable", "plaintext-only");
      if (!el.isContentEditable) el.setAttribute("contenteditable", "true");
      el.focus();
      const onKey = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          e.preventDefault();
          el.innerText = editing.current?.original ?? el.innerText;
          editing.current = null;
          el.removeAttribute("contenteditable");
          cleanup();
        } else if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          el.blur();
        }
      };
      const onBlur = () => {
        cleanup();
        void commitText();
      };
      const cleanup = () => {
        el.removeEventListener("keydown", onKey);
        el.removeEventListener("blur", onBlur);
      };
      el.addEventListener("keydown", onKey);
      el.addEventListener("blur", onBlur);
    },
    [commitText],
  );

  /* ---- clicks: a field, else the section under the pointer ---- */
  useEffect(() => {
    if (preview || off) return;
    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest("#rm-editor-ui")) return;
      const el = target.closest<HTMLElement>("[data-e]");
      const tag = el ? parse(el) : null;
      if (el && tag) {
        if (el.isContentEditable) return; // already editing this one
        e.preventDefault();
        e.stopPropagation();
        if (tag.k === "text") startText(el, tag);
        else if (tag.k === "rich") {
          void (async () => {
            const { value, label } = await api.readField(tag);
            setPanel({ k: "rich", tag, value: String(value ?? ""), label });
          })();
        } else if (tag.k === "link") {
          void (async () => {
            const [l, h] = await Promise.all([api.readField(tag), tag.fh ? api.readField({ ...tag, f: tag.fh }) : Promise.resolve({ value: "" })]);
            setPanel({ k: "link", tag, label: String(l.value ?? ""), href: String(h.value ?? "") });
          })();
        } else if (tag.k === "media") {
          void (async () => {
            const [i, v] = await Promise.all([api.readField(tag), tag.fv ? api.readField({ ...tag, f: tag.fv }) : Promise.resolve({ value: "" })]);
            setPanel({ k: "media", tag, image: String(i.value ?? ""), video: String(v.value ?? "") });
          })();
        }
      } else {
        const hit = hitTest(boxesRef.current, e.pageX, e.pageY);
        if (hit) setSelected(hit.id);
        // links on the page do not navigate while editing (Preview for that); buttons such as tabs still work
        if (target.closest("a[href]")) e.preventDefault();
        // a tab may have opened: its sections get their frames
        requestAnimationFrame(() => remeasure());
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !editing.current) setSelected(null);
    };
    document.addEventListener("click", onClick, true);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("keydown", onKey);
    };
  }, [startText, preview, off, remeasure]);

  /* ---- top bar actions ---- */
  const legacyItems = (legacy?.items ?? []).filter((it) => !(page && it.r === page.r && it.id === page.id));
  const hasChanges = (info ? info.status !== "live" : false) || legacyItems.length > 0;

  const openReview = async () => {
    setBusy(true);
    try {
      let items: string[] = [];
      if (page) {
        const res = await pageApi.pageChanges(page);
        if ("error" in res) return say(res.error, true);
        items = res.items;
      }
      setModal({ k: "review", items, others: legacyItems.map((i) => i.label), confirmDiscard: false });
    } finally {
      setBusy(false);
    }
  };

  const publishNow = async () => {
    setBusy(true);
    try {
      const r = await api.publishTargets(targetsOnPage());
      undo.current = [];
      setUndoCount(0);
      setModal(r.published ? { k: "live", path: info?.livePath ?? pathname } : null);
      if (!r.published) say("Nothing to publish");
      await afterChange();
    } finally {
      setBusy(false);
    }
  };

  const discardAll = async () => {
    setBusy(true);
    try {
      const n = await api.discardTargets(targetsOnPage());
      undo.current = [];
      setUndoCount(0);
      setModal(null);
      say(n ? "Changes discarded" : "Nothing to discard");
      await afterChange();
    } finally {
      setBusy(false);
    }
  };

  const openHistory = async () => {
    if (!page) return;
    setPanel({ k: "history", items: null });
    const res = await pageApi.pageHistory(page);
    if ("error" in res) return say(res.error, true);
    setPanel({ k: "history", items: res.items });
  };

  const restore = async (id: number) => {
    if (!page) return;
    setBusy(true);
    try {
      const res = await pageApi.restorePage(page, id, version.current);
      if ("error" in res) {
        if (res.conflict) setModal({ k: "conflict", message: res.error });
        else say(res.error, true);
        return;
      }
      version.current = res.version;
      pushUndo({ kind: "blocks", prev: res.undo, label: "Restored a version" });
      say("Version restored. Not live yet — check it, then Publish");
      setPanel(null);
      await afterChange();
    } finally {
      setBusy(false);
    }
  };

  const onCompare = async (region: string) => {
    if (!page || region === "") return;
    if (region === "off") return setCompare(null);
    const res = await pageApi.compareWith(page, region as never);
    if ("error" in res) return say(res.error, true);
    setCompare(res);
    const n = res.sections.filter((x) => x !== "same").length;
    say(n ? `${n} section${n > 1 ? "s" : ""} differ from ${res.label}` : `Same as ${res.label}`);
  };

  /* ---- render ---- */
  if (off) {
    return (
      <div id="rm-editor-ui">
        <button type="button" onClick={() => { setDemoEditorOff(false); setOff(false); }} className="fixed bottom-4 right-4 z-[1000] rounded-full bg-neutral-900 px-4 py-2 text-sm font-semibold text-white shadow-xl hover:bg-neutral-700">
          ✎ Edit this page (demo)
        </button>
      </div>
    );
  }

  const sectionById = new Map((info?.sections ?? []).map((s) => [s.id, s]));
  const listOf = (l: string) => (info?.sections ?? []).filter((s) => s.list === l);
  const vis = (b: Box) => ({ top: b.top - scroll, left: b.left, width: b.width, height: b.height });
  const sel = selected ? boxes.find((b) => b.id === selected) : null;
  const selInfo = selected ? sectionById.get(selected) : undefined;
  const selList = selInfo ? listOf(selInfo.list) : [];
  const hov = hovered && hovered !== selected ? boxes.find((b) => b.id === hovered) : null;
  const plusFor = [sel, hovered ? boxes.find((b) => b.id === hovered) : null].filter((b): b is Box => !!b);
  const vw = typeof window === "undefined" ? 1200 : window.innerWidth;
  const plusAt = new Map<string, { list: string; at: number; y: number; x: number }>(); // list + insert index → place
  for (const b of plusFor) {
    // position in the stored list (a section with nothing to list is stored but not shown)
    const s = sectionById.get(b.id);
    const at = s?.at ?? b.i;
    const list = s?.list ?? b.l;
    const x = list ? b.left + b.width / 2 : vw / 2;
    plusAt.set(`${list}|${at}`, { list, at, y: b.top, x });
    plusAt.set(`${list}|${at + 1}`, { list, at: at + 1, y: b.top + b.height, x });
  }
  const title = info?.title ?? (typeof document === "undefined" ? "" : document.title.split(/\s[|–-]\s/)[0]);

  return (
    <div id="rm-editor-ui">
      <style>{STYLE(top, preview)}</style>
      {DEMO && (
        <div className="fixed inset-x-0 top-0 z-[1001] h-6 truncate bg-amber-400 px-4 text-center text-xs font-medium leading-6 text-black">
          Demo — edits are saved only in your browser (localStorage). No server, no database.
        </div>
      )}

      {preview ? (
        <PreviewBar demo={DEMO} onBack={() => setPreview(false)} />
      ) : (
        <TopBar
          info={info}
          title={title}
          status={msg ?? statusText(info, legacyItems.length)}
          busy={busy}
          canUndo={undoCount > 0}
          hasChanges={hasChanges}
          compareLabel={compare?.label ?? null}
          pagesHref={withBase("/admin/editor")}
          exitHref={DEMO ? null : `/api/editor?off=1&redirect=${encodeURIComponent(pathname)}`}
          demo={DEMO}
          onUndo={doUndo}
          onHistory={openHistory}
          onPreview={() => { setPreview(true); setSelected(null); setPanel(null); }}
          onPublish={openReview}
          onCompare={onCompare}
          onRegion={(p) => router.push(p)}
          onExit={() => { setDemoEditorOff(true); setOff(true); }}
        />
      )}

      {!preview && info && (
        <>
          {/* comparison frames */}
          {compare &&
            boxes.map((b) => {
              const s = sectionById.get(b.id);
              const d = s && !s.list ? compare.sections[s.at] : undefined;
              if (!d || d === "same") return null;
              return (
                <div key={`cmp-${b.id}`} className="pointer-events-none fixed z-[999] border-2 border-dashed border-amber-500" style={vis(b)}>
                  <span className="absolute left-2 top-2 rounded bg-amber-500 px-2 py-0.5 text-xs font-semibold text-black">{d === "different" ? `Different in ${compare.label}` : `Only here — not in ${compare.label}`}</span>
                </div>
              );
            })}
          {/* hover and selection */}
          {hov && (
            <div className="pointer-events-none fixed z-[999] border border-blue-400" style={vis(hov)}>
              <span className="absolute left-0 top-0 bg-blue-500 px-1.5 py-0.5 text-[11px] text-white">{sectionById.get(hov.id)?.name}</span>
            </div>
          )}
          {sel && <div className="pointer-events-none fixed z-[999] border-2 border-blue-600" style={vis(sel)} />}
          {sel && selInfo && (
            <SectionToolbar
              s={info.canDesign ? selInfo : { ...selInfo, variants: [] }}
              first={selInfo.at === 0}
              last={selInfo.at === selList.length - 1 || !!selList[selInfo.at + 1]?.pinned}
              busy={busy}
              style={{ top: Math.min(Math.max(sel.top - scroll - 34, top + 6), sel.top - scroll + sel.height - 34), left: Math.min(Math.max(sel.left + 8, 8), vw - 380) }}
              onVariant={(v) => runOp({ op: "variant", id: selInfo.id, variant: v }, `Changed layout of ${selInfo.name}`)}
              onMove={(d) => runOp({ op: "move", id: selInfo.id, dir: d }, `Moved ${selInfo.name}`)}
              onCopy={() => runOp({ op: "duplicate", id: selInfo.id }, `Copied ${selInfo.name}`)}
              onRemove={() => runOp({ op: "remove", id: selInfo.id }, `Deleted ${selInfo.name}`)}
              onTabs={selInfo.tabs ? () => setPanel({ k: "tabs", id: selInfo.id }) : undefined}
            />
          )}
          {sel && selInfo?.fromRecords && (
            <div className="fixed z-[1002] rounded bg-neutral-900 px-2 py-1 text-xs text-white" style={{ top: Math.max(sel.top - scroll + 6, top + 44), left: Math.max(sel.left + sel.width - 260, 8) }}>
              List items come from their own records in the admin
            </div>
          )}
          {/* add-section buttons on the edges of the hovered / selected section */}
          {[...plusAt.entries()].map(([key, p]) => (
            <button
              key={`plus-${key}`}
              type="button"
              data-rm-plus
              disabled={busy}
              onClick={() => setPanel({ k: "add", at: p.at, list: p.list })}
              className="fixed z-[1001] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white shadow-lg hover:bg-blue-700"
              style={{ top: p.y - scroll, left: p.x }}
            >
              {p.list ? "+ Add section to this tab" : "+ Add section"}
            </button>
          ))}
          {boxes.length === 0 && (
            <button type="button" onClick={() => setPanel({ k: "add", at: 0, list: "" })} className="fixed bottom-6 left-1/2 z-[1001] -translate-x-1/2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-lg">
              + Add section
            </button>
          )}
        </>
      )}

      {/* side panels */}
      {panel?.k === "rich" && (
        <SidePanel title={`Edit: ${panel.label}`} top={top} onClose={() => setPanel(null)}>
          <RichForm
            value={panel.value}
            onCancel={() => setPanel(null)}
            onSave={async (html) => {
              if (await save(panel.tag, "rich", html, { value: panel.value, label: "text change" })) setPanel(null);
            }}
          />
        </SidePanel>
      )}
      {panel?.k === "link" && (
        <SidePanel title="Button or link" top={top} onClose={() => setPanel(null)}>
          <LinkForm
            label={panel.label}
            href={panel.href}
            hasHref={!!panel.tag.fh}
            onCancel={() => setPanel(null)}
            onSave={async (label, href) => {
              let ok = label === panel.label || (await save(panel.tag, "text", label, { value: panel.label, label: "link change" }));
              if (ok && panel.tag.fh && href !== panel.href) ok = await save({ ...panel.tag, f: panel.tag.fh }, "url", href, { value: panel.href, label: "link change" });
              if (ok) setPanel(null);
            }}
          />
        </SidePanel>
      )}
      {panel?.k === "media" && (
        <SidePanel title="Picture or video" top={top} onClose={() => setPanel(null)}>
          <MediaActions
            image={panel.image ? withBase(panel.image) : ""}
            video={panel.video ? withBase(panel.video) : ""}
            hasVideo={!!panel.tag.fv}
            onReplace={(kind) => setPicker({ tag: panel.tag, kind })}
            onRemoveVideo={async () => {
              if (await save({ ...panel.tag, f: panel.tag.fv! }, "video", "", { value: panel.video, label: "video change" })) setPanel({ ...panel, video: "" });
            }}
            onClear={async () => {
              if (await save(panel.tag, "image", "", { value: panel.image, label: "picture change" })) setPanel({ ...panel, image: "" });
            }}
          />
        </SidePanel>
      )}
      {panel?.k === "add" && (
        <SidePanel title={panel.list ? "Add section to this tab" : "Add section"} top={top} onClose={() => setPanel(null)}>
          <PresetList
            presets={(info?.presets ?? []).filter((p) => !panel.list || p.nestable)}
            busy={busy}
            onPick={async (p) => {
              setPanel(null);
              await runOp({ op: "add", at: panel.at, type: p.type, variant: p.variant, ...(panel.list ? { in: panel.list } : {}) }, `Added ${p.name}`);
            }}
          />
        </SidePanel>
      )}
      {panel?.k === "tabs" && (
        <SidePanel title="Tabs" top={top} onClose={() => setPanel(null)}>
          <TabsPanel
            tabs={sectionById.get(panel.id)?.tabs ?? []}
            busy={busy}
            onRename={(tab, label) => runOp({ op: "tab", id: panel.id, act: "rename", tab, label }, "Renamed a tab")}
            onMove={(tab, dir) => runOp({ op: "tab", id: panel.id, act: "move", tab, dir }, "Moved a tab")}
            onRemove={(tab) => runOp({ op: "tab", id: panel.id, act: "remove", tab }, "Deleted a tab")}
            onLink={(tab, href) => runOp({ op: "tab", id: panel.id, act: "link", tab, href }, "Changed a tab link")}
            onAdd={(label, href) => runOp({ op: "tab", id: panel.id, act: "add", at: sectionById.get(panel.id)?.tabs?.length ?? 0, label, ...(href !== undefined ? { href } : {}) }, `Added tab ${label}`)}
          />
        </SidePanel>
      )}
      {panel?.k === "history" && (
        <SidePanel title="History" top={top} onClose={() => setPanel(null)}>
          <HistoryList items={panel.items} busy={busy} onRestore={restore} />
        </SidePanel>
      )}
      {picker && (
        <MediaPicker
          kind={picker.kind}
          onClose={() => setPicker(null)}
          onPick={async (m) => {
            const f = picker.kind === "video" ? picker.tag.fv! : picker.tag.f;
            const prev = panel?.k === "media" ? (picker.kind === "video" ? panel.video : panel.image) : "";
            const ok = await save({ ...picker.tag, f }, picker.kind, m.url, { value: prev, label: `${picker.kind === "video" ? "video" : "picture"} change` });
            if (ok && panel?.k === "media") setPanel({ ...panel, [picker.kind]: m.url });
            setPicker(null);
          }}
        />
      )}

      {/* dialogs */}
      {modal?.k === "review" && (
        <Dialog title="Review changes" onClose={() => setModal(null)}>
          {modal.items.length + modal.others.length === 0 ? (
            <p className="text-sm text-neutral-600">No changes to publish.</p>
          ) : (
            <ul className="mb-4 list-disc space-y-1 pl-5 text-sm">
              {modal.items.map((x) => <li key={x}>{x}</li>)}
              {modal.others.map((x) => <li key={x}>{x} (shown on this page)</li>)}
            </ul>
          )}
          {info?.changedBy && <p className="mb-4 text-xs text-neutral-500">Last change by {info.changedBy}{info.changedAt ? `, ${new Date(info.changedAt).toLocaleString()}` : ""}.</p>}
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" className={buttons.primary} disabled={busy || modal.items.length + modal.others.length === 0} onClick={publishNow}>Publish now</button>
            <button type="button" className={buttons.secondary} onClick={() => setModal(null)}>Keep editing</button>
            <span className="flex-1" />
            <button type="button" className={`${buttons.secondary} text-red-700`} disabled={busy} onClick={() => (modal.confirmDiscard ? discardAll() : setModal({ ...modal, confirmDiscard: true }))}>
              {modal.confirmDiscard ? "Click again to discard all" : "Discard all changes"}
            </button>
          </div>
        </Dialog>
      )}
      {modal?.k === "live" && (
        <Dialog title="Live now" onClose={() => setModal(null)}>
          <p className="text-sm text-neutral-700">Visitors see the new version at</p>
          <p className="mt-1 break-all rounded bg-neutral-100 px-2 py-1 font-mono text-sm">{typeof window === "undefined" ? modal.path : `${window.location.origin}${withBase(modal.path)}`}</p>
          <div className="mt-4 flex gap-2">
            <a href={withBase(modal.path)} target="_blank" rel="noreferrer" className={buttons.primary}>Open live page ↗</a>
            <button type="button" className={buttons.secondary} onClick={() => setModal(null)}>Keep editing</button>
          </div>
        </Dialog>
      )}
      {modal?.k === "conflict" && (
        <Dialog title="Someone else changed this page">
          <p className="text-sm text-neutral-700">{modal.message}</p>
          <p className="mt-2 text-sm text-neutral-500">Your last change was not saved.</p>
          <div className="mt-4 flex gap-2">
            <button type="button" className={buttons.primary} onClick={() => window.location.reload()}>Reload</button>
          </div>
        </Dialog>
      )}
    </div>
  );
}
