"use client";

import { useEffect, useState } from "react";
import * as collections from "@/admin/collections";
import type { CollectionField, CollectionItem, CollectionSummary } from "@/admin/collections";
import * as live from "@/admin/inline";
import { PagesList, type PickPage } from "./editor-ui";

/**
 * 📄 Pages and the page picker: «Pages» (built from sections) and «Collections» (records of one kind), like Webflow's
 * Pages / CMS but in plain words (docs/screens/on-page-editor.md → «Страницы и коллекции»).
 * Editor chrome: the editor's own neutral palette (as editor-ui.tsx).
 */
export type OpenRecord = { item: CollectionItem; fields: CollectionField[]; collection: string };

export function PagesPanel(props: {
  pages: PickPage[] | null;
  current: string | null;
  demo: boolean;
  onPage: (path: string) => void;
  onRecord: (r: OpenRecord) => void;
  maxHeight?: string;
}) {
  const [tab, setTab] = useState<"pages" | "collections">("pages");
  const [list, setList] = useState<CollectionSummary[] | null>(null);
  const [open, setOpen] = useState<{ key: string; title: string; newLabel: string; newHref: string; fields: CollectionField[]; items: CollectionItem[] } | null>(null);
  const [q, setQ] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (tab !== "collections" || list || props.demo) return;
    let alive = true;
    void collections.collectionsOverview().then((r) => {
      if (!alive) return;
      if ("error" in r) setError(r.error);
      else setList(r.items);
    });
    return () => {
      alive = false;
    };
  }, [tab, list, props.demo]);

  const openCollection = async (key: string) => {
    const r = await collections.collectionItems(key);
    if ("error" in r) return setError(r.error);
    setQ("");
    setOpen({ key, ...r });
  };

  const tabBtn = (k: "pages" | "collections", label: string) => (
    <button type="button" role="tab" aria-selected={tab === k} onClick={() => { setTab(k); setOpen(null); }} className={`flex-1 border-b-2 px-3 py-2 text-sm ${tab === k ? "border-neutral-900 font-semibold" : "border-transparent text-neutral-500 hover:text-neutral-900"}`}>
      {label}
    </button>
  );

  return (
    <div>
      {!props.demo && (
        <div role="tablist" aria-label="Pages or collections" className="flex border-b border-neutral-200">
          {tabBtn("pages", "Pages")}
          {tabBtn("collections", "Collections")}
        </div>
      )}
      {tab === "pages" ? (
        <PagesList pages={props.pages} current={props.current} onPick={props.onPage} maxHeight={props.maxHeight} />
      ) : error ? (
        <p className="p-4 text-sm text-red-700">{error}</p>
      ) : open ? (
        <div>
          <div className="flex items-center gap-2 border-b border-neutral-200 p-2">
            <button type="button" onClick={() => setOpen(null)} className="rounded px-2 py-1 text-sm hover:bg-neutral-100">← Collections</button>
            <span className="min-w-0 flex-1 truncate text-sm font-semibold">{open.title}</span>
            <a href={open.newHref} target="_blank" rel="noreferrer" className="rounded border border-neutral-300 px-2 py-1 text-xs hover:bg-neutral-50">+ New {open.newLabel} ↗</a>
          </div>
          <div className="border-b border-neutral-200 p-2">
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Search ${open.title.toLowerCase()}`} aria-label={`Search ${open.title.toLowerCase()}`} className="w-full rounded border border-neutral-300 px-2 py-1.5 text-sm" />
          </div>
          <ul className="overflow-auto p-1" style={props.maxHeight ? { maxHeight: props.maxHeight } : undefined}>
            {open.items
              .filter((it) => !q.trim() || `${it.title} ${it.sub}`.toLowerCase().includes(q.trim().toLowerCase()))
              .map((it) => (
                <li key={it.id}>
                  <button
                    type="button"
                    onClick={() => (it.path ? props.onPage(it.path) : props.onRecord({ item: it, fields: open.fields, collection: open.title }))}
                    className="flex w-full items-start gap-2 rounded px-2 py-1.5 text-left hover:bg-neutral-100"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm">{it.title}</span>
                      {it.sub && <span className="block truncate text-xs text-neutral-500">{it.sub}</span>}
                    </span>
                    {it.status && it.status !== "live" && <span className="shrink-0 rounded bg-amber-100 px-1 text-[10px] text-amber-900">{it.status === "draft" ? "draft" : "changes"}</span>}
                    <span className="shrink-0 text-xs text-neutral-400" aria-hidden>{it.path ? "page ›" : "edit ›"}</span>
                  </button>
                </li>
              ))}
            {!open.items.length && <li className="p-3 text-sm text-neutral-500">Nothing here yet.</li>}
          </ul>
        </div>
      ) : !list ? (
        <p className="p-4 text-sm text-neutral-500">Loading…</p>
      ) : (
        <ul className="p-1">
          {list.map((c) => (
            <li key={c.key}>
              <button type="button" onClick={() => void openCollection(c.key)} className="flex w-full items-start gap-3 rounded px-2 py-2 text-left hover:bg-neutral-100">
                <span aria-hidden className="text-lg leading-6">{c.icon}</span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline gap-2 text-sm font-medium">{c.title}<span className="text-xs font-normal text-neutral-500">{c.count}</span></span>
                  <span className="block text-xs text-neutral-500">{c.where}</span>
                </span>
                <span aria-hidden className="text-neutral-400">›</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** A record without a page of its own: its texts as fields, its status and Publish (on-page-editor.md). */
export function RecordPanel({ rec, onSaved, onError }: { rec: OpenRecord; onSaved: (m: string) => void; onError: (m: string) => void }) {
  const t = { r: rec.item.r, id: rec.item.id };
  const [values, setValues] = useState<Record<string, string> | null>(null);
  const [status, setStatus] = useState<"live" | "changed" | "draft" | null>(rec.item.status);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    void Promise.all(rec.fields.map(async (f) => [f.name, String((await live.readField({ ...t, f: f.name })).value ?? "")] as const)).then((pairs) => alive && setValues(Object.fromEntries(pairs)));
    return () => {
      alive = false;
    };
  }, [rec]); // eslint-disable-line react-hooks/exhaustive-deps

  const refreshStatus = async () => {
    const s = await collections.recordStatus(t.r, t.id);
    if (!("error" in s)) setStatus(s.status);
  };

  const saveOne = async (f: CollectionField, value: string) => {
    if (!values || value === values[f.name]) return;
    if (f.required && !value.trim()) return onError(`${f.label} is required`);
    setBusy(true);
    try {
      const res = await live.saveField({ ...t, f: f.name }, f.type === "url" ? "url" : "text", value);
      setValues({ ...values, [f.name]: value });
      onSaved(res.pending ? "Saved. Not live yet" : "Saved");
      await refreshStatus();
    } catch (e) {
      onError(`Not saved: ${(e as Error).message}`);
    } finally {
      setBusy(false);
    }
  };

  if (!values) return <p className="text-sm text-neutral-500">Loading…</p>;
  return (
    <div className="space-y-4 text-sm">
      <p className="text-xs text-neutral-500">
        {rec.collection} ·{" "}
        {status === "draft" ? "Draft — not on the site" : status === "changed" ? "On the site, with unpublished changes" : status === "live" ? "On the site" : "Always on the site"}
      </p>
      {rec.fields.map((f) => (
        <label key={f.name} className="block">
          <span className="mb-1 block text-xs font-medium text-neutral-600">{f.label}{f.required ? " *" : ""}</span>
          {f.type === "textarea" ? (
            <textarea defaultValue={values[f.name]} rows={4} disabled={busy} onBlur={(e) => void saveOne(f, e.currentTarget.value)} className="w-full rounded border border-neutral-300 px-2 py-1.5" />
          ) : (
            <input defaultValue={values[f.name]} disabled={busy} onBlur={(e) => void saveOne(f, e.currentTarget.value)} onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()} className="w-full rounded border border-neutral-300 px-2 py-1.5" />
          )}
        </label>
      ))}
      <div className="flex items-center gap-2 border-t border-neutral-200 pt-3">
        {(status === "changed" || status === "draft") && (
          <button
            type="button"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                const r = await live.publishTargets([t]);
                onSaved(r.published ? "Published" : "Nothing to publish");
                await refreshStatus();
              } finally {
                setBusy(false);
              }
            }}
            className="rounded bg-emerald-500 px-3 py-1.5 font-semibold text-black hover:bg-emerald-400 disabled:opacity-50"
          >
            Publish
          </button>
        )}
        <a href={rec.item.adminHref} target="_blank" rel="noreferrer" className="ml-auto text-xs underline">All fields ↗</a>
      </div>
    </div>
  );
}
