"use client";
import { startTransition, useActionState, useMemo, useState } from "react";
import type { MaterialKind } from "@/db/schema";
import { REGION_CHOICES } from "@/lib/regions";
import { MATERIAL_KIND_LABELS } from "@/lib/material";
import { instructionsFor, type FullTextMode, type Suggestion } from "@/lib/document-import";
import { createFromDocument } from "@/admin/document-actions";
import { inputCls } from "@/components/admin/ui";

type Props = {
  pdf: { id: number; filename: string; url: string; pageCount: number | null; hasText: boolean };
  suggestion: Suggestion;
  nct: string | null;
  products: { id: number; name: string }[];
  today: string;
};

/** Defaults by kind (docs/screens/admin-create-from-document.md → Шаг 2). */
const MODE: Record<MaterialKind, FullTextMode> = { study: "embed", publication: "link", news: "embed", case: "embed", document: "embed" };
const WHERE: Record<MaterialKind, { evidence: boolean; news: boolean }> = {
  study: { evidence: true, news: true }, publication: { evidence: true, news: false }, news: { evidence: false, news: true }, case: { evidence: false, news: false }, document: { evidence: false, news: false },
};
const KINDS = Object.keys(MATERIAL_KIND_LABELS) as MaterialKind[];
const h = "text-sm font-semibold";
const box = "rounded-lg border border-neutral-200 bg-white p-5";

export function DocumentImportForm({ pdf, suggestion, nct, products, today }: Props) {
  const [state, action, pending] = useActionState(createFromDocument, null);
  const [kind, setKind] = useState<MaterialKind>(suggestion.kind);
  const [copied, setCopied] = useState(false);
  const instructions = useMemo(() => instructionsFor(kind), [kind]);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(instructions);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };
  const where = WHERE[kind];
  return (
    // submitted by hand: a form action would reset the form after an error — the pasted answer and the chosen kind stay
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(() => action(fd));
      }}
      className="grid max-w-5xl gap-6 lg:grid-cols-[minmax(0,1fr)_16rem]"
    >
      <input type="hidden" name="mediaId" value={pdf.id} />
      <div className="space-y-6">
        <fieldset className={box}>
          <legend className={`${h} px-1`}>1. What is it?</legend>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {KINDS.map((k) => (
              <label key={k} className={`flex items-start gap-2 rounded border p-3 text-sm ${k === kind ? "border-neutral-900" : "border-neutral-200"}`}>
                <input type="radio" name="kind" value={k} checked={k === kind} onChange={() => setKind(k)} className="mt-0.5" />
                <span>
                  <span className="font-medium">{MATERIAL_KIND_LABELS[k]}</span>
                  {k === suggestion.kind && <span className="block text-xs text-neutral-600">Suggested from the file · {suggestion.reason}</span>}
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className={box}>
          <legend className={`${h} px-1`}>2. Details</legend>
          <div className="mt-2 grid gap-4 sm:grid-cols-2">
            {kind === "document" && (
              <label className="text-sm sm:col-span-2">Title *<input name="title" required className={`${inputCls} mt-1`} defaultValue={pdf.filename.replace(/-[0-9a-f]{6}\.pdf$|\.pdf$/i, "").replace(/[-_]+/g, " ")} /></label>
            )}
            <label className="text-sm">Date<input type="date" name="publishedOn" defaultValue={today} className={`${inputCls} mt-1`} /></label>
            <label className="text-sm">Product
              <select name="productId" defaultValue="" className={`${inputCls} mt-1`}>
                <option value="">— none —</option>
                {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </label>
            <fieldset className="text-sm sm:col-span-2">
              <legend>Show in regions <span className="text-xs text-neutral-500">(none ticked = all)</span></legend>
              <div className="mt-1 flex flex-wrap gap-4">
                {REGION_CHOICES.map((r) => <label key={r.region} className="flex items-center gap-2"><input type="checkbox" name="regions" value={r.region} />{r.label}</label>)}
              </div>
            </fieldset>
            <label className="text-sm">Link to the original<input name="url" type="url" placeholder="https://doi.org/…" className={`${inputCls} mt-1`} /></label>
            {kind === "study" && <label className="text-sm">NCT number<input name="nct" defaultValue={nct ?? ""} placeholder="NCT04518670" className={`${inputCls} mt-1`} /><span className="mt-1 block text-xs text-neutral-500">{nct ? "Found in the PDF. " : ""}The study passport is completed from ClinicalTrials.gov; the PDF&apos;s values come first.</span></label>}
          </div>
          {kind !== "document" && (
            /* key by kind: the defaults follow a change of kind; typed details above stay */
            <fieldset key={`mode-${kind}`} className="mt-5 text-sm">
              <legend className="font-medium">Full text on the page</legend>
              <div className="mt-1 grid gap-1">
                <label className="flex gap-2"><input type="radio" name="mode" value="embed" defaultChecked={MODE[kind] === "embed"} />Show the PDF — the exact original (own posters, press releases)</label>
                <label className="flex gap-2"><input type="radio" name="mode" value="copy" defaultChecked={MODE[kind] === "copy"} />Copy the text onto the page — readable on a phone, found by search</label>
                <label className="flex gap-2"><input type="radio" name="mode" value="link" defaultChecked={MODE[kind] === "link"} />Link to the original only — when we may not copy it (journal articles)</label>
              </div>
            </fieldset>
          )}
          <fieldset key={`where-${kind}`} className="mt-5 text-sm">
            <legend className="font-medium">Where it appears</legend>
            <div className="mt-1 flex flex-wrap gap-4">
              <label className="flex items-center gap-2"><input type="checkbox" name="showInEvidence" defaultChecked={where.evidence} />Evidence</label>
              <label className="flex items-center gap-2"><input type="checkbox" name="showInNews" defaultChecked={where.news} />News &amp; Events</label>
              <label className="flex items-center gap-2"><input type="checkbox" name="featured" defaultChecked />Highlight</label>
            </div>
            <p className="mt-1 text-xs text-neutral-500">Highlights: home, top of News &amp; Events, featured on Evidence — the newest ones show.</p>
          </fieldset>
        </fieldset>

        {kind !== "document" && (
          <fieldset className={box}>
            <legend className={`${h} px-1`}>3. Summary with your own AI</legend>
            <p className="mt-1 text-sm text-neutral-600">The summary on top comes from your AI assistant — ChatGPT, Claude or Copilot, whichever you already use. The site does not pay for AI, and it checks every number against the PDF.</p>
            <ol className="mt-4 space-y-4 text-sm">
              <li>
                <span className="font-medium">Copy the instructions</span>
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <button type="button" onClick={copy} className="rounded border border-neutral-300 px-3 py-1.5 font-medium hover:border-neutral-900">Copy instructions for AI</button>
                  <span aria-live="polite" className="text-xs text-neutral-600">{copied ? "Copied" : ""}</span>
                </div>
                <details className="mt-2"><summary className="cursor-pointer text-xs text-neutral-600">See the instructions</summary><pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap rounded bg-neutral-50 p-3 text-xs">{instructions}</pre></details>
              </li>
              <li><span className="font-medium">In your AI chat: attach the PDF and paste the instructions.</span> The answer lists the key numbers, each with the exact sentence it came from.</li>
              <li>
                <label htmlFor="answer" className="font-medium">Paste the answer here</label>
                <textarea id="answer" name="answer" rows={10} required className={`${inputCls} mt-2 font-mono text-xs`} placeholder='{ "title": "…", "conclusion": "…", "figures": [ … ] }' />
              </li>
            </ol>
          </fieldset>
        )}

        {state?.error && <p role="alert" data-testid="import-error" className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{state.error}</p>}
        <div className="flex items-center gap-3">
          <button type="submit" disabled={pending} className="rounded bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60">{pending ? "Building the draft…" : "Build the draft"}</button>
          <span className="text-xs text-neutral-500">A draft: nothing goes on the site until you publish it.</span>
        </div>
      </div>

      <aside className="space-y-3 text-sm">
        <div className={box}>
          <div className="text-xs uppercase tracking-wide text-neutral-500">The PDF</div>
          <div className="mt-1 break-words font-medium">{pdf.filename}</div>
          <div className="text-xs text-neutral-500">{pdf.pageCount ? `${pdf.pageCount} pages` : "PDF"}</div>
          <a href={pdf.url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block underline">Open the PDF ↗</a>
        </div>
        {!pdf.hasText && <p role="note" className="rounded border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">The site could not read text in this PDF (a scan?). Quotes cannot be checked: every number will need «Looks right».</p>}
      </aside>
    </form>
  );
}
