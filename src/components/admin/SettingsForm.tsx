"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "./ui";

/**
 * A settings group's form with Save in a bar stuck to the bottom of the screen (docs/screens/admin-settings.md →
 * «Иерархия», decision 2026-11-27; reference: Shopify's save bar): Save is always at hand; with changes — «Unsaved
 * changes» and Discard, which reloads the group without saving. Leaving with changes asks first.
 */
export function SettingsForm({ action, discardHref, children }: { action: (fd: FormData) => Promise<void>; discardHref: string; children: React.ReactNode }) {
  const ref = useRef<HTMLFormElement>(null);
  const baseline = useRef("");
  const submitting = useRef(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    const form = ref.current;
    if (!form) return;
    // every field, the lists' hidden JSON included; «__» keys are the form's own
    const read = () => JSON.stringify([...new FormData(form).entries()].filter(([k, v]) => typeof v === "string" && !k.startsWith("__")));
    baseline.current = read();
    let t: ReturnType<typeof setTimeout> | undefined;
    // lists change their hidden value without an input event (add, remove, drag): check after any interaction
    const check = () => {
      clearTimeout(t);
      t = setTimeout(() => setDirty(read() !== baseline.current), 0);
    };
    const events = ["input", "change", "click", "keyup", "drop", "pointerup"] as const;
    events.forEach((e) => form.addEventListener(e, check));
    const leave = (e: BeforeUnloadEvent) => {
      if (!submitting.current && read() !== baseline.current) e.preventDefault();
    };
    window.addEventListener("beforeunload", leave);
    return () => {
      clearTimeout(t);
      events.forEach((e) => form.removeEventListener(e, check));
      window.removeEventListener("beforeunload", leave);
    };
  }, []);

  return (
    <form ref={ref} action={action} onSubmit={() => (submitting.current = true)} className="space-y-6">
      {children}
      {/* above the phone's bottom bar of spaces (h-14), at the very bottom from sm */}
      <div className="sticky bottom-14 z-20 -mx-4 flex flex-wrap items-center justify-end gap-3 border-t border-neutral-200 bg-white px-4 py-3 sm:bottom-0 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        {dirty && (
          <>
            <span role="status" className="mr-auto inline-flex items-center gap-1.5 text-sm text-amber-900">
              <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-amber-500" />
              Unsaved changes
            </span>
            {/* a full load, so the lists drop what was typed */}
            <a href={discardHref} onClick={() => (submitting.current = true)} className="inline-flex items-center rounded border border-neutral-300 bg-white px-3 py-2 text-sm font-medium text-neutral-800 hover:bg-neutral-100">
              Discard
            </a>
          </>
        )}
        <Button type="submit">Save</Button>
      </div>
    </form>
  );
}
