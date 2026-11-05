"use client";


import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import * as live from "@/admin/inline";
import type { PendingItem, InlineKind } from "@/admin/inline";
import { MediaPicker } from "@/components/admin/MediaPicker";
import { RichText } from "@/components/admin/RichText";
import { DEMO, withBase } from "@/lib/demo";
import { demoApi, applyDemoState, demoEditorOff, setDemoEditorOff } from "./demo-store";

// Static demo build: edits live in the visitor's browser; otherwise server actions + workflow.
const { readField, saveField, pendingFor, publishTargets, discardTargets, submitTargetsForReview } = DEMO ? demoApi : live;


type Tag = { r: string; id: number; f: string; k: "text" | "rich" | "link" | "media"; fh?: string; fv?: string };
type Active =
  | { kind: "rich"; tag: Tag; el: HTMLElement; value: string; label: string }
  | { kind: "link"; tag: Tag; el: HTMLElement; label: string; href: string }
  | { kind: "media"; tag: Tag; el: HTMLElement; rect: DOMRect; picker: null | "image" | "video" };

const STYLE = `
[data-e]{outline:1px dashed rgba(37,99,235,.55);outline-offset:3px;cursor:pointer;border-radius:2px;transition:outline-color .12s}
[data-e]:hover{outline:2px solid #2563eb;background:rgba(37,99,235,.06)}
[data-e][contenteditable]{outline:2px solid #f59e0b;background:#fff;color:#111;cursor:text;min-width:2ch;white-space:pre-wrap}
.rm-e-media{position:relative;display:block}
.rm-e-media:hover::after{content:"Replace media";position:absolute;top:8px;left:8px;background:#2563eb;color:#fff;font:600 11px/1 system-ui;padding:6px 8px;border-radius:4px;pointer-events:none}
body{padding-bottom:64px}
`;

function parse(el: Element): Tag | null {
  try {
    return JSON.parse(el.getAttribute("data-e") || "") as Tag;
  } catch {
    return null;
  }
}

export default function EditorOverlay() {
  const router = useRouter();
  const pathname = usePathname();
  const [off, setOff] = useState(false);
  const [active, setActive] = useState<Active | null>(null);
  const [pending, setPending] = useState<{ items: PendingItem[]; canPublishAll: boolean; requireApproval: boolean; user: { name: string; role: string } } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [showList, setShowList] = useState(false);
  const editing = useRef<{ el: HTMLElement; tag: Tag; original: string } | null>(null);

  const say = useCallback((m: string) => {
    setToast(m);
    setTimeout(() => setToast((t) => (t === m ? null : t)), 2500);
  }, []);

  const targetsOnPage = useCallback(() => {
    const out: { r: string; id: number }[] = [];
    document.querySelectorAll("[data-e]").forEach((el) => {
      const t = parse(el);
      if (t) out.push({ r: t.r, id: t.id });
    });
    return out;
  }, []);

  const refreshPending = useCallback(async () => {
    try {
      setPending(await pendingFor(targetsOnPage()));
    } catch (e) {
      say((e as Error).message);
    }
  }, [targetsOnPage, say]);

  useEffect(() => {
    const t = setTimeout(() => {
      if (DEMO) {
        applyDemoState();
        setOff(demoEditorOff());
      }
      void refreshPending();
    }, 50);
    return () => clearTimeout(t);
  }, [refreshPending, pathname]);

  const refresh = useCallback(() => {
    if (DEMO) applyDemoState();
    else router.refresh();
  }, [router]);

  const save = useCallback(
    async (tag: { r: string; id: number; f: string }, kind: InlineKind, value: unknown) => {
      setBusy("Saving…");
      try {
        const res = await saveField(tag, kind, value);
        say(DEMO ? "Saved in this browser (demo)" : res.pending ? "Saved as pending change" : "Saved");
        refresh();
        await refreshPending();
        return true;
      } catch (e) {
        say(`Not saved: ${(e as Error).message}`);
        return false;
      } finally {
        setBusy(null);
      }
    },
    [refresh, refreshPending, say],
  );

  /* ---- inline plain text ---- */
  const commitText = useCallback(async () => {
    const cur = editing.current;
    if (!cur) return;
    editing.current = null;
    const { el, tag, original } = cur;
    el.removeAttribute("contenteditable");
    const value = el.innerText;
    if (value === original) return;
    const ok = await save(tag, "text", value);
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

  /* ---- click routing ---- */
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest("#rm-editor-ui")) return;
      const el = target.closest<HTMLElement>("[data-e]");
      if (!el) return;
      const tag = parse(el);
      if (!tag) return;
      if (el.isContentEditable) return; // already editing this one
      e.preventDefault();
      e.stopPropagation();
      if (tag.k === "text") startText(el, tag);
      else if (tag.k === "rich") {
        void (async () => {
          const { value, label } = await readField(tag);
          setActive({ kind: "rich", tag, el, value: String(value ?? ""), label });
        })();
      } else if (tag.k === "link") {
        void (async () => {
          const [l, h] = await Promise.all([readField(tag), tag.fh ? readField({ ...tag, f: tag.fh }) : Promise.resolve({ value: "" })]);
          setActive({ kind: "link", tag, el, label: String(l.value ?? ""), href: String(h.value ?? "") });
        })();
      } else if (tag.k === "media") setActive({ kind: "media", tag, el, rect: el.getBoundingClientRect(), picker: null });
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [startText]);

  /* ---- toolbar actions ---- */
  const doPublish = async () => {
    setBusy("Publishing…");
    try {
      const r = await publishTargets(targetsOnPage());
      say(r.published ? `Published ${r.published} change${r.published > 1 ? "s" : ""}${DEMO ? " (demo: only in this browser)" : ""}` : r.blocked.length ? `Blocked: ${r.blocked.join(", ")}` : "Nothing to publish");
      refresh();
      await refreshPending();
    } finally {
      setBusy(null);
    }
  };
  const doDiscard = async () => {
    if (!confirm("Discard all pending changes on this page?")) return;
    setBusy("Discarding…");
    try {
      const n = await discardTargets(targetsOnPage());
      say(n ? `Discarded ${n}` : "Nothing to discard");
      refresh();
      await refreshPending();
    } finally {
      setBusy(null);
    }
  };
  const doReview = async () => {
    const note = prompt("Note for the approver (optional)") ?? "";
    setBusy("Submitting…");
    try {
      const n = await submitTargetsForReview(targetsOnPage(), note);
      say(n ? "Submitted for review" : "Nothing to submit");
      await refreshPending();
    } finally {
      setBusy(null);
    }
  };

  const count = pending?.items.length ?? 0;
  const adminHref = pending?.items[0]?.href ?? withBase("/admin");

  if (off) {
    return (
      <div id="rm-editor-ui">
        <button type="button" onClick={() => { setDemoEditorOff(false); setOff(false); }} className="fixed bottom-4 right-4 z-[1000] rounded-full bg-neutral-900 px-4 py-2 text-sm font-semibold text-white shadow-xl hover:bg-neutral-700">
          ✎ Edit this page (demo)
        </button>
      </div>
    );
  }

  return (
    <div id="rm-editor-ui">
      <style>{STYLE}</style>
      {DEMO && (
        <div className="fixed inset-x-0 top-0 z-[1000] bg-amber-400 px-4 py-1 text-center text-xs font-medium text-black">
          Demo — edits are saved only in your browser (localStorage). No server, no database.
        </div>
      )}

      {/* bottom toolbar */}
      <div className="fixed inset-x-0 bottom-0 z-[1000] border-t border-neutral-800 bg-neutral-900 text-white shadow-2xl">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-2.5 text-sm">
          <span className="inline-flex items-center gap-2 font-semibold"><span className="inline-block h-2 w-2 rounded-full bg-amber-400" />Editing</span>
          <span className="text-neutral-400">as {pending?.user.name ?? "…"}</span>
          <button type="button" onClick={() => setShowList((s) => !s)} className="rounded bg-neutral-800 px-2 py-1 text-xs hover:bg-neutral-700">
            {count ? `${count} pending change${count > 1 ? "s" : ""} on this page ${showList ? "▾" : "▸"}` : "No pending changes on this page"}
          </button>
          <span className="flex-1 text-xs text-neutral-400">{busy ?? toast ?? "Click any outlined text or media to edit."}</span>
          {count > 0 && pending?.canPublishAll && (
            <button type="button" disabled={!!busy} onClick={doPublish} className="rounded bg-emerald-500 px-3 py-1.5 text-sm font-semibold text-black hover:bg-emerald-400 disabled:opacity-50">Publish</button>
          )}
          {count > 0 && pending && !pending.canPublishAll && (
            <button type="button" disabled={!!busy} onClick={doReview} className="rounded bg-amber-400 px-3 py-1.5 text-sm font-semibold text-black hover:bg-amber-300 disabled:opacity-50">Submit for review</button>
          )}
          {count > 0 && <button type="button" disabled={!!busy} onClick={doDiscard} className="rounded border border-neutral-600 px-3 py-1.5 text-sm hover:bg-neutral-800 disabled:opacity-50">Discard</button>}
          <a href={adminHref} className="rounded border border-neutral-600 px-3 py-1.5 text-sm hover:bg-neutral-800">Open in admin</a>
          {DEMO ? (
            <button type="button" onClick={() => { setDemoEditorOff(true); setOff(true); }} className="rounded px-3 py-1.5 text-sm text-neutral-300 hover:bg-neutral-800">View as visitor</button>
          ) : (
            <a href={`/api/editor?off=1&redirect=${encodeURIComponent(pathname)}`} className="rounded px-3 py-1.5 text-sm text-neutral-300 hover:bg-neutral-800">Exit editor</a>
          )}
        </div>
        {showList && count > 0 && (
          <ul className="mx-auto max-w-6xl divide-y divide-neutral-800 border-t border-neutral-800 px-4 text-xs">
            {pending!.items.map((it) => (
              <li key={`${it.r}#${it.id}`} className="flex items-center gap-3 py-1.5">
                <span className="flex-1">{it.label}</span>
                {it.reviewStatus && it.reviewStatus !== "editing" && <span className="rounded bg-neutral-800 px-1.5 py-0.5">{it.reviewStatus.replace("_", " ")}</span>}
                {it.publishAt && <span className="text-neutral-400">scheduled {new Date(it.publishAt).toLocaleString()}</span>}
                {it.by && <span className="text-neutral-400">{it.by}, {new Date(it.at).toLocaleString()}</span>}
                {it.href && <a href={it.href} className="underline">open</a>}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* rich text panel */}
      {active?.kind === "rich" && (
        <Panel title={`Edit: ${active.label}`} onClose={() => setActive(null)}>
          <RichForm
            value={active.value}
            onCancel={() => setActive(null)}
            onSave={async (html) => {
              const ok = await save(active.tag, "rich", html);
              if (ok) setActive(null);
            }}
          />
        </Panel>
      )}

      {/* link popover */}
      {active?.kind === "link" && (
        <Panel title="Edit link" onClose={() => setActive(null)} small>
          <LinkForm
            label={active.label}
            href={active.href}
            hasHref={!!active.tag.fh}
            onCancel={() => setActive(null)}
            onSave={async (label, href) => {
              let ok = await save(active.tag, "text", label);
              if (ok && active.tag.fh) ok = await save({ ...active.tag, f: active.tag.fh }, "url", href);
              if (ok) setActive(null);
            }}
          />
        </Panel>
      )}

      {/* media menu */}
      {active?.kind === "media" && !active.picker && (
        <div
          className="fixed z-[1001] flex flex-col overflow-hidden rounded border border-neutral-300 bg-white text-sm text-neutral-900 shadow-xl"
          style={{ top: Math.max(8, active.rect.top + 8), left: Math.max(8, active.rect.left + 8) }}
          onMouseLeave={() => setActive(null)}
        >
          <button type="button" className="px-3 py-2 text-left hover:bg-neutral-100" onClick={() => setActive({ ...active, picker: "image" })}>Replace image…</button>
          {active.tag.fv && <button type="button" className="px-3 py-2 text-left hover:bg-neutral-100" onClick={() => setActive({ ...active, picker: "video" })}>Replace video…</button>}
          {active.tag.fv && (
            <button type="button" className="px-3 py-2 text-left text-red-700 hover:bg-neutral-100" onClick={async () => { if (await save({ ...active.tag, f: active.tag.fv! }, "video", "")) setActive(null); }}>Remove video (show image)</button>
          )}
          <button type="button" className="px-3 py-2 text-left text-red-700 hover:bg-neutral-100" onClick={async () => { if (await save(active.tag, "image", "")) setActive(null); }}>Clear image</button>
          <button type="button" className="border-t border-neutral-200 px-3 py-2 text-left text-neutral-500 hover:bg-neutral-100" onClick={() => setActive(null)}>Cancel</button>
        </div>
      )}
      {active?.kind === "media" && active.picker && (
        <MediaPicker
          kind={active.picker}
          onClose={() => setActive(null)}
          onPick={async (m) => {
            const f = active.picker === "video" ? active.tag.fv! : active.tag.f;
            if (await save({ ...active.tag, f }, active.picker!, m.url)) setActive(null);
          }}
        />
      )}
    </div>
  );
}

function Panel({ title, children, onClose, small }: { title: string; children: React.ReactNode; onClose: () => void; small?: boolean }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-[1001] flex items-start justify-center bg-black/40 p-4 pt-12" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`max-h-[85vh] w-full overflow-auto rounded-lg bg-white p-5 text-neutral-900 shadow-2xl ${small ? "max-w-md" : "max-w-3xl"}`}>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold">{title}</h2>
          <button type="button" onClick={onClose} className="text-neutral-500 hover:text-neutral-900">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function RichForm({ value, onSave, onCancel }: { value: string; onSave: (html: string) => Promise<void>; onCancel: () => void }) {
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
        <button type="button" onClick={onCancel} className="rounded border border-neutral-300 px-3 py-1.5 text-sm">Cancel</button>
        <button type="submit" className="rounded bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white">Save</button>
      </div>
    </form>
  );
}

function LinkForm({ label, href, hasHref, onSave, onCancel }: { label: string; href: string; hasHref: boolean; onSave: (label: string, href: string) => Promise<void>; onCancel: () => void }) {
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
        <button type="button" onClick={onCancel} className="rounded border border-neutral-300 px-3 py-1.5 text-sm">Cancel</button>
        <button type="submit" className="rounded bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white">Save</button>
      </div>
    </form>
  );
}
