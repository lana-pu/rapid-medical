"use client";

import { useEffect, useState } from "react";
import { withBase } from "@/lib/demo";

/**
 * Static demo (GitHub Pages) runtime glue:
 *  - every internal link is a full page load (there is no Next server to answer RSC navigations);
 *  - every form submit is swallowed with a "demo" toast (no server actions either).
 */
export function DemoShell() {
  const [toast, setToast] = useState<string | null>(null);
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as HTMLElement).closest<HTMLAnchorElement>("a[href]");
      if (!a) return;
      const href = a.getAttribute("href") || "";
      if (href.startsWith("#") || /^(https?:|mailto:|tel:)/.test(href) || a.target === "_blank") return;
      if ((e.target as HTMLElement).closest("[data-e]")) return; // editor handles its own clicks
      e.preventDefault();
      e.stopPropagation();
      window.location.href = a.href;
    };
    const onSubmit = (e: Event) => {
      const form = e.target as HTMLFormElement;
      if (form.closest("#rm-editor-ui")) return; // editor panels handle their own submits
      e.preventDefault();
      e.stopPropagation();
      if (form.querySelector("input[name=password]") && /\/admin\/login\/?$/.test(location.pathname)) {
        window.location.href = withBase("/admin"); // demo: any credentials "work"
        return;
      }
      setToast(form.closest("main, aside") && /\/admin\//.test(location.pathname + "/") ? "Saved — demo mode: changes stay in this browser session only." : "Demo mode: the form is not sent anywhere.");
      setTimeout(() => setToast(null), 3000);
    };
    document.addEventListener("click", onClick, true);
    document.addEventListener("submit", onSubmit, true);
    return () => {
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("submit", onSubmit, true);
    };
  }, []);
  if (!toast) return null;
  return <div className="fixed bottom-20 left-1/2 z-[2000] -translate-x-1/2 rounded bg-neutral-900 px-4 py-2 text-sm text-white shadow-xl">{toast}</div>;
}
