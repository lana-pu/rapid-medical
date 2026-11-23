"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

/** Upload a PDF through the media library's own upload, then go on to step 2 with it. */
export function PdfUpload() {
  const router = useRouter();
  const [state, setState] = useState<{ busy: boolean; error: string | null }>({ busy: false, error: null });
  const upload = async (file: File | undefined) => {
    if (!file) return;
    setState({ busy: true, error: null });
    const fd = new FormData();
    fd.append("file", file);
    try {
      const r = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const j = (await r.json()) as { id?: number; error?: string };
      if (!r.ok || !j.id) return setState({ busy: false, error: j.error ?? "Upload failed" });
      router.push(`/admin/create-from-document/${j.id}`);
    } catch {
      setState({ busy: false, error: "Upload failed — check the connection and try again" });
    }
  };
  return (
    <div>
      <label className="inline-flex cursor-pointer items-center gap-2 rounded bg-neutral-900 px-4 py-2 text-sm font-medium text-white aria-disabled:opacity-60" aria-disabled={state.busy}>
        <input type="file" accept="application/pdf" className="sr-only" disabled={state.busy} onChange={(e) => upload(e.target.files?.[0])} />
        {state.busy ? "Reading the PDF…" : "Choose a PDF…"}
      </label>
      {state.busy && <p className="mt-2 text-xs text-neutral-500">Drawing its pages and reading its text — a long PDF takes up to a minute.</p>}
      {state.error && <p role="alert" className="mt-2 text-sm text-red-700">{state.error}</p>}
    </div>
  );
}
