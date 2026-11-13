"use client";

import { startTransition, useActionState, useEffect, useRef } from "react";
import Link from "next/link";
import { submitForm, type FormState } from "@/lib/forms";
import { attribution, track } from "@/lib/tracking";

const REGIONS = ["Americas", "Europe", "Asia Pacific", "Middle East"];
const input = "w-full rounded border border-border bg-background px-3 py-2 text-sm focus:border-foreground focus:outline-none";

export function ContactForm({
  form = "contact",
  topics,
  defaultTopic,
  defaultRegion,
  meta = {},
  compact = false,
}: {
  /** `event`: registration for an event — "Hospital" instead of "Organization", plus dietary requirements. */
  form?: "contact" | "webinar" | "careers" | "event";
  topics: string[];
  defaultTopic?: string;
  defaultRegion?: string;
  meta?: Record<string, string>;
  compact?: boolean;
}) {
  // Source of the visit goes into the submission (variant Г); a successful one is reported to GA4 (variant Б).
  const topic = useRef("");
  const [state, action, pending] = useActionState<FormState, FormData>((prev, fd) => {
    topic.current = String(fd.get("topic") ?? "");
    // Extra fields of a form type (meta_*) travel in meta, like the visit source.
    const extra: Record<string, string> = {};
    for (const [k, v] of [...fd.entries()]) if (k.startsWith("meta_") && typeof v === "string" && v.trim()) extra[k.slice(5)] = v.trim().slice(0, 500);
    fd.set("meta", JSON.stringify({ ...attribution(), ...extra, ...meta }));
    return submitForm(prev, fd);
  }, null);
  const err = (k: string) => (state && !state.ok && state.errors?.[k]) || null;
  useEffect(() => {
    if (state?.ok) track("generate_lead", { form, topic: topic.current });
  }, [state, form]);

  if (state?.ok) {
    // what the visitor did, in words (docs/screens/contact-us.md → «Проход по юзабилити»)
    const [title, body] =
      form === "event"
        ? [`You're registered for ${defaultTopic || "the event"}.`, "We'll email you the details."]
        : form === "careers"
          ? ["Thanks — we've received your details.", "We'll be in touch if there's a match."]
          : ["Thank you for contacting us.", "We will get back to you as soon as possible."];
    return (
      <div className="rounded border border-border bg-surface p-6" role="status">
        <p className="font-medium">{title}</p>
        <p className="mt-1 text-sm text-muted">{body}</p>
      </div>
    );
  }

  return (
    // Sent from the handler, not through `action`: React 19 resets a form after an action, which wiped what the
    // visitor typed whenever the server answered with an error.
    <form
      data-form={form}
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(() => action(fd));
      }}
      className="space-y-4"
    >
      <input type="hidden" name="form" value={form} />
      {/* honeypot */}
      <input name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />

      {state && !state.ok && state.message && <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{state.message}</p>}

      <p className="text-xs text-muted">(* indicates a required field)</p>

      {form === "event" ? (
        <input type="hidden" name="topic" value={defaultTopic ?? topics[0] ?? ""} />
      ) : (
        <label className="block text-sm">
          <span className="mb-1 flex justify-between">
            <span>{form === "webinar" ? "Which webinar?*" : form === "careers" ? "Area of interest*" : "How can we help? Select a topic.*"}</span>
            {err("topic") && <span className="text-red-600">{err("topic")}</span>}
          </span>
          <select name="topic" required defaultValue={defaultTopic ?? ""} aria-invalid={!!err("topic") || undefined} className={`${input} ${err("topic") ? "border-red-600" : ""}`}>
            <option value="" disabled>Select…</option>
            {topics.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </label>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field name="firstName" label="First Name*" error={err("firstName")} required />
        <Field name="lastName" label="Last Name*" error={err("lastName")} required />
        <Field name="organization" label={form === "event" ? "Hospital" : "Organization"} />
        <Field name="email" label="Email*" type="email" error={err("email")} required />
        <Field name="phone" label="Phone" type="tel" />
        <label className="block text-sm">
          <span className="mb-1 block">Region</span>
          <select name="region" defaultValue={defaultRegion ?? ""} className={input}>
            <option value="">Select…</option>
            {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </label>
        {!compact && <Field name="country" label="Country" />}
        {!compact && <Field name="state" label="State/Province" />}
        {form === "event" && <Field name="meta_dietary" label="Dietary requirements" />}
      </div>

      <label className="block text-sm">
        <span className="mb-1 block">Message</span>
        <textarea name="message" rows={4} className={input} />
      </label>

      <label className="flex items-start gap-2 text-sm">
        <input type="checkbox" name="optIn" className="mt-1" />
        <span>Sign me up! I would like to receive Rapid Medical news and updates.</span>
      </label>

      <p className="text-xs text-muted">
        By clicking “Submit,” you understand and agree that the information provided will be used and processed in accordance with our{" "}
        <Link href="/privacy-statement" className="underline">Privacy Statement</Link>.
      </p>

      <button disabled={pending} className="rounded bg-accent px-5 py-2 text-sm font-medium text-accent-foreground disabled:opacity-50">
        {pending ? "Sending…" : "Submit"}
      </button>
    </form>
  );
}

function Field({ name, label, type = "text", error, required }: { name: string; label: string; type?: string; error?: string | null; required?: boolean }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 flex justify-between"><span>{label}</span>{error && <span className="text-red-600">{error}</span>}</span>
      <input name={name} type={type} required={required} aria-invalid={!!error || undefined} className={`${input} ${error ? "border-red-600" : ""}`} />
    </label>
  );
}
