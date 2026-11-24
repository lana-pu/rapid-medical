"use client";

import { useActionState, useCallback, useEffect, useRef, useState } from "react";
import type { FieldDef } from "@/admin/fields";
import { autosaveResource, saveResource, type SaveState } from "@/admin/actions";
import { DEMO } from "@/lib/demo";
import { REGIONS, type Product } from "@/db/schema";
import { REGION_CHOICES, REGION_LABELS } from "@/lib/regions";
import { Button, inputCls, Notice, StateDot } from "./ui";
import { Repeater } from "./Repeater";
import { ImageField } from "./ImageField";
import { RichText } from "./RichText";
import { UnsavedGuard } from "./UnsavedGuard";
import { TableEditor } from "./TableEditor";
import type { SpecTable } from "@/db/schema";

type Props = {
  resourceSlug: string;
  fields: FieldDef[];
  row: Record<string, unknown> | null;
  products: Product[];
  /** Goes through draft → Publish (has a status): autosave and a Publish button instead of Save */
  workflow?: boolean;
  /** Live status of the record and whether it has unpublished changes (workflow records) */
  liveStatus?: string;
  pending?: boolean;
  /** Link into the on-page editor for records whose content is edited on the page (null = new record, no link yet) */
  contentHref?: string | null;
};

function toDateInput(v: unknown): string {
  if (!v) return "";
  const d = new Date(v as string);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
}

export function ResourceForm({ resourceSlug, fields, row, products, workflow = false, liveStatus, pending: hasPending = false, contentHref }: Props) {
  const [state, action, submitting] = useActionState<SaveState, FormData>(saveResource, null);
  const formRef = useRef<HTMLFormElement>(null);
  const summaryRef = useRef<HTMLDivElement>(null);
  const isNew = !row?.id;
  const auto = useAutosave(formRef, workflow && !isNew && !DEMO);
  const errors = state?.errors ?? auto.errors ?? {};
  const labels = new Map(fields.map((f) => [f.name, f.label]));
  const errorKeys = state?.errors ? Object.keys(state.errors) : [];
  // on the site, nothing saved since: Publish has nothing to do, and the bar says so in words
  const noChanges = liveStatus === "published" && !hasPending && !auto.saved && !auto.touched;

  // the summary takes the focus when Publish / Create draft finds mistakes (GOV.UK)
  useEffect(() => {
    if (errorKeys.length) summaryRef.current?.focus();
  }, [state, errorKeys.length]);

  // Group by section, preserving order of first appearance
  const sections: { name: string; fields: FieldDef[] }[] = [];
  for (const f of fields) {
    if (f.type === "status") continue; // on the site only through Publish (flow pub-new)
    if (f.onPage) continue; // edited on the page (ADR-007)
    const name = f.section ?? "";
    let s = sections.find((x) => x.name === name);
    if (!s) {
      s = { name, fields: [] };
      sections.push(s);
    }
    s.fields.push(f);
  }

  return (
    <form ref={formRef} action={action} className="space-y-6">
      <input type="hidden" name="__resource" value={resourceSlug} />
      {row?.id ? <input type="hidden" name="__id" value={String(row.id)} /> : null}
      <UnsavedGuard formRef={formRef} storageKey={`rm-draft:${resourceSlug}:${row?.id ?? "new"}`} />

      {errorKeys.length > 0 ? (
        <div ref={summaryRef} tabIndex={-1} role="alert" className="rounded-lg border-2 border-red-600 bg-white p-4 text-sm outline-none">
          <div className="font-semibold text-red-700">{state?.message}</div>
          <ul className="mt-2 list-disc pl-5">
            {errorKeys.map((k) => (
              <li key={k}>
                <a href={`#${k}`} className="text-red-700 underline">{labels.get(k) ?? k}</a>: {state!.errors![k]}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        state?.message && <Notice kind="error">{state.message}</Notice>
      )}

      {contentHref !== undefined && fields.some((f) => f.onPage) && (
        <div className="rounded-lg border border-neutral-200 bg-white p-5 text-sm text-neutral-700">
          <div className="font-semibold text-neutral-900">Page content</div>
          <p className="mt-1">Texts, pictures and sections of this page are edited on the page itself.{!row?.id && " The page starts from a template; open it after saving."}</p>
          {contentHref && <a href={contentHref} className="mt-2 inline-block font-medium underline">Edit on page ✎</a>}
        </div>
      )}

      {/* one card, the sections inside as quiet headings (docs/screens/admin-record-edit.md → «Иерархия») */}
      {sections.length > 0 && (
        <div className="rounded-lg border border-neutral-200 bg-white px-4 py-5 @xl:px-6">
          {sections.map((s, i) => (
            <fieldset key={s.name || "_"} className={i > 0 ? "mt-6 border-t border-neutral-100 pt-5" : ""}>
              {s.name && <legend className="float-left mb-4 w-full text-xs font-semibold text-neutral-500">{s.name}</legend>}
              <div className="clear-both grid grid-cols-[minmax(0,1fr)] gap-x-4 gap-y-5 @xl:grid-cols-2">
                {s.fields.map((f) => (
                  // a section that is just one picture: its heading names it, the field's own label stays for screen readers
                  <Field key={f.name} f={f} value={row?.[f.name]} error={errors[f.name]} products={products} bare={!!s.name && s.fields.length === 1 && f.type === "image"} />
                ))}
              </div>
            </fieldset>
          ))}
        </div>
      )}

      {/* above the admin's bottom navigation on a phone (it hid the button) */}
      <div className="sticky bottom-[4.25rem] z-20 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border border-neutral-200 bg-white/95 px-4 py-2.5 shadow-lg backdrop-blur sm:bottom-3">
        <span className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1">
          {workflow && (
            <span data-testid="record-status">
              {isNew || liveStatus !== "published" ? <StateDot tone="draft">Draft · not on the site</StateDot> : hasPending || auto.saved ? <StateDot tone="changed">Changes waiting</StateDot> : <StateDot tone="live">On the site</StateDot>}
            </span>
          )}
          {workflow && !isNew && (
            <span className="text-xs text-neutral-500" role="status">
              {DEMO ? "Demo: changes are not saved" : auto.text}
            </span>
          )}
        </span>
        {workflow && !isNew && noChanges && <span className="text-xs text-neutral-500">No changes</span>}
        {!workflow ? (
          <Button type="submit" disabled={submitting}>{submitting ? "Saving…" : "Save"}</Button>
        ) : isNew ? (
          <Button type="submit" disabled={submitting}>{submitting ? "Creating…" : "Create draft"}</Button>
        ) : (
          <Button type="submit" name="__intent" value="publish" disabled={submitting || auto.busy || noChanges}>
            {submitting ? "Publishing…" : liveStatus === "published" ? "Publish changes" : "Publish"}
          </Button>
        )}
      </div>
    </form>
  );
}

/**
 * Autosave (docs/screens/admin-record-edit.md): 2 s after the last change and when a field loses focus. Rich text, lists
 * and pictures write hidden inputs without events, so the form is also compared every few seconds. Never publishes.
 */
function useAutosave(formRef: React.RefObject<HTMLFormElement | null>, on: boolean) {
  const [busy, setBusy] = useState(false);
  const [text, setText] = useState("Saved automatically");
  const [saved, setSaved] = useState(false);
  const [touched, setTouched] = useState(false);
  const [errors, setErrors] = useState<Record<string, string> | null>(null);
  const last = useRef<string | null>(null);
  const running = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const snapshot = useCallback(() => {
    const form = formRef.current;
    if (!form) return null;
    const fd = new FormData(form);
    fd.delete("__intent");
    return { fd, key: JSON.stringify([...fd.entries()].map(([k, v]) => [k, typeof v === "string" ? v : ""])) };
  }, [formRef]);

  const save = useCallback(async () => {
    if (!on || running.current) return;
    const s = snapshot();
    if (!s || s.key === last.current) return;
    running.current = true;
    setBusy(true);
    setText("Saving…");
    try {
      const r = await autosaveResource(s.fd);
      if (r.ok) {
        last.current = s.key;
        setErrors(null);
        setSaved(r.pending);
        const t = new Date(r.at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
        setText(`Saved automatically · ${t}`);
        formRef.current?.dispatchEvent(new CustomEvent("rm-saved"));
      } else {
        last.current = s.key; // the same content is not retried until it changes
        setErrors(r.errors ?? null);
        setText(`Not saved: ${r.message}`);
      }
    } catch {
      setText("Not saved: no connection. Your changes stay in the form.");
    } finally {
      running.current = false;
      setBusy(false);
    }
  }, [on, snapshot, formRef]);

  useEffect(() => {
    if (!on) return;
    const form = formRef.current;
    if (!form) return;
    last.current = snapshot()?.key ?? null; // what the page loaded with is saved already
    const soon = () => {
      setTouched(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => void save(), 2000);
    };
    const now = () => void save();
    form.addEventListener("input", soon);
    form.addEventListener("change", soon);
    form.addEventListener("focusout", now);
    const poll = setInterval(() => void save(), 5000);
    return () => {
      form.removeEventListener("input", soon);
      form.removeEventListener("change", soon);
      form.removeEventListener("focusout", now);
      clearInterval(poll);
      if (timer.current) clearTimeout(timer.current);
    };
  }, [on, formRef, save, snapshot]);

  return { busy, text, saved, touched, errors };
}

function Label({ f, error, count, bare = false }: { f: FieldDef; error?: string; count?: number; bare?: boolean }) {
  return (
    <div className={bare ? "sr-only" : "mb-1 flex items-baseline gap-2"}>
      <label htmlFor={f.name} className="text-sm font-medium text-neutral-800">
        {f.label}
        {f.required && <span className="text-red-600"> *</span>}
      </label>
      {error && <span className="text-xs text-red-600">{error}</span>}
      {f.max != null && count != null && (
        <span className={`ml-auto text-xs tabular-nums ${count > f.max ? "font-medium text-amber-700" : "text-neutral-500"}`}>{count} / {f.max}</span>
      )}
    </div>
  );
}

/** A text with a recommended length: counts characters beside the label (Title in Google 60, Description 155). */
function Counted({ f, name, str, error, wrap, help }: { f: FieldDef; name: string; str: string; error?: string; wrap: string; help: React.ReactNode }) {
  const [n, setN] = useState(str.length);
  const area = f.type === "textarea";
  return (
    <div className={wrap}>
      <Label f={f} error={error} count={n} />
      {area ? (
        <textarea id={name} name={name} defaultValue={str} rows={f.rows ?? 4} onInput={(e) => setN(e.currentTarget.value.length)} className={inputCls} />
      ) : (
        <input id={name} name={name} defaultValue={str} placeholder={f.placeholder} onInput={(e) => setN(e.currentTarget.value.length)} className={inputCls} />
      )}
      {help}
    </div>
  );
}

export function Field({ f, value, error, products, namePrefix = "", bare = false }: { f: FieldDef; value: unknown; error?: string; products: Product[]; namePrefix?: string; bare?: boolean }) {
  const name = namePrefix + f.name;
  const wrap = f.half ? "min-w-0" : "min-w-0 @xl:col-span-2"; // one column below 576 px of the working area (docs/admin-ia.md → «Адаптив»)
  const help = f.help ? <p className="mt-1 text-xs text-neutral-500">{f.help}</p> : null;
  const str = value == null ? "" : String(value);

  if (f.max != null && (f.type === "text" || f.type === "textarea")) return <Counted f={f} name={name} str={str} error={error} wrap={wrap} help={help} />;

  switch (f.type) {
    case "text":
    case "slug":
    case "url":
      return (
        <div className={wrap}>
          <Label f={f} error={error} />
          <input id={name} name={name} defaultValue={str} placeholder={f.placeholder} className={inputCls} />
          {help}
        </div>
      );
    case "number":
      return (
        <div className={wrap}>
          <Label f={f} error={error} />
          <input id={name} name={name} type="number" defaultValue={str} className={inputCls} />
          {help}
        </div>
      );
    case "textarea":
      return (
        <div className={wrap}>
          <Label f={f} error={error} />
          <textarea id={name} name={name} defaultValue={str} rows={f.rows ?? 4} className={inputCls} />
          {help}
        </div>
      );
    case "markdown":
      return (
        <div className={wrap}>
          <Label f={f} error={error} />
          <RichText name={name} defaultValue={str} minHeight={(f.rows ?? 8) * 28} />
          {help}
        </div>
      );
    case "json":
      return (
        <div className={wrap}>
          <Label f={f} error={error} />
          <textarea id={name} name={name} defaultValue={value == null ? "" : typeof value === "object" ? JSON.stringify(value, null, 2) : String(value)} rows={f.rows ?? 4} className={`${inputCls} font-mono text-xs`} />
          {help}
        </div>
      );
    case "boolean":
      // a switch (docs/screens/admin-record-edit.md → «Иерархия»): still a checkbox underneath, so the form posts the same
      return (
        <div className={wrap}>
          <label htmlFor={name} className="inline-flex cursor-pointer items-start gap-3">
            <input id={name} name={name} type="checkbox" role="switch" defaultChecked={Boolean(value)} className="peer sr-only" />
            <span aria-hidden className="relative mt-0.5 h-5 w-9 shrink-0 rounded-full bg-neutral-300 transition-colors after:absolute after:left-0.5 after:top-0.5 after:h-4 after:w-4 after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:bg-neutral-900 peer-checked:after:translate-x-4 peer-focus-visible:ring-2 peer-focus-visible:ring-neutral-900 peer-focus-visible:ring-offset-2" />
            <span className="text-sm font-medium text-neutral-800">{f.label}</span>
          </label>
          {help}
        </div>
      );
    case "date":
      return (
        <div className={wrap}>
          <Label f={f} error={error} />
          <input id={name} name={name} type="date" defaultValue={toDateInput(value)} className={inputCls} />
          {help}
        </div>
      );
    case "month":
      return (
        <div className={wrap}>
          <Label f={f} error={error} />
          <input id={name} name={name} type="month" defaultValue={toDateInput(value).slice(0, 7)} className={inputCls} />
          {help}
        </div>
      );
    case "status":
      return (
        <div className={wrap}>
          <Label f={f} error={error} />
          <select id={name} name={name} defaultValue={str || "draft"} className={inputCls}>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </div>
      );
    case "select":
      return (
        <div className={wrap}>
          <Label f={f} error={error} />
          <select id={name} name={name} defaultValue={str} className={inputCls}>
            {f.options?.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      );
    case "region": {
      // names as in the region menu (Europe & Middle East, not the long site label)
      const regionLabel = (r: string) => REGION_CHOICES.find((c) => c.region === r)?.label ?? REGION_LABELS[r as keyof typeof REGION_LABELS] ?? r;
      if (f.fixedAfterCreate && str)
        return (
          <div className={wrap}>
            <Label f={f} error={error} />
            <p className="py-2 text-sm text-neutral-800">{regionLabel(str)}</p>
            <p className="text-xs text-neutral-500">For another region, create its version on the page&apos;s screen.</p>
          </div>
        );
      return (
        <div className={wrap}>
          <Label f={f} error={error} />
          <select id={name} name={name} defaultValue={str} className={inputCls}>
            {!f.required && <option value="">— all regions —</option>}
            {REGIONS.map((r) => (
              <option key={r} value={r}>{regionLabel(r)}</option>
            ))}
          </select>
        </div>
      );
    }
    case "regions": {
      const selected = Array.isArray(value) ? (value as string[]) : [];
      return (
        <div className={wrap}>
          <Label f={f} error={error} />
          <RegionsCheckboxes name={name} selected={selected} />
          {help}
        </div>
      );
    }
    case "product":
      return (
        <div className={wrap}>
          <Label f={f} error={error} />
          <select id={name} name={name} defaultValue={str} className={inputCls}>
            <option value="">— none —</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>{p.fullName}</option>
            ))}
          </select>
        </div>
      );
    case "image":
      return (
        <div className={wrap}>
          <Label f={f} error={error} bare={bare} />
          {bare && error && <p className="mb-1 text-xs text-red-600">{error}</p>}
          <ImageField name={name} defaultValue={str} large={!namePrefix} />
          {help}
        </div>
      );
    case "stringList":
      return (
        <div className={wrap}>
          <Label f={f} error={error} />
          <textarea id={name} name={name} defaultValue={Array.isArray(value) ? (value as string[]).join("\n") : ""} rows={f.rows ?? 3} className={`${inputCls} font-mono text-xs`} />
          {help}
        </div>
      );
    case "repeater": {
      const items = Array.isArray(value) ? (value as Record<string, unknown>[]) : [];
      return (
        <div className={wrap}>
          <Label f={f} error={error} />
          <Repeater name={name} fields={f.fields ?? []} initial={items} products={products} itemLabel={f.label.toLowerCase().replace(/s$/, "")} />
          {help}
        </div>
      );
    }
    case "link":
      return (
        <div className={wrap}>
          <Label f={f} error={error} />
          <LinkInput name={name} initial={value as { label?: string; href?: string } | null} />
          {help}
        </div>
      );
    case "table":
      return (
        <div className={wrap}>
          <Label f={f} error={error} />
          <TableEditor name={name} initial={value as SpecTable | null} />
          {help}
        </div>
      );
    default:
      return null;
  }
}

function LinkInput({ name, initial }: { name: string; initial: { label?: string; href?: string } | null }) {
  const [v, setV] = useState({ label: initial?.label ?? "", href: initial?.href ?? "" });
  return (
    <div className="grid grid-cols-1 gap-2 @md:grid-cols-2">
      <input type="hidden" name={name} value={v.label || v.href ? JSON.stringify(v) : ""} readOnly />
      <input placeholder="Label" value={v.label} onChange={(e) => setV({ ...v, label: e.target.value })} className={inputCls} />
      <input placeholder="https://… , mailto:… or /path" value={v.href} onChange={(e) => setV({ ...v, href: e.target.value })} className={inputCls} />
    </div>
  );
}

/** Regions as chips in one row (docs/screens/admin-record-edit.md → «Иерархия»); checkboxes underneath. */
function RegionsCheckboxes({ name, selected }: { name: string; selected: string[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {REGIONS.map((r) => (
        <label key={r} className="cursor-pointer rounded-full border border-neutral-300 bg-white px-3 py-1 text-sm text-neutral-800 hover:border-neutral-500 has-[:checked]:border-neutral-900 has-[:checked]:bg-neutral-900 has-[:checked]:text-white has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-neutral-900 has-[:focus-visible]:ring-offset-2">
          <input type="checkbox" value={r} defaultChecked={selected.includes(r)} className="sr-only" data-regions={name} onChange={(e) => syncRegions(e.currentTarget.form, name)} />
          {REGION_CHOICES.find((c) => c.region === r)?.label ?? REGION_LABELS[r]}
        </label>
      ))}
      <input type="hidden" name={name} defaultValue={selected.join(",")} />
    </div>
  );
}

function syncRegions(form: HTMLFormElement | null, name: string) {
  if (!form) return;
  const boxes = form.querySelectorAll<HTMLInputElement>(`input[data-regions="${name}"]`);
  const hidden = form.querySelector<HTMLInputElement>(`input[type=hidden][name="${name}"]`);
  if (hidden) hidden.value = [...boxes].filter((b) => b.checked).map((b) => b.value).join(",");
}
