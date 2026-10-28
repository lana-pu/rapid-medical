import "server-only";
import { desc, eq, sql, getTableColumns } from "drizzle-orm";
import type { PgTable } from "drizzle-orm/pg-core";
import { db } from "@/db";
import { isRegion } from "@/lib/regions";
import type { FieldDef } from "./fields";
import type { Resource } from "./resources";

/* eslint-disable @typescript-eslint/no-explicit-any */
// This module is intentionally untyped at the table level: every resource is
// described declaratively, and Drizzle's generics cannot be expressed over a
// runtime list of heterogeneous tables.

export type Row = Record<string, any>;
export type FieldErrors = Record<string, string>;

function col(table: PgTable, name: string) {
  const c = (getTableColumns(table) as Row)[name];
  if (!c) throw new Error(`Unknown column ${name}`);
  return c;
}

export async function listRows(res: Resource, opts: { search?: string; limit?: number } = {}): Promise<Row[]> {
  const order = col(res.table, res.sortBy);
  const dir = res.sortBy === "sortOrder" || res.sortBy === "id" ? order : desc(order);
  let q = db.select().from(res.table as any).orderBy(dir, desc(col(res.table, "id"))).$dynamic();
  if (opts.search) {
    const label = col(res.table, res.labelField);
    q = q.where(sql`${label} ILIKE ${"%" + opts.search + "%"}`);
  }
  return (await q.limit(opts.limit ?? 500)) as Row[];
}

export async function getRow(res: Resource, id: number): Promise<Row | null> {
  const rows = (await db.select().from(res.table as any).where(eq(col(res.table, "id"), id)).limit(1)) as Row[];
  return rows[0] ?? null;
}

/* ------------------------------------------------------------------ */
/*  FormData → typed object                                            */
/* ------------------------------------------------------------------ */

function parseField(f: FieldDef, raw: FormDataEntryValue | null, errors: FieldErrors, key: string): unknown {
  const s = typeof raw === "string" ? raw.trim() : "";
  const required = f.required && !s;

  switch (f.type) {
    case "text":
    case "textarea":
    case "markdown":
    case "status":
    case "select":
      if (required) errors[key] = "Required";
      return s;
    case "url":
      if (required) errors[key] = "Required";
      if (s && !/^(https?:\/\/|mailto:|\/)/i.test(s)) errors[key] = "Must be an absolute URL, mailto: or a path";
      return s || null;
    case "slug": {
      const slug = s.toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-|-$/g, "");
      if (f.required && !slug) errors[key] = "Required";
      return slug;
    }
    case "number":
      if (s === "") return 0;
      if (Number.isNaN(Number(s))) errors[key] = "Must be a number";
      return Number(s);
    case "boolean":
      return raw === "on" || raw === "true" || raw === "1";
    case "date":
      if (required) errors[key] = "Required";
      if (!s) return null;
      if (!/^\d{4}-\d{2}(-\d{2})?$/.test(s)) errors[key] = "Use YYYY-MM or YYYY-MM-DD";
      return new Date(s.length === 7 ? `${s}-01` : s);
    case "region":
      if (required && !s) errors[key] = "Required";
      if (s && !isRegion(s)) errors[key] = "Invalid region";
      return s || null;
    case "regions": {
      const list = s ? s.split(",").map((x) => x.trim()).filter(isRegion) : [];
      return list;
    }
    case "product":
      return s ? Number(s) : null;
    case "stringList":
      return s ? s.split(/\r?\n/).map((x) => x.trim()).filter(Boolean) : [];
    case "repeater": {
      if (!s) return [];
      try {
        const arr = JSON.parse(s);
        if (!Array.isArray(arr)) throw new Error();
        return arr;
      } catch {
        errors[key] = "Invalid list data";
        return [];
      }
    }
    default:
      return s;
  }
}

export function parseForm(res: Resource, fd: FormData): { data: Row; errors: FieldErrors } {
  const data: Row = {};
  const errors: FieldErrors = {};
  for (const f of res.fields) {
    let v = parseField(f, fd.get(f.name), errors, f.name);
    // heroCta is stored as a single object; the form uses a repeater
    if (f.name === "heroCta" && Array.isArray(v)) v = v[0] ?? null;
    data[f.name] = v;
  }
  return { data, errors };
}

/* ------------------------------------------------------------------ */
/*  Persistence                                                        */
/* ------------------------------------------------------------------ */

export async function saveRow(res: Resource, id: number | null, data: Row): Promise<number> {
  const cols = getTableColumns(res.table) as Row;
  const values: Row = {};
  for (const k of Object.keys(data)) if (cols[k]) values[k] = data[k];
  if (cols.updatedAt) values.updatedAt = new Date();

  if (id) {
    await db.update(res.table as any).set(values).where(eq(col(res.table, "id"), id));
    return id;
  }
  const inserted = (await db.insert(res.table as any).values(values).returning({ id: col(res.table, "id") })) as Row[];
  return inserted[0].id as number;
}

export async function deleteRow(res: Resource, id: number) {
  await db.delete(res.table as any).where(eq(col(res.table, "id"), id));
}

export async function duplicateRow(res: Resource, id: number, overrides: Row = {}): Promise<number> {
  const row = await getRow(res, id);
  if (!row) throw new Error("Not found");
  const { id: _id, createdAt: _c, updatedAt: _u, ...rest } = row;
  void _id; void _c; void _u;
  return saveRow(res, null, { ...rest, ...overrides, status: "draft" });
}
