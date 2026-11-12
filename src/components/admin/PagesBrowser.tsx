"use client";

import { useMemo, useState } from "react";
import type { PageCard } from "@/admin/pages-index";
import type { Region } from "@/db/schema";
import { createPage } from "@/admin/page-editor";
import type { TemplateId } from "@/blocks/templates";
import { withBase } from "@/lib/demo";
import { Button, PageHeader, inputCls } from "./ui";

/** Pages list for editors: search, region filter, status in words, New page (docs/screens/admin-editor-pages.md). */

/** Same text on the server and in the browser (no locale or time-zone difference → no hydration mismatch). */
const day = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

const STATUS: Record<PageCard["status"], { text: string; cls: string }> = {
  live: { text: "Live", cls: "bg-emerald-100 text-emerald-800" },
  changed: { text: "Live, with unpublished changes", cls: "bg-amber-100 text-amber-900" },
  draft: { text: "Draft — not live yet", cls: "bg-neutral-200 text-neutral-700" },
};

export function PagesBrowser({ cards, templates, regions, lists, demo, startCreating = false }: { cards: PageCard[]; templates: { id: TemplateId; label: string; description: string }[]; regions: { label: string; region: Region }[]; lists: { label: string; href: string }[]; demo: boolean; startCreating?: boolean }) {
  const [q, setQ] = useState("");
  const [region, setRegion] = useState<string>("all");
  const [creating, setCreating] = useState(startCreating);
  const regionLabel = (r: Region | null) => (r ? regions.find((x) => x.region === r)?.label ?? r : "Global");
  const editHref = (path: string) => (demo ? withBase(path) : `/api/editor?on=1&redirect=${encodeURIComponent(path)}`);

  const shown = useMemo(() => {
    const s = q.trim().toLowerCase();
    return cards.filter((c) => (region === "all" || (region === "global" ? !c.region : c.region === region)) && (!s || `${c.title} ${c.path}`.toLowerCase().includes(s)));
  }, [cards, q, region]);

  const chips = [{ id: "all", label: "All" }, ...regions.map((r) => ({ id: r.region, label: r.label })), { id: "global", label: "Global" }];

  return (
    <>
      <PageHeader
        title="Pages"
        subtitle="Open a page to change it right on the page"
        actions={
          <Button type="button" onClick={() => setCreating(true)} disabled={demo} title={demo ? "New pages need the server; the demo has none" : undefined}>
            New page
          </Button>
        }
      />
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name or address" aria-label="Search pages" className={`${inputCls} max-w-sm`} />
        <div className="flex flex-wrap gap-1" role="group" aria-label="Region">
          {chips.map((c) => (
            <button key={c.id} type="button" aria-pressed={region === c.id} onClick={() => setRegion(c.id)} className={`rounded-full border px-3 py-1 text-sm ${region === c.id ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-300 bg-white hover:bg-neutral-100"}`}>
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {shown.length === 0 ? (
        <div className="rounded-lg border border-dashed border-neutral-300 bg-white p-8 text-center text-sm text-neutral-600">
          {q ? (
            <>
              No pages match “{q}”.{" "}
              <button type="button" className="underline" onClick={() => setQ("")}>Clear search</button>
            </>
          ) : (
            <>No pages in {chips.find((c) => c.id === region)?.label} yet.</>
          )}
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {shown.map((c) => (
            <li key={`${c.r}-${c.id}`} className="group relative overflow-hidden rounded-lg border border-neutral-200 bg-white hover:border-neutral-400">
              <a href={editHref(c.path)} className="block" aria-label={`Edit ${c.title} (${regionLabel(c.region)})`}>
                <div className="aspect-[16/7] bg-neutral-100">
                  {c.thumb ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={withBase(c.thumb)} alt="" className="h-full w-full object-cover" loading="lazy" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs uppercase tracking-wide text-neutral-400">{c.type}</div>
                  )}
                </div>
                <div className="p-3">
                  <div className="font-medium text-neutral-900">{c.title}</div>
                  <div className="mt-0.5 text-xs text-neutral-500">
                    {c.type} · {regionLabel(c.region)} · <span className="font-mono">{c.path}</span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                    <span className={`rounded px-1.5 py-0.5 font-medium ${STATUS[c.status].cls}`}>{STATUS[c.status].text}</span>
                    {c.changedBy && <span className="text-neutral-500">{c.changedBy}, {day(c.changedAt!)}</span>}
                  </div>
                </div>
              </a>
              <a href={withBase(c.adminHref)} className="absolute right-2 top-2 rounded bg-white/90 px-2 py-0.5 text-xs text-neutral-700 opacity-0 shadow group-hover:opacity-100 focus:opacity-100">Settings</a>
            </li>
          ))}
        </ul>
      )}

      <section className="mt-10">
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-neutral-500">Lists</h2>
        <p className="mb-2 text-sm text-neutral-600">These pages are built from records: change the records, the pages follow.</p>
        <div className="flex flex-wrap gap-2">
          {lists.map((l) => (
            <a key={l.href} href={withBase(l.href)} className="rounded border border-neutral-300 bg-white px-3 py-1.5 text-sm hover:bg-neutral-100">{l.label}</a>
          ))}
        </div>
      </section>

      {creating && <NewPageDialog templates={templates} regions={regions} onClose={() => setCreating(false)} onCreated={(path) => (window.location.href = editHref(path))} />}
    </>
  );
}

function NewPageDialog({ templates, regions, onClose, onCreated }: { templates: { id: TemplateId; label: string; description: string }[]; regions: { label: string; region: Region }[]; onClose: () => void; onCreated: (path: string) => void }) {
  const [template, setTemplate] = useState<TemplateId>(templates[0].id);
  const [title, setTitle] = useState("");
  const [region, setRegion] = useState<string>(regions[0].region);
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [err, setErr] = useState<{ field?: string; error: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const auto = (t: string) => t.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  const therapy = template === "therapy";
  const effRegion = therapy && region === "global" ? regions[0].region : region;
  const preview = therapy ? `/${effRegion}/therapies/${slug || "…"}` : effRegion === "global" ? `/${slug || "…"}` : `/${effRegion}/${slug || "…"}`;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    const res = await createPage({ template, title, region: effRegion, slug });
    setBusy(false);
    if ("error" in res) return setErr(res);
    onCreated(res.path);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 pt-20" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <form role="dialog" aria-label="New page" onSubmit={submit} className="w-full max-w-lg space-y-4 rounded-lg bg-white p-5 shadow-2xl">
        <h2 className="text-lg font-semibold">New page</h2>
        <fieldset>
          <legend className="mb-1 text-xs font-medium text-neutral-600">Template</legend>
          <div className="space-y-1.5">
            {templates.map((t) => (
              <label key={t.id} className={`flex cursor-pointer gap-2 rounded border p-2 text-sm ${template === t.id ? "border-neutral-900" : "border-neutral-200"}`}>
                <input type="radio" name="template" value={t.id} checked={template === t.id} onChange={() => setTemplate(t.id)} />
                <span>
                  <span className="block font-medium">{t.label}</span>
                  <span className="block text-xs text-neutral-500">{t.description}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
        <label className="block text-sm">
          <span className="mb-1 block text-xs font-medium text-neutral-600">Name</span>
          <input autoFocus value={title} onChange={(e) => { setTitle(e.target.value); if (!slugTouched) setSlug(auto(e.target.value)); }} className={inputCls} />
          {err?.field === "title" && <span className="mt-1 block text-xs text-red-700">{err.error}</span>}
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-xs font-medium text-neutral-600">Region</span>
          <select value={effRegion} onChange={(e) => setRegion(e.target.value)} className={inputCls}>
            {regions.map((r) => <option key={r.region} value={r.region}>{r.label}</option>)}
            {!therapy && <option value="global">Global (no region in the address)</option>}
          </select>
          {err?.field === "region" && <span className="mt-1 block text-xs text-red-700">{err.error}</span>}
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-xs font-medium text-neutral-600">Address</span>
          <input value={slug} onChange={(e) => { setSlug(e.target.value); setSlugTouched(true); }} className={`${inputCls} font-mono`} />
          <span className="mt-1 block text-xs text-neutral-500 font-mono">{preview}</span>
          {err?.field === "slug" && <span className="mt-1 block text-xs text-red-700">{err.error}</span>}
        </label>
        {err && !err.field && <p className="text-sm text-red-700">{err.error}</p>}
        {therapy && <p className="text-xs text-neutral-500">A therapy page appears in the site menu after Publish.</p>}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={busy}>{busy ? "Creating…" : "Create and open"}</Button>
        </div>
      </form>
    </div>
  );
}
