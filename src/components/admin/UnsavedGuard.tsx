"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Tracks a form's dirtiness: warns before leaving the page and keeps a local
 * backup of the serialised form so an accidental close can be recovered.
 *
 * Wraps the form via a ref: <form ref={ref}> + <UnsavedGuard formRef={ref} storageKey=… />
 */
export function UnsavedGuard({ formRef, storageKey }: { formRef: React.RefObject<HTMLFormElement | null>; storageKey: string }) {
  const [dirty, setDirty] = useState(false);
  const [backup, setBackup] = useState<{ at: number; data: Record<string, string> } | null>(null);
  const baseline = useRef<string>("");
  const submitting = useRef(false);
  const dirtyRef = useRef(false);

  const serialise = () => {
    const form = formRef.current;
    if (!form) return {};
    const out: Record<string, string> = {};
    for (const [k, v] of new FormData(form).entries()) if (typeof v === "string" && !k.startsWith("__")) out[k] = v;
    return out;
  };

  useEffect(() => {
    const form = formRef.current;
    if (!form) return;
    baseline.current = JSON.stringify(serialise());
    // defer the state update out of the effect body
    const t0 = setTimeout(() => {
      try {
        const raw = localStorage.getItem(storageKey);
        if (raw) {
          const b = JSON.parse(raw) as { at: number; data: Record<string, string> };
          if (JSON.stringify(b.data) !== baseline.current) setBackup(b);
          else localStorage.removeItem(storageKey);
        }
      } catch { /* storage unavailable */ }
    }, 0);

    let timer: ReturnType<typeof setTimeout> | null = null;
    const onInput = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        if (submitting.current) return;
        const now = JSON.stringify(serialise());
        const d = now !== baseline.current;
        dirtyRef.current = d;
        setDirty(d);
        try {
          if (d) localStorage.setItem(storageKey, JSON.stringify({ at: Date.now(), data: JSON.parse(now) }));
          else localStorage.removeItem(storageKey);
        } catch { /* ignore */ }
      }, 400);
    };
    const onSubmit = () => {
      submitting.current = true;
      try { localStorage.removeItem(storageKey); } catch { /* ignore */ }
    };
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (dirtyRef.current && !submitting.current) { e.preventDefault(); }
    };
    form.addEventListener("input", onInput);
    form.addEventListener("change", onInput);
    form.addEventListener("submit", onSubmit);
    // autosave stored the form: nothing to warn about or to keep locally
    const onSaved = () => {
      baseline.current = JSON.stringify(serialise());
      dirtyRef.current = false;
      setDirty(false);
      try { localStorage.removeItem(storageKey); } catch { /* ignore */ }
    };
    form.addEventListener("rm-saved", onSaved);
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      clearTimeout(t0);
      form.removeEventListener("input", onInput);
      form.removeEventListener("change", onInput);
      form.removeEventListener("submit", onSubmit);
      form.removeEventListener("rm-saved", onSaved);
      window.removeEventListener("beforeunload", onBeforeUnload);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  // Intercept in-app navigation (Next <Link>) while dirty
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!dirtyRef.current || submitting.current) return;
      const a = (e.target as HTMLElement).closest("a[href]");
      if (!a || a.getAttribute("target") === "_blank") return;
      if (!window.confirm("You have unsaved changes. Leave this page?")) { e.preventDefault(); e.stopPropagation(); }
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  const restore = () => {
    const form = formRef.current;
    if (!form || !backup) return;
    for (const [k, v] of Object.entries(backup.data)) {
      const el = form.elements.namedItem(k) as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null;
      if (!el) continue;
      if (el instanceof HTMLInputElement && el.type === "checkbox") el.checked = v === "on";
      else el.value = v;
      el.dispatchEvent(new Event("input", { bubbles: true }));
    }
    setBackup(null);
    dirtyRef.current = true;
    setDirty(true);
    // Rich text / repeaters keep their own state; tell the user what to check
    window.alert("Simple fields restored. Rich text and list fields keep their saved version — please re-check them.");
  };
  const discard = () => { try { localStorage.removeItem(storageKey); } catch { /* ignore */ } setBackup(null); };

  return (
    <>
      {backup && (
        <div className="mb-4 flex items-center gap-3 rounded border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          <span>Unsaved changes from {new Date(backup.at).toLocaleString()} were found on this device.</span>
          <button type="button" onClick={restore} className="rounded bg-amber-900 px-2 py-1 text-xs text-white">Restore</button>
          <button type="button" onClick={discard} className="text-xs underline">Discard</button>
        </div>
      )}
      {dirty && <span className="fixed bottom-20 right-6 z-40 rounded-full bg-amber-500 px-3 py-1 text-xs font-medium text-white shadow">Unsaved changes</span>}
    </>
  );
}
