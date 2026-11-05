"use client";

import { useId, useState } from "react";
import { DndContext, closestCenter, PointerSensor, KeyboardSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { FieldDef } from "@/admin/fields";
import type { Product } from "@/db/schema";
import { REGIONS } from "@/db/schema";
import { REGION_LABELS } from "@/lib/regions";
import { inputCls } from "./ui";
import { ImageField } from "./ImageField";

type Item = Record<string, unknown> & { _key?: string };

let seq = 0;
const newKey = () => `k${Date.now().toString(36)}${(seq++).toString(36)}`;

function blank(fields: FieldDef[]): Item {
  const it: Item = { _key: newKey() };
  for (const f of fields) {
    if (f.type === "boolean") it[f.name] = false;
    else if (f.type === "repeater") it[f.name] = [];
    else if (f.type === "link") it[f.name] = { label: "", href: "" };
    else if (f.type === "select") it[f.name] = f.options?.[0]?.value ?? "";
    else it[f.name] = "";
  }
  return it;
}

function withKeys(items: Item[]): Item[] {
  return items.map((it) => (it._key ? it : { ...it, _key: newKey() }));
}

function strip(items: Item[]): Record<string, unknown>[] {
  return items.map((it) => {
    const { _key, ...rest } = it;
    void _key;
    for (const k of Object.keys(rest)) if (Array.isArray(rest[k]) && (rest[k] as Item[]).some((x) => x && typeof x === "object" && "_key" in x)) rest[k] = strip(rest[k] as Item[]);
    return rest;
  });
}

/** Label shown on a collapsed item: first non-empty text-ish field. */
function summary(it: Item, fields: FieldDef[]): string {
  for (const f of fields) {
    const v = it[f.name];
    if (typeof v === "string" && v.trim() && ["text", "textarea", "slug", "url"].includes(f.type)) return v.slice(0, 80);
    if (f.type === "link" && v && typeof v === "object" && (v as { label?: string }).label) return (v as { label: string }).label;
  }
  return "(empty)";
}

/**
 * Sortable list of objects, serialised to a hidden JSON input (top level) or
 * reported through onChange (nested). Supports nested repeaters.
 */
export function Repeater({
  name,
  fields,
  initial,
  products,
  onChange,
  detached = false,
  itemLabel = "item",
}: {
  name: string;
  fields: FieldDef[];
  initial: Record<string, unknown>[];
  products: Product[];
  onChange?: (items: Record<string, unknown>[]) => void;
  detached?: boolean;
  itemLabel?: string;
}) {
  const [items, setItems] = useState<Item[]>(() => withKeys(initial as Item[]));
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
  const dndId = useId();

  const commit = (next: Item[]) => {
    setItems(next);
    onChange?.(strip(next));
  };
  const update = (i: number, key: string, v: unknown) => commit(items.map((it, idx) => (idx === i ? { ...it, [key]: v } : it)));
  const remove = (i: number) => commit(items.filter((_, idx) => idx !== i));
  const add = () => commit([...items, blank(fields)]);
  const duplicate = (i: number) => {
    const copy = { ...structuredClone(items[i]), _key: newKey() };
    commit([...items.slice(0, i + 1), copy, ...items.slice(i + 1)]);
  };
  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const from = items.findIndex((x) => x._key === active.id);
    const to = items.findIndex((x) => x._key === over.id);
    commit(arrayMove(items, from, to));
  };

  return (
    <div className="space-y-2">
      {!detached && <input type="hidden" name={name} value={JSON.stringify(strip(items))} readOnly />}
      <DndContext id={dndId} sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={items.map((x) => x._key!)} strategy={verticalListSortingStrategy}>
          {items.map((it, i) => (
            <SortableItem key={it._key} id={it._key!}>
              {(handle) => (
                <div className="rounded border border-neutral-200 bg-neutral-50">
                  <div className="flex items-center gap-2 px-2 py-1.5 text-xs text-neutral-600">
                    <button type="button" {...handle} className="cursor-grab select-none px-1 text-neutral-400 hover:text-neutral-900" title="Drag to reorder" aria-label="Drag to reorder">⋮⋮</button>
                    <button type="button" onClick={() => setCollapsed((c) => ({ ...c, [it._key!]: !c[it._key!] }))} className="flex-1 truncate text-left font-medium text-neutral-800">
                      {collapsed[it._key!] ? "▸" : "▾"} #{i + 1} · {summary(it, fields)}
                    </button>
                    <button type="button" onClick={() => duplicate(i)} className="hover:text-neutral-900">duplicate</button>
                    <button type="button" onClick={() => remove(i)} className="text-red-600 hover:text-red-800">remove</button>
                  </div>
                  {!collapsed[it._key!] && (
                    <div className="grid grid-cols-2 gap-3 border-t border-neutral-200 p-3">
                      {fields.map((f) => (
                        <SubField key={f.name} f={f} value={it[f.name]} onChange={(v) => update(i, f.name, v)} products={products} path={`${name}.${i}.${f.name}`} />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </SortableItem>
          ))}
        </SortableContext>
      </DndContext>
      <button type="button" onClick={add} className="rounded border border-dashed border-neutral-400 px-3 py-1.5 text-sm text-neutral-700 hover:bg-neutral-100">
        + Add {itemLabel}
      </button>
    </div>
  );
}

function SortableItem({ id, children }: { id: string; children: (handle: Record<string, unknown>) => React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.6 : 1 }}>
      {children({ ...attributes, ...listeners })}
    </div>
  );
}

/** One field inside a repeater item – controlled, no form name. */
export function SubField({ f, value, onChange, products, path }: { f: FieldDef; value: unknown; onChange: (v: unknown) => void; products: Product[]; path: string }) {
  const wrap = f.half ? "col-span-1" : "col-span-2";
  const label = <label className="mb-1 block text-xs font-medium text-neutral-700">{f.label}{f.required && <span className="text-red-600"> *</span>}</label>;
  const help = f.help ? <p className="mt-1 text-[11px] text-neutral-500">{f.help}</p> : null;
  const s = value == null ? "" : String(value);

  switch (f.type) {
    case "textarea":
      return <div className={wrap}>{label}<textarea rows={f.rows ?? 2} value={s} onChange={(e) => onChange(e.target.value)} className={inputCls} />{help}</div>;
    case "select":
      return (
        <div className={wrap}>{label}
          <select value={s} onChange={(e) => onChange(e.target.value)} className={inputCls}>
            {f.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      );
    case "region":
      return (
        <div className={wrap}>{label}
          <select value={s} onChange={(e) => onChange(e.target.value)} className={inputCls}>
            <option value="">—</option>
            {REGIONS.map((r) => <option key={r} value={r}>{REGION_LABELS[r]}</option>)}
          </select>
        </div>
      );
    case "image":
      return <div className={wrap}>{label}<ImageField name={path} defaultValue={s} onChange={onChange} detached kind={/video/i.test(f.label) ? "video" : /pdf/i.test(f.label) ? "pdf" : "any"} />{help}</div>;
    case "boolean":
      return <label className={`${wrap} flex items-center gap-2 text-xs`}><input type="checkbox" checked={Boolean(value)} onChange={(e) => onChange(e.target.checked)} /> {f.label}</label>;
    case "number":
      return <div className={wrap}>{label}<input type="number" value={s} onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))} className={inputCls} /></div>;
    case "link": {
      const v = (value && typeof value === "object" ? value : { label: "", href: "" }) as { label?: string; href?: string };
      return (
        <div className={wrap}>{label}
          <div className="grid grid-cols-2 gap-2">
            <input placeholder="Label" value={v.label ?? ""} onChange={(e) => onChange({ ...v, label: e.target.value })} className={inputCls} />
            <input placeholder="https://… , mailto:… or /path" value={v.href ?? ""} onChange={(e) => onChange({ ...v, href: e.target.value })} className={inputCls} />
          </div>
          {help}
        </div>
      );
    }
    case "json": {
      // free-form object (e.g. chart definition); kept as text while editing, parsed on change
      const text = typeof value === "string" ? value : value && Object.keys(value as object).length ? JSON.stringify(value, null, 2) : "";
      return (
        <div className={wrap}>{label}
          <textarea rows={6} defaultValue={text} onChange={(e) => { try { onChange(e.target.value.trim() ? JSON.parse(e.target.value) : null); } catch { onChange(e.target.value); } }} className={`${inputCls} font-mono text-xs`} />
          {help}
        </div>
      );
    }
    case "repeater":
      return (
        <div className={wrap}>{label}
          <Repeater name={path} fields={f.fields ?? []} initial={Array.isArray(value) ? (value as Record<string, unknown>[]) : []} products={products} onChange={onChange} detached itemLabel={f.label.toLowerCase().replace(/s$/, "")} />
          {help}
        </div>
      );
    default:
      return <div className={wrap}>{label}<input value={s} onChange={(e) => onChange(e.target.value)} placeholder={f.placeholder} className={inputCls} />{help}</div>;
  }
}
