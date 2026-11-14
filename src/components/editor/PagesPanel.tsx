"use client";

import { useEffect, useState } from "react";
import * as collections from "@/admin/collections";
import type { CollectionField, CollectionItem, CollectionSummary } from "@/admin/collections";
import * as live from "@/admin/inline";
import type { PageNode, PageVersion } from "@/admin/page-tree";
import { REGION_CHOICES } from "@/lib/regions";

/**
 * 📄 Pages and the page picker: «Pages» (built from sections) and «Collections» (records of one kind), like Webflow's
 * Pages / CMS but in plain words (docs/screens/on-page-editor.md → «Страницы и коллекции»).
 * Editor chrome: the editor's own neutral palette (as editor-ui.tsx).
 */
export type OpenRecord = { item: CollectionItem; fields: CollectionField[]; collection: string };

const REGION_LABEL: Record<string, string> = Object.fromEntries(REGION_CHOICES.map((c) => [c.region, c.label]));

/** The version of a page for the region being edited (a page for every region: its only version). */
const versionFor = (n: PageNode, region: string | null): PageVersion | undefined => n.versions.find((v) => v.region === region) ?? n.versions.find((v) => v.region === null);

/** The site as a tree, every page once; the region comes from the top bar (on-page-editor.md → «Страницы и коллекции»). */
export function PagesTree({ tree, region, currentKey, onOpen, maxHeight }: { tree: PageNode[] | null; region: string | null; currentKey: string; onOpen: (path: string) => void; maxHeight?: string }) {
  const [q, setQ] = useState("");
  const [closed, setClosed] = useState<Set<string>>(new Set());
  if (!tree) return <p className="p-4 text-sm text-neutral-500">Loading…</p>;
  const needle = q.trim().toLowerCase();
  const matches = (n: PageNode): boolean => !needle || `${n.title} ${n.type} ${n.key}`.toLowerCase().includes(needle) || n.children.some(matches);
  const row = (n: PageNode, depth: number) => {
    if (!matches(n)) return null;
    const v = versionFor(n, region);
    const open = needle || !closed.has(n.key);
    const group = !n.versions.length; // «Other pages»: a heading, not a page
    const here = n.key === currentKey;
    return (
      <li key={n.key}>
        <div className={`flex items-center gap-1 rounded pr-2 ${here ? "bg-blue-50 ring-1 ring-blue-500" : "hover:bg-neutral-100"}`} style={{ paddingLeft: 4 + depth * 16 }}>
          {n.children.length ? (
            <button type="button" aria-label={open ? `Collapse ${n.title}` : `Expand ${n.title}`} aria-expanded={!!open} onClick={() => setClosed((c) => { const x = new Set(c); if (x.has(n.key)) x.delete(n.key); else x.add(n.key); return x; })} className="w-5 shrink-0 text-xs text-neutral-500">
              {open ? "▾" : "▸"}
            </button>
          ) : (
            <span className="w-5 shrink-0" />
          )}
          {group ? (
            <span className="flex-1 py-1.5 text-xs font-semibold uppercase tracking-wide text-neutral-500">{n.title}</span>
          ) : (
            <button
              type="button"
              aria-current={here ? "page" : undefined}
              onClick={() => onOpen((v ?? n.versions[0]).path)}
              title={v ? n.title : `${n.title} — not in ${REGION_LABEL[region ?? ""] ?? "this region"}; opens ${REGION_LABEL[n.versions[0].region ?? ""] ?? ""}`}
              className={`flex min-w-0 flex-1 items-center gap-2 py-1.5 text-left text-sm ${v ? "" : "text-neutral-400"}`}
            >
              <span className="min-w-0 flex-1 truncate">{n.title}</span>
              {!v && <span className="shrink-0 text-[10px]">not in {REGION_LABEL[region ?? ""] ?? "this region"}</span>}
              {n.fieldsOnly && <span className="shrink-0 text-[10px] text-neutral-400" title="A list page: its texts are edited in place, its items in Collections">list</span>}
              {v && v.status !== "live" && <span className="shrink-0 rounded bg-amber-100 px-1 text-[10px] text-amber-900">{v.status === "draft" ? "draft" : "changes"}</span>}
            </button>
          )}
        </div>
        {open && n.children.length > 0 && <ul>{n.children.map((c) => row(c, depth + 1))}</ul>}
      </li>
    );
  };
  return (
    <div>
      <div className="border-b border-neutral-200 p-2">
        <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search pages" aria-label="Search pages" className="w-full rounded border border-neutral-300 px-2 py-1.5 text-sm" />
        {region && <p className="mt-1 px-1 text-[11px] text-neutral-500">Opens the {REGION_LABEL[region]} version — switch the region in the top bar.</p>}
      </div>
      <ul className="overflow-auto p-1" style={maxHeight ? { maxHeight } : undefined} aria-label="Pages of the site">
        {tree.map((n) => row(n, 0))}
      </ul>
    </div>
  );
}

export function PagesPanel(props: {
  tree: PageNode[] | null;
  region: string | null;
  currentKey: string;
  demo: boolean;
  onPage: (path: string) => void;
  onRecord: (r: OpenRecord) => void;
  maxHeight?: string;
}) {
  const [tab, setTab] = useState<"pages" | "collections">("pages");
  const [list, setList] = useState<CollectionSummary[] | null>(null);
  const [open, setOpen] = useState<{ key: string; title: string; where: string; newLabel: string; newHref: string; fields: CollectionField[]; items: CollectionItem[] } | null>(null);
  const [filter, setFilter] = useState<"all" | "live" | "draft" | "changed">("all");
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
    setFilter("all");
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
        <PagesTree tree={props.tree} region={props.region} currentKey={props.currentKey} onOpen={props.onPage} maxHeight={props.maxHeight} />
      ) : error ? (
        <p className="p-4 text-sm text-red-700">{error}</p>
      ) : open ? (
        <CollectionView open={open} q={q} setQ={setQ} filter={filter} setFilter={setFilter} maxHeight={props.maxHeight} onBack={() => setOpen(null)} onItem={(it) => (it.path ? props.onPage(it.path) : props.onRecord({ item: it, fields: open.fields, collection: open.title }))} />
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

type Open = { key: string; title: string; where: string; newLabel: string; newHref: string; fields: CollectionField[]; items: CollectionItem[] };
type Filter = "all" | "live" | "draft" | "changed";
const STATUS: Record<Filter, string> = { all: "All", live: "Live", draft: "Draft", changed: "Changes" };

/** One collection's records: grouped, with pictures, a status filter and search that stay on top. */
function CollectionView({ open, q, setQ, filter, setFilter, maxHeight, onBack, onItem }: { open: Open; q: string; setQ: (v: string) => void; filter: Filter; setFilter: (f: Filter) => void; maxHeight?: string; onBack: () => void; onItem: (it: CollectionItem) => void }) {
  const needle = q.trim().toLowerCase();
  const count = (f: Filter) => open.items.filter((it) => f === "all" || it.status === f).length;
  const shown = open.items.filter((it) => (filter === "all" || it.status === filter) && (!needle || `${it.title} ${it.sub} ${it.group ?? ""}`.toLowerCase().includes(needle)));
  const groups = [...new Set(shown.map((it) => it.group ?? ""))];
  const hasStatus = open.items.some((it) => it.status);
  return (
    <div className="flex h-full flex-col">
      <div className="sticky top-0 z-10 space-y-2 border-b border-neutral-200 bg-white p-2">
        <div className="flex items-center gap-2">
          <button type="button" onClick={onBack} className="rounded px-2 py-1 text-sm hover:bg-neutral-100">← Collections</button>
          <a href={open.newHref} target="_blank" rel="noreferrer" className="ml-auto rounded border border-neutral-300 px-2 py-1 text-xs hover:bg-neutral-50">+ New {open.newLabel} ↗</a>
        </div>
        <div className="px-1">
          <h3 className="text-base font-semibold">{open.title}</h3>
          <p className="text-xs text-neutral-500">{open.where}</p>
        </div>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Search ${open.title.toLowerCase()}`} aria-label={`Search ${open.title.toLowerCase()}`} className="w-full rounded border border-neutral-300 px-2 py-1.5 text-sm" />
        {hasStatus && (
          <div role="tablist" aria-label="Status" className="flex flex-wrap gap-1">
            {(Object.keys(STATUS) as Filter[]).map((f) => (
              <button key={f} type="button" role="tab" aria-selected={filter === f} onClick={() => setFilter(f)} className={`rounded-full px-2.5 py-0.5 text-xs ${filter === f ? "bg-neutral-900 text-white" : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"}`}>
                {STATUS[f]} {count(f)}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="flex-1 overflow-auto p-1" style={maxHeight ? { maxHeight } : undefined}>
        {groups.map((g) => (
          <section key={g || "-"} aria-label={g || open.title}>
            {g && <h4 className="sticky top-0 bg-white/95 px-2 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wide text-neutral-500">{g}</h4>}
            <ul>
              {shown.filter((it) => (it.group ?? "") === g).map((it) => (
                <li key={it.id}>
                  <button type="button" onClick={() => onItem(it)} className="flex w-full items-center gap-3 rounded px-2 py-2 text-left hover:bg-neutral-100">
                    {it.thumb ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={it.thumb} alt="" loading="lazy" className="h-10 w-10 shrink-0 rounded border border-neutral-200 object-cover" />
                    ) : (
                      <span aria-hidden className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-neutral-100 text-xs font-semibold text-neutral-400">{it.title.slice(0, 1)}</span>
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="line-clamp-2 text-sm leading-snug">{it.title}</span>
                      {it.sub && <span className="block truncate text-xs text-neutral-500">{it.sub}</span>}
                    </span>
                    {it.status && it.status !== "live" && <span className="shrink-0 rounded bg-amber-100 px-1 text-[10px] text-amber-900">{it.status === "draft" ? "draft" : "changes"}</span>}
                    <span className="shrink-0 text-[11px] text-neutral-400" title={it.path ? "Opens its page in the editor" : "Opens its texts on the right"}>{it.path ? "page ›" : "edit ›"}</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ))}
        {!shown.length && <p className="p-3 text-sm text-neutral-500">{open.items.length ? "Nothing matches." : "Nothing here yet."}</p>}
      </div>
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
