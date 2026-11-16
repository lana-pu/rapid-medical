"use client";

import { useActionState, useState } from "react";
import type { SeoVersion } from "@/admin/seo";
import { saveSeo, type SeoSaved } from "@/admin/seo-actions";
import { publishResource } from "@/admin/actions";
import { DESCRIPTION_MAX, TITLE_MAX } from "@/lib/seo";

/**
 * One page in one region in Search & sharing (docs/screens/admin-seo.md): the two fields with their counters and a
 * hint, the snippet as Google shows it, Save; a page with unpublished changes gets Publish. Admin chrome palette.
 */

const HOST = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.rapid-medical.com").replace(/^https?:\/\//, "").replace(/\/$/, "");

function Counter({ n, max }: { n: number; max: number }) {
  return <span className={`text-xs tabular-nums ${n > max ? "font-medium text-amber-700" : "text-neutral-400"}`}>{n}/{max}</span>;
}

export function SeoEditor({ v, back }: { v: SeoVersion; back: string }) {
  const [title, setTitle] = useState(v.title);
  const [description, setDescription] = useState(v.description);
  const [saved, action, busy] = useActionState<SeoSaved, FormData>(saveSeo, null);
  const changed = title !== v.title || description !== v.description;
  const shown = title || v.fallbackTitle;

  return (
    <section aria-label={`Google texts — ${v.label}`} className="rounded-lg border border-neutral-200 bg-white">
      <div className="flex items-center justify-between gap-2 border-b border-neutral-100 px-5 py-3">
        <span className="font-semibold text-neutral-900">{v.label}</span>
        {v.pending && <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-900">unpublished changes</span>}
      </div>
      <div className="grid gap-6 p-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <form action={action} className="space-y-4">
          {v.target.kind === "record" ? (
            <>
              <input type="hidden" name="kind" value="record" />
              <input type="hidden" name="r" value={v.target.r} />
              <input type="hidden" name="id" value={v.target.id} />
            </>
          ) : (
            <>
              <input type="hidden" name="kind" value="setting" />
              <input type="hidden" name="titleKey" value={v.target.title} />
              <input type="hidden" name="descriptionKey" value={v.target.description} />
            </>
          )}
          <label className="block">
            <span className="mb-1 flex items-baseline justify-between text-sm font-medium text-neutral-800">Title in Google <Counter n={title.length} max={TITLE_MAX} /></span>
            <input name="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={v.fallbackTitle} className="w-full rounded border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none" />
            <span className="mt-1 block text-xs text-neutral-500">The page&apos;s name and what it is about. Empty — “{v.fallbackTitle}”.</span>
          </label>
          <label className="block">
            <span className="mb-1 flex items-baseline justify-between text-sm font-medium text-neutral-800">Description in Google <Counter n={description.length} max={DESCRIPTION_MAX} /></span>
            <textarea name="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full rounded border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none" />
            <span className="mt-1 block text-xs text-neutral-500">What the page offers, in one or two sentences. Empty — Google picks text from the page.</span>
          </label>
          <div className="flex flex-wrap items-center gap-3">
            <button disabled={busy || !changed} className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-40">{busy ? "Saving…" : "Save"}</button>
            {saved?.ok && !changed && <span role="status" className="text-sm text-neutral-600">{saved.pending ? "Saved. It goes live when this page is published." : "Saved — live on the site."}</span>}
            {saved && !saved.ok && <span role="alert" className="text-sm text-red-700">{saved.error}</span>}
          </div>
        </form>
        <div>
          <div className="mb-2 text-xs font-medium uppercase tracking-wide text-neutral-500">In Google</div>
          <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
            <div className="truncate text-xs text-neutral-600">{HOST} › {v.path.split("?")[0].split("/").filter(Boolean).join(" › ") || ""}</div>
            <div className="mt-0.5 line-clamp-1 text-lg leading-snug text-blue-800">{shown.length > TITLE_MAX ? `${shown.slice(0, TITLE_MAX - 1)}…` : shown}</div>
            <p className="mt-0.5 line-clamp-2 text-sm text-neutral-700">{description ? (description.length > DESCRIPTION_MAX ? `${description.slice(0, DESCRIPTION_MAX - 1)}…` : description) : <span className="text-neutral-400">Google will pick text from the page.</span>}</p>
          </div>
          {v.pending && v.target.kind === "record" && (
            <form action={publishResource} className="mt-3 flex items-center gap-3 text-sm">
              <input type="hidden" name="__resource" value={v.target.r} />
              <input type="hidden" name="__id" value={v.target.id} />
              <input type="hidden" name="__back" value={back} />
              <button className="rounded border border-neutral-300 bg-white px-3 py-1.5 font-medium hover:bg-neutral-50">Publish {v.label}</button>
              <span className="text-xs text-neutral-500">Publishes every unpublished change of this page in {v.label}.</span>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
