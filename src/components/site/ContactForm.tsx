"use client";

import { startTransition, useActionState, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { submitForm, type FormState } from "@/lib/forms";
import { attribution, track } from "@/lib/tracking";
import { COUNTRIES_WITH_STATE, countryOptions } from "@/lib/countries";
import { Button, Field, SelectField, TextAreaField, CheckboxField } from "./ui";
import { chipClass, inputClass } from "./ui-classes";

const REGIONS = ["Americas", "Europe", "Asia Pacific", "Middle East"];
/** Topics shown as chips; the rest are under «Other topic» (DESIGN.md → Формы: up to ~4 chips, else 3 + a list). */
const CHIPS = 3;

export function ContactForm({
  form = "contact",
  topics,
  defaultTopic,
  defaultRegion,
  defaultCountry,
  meta = {},
  compact = false,
}: {
  /** `event`: registration for an event — "Hospital" instead of "Organization", plus dietary requirements. */
  form?: "contact" | "webinar" | "careers" | "event";
  topics: string[];
  defaultTopic?: string;
  defaultRegion?: string;
  /** Contact form: preselected country (ISO code, from the visitor's location). */
  defaultCountry?: string;
  meta?: Record<string, string>;
  compact?: boolean;
}) {
  // Source of the visit goes into the submission (variant Г); a successful one is reported to GA4 (variant Б).
  const [sent, setSent] = useState({ topic: "", email: "", country: "" });
  const [round, setRound] = useState(0); // «Send another request» starts a fresh form
  const [state, action, pending] = useActionState<FormState, FormData | null>((prev, fd) => {
    if (fd === null) return null; // back to an empty form
    // Extra fields of a form type (meta_*) travel in meta, like the visit source.
    const extra: Record<string, string> = {};
    for (const [k, v] of [...fd.entries()]) if (k.startsWith("meta_") && typeof v === "string" && v.trim()) extra[k.slice(5)] = v.trim().slice(0, 500);
    fd.set("meta", JSON.stringify({ ...attribution(), ...extra, ...meta }));
    return submitForm(prev, fd);
  }, null);
  const err = (k: string) => (state && !state.ok && state.errors?.[k]) || null;
  const fieldErrors = !!(state && !state.ok && state.errors && Object.keys(state.errors).length);
  useEffect(() => {
    if (state?.ok) track("generate_lead", { form, topic: sent.topic });
  }, [state, form, sent.topic]);

  if (state?.ok) {
    // what the visitor did, in words (docs/screens/contact-us.md → Состояния)
    const [title, body] =
      form === "event"
        ? [`You're registered for ${defaultTopic || "the event"}.`, "We'll email you the details."]
        : form === "careers"
          ? ["Thanks — we've received your details.", "We'll be in touch if there's a match."]
          : ["Thank you for contacting us.", "We will get back to you as soon as possible."];
    return (
      <div className="rounded border border-border bg-surface p-6" role="status">
        <p className="text-lg font-medium">{title}</p>
        <p className="mt-1 text-sm text-muted">{body}{sent.email && form === "contact" ? ` We’ll reply to ${sent.email}.` : ""}</p>
        {form === "contact" && (
          <>
            <dl className="mt-4 divide-y divide-border border-y border-border text-sm">
              {sent.topic && <div className="flex justify-between gap-4 py-2"><dt className="text-muted">Topic</dt><dd>{sent.topic}</dd></div>}
              {sent.country && <div className="flex justify-between gap-4 py-2"><dt className="text-muted">Country</dt><dd>{sent.country}</dd></div>}
            </dl>
            <button type="button" className="mt-4 text-sm underline" onClick={() => { setRound((r) => r + 1); startTransition(() => action(null)); }}>
              Send another request
            </button>
          </>
        )}
      </div>
    );
  }

  return (
    // Sent from the handler, not through `action`: React 19 resets a form after an action, which wiped what the
    // visitor typed whenever the server answered with an error.
    <form
      key={round}
      data-form={form}
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        setSent({ topic: String(fd.get("topic") ?? ""), email: String(fd.get("email") ?? ""), country: String(fd.get("countryLabel") ?? "") });
        startTransition(() => action(fd));
      }}
      className="space-y-4"
    >
      <input type="hidden" name="form" value={form} />
      {/* honeypot */}
      <input name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />

      {/* a message that is not about one field (rate limit); field errors are shown at the fields */}
      {state && !state.ok && state.message && !fieldErrors && <p className="rounded border border-danger px-3 py-2 text-sm text-danger">{state.message}</p>}

      <p className="text-xs text-muted">(* indicates a required field)</p>

      {form === "event" ? (
        <input type="hidden" name="topic" value={defaultTopic ?? topics[0] ?? ""} />
      ) : form === "contact" || form === "careers" ? (
        <TopicChips topics={topics} defaultTopic={defaultTopic} error={err("topic")} legend={form === "careers" ? "Area of interest*" : undefined} />
      ) : (
        <SelectField label={form === "webinar" ? "Which webinar?*" : "How can we help? Select a topic.*"} name="topic" required defaultValue={defaultTopic ?? ""} error={err("topic")}>
          <option value="" disabled>Select…</option>
          {topics.map((t) => <option key={t} value={t}>{t}</option>)}
        </SelectField>
      )}

      {form === "contact" ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field name="firstName" label="First Name*" error={err("firstName")} required />
          <Field name="lastName" label="Last Name*" error={err("lastName")} required />
          <Field name="email" label="Email*" type="email" error={err("email")} required />
          <Field name="phone" label="Phone" type="tel" />
          <Field name="organization" label="Organization" />
          <CountryState defaultCountry={defaultCountry} error={err("country")} />
        </div>
      ) : form === "careers" ? (
        // a candidate, not a customer (DESIGN.md → Careers): no Organization; a LinkedIn or CV link instead of a file
        <div className="grid gap-4 sm:grid-cols-2">
          <Field name="firstName" label="First Name*" error={err("firstName")} required />
          <Field name="lastName" label="Last Name*" error={err("lastName")} required />
          <Field name="email" label="Email*" type="email" error={err("email")} required />
          <Field name="meta_linkedin" label="LinkedIn or CV link" type="url" placeholder="https://" />
          <CountryState defaultCountry={defaultCountry} error={err("country")} />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field name="firstName" label="First Name*" error={err("firstName")} required />
          <Field name="lastName" label="Last Name*" error={err("lastName")} required />
          <Field name="organization" label={form === "event" ? "Hospital" : "Organization"} />
          <Field name="email" label="Email*" type="email" error={err("email")} required />
          <Field name="phone" label="Phone" type="tel" />
          <SelectField label="Region" name="region" defaultValue={defaultRegion ?? ""}>
            <option value="">Select…</option>
            {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
          </SelectField>
          {!compact && <Field name="country" label="Country" />}
          {!compact && <Field name="state" label="State/Province" />}
          {form === "event" && <Field name="meta_dietary" label="Dietary requirements" />}
        </div>
      )}

      <TextAreaField label="Message" name="message" rows={4} placeholder={form === "careers" ? "What would you like to work on?" : undefined} />

      <CheckboxField name="optIn" label="Sign me up! I would like to receive Rapid Medical news and updates." />

      <Button type="submit" size="lg" block={form === "contact" || form === "careers"} disabled={pending}>
        {pending ? "Sending…" : "Submit"}
      </Button>

      <p className="text-xs text-muted">
        By clicking “Submit,” you understand and agree that the information provided will be used and processed in accordance with our{" "}
        <Link href="/privacy-statement" className="underline">Privacy Statement</Link>.
      </p>
    </form>
  );
}

/** Topic first, as chips: the frequent ones visible, the rest under «Other topic» (DESIGN.md → Формы). */
function TopicChips({ topics, defaultTopic, error, legend = "How can we help? Select a topic.*" }: { topics: string[]; defaultTopic?: string; error?: string | null; legend?: string }) {
  const main = topics.slice(0, CHIPS);
  const rest = topics.slice(CHIPS);
  const [topic, setTopic] = useState(defaultTopic && topics.includes(defaultTopic) ? defaultTopic : "");
  const [other, setOther] = useState(!!topic && rest.includes(topic));
  const chip = (on: boolean) => `cursor-pointer ${chipClass(on)} has-[:focus-visible]:outline has-[:focus-visible]:outline-2`;
  return (
    <fieldset className="text-sm" aria-invalid={!!error || undefined}>
      <legend className="mb-2">{legend}</legend>
      <input type="hidden" name="topic" value={topic} />
      <div className="flex flex-wrap gap-2">
        {main.map((t) => (
          <label key={t} className={chip(!other && topic === t)}>
            <input type="radio" name="topicChoice" value={t} checked={!other && topic === t} onChange={() => { setOther(false); setTopic(t); }} className="sr-only" />
            {t}
          </label>
        ))}
        {rest.length > 0 && (
          <label className={chip(other)}>
            <input type="radio" name="topicChoice" value="other" checked={other} onChange={() => { setOther(true); setTopic(rest.includes(topic) ? topic : ""); }} className="sr-only" />
            Other topic ▾
          </label>
        )}
      </div>
      {other && (
        <select aria-label="Other topic" required value={topic} onChange={(e) => setTopic(e.target.value)} className={`${inputClass(!!error)} mt-2`}>
          <option value="" disabled>Select…</option>
          {rest.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      )}
      {error && <span className="mt-1 block text-xs text-danger">{error}</span>}
    </fieldset>
  );
}

/** Country from the list; State / Province only for the US and Canada (decision 2026-11-15). */
function CountryState({ defaultCountry, error }: { defaultCountry?: string; error?: string | null }) {
  const options = useMemo(() => countryOptions(), []);
  const [code, setCode] = useState(defaultCountry && options.some((o) => o.code === defaultCountry) ? defaultCountry : "");
  const label = options.find((o) => o.code === code)?.name ?? "";
  return (
    <>
      <label className="block text-sm">
        <span className="mb-1 block">Country*</span>
        <select name="countryCode" required value={code} onChange={(e) => setCode(e.target.value)} aria-invalid={!!error || undefined} className={inputClass(!!error)}>
          <option value="" disabled>Select…</option>
          {options.map((o) => <option key={o.code} value={o.code}>{o.name}</option>)}
        </select>
        <input type="hidden" name="countryLabel" value={label} />
        {error && <span className="mt-1 block text-xs text-danger">{error}</span>}
      </label>
      {COUNTRIES_WITH_STATE.includes(code) && <Field name="state" label={code === "CA" ? "Province" : "State"} />}
    </>
  );
}

