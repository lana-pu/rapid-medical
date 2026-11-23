"use client";

import { useState } from "react";

/**
 * «Copy link for a post» (docs/screens/admin-sections.md → «Экран страницы»): the page's address with a LinkedIn
 * campaign tag, so the post shows up in Analytics → «LinkedIn posts and campaigns». Admin chrome: neutral palette.
 */

const SITE = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.rapid-medical.com").replace(/\/$/, "");
export const campaignTag = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);
export const postLink = (path: string, campaign: string) => {
  const tag = campaignTag(campaign);
  return `${SITE}${path}?utm_source=linkedin&utm_medium=social${tag ? `&utm_campaign=${tag}` : ""}`;
};

export function CopyPostLink({ versions }: { versions: { label: string; path: string }[] }) {
  const [open, setOpen] = useState(false);
  const [path, setPath] = useState(versions[0]?.path ?? "/");
  const [campaign, setCampaign] = useState("");
  const [copied, setCopied] = useState(false);
  if (!versions.length) return null;
  const link = postLink(path, campaign);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* the field stays selectable: copy by hand */
    }
  };

  return (
    <div className="relative">
      <button type="button" aria-expanded={open} onClick={() => setOpen((o) => !o)} className="inline-flex items-center rounded border border-neutral-300 bg-white px-3 py-2 text-sm font-medium text-neutral-800 hover:bg-neutral-100">
        Copy link for a post
      </button>
      {open && (
        <div role="dialog" aria-label="Link for a post" className="absolute right-0 top-full z-30 mt-2 w-[26rem] max-sm:fixed max-sm:inset-x-4 max-sm:top-14 max-sm:w-auto space-y-3 rounded-lg border border-neutral-200 bg-white p-4 text-sm shadow-xl">
          <p className="text-neutral-600">A link for a LinkedIn post. Visits and requests from it appear in Analytics under the campaign name.</p>
          {versions.length > 1 && (
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-neutral-600">Region</span>
              <select value={path} onChange={(e) => setPath(e.target.value)} className="w-full rounded border border-neutral-300 px-2 py-1.5">
                {versions.map((v) => <option key={v.path} value={v.path}>{v.label}</option>)}
              </select>
            </label>
          )}
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-neutral-600">Campaign name</span>
            <input value={campaign} onChange={(e) => setCampaign(e.target.value)} placeholder="e.g. ESMINT 2026 recap" className="w-full rounded border border-neutral-300 px-2 py-1.5" />
          </label>
          <input readOnly aria-label="Link" value={link} onFocus={(e) => e.currentTarget.select()} className="w-full rounded border border-neutral-200 bg-neutral-50 px-2 py-1.5 font-mono text-xs" />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setOpen(false)} className="rounded px-3 py-1.5 hover:bg-neutral-100">Close</button>
            <button type="button" onClick={copy} className="rounded bg-neutral-900 px-3 py-1.5 font-medium text-white hover:bg-neutral-700">{copied ? "Copied" : "Copy"}</button>
          </div>
        </div>
      )}
    </div>
  );
}
