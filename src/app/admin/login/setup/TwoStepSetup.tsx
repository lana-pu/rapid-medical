"use client";

import Link from "next/link";
import { useState } from "react";
import { enableTwoStep } from "@/admin/two-step";

/** QR, key, code → recovery codes (shown once) → Continue. */
export function TwoStepSetup({ secret, qr }: { secret: string; qr: string }) {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [codes, setCodes] = useState<string[] | null>(null);

  if (codes) {
    return (
      <div className="space-y-4 text-sm">
        <p className="font-medium text-green-800">Two-step sign-in is on.</p>
        <p>Save these recovery codes somewhere safe. Each works once if you lose your phone; they are not shown again.</p>
        <pre className="rounded bg-neutral-100 p-3 font-mono text-xs" aria-label="Recovery codes">{codes.join("\n")}</pre>
        <Link href="/admin/start" className="block w-full rounded bg-neutral-900 px-3 py-2 text-center font-medium text-white">Continue</Link>
      </div>
    );
  }
  return (
    <form
      className="space-y-4 text-sm"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError(null);
        const r = await enableTwoStep(secret, code);
        setBusy(false);
        if ("error" in r) setError(r.error);
        else setCodes(r.codes);
      }}
    >
      <p>Scan the code with an authenticator app (Google Authenticator, Microsoft Authenticator, 1Password…), then enter the six digits it shows.</p>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={qr} alt="QR code for the authenticator app" width={180} height={180} />
      <p className="font-mono text-xs text-neutral-500">Or type this key: <span data-testid="totp-key">{secret}</span></p>
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-neutral-600">Code from the app</span>
        <input name="code" inputMode="numeric" autoComplete="one-time-code" value={code} onChange={(e) => setCode(e.target.value)} required className="w-full rounded border border-neutral-300 px-2 py-1.5" />
      </label>
      {error && <p className="rounded bg-red-50 px-3 py-2 text-red-700">{error}</p>}
      <button disabled={busy} className="w-full rounded bg-neutral-900 px-3 py-2 font-medium text-white disabled:opacity-50">{busy ? "Checking…" : "Turn on"}</button>
    </form>
  );
}
