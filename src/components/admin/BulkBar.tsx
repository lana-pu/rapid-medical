"use client";

import { useEffect, useState } from "react";

/** Appears when rows are ticked; submits the surrounding form with __action. */
export function BulkBar({ hasStatus }: { hasStatus: boolean }) {
  const [n, setN] = useState(0);

  useEffect(() => {
    const form = document.querySelector<HTMLFormElement>("form[action]");
    const count = () => setN(document.querySelectorAll<HTMLInputElement>('input[name="ids"]:checked').length);
    const all = document.querySelector<HTMLInputElement>("input[data-select-all]");
    const onAll = () => { document.querySelectorAll<HTMLInputElement>('input[name="ids"]').forEach((b) => (b.checked = all!.checked)); count(); };
    document.addEventListener("change", count);
    all?.addEventListener("change", onAll);
    return () => { document.removeEventListener("change", count); all?.removeEventListener("change", onAll); void form; };
  }, []);

  if (!n) return null;
  const confirmDelete = (e: React.MouseEvent<HTMLButtonElement>) => { if (!window.confirm(`Delete ${n} item(s)? This cannot be undone.`)) e.preventDefault(); };

  return (
    <div className="mb-2 flex items-center gap-2 rounded border border-neutral-300 bg-neutral-100 px-3 py-2 text-sm">
      <span className="font-medium">{n} selected</span>
      {hasStatus && <button name="__action" value="publish" className="rounded bg-neutral-900 px-2 py-1 text-xs text-white">Publish</button>}
      {hasStatus && <button name="__action" value="unpublish" className="rounded border border-neutral-400 bg-white px-2 py-1 text-xs">Unpublish</button>}
      <button name="__action" value="delete" onClick={confirmDelete} className="rounded border border-red-300 bg-white px-2 py-1 text-xs text-red-700">Delete</button>
    </div>
  );
}
