"use client";

import { useState } from "react";
import type { FieldDef } from "@/admin/fields";
import type { Product } from "@/db/schema";
import { inputCls } from "./ui";
import { ImageField } from "./ImageField";

type Item = Record<string, unknown>;

/**
 * Edits an array of objects and serialises it to a hidden JSON input.
 * Kept deliberately simple: no drag & drop, just up/down/remove.
 */
export function Repeater({ name, fields, initial, products }: { name: string; fields: FieldDef[]; initial: Item[]; products: Product[] }) {
  const [items, setItems] = useState<Item[]>(initial);
  void products;

  const update = (i: number, key: string, v: unknown) =>
    setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, [key]: v } : it)));
  const move = (i: number, dir: -1 | 1) =>
    setItems((prev) => {
      const j = i + dir;
      if (j < 0 || j >= prev.length) return prev;
      const copy = [...prev];
      [copy[i], copy[j]] = [copy[j], copy[i]];
      return copy;
    });
  const remove = (i: number) => setItems((prev) => prev.filter((_, idx) => idx !== i));
  const add = () => setItems((prev) => [...prev, Object.fromEntries(fields.map((f) => [f.name, f.type === "boolean" ? false : f.options?.[0]?.value ?? ""]))]);

  return (
    <div className="space-y-3">
      <input type="hidden" name={name} value={JSON.stringify(items)} readOnly />
      {items.map((it, i) => (
        <div key={i} className="rounded border border-neutral-200 bg-neutral-50 p-3">
          <div className="mb-2 flex items-center justify-between text-xs text-neutral-500">
            <span>#{i + 1}</span>
            <span className="flex gap-2">
              <button type="button" onClick={() => move(i, -1)} className="hover:text-neutral-900">↑</button>
              <button type="button" onClick={() => move(i, 1)} className="hover:text-neutral-900">↓</button>
              <button type="button" onClick={() => remove(i)} className="text-red-600 hover:text-red-800">remove</button>
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {fields.map((f) => {
              const v = it[f.name];
              const wrap = f.half ? "col-span-1" : "col-span-2";
              const label = <label className="mb-1 block text-xs font-medium text-neutral-700">{f.label}</label>;
              if (f.type === "textarea")
                return (
                  <div key={f.name} className={wrap}>
                    {label}
                    <textarea rows={f.rows ?? 2} value={String(v ?? "")} onChange={(e) => update(i, f.name, e.target.value)} className={inputCls} />
                  </div>
                );
              if (f.type === "select")
                return (
                  <div key={f.name} className={wrap}>
                    {label}
                    <select value={String(v ?? "")} onChange={(e) => update(i, f.name, e.target.value)} className={inputCls}>
                      {f.options?.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </div>
                );
              if (f.type === "image")
                return (
                  <div key={f.name} className={wrap}>
                    {label}
                    <ImageField name={`${name}__${i}__${f.name}`} defaultValue={String(v ?? "")} onChange={(url) => update(i, f.name, url)} detached />
                  </div>
                );
              if (f.type === "boolean")
                return (
                  <label key={f.name} className={`${wrap} flex items-center gap-2 text-xs`}>
                    <input type="checkbox" checked={Boolean(v)} onChange={(e) => update(i, f.name, e.target.checked)} /> {f.label}
                  </label>
                );
              const sv = v != null && typeof v === "object" ? JSON.stringify(v) : String(v ?? "");
              return (
                <div key={f.name} className={wrap}>
                  {label}
                  <input value={sv} onChange={(e) => update(i, f.name, e.target.value)} className={inputCls} />
                </div>
              );
            })}
          </div>
        </div>
      ))}
      <button type="button" onClick={add} className="rounded border border-dashed border-neutral-400 px-3 py-1.5 text-sm text-neutral-700 hover:bg-neutral-100">
        + Add item
      </button>
    </div>
  );
}
