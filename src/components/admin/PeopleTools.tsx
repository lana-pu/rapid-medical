"use client";

import { useState } from "react";
import { invitePerson, inviteAgain, setPassword } from "@/admin/people";
import { DEMO } from "@/lib/demo";
import { Button, inputCls } from "./ui";

/** People and roles: invite, invite link again, a new password (docs/screens/admin-people.md). */

export const ROLE_TEXT: Record<string, { label: string; text: string }> = {
  editor: { label: "Editor", text: "changes text and pictures, builds pages from templates, publishes" },
  designer: { label: "Designer", text: "the same, and changes how sections look" },
  admin: { label: "Admin", text: "the same, and people, settings, integrations" },
};

function LinkBox({ name, link }: { name: string; link: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="space-y-2 text-sm">
      <p>Invite link for {name} · valid 7 days:</p>
      <input readOnly value={link} aria-label="Invite link" className={`${inputCls} font-mono text-xs`} onFocus={(e) => e.currentTarget.select()} />
      <Button type="button" variant="secondary" onClick={() => navigator.clipboard?.writeText(link).then(() => setCopied(true))}>{copied ? "Copied" : "Copy"}</Button>
    </div>
  );
}

export function InviteButton() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("editor");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [link, setLink] = useState<string | null>(null);
  const close = () => { setOpen(false); setLink(null); setError(null); setEmail(""); setName(""); setRole("editor"); };
  if (!open) return <Button type="button" onClick={() => setOpen(true)} disabled={DEMO} title={DEMO ? "Invites need the server; not in the demo" : undefined}>Invite a person</Button>;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 pt-16" onMouseDown={(e) => e.target === e.currentTarget && !busy && close()}>
      <div role="dialog" aria-label="Invite a person" className="w-full max-w-lg space-y-4 rounded-lg bg-white p-5 shadow-2xl">
        <h2 className="text-lg font-semibold">Invite a person</h2>
        {link ? (
          <>
            <LinkBox name={name} link={link} />
            <div className="flex justify-end"><Button type="button" onClick={close}>Done</Button></div>
          </>
        ) : (
          <form
            className="space-y-4"
            onSubmit={async (e) => {
              e.preventDefault();
              setBusy(true);
              setError(null);
              const r = await invitePerson(email, name, role);
              setBusy(false);
              if ("error" in r) setError(r.error);
              else setLink(r.link);
            }}
          >
            <label className="block text-sm"><span className="mb-1 block text-xs font-medium text-neutral-600">Email</span><input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} /></label>
            <label className="block text-sm"><span className="mb-1 block text-xs font-medium text-neutral-600">Name</span><input required value={name} onChange={(e) => setName(e.target.value)} className={inputCls} /></label>
            <fieldset className="space-y-2 text-sm">
              <legend className="mb-1 text-xs font-medium text-neutral-600">What they can do</legend>
              {Object.entries(ROLE_TEXT).map(([v, r]) => (
                <label key={v} className="flex gap-2">
                  <input type="radio" name="role" value={v} checked={role === v} onChange={() => setRole(v)} />
                  <span><b>{r.label}</b> — {r.text}</span>
                </label>
              ))}
            </fieldset>
            <p className="text-xs text-neutral-500">They get an email with a link. Two-step sign-in is set up on the first visit.</p>
            {error && <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={close} disabled={busy}>Cancel</Button>
              <Button type="submit" disabled={busy}>{busy ? "Sending…" : "Send invite"}</Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export function InviteAgain({ id, name }: { id: number; name: string }) {
  const [link, setLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  if (DEMO) return null;
  if (link) return <LinkBox name={name} link={link} />;
  return (
    <>
      <button type="button" className="text-xs underline" onClick={async () => { const r = await inviteAgain(id); if ("error" in r) setError(r.error); else setLink(r.link); }}>
        Copy invite link again
      </button>
      {error && <span className="ml-2 text-xs text-red-700">{error}</span>}
    </>
  );
}

export function NewPassword({ id }: { id: number }) {
  const [msg, setMsg] = useState<string | null>(null);
  if (DEMO) return null;
  return (
    <details className="text-xs">
      <summary className="cursor-pointer underline">Set a new password</summary>
      <form
        className="mt-1 flex gap-1"
        onSubmit={async (e) => {
          e.preventDefault();
          const r = await setPassword(new FormData(e.currentTarget));
          setMsg("error" in r ? r.error : "Password changed");
        }}
      >
        <input type="hidden" name="id" value={id} />
        <input name="password" type="password" placeholder="10+ characters" autoComplete="new-password" className={`${inputCls} py-1`} />
        <button className="rounded border border-neutral-300 px-2">Set</button>
      </form>
      {msg && <span className="text-neutral-600">{msg}</span>}
    </details>
  );
}
