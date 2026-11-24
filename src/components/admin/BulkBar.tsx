"use client";

import { useEffect, useState } from "react";

/**
 * Appears when rows are ticked: a dark bar floating at the bottom of the list (docs/screens/admin-list.md → «Массовые
 * действия»), above the admin's bottom navigation on a phone; submits the surrounding form with __action.
 * `fixed`: pages that always stay on the site (Home, About…) — only Publish, no Unpublish or Delete that would do nothing.
 * `canDelete`: Delete is the admin's (ADR-006 → «Права»).
 */
export function BulkBar({ hasStatus, fixed = false, canDelete = false }: { hasStatus: boolean; fixed?: boolean; canDelete?: boolean }) {
  const [n, setN] = useState(0);

  useEffect(() => {
    const count = () => setN(document.querySelectorAll<HTMLInputElement>('input[name="ids"]:checked').length);
    const all = document.querySelector<HTMLInputElement>("input[data-select-all]");
    const onAll = () => { document.querySelectorAll<HTMLInputElement>('input[name="ids"]').forEach((b) => (b.checked = all!.checked)); count(); };
    document.addEventListener("change", count);
    all?.addEventListener("change", onAll);
    return () => { document.removeEventListener("change", count); all?.removeEventListener("change", onAll); };
  }, []);

  if (!n) return null;
  const confirmDelete = (e: React.MouseEvent<HTMLButtonElement>) => { if (!window.confirm(`Delete ${n} item(s)? This cannot be undone.`)) e.preventDefault(); };
  const clear = () => {
    document.querySelectorAll<HTMLInputElement>('input[name="ids"], input[data-select-all]').forEach((b) => (b.checked = false));
    setN(0);
  };
  const btn = "rounded-md border border-white/25 px-2.5 py-1 text-[13px] hover:bg-white/10";

  return (
    <div role="toolbar" aria-label="Selected items" className="sticky bottom-[4.5rem] z-30 mx-auto mt-3 flex w-fit max-w-full flex-wrap items-center gap-2 rounded-xl bg-neutral-900 py-2 pl-4 pr-2 text-sm text-white shadow-xl sm:bottom-4">
      <span><b className="font-semibold tabular-nums">{n}</b> selected</span>
      {hasStatus && <button name="__action" value="publish" className={btn}>Publish</button>}
      {hasStatus && !fixed && <button name="__action" value="unpublish" className={btn}>Unpublish</button>}
      {!fixed && canDelete && <button name="__action" value="delete" onClick={confirmDelete} className={`${btn} text-red-300`}>Delete</button>}
      <button type="button" onClick={clear} aria-label="Clear the selection" className="rounded-md px-2 py-1 text-white/60 hover:text-white">✕</button>
    </div>
  );
}
