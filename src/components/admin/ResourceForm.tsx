"use client";

import { useActionState, useRef, useState } from "react";
import type { FieldDef } from "@/admin/fields";
import { saveResource, type SaveState } from "@/admin/actions";
import { REGIONS, type Product } from "@/db/schema";
import { REGION_LABELS } from "@/lib/regions";
import { Button, inputCls, Notice } from "./ui";
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
  /** Published records: status is controlled by the workflow panel, not the form */
  hideStatus?: boolean;
  /** Link into the on-page editor for records whose content is edited on the page (null = new record, no link yet) */
  contentHref?: string | null;
};

function toDateInput(v: unknown): string {
  if (!v) return "";
  const d = new Date(v as string);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
}

export function ResourceForm({ resourceSlug, fields, row, products, hideStatus = false, contentHref }: Props) {
  const [state, action, pending] = useActionState<SaveState, FormData>(saveResource, null);
  const errors = state?.errors ?? {};
  const formRef = useRef<HTMLFormElement>(null);

  // Group by section, preserving order of first appearance
  const sections: { name: string; fields: FieldDef[] }[] = [];
  for (const f of fields) {
    if (hideStatus && f.type === "status") continue;
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
    <form ref={formRef} action={action} className="space-y-8">
      <input type="hidden" name="__resource" value={resourceSlug} />
      {row?.id ? <input type="hidden" name="__id" value={String(row.id)} /> : null}
      <UnsavedGuard formRef={formRef} storageKey={`rm-draft:${resourceSlug}:${row?.id ?? "new"}`} />

      {state?.message && <Notice kind="error">{state.message}</Notice>}

      {contentHref !== undefined && fields.some((f) => f.onPage) && (
        <div className="rounded-lg border border-neutral-200 bg-white p-5 text-sm text-neutral-700">
          <div className="font-semibold text-neutral-900">Page content</div>
          <p className="mt-1">Texts, pictures and sections of this page are edited on the page itself.{!row?.id && " The page starts from a template; open it after saving."}</p>
          {contentHref && <a href={contentHref} className="mt-2 inline-block font-medium underline">Edit on page ✎</a>}
        </div>
      )}

      {sections.map((s) => (
        <fieldset key={s.name || "_"} className="rounded-lg border border-neutral-200 bg-white p-5">
          {s.name && <legend className="px-2 text-sm font-semibold uppercase tracking-wide text-neutral-500">{s.name}</legend>}
          <div className="grid grid-cols-2 gap-x-4 gap-y-5">
            {s.fields.map((f) => (
              <Field key={f.name} f={f} value={row?.[f.name]} error={errors[f.name]} products={products} />
            ))}
          </div>
        </fieldset>
      ))}

      <div className="sticky bottom-0 flex items-center gap-3 border-t border-neutral-200 bg-neutral-50/95 py-3 backdrop-blur">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save"}
        </Button>
        <span className="text-xs text-neutral-500">{hideStatus ? "This record is live: saving creates pending changes to review and publish." : "Unpublished record: saving updates it in place; set status to “published” or use Publish to go live."}</span>
      </div>
    </form>
  );
}

function Label({ f, error }: { f: FieldDef; error?: string }) {
  return (
    <div className="mb-1 flex items-baseline justify-between">
      <label htmlFor={f.name} className="text-sm font-medium text-neutral-800">
        {f.label}
        {f.required && <span className="text-red-600"> *</span>}
      </label>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}

export function Field({ f, value, error, products, namePrefix = "" }: { f: FieldDef; value: unknown; error?: string; products: Product[]; namePrefix?: string }) {
  const name = namePrefix + f.name;
  const wrap = f.half ? "col-span-1" : "col-span-2";
  const help = f.help ? <p className="mt-1 text-xs text-neutral-500">{f.help}</p> : null;
  const str = value == null ? "" : String(value);

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
      return (
        <div className={`${wrap} flex items-center gap-2 pt-6`}>
          <input id={name} name={name} type="checkbox" defaultChecked={Boolean(value)} className="h-4 w-4" />
          <label htmlFor={name} className="text-sm text-neutral-800">{f.label}</label>
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
    case "region":
      return (
        <div className={wrap}>
          <Label f={f} error={error} />
          <select id={name} name={name} defaultValue={str} className={inputCls}>
            {!f.required && <option value="">— global —</option>}
            {REGIONS.map((r) => (
              <option key={r} value={r}>{REGION_LABELS[r]}</option>
            ))}
          </select>
        </div>
      );
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
          <Label f={f} error={error} />
          <ImageField name={name} defaultValue={str} />
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
    <div className="grid grid-cols-2 gap-2">
      <input type="hidden" name={name} value={v.label || v.href ? JSON.stringify(v) : ""} readOnly />
      <input placeholder="Label" value={v.label} onChange={(e) => setV({ ...v, label: e.target.value })} className={inputCls} />
      <input placeholder="https://… , mailto:… or /path" value={v.href} onChange={(e) => setV({ ...v, href: e.target.value })} className={inputCls} />
    </div>
  );
}

function RegionsCheckboxes({ name, selected }: { name: string; selected: string[] }) {
  return (
    <div className="flex gap-4">
      {REGIONS.map((r) => (
        <label key={r} className="flex items-center gap-2 text-sm">
          <input type="checkbox" value={r} defaultChecked={selected.includes(r)} className="h-4 w-4" data-regions={name} onChange={(e) => syncRegions(e.currentTarget.form, name)} />
          {REGION_LABELS[r]}
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
