"use client";

import { useState } from "react";

/** Share a material (DESIGN.md → Страница из документа): LinkedIn first — that is where the posts go — X, copy link. */
export function ShareLinks({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);
  const url = () => window.location.origin + window.location.pathname;
  const btn = "rounded border border-border px-3 py-1.5 text-xs hover:border-foreground";
  const open = (href: string) => window.open(href, "_blank", "noopener,noreferrer");
  return (
    <div className="flex flex-wrap gap-2" aria-label="Share">
      <button type="button" className={btn} onClick={() => open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url())}`)}>LinkedIn</button>
      <button type="button" className={btn} onClick={() => open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url())}&text=${encodeURIComponent(title)}`)}>X</button>
      <button
        type="button"
        className={btn}
        onClick={() => {
          navigator.clipboard?.writeText(url()).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }, () => setCopied(false));
        }}
      >
        {copied ? "Copied" : "Copy link"}
      </button>
    </div>
  );
}
