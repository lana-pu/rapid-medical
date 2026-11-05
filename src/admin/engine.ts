import "server-only";
import { asc, desc, eq, inArray, sql, getTableColumns } from "drizzle-orm";
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

export type ListQuery = {
  search?: string;
  /** column → value; "regions" matches jsonb containment, others equality */
  filters?: Record<string, string>;
  sort?: string;
  dir?: "asc" | "desc";
  page?: number;
  per?: number;
};

export async function listRows(res: Resource, q: ListQuery = {}): Promise<{ rows: Row[]; total: number; page: number; per: number }> {
  const cols = getTableColumns(res.table) as Row;
  const conds: ReturnType<typeof sql>[] = [];
  if (q.search) conds.push(sql`${col(res.table, res.labelField)} ILIKE ${"%" + q.search + "%"}`);
  for (const [k, v] of Object.entries(q.filters ?? {})) {
    if (!v || !cols[k]) continue;
    if (k === "regions") conds.push(sql`(jsonb_array_length(${cols[k]}) = 0 OR ${cols[k]} @> ${JSON.stringify([v])}::jsonb)`);
    else if (v === "__null") conds.push(sql`${cols[k]} IS NULL`);
    else if (cols[k].dataType === "number") conds.push(sql`${cols[k]} = ${Number(v)}`);
    else if (cols[k].dataType === "boolean") conds.push(sql`${cols[k]} = ${v === "true"}`);
    else conds.push(sql`${cols[k]} = ${v}`);
  }
  const where = conds.length ? sql.join(conds, sql` AND `) : undefined;

  const sortKey = q.sort && cols[q.sort] ? q.sort : res.sortBy;
  const defaultDir: "asc" | "desc" = sortKey === "sortOrder" || sortKey === "id" || sortKey === "name" || sortKey === "title" ? "asc" : "desc";
  const dirv = q.dir ?? (q.sort ? "asc" : defaultDir);
  const order = dirv === "asc" ? asc(cols[sortKey]) : desc(cols[sortKey]);
  const per = q.per ?? 50;
  const page = Math.max(1, q.page ?? 1);

  const [rows, [{ n }]] = await Promise.all([
    db.select().from(res.table as any).where(where).orderBy(order, desc(col(res.table, "id"))).limit(per).offset((page - 1) * per),
    db.select({ n: sql<number>`count(*)::int` }).from(res.table as any).where(where),
  ]);
  return { rows: rows as Row[], total: n, page, per };
}

/** Bulk status change / delete. */
export async function bulk(res: Resource, ids: number[], action: "publish" | "unpublish" | "delete") {
  if (!ids.length) return;
  const idc = col(res.table, "id");
  const cols = getTableColumns(res.table) as Row;
  if (action === "delete") await db.delete(res.table as any).where(inArray(idc, ids));
  else if (cols.status) await db.update(res.table as any).set({ status: action === "publish" ? "published" : "draft", ...(cols.updatedAt ? { updatedAt: new Date() } : {}) }).where(inArray(idc, ids));
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
    case "status":
    case "select":
      if (required) errors[key] = "Required";
      return s;
    case "markdown": {
      // Tiptap emits "<p></p>" for an empty document
      const v = /^(<p>\s*<\/p>\s*)*$/.test(s) ? "" : s;
      if (f.required && !v) errors[key] = "Required";
      return v;
    }
    case "json":
      // nullable json columns (chart, annotatedImage) get null when empty; required ones (aliases) an empty object
      if (!s || s === "{}" || s === "null") return f.required ? {} : null;
      try { return JSON.parse(s); } catch { errors[key] = "Invalid JSON"; return f.required ? {} : null; }
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
    case "link": {
      if (!s) return null;
      try {
        const o = JSON.parse(s) as { label?: string; href?: string };
        if (!o.label && !o.href) return null;
        if (!o.href) errors[key] = "Link needs a URL";
        return { label: o.label ?? "", href: o.href ?? "" };
      } catch { errors[key] = "Invalid link"; return null; }
    }
    case "table": {
      if (!s) return null;
      try {
        const t = JSON.parse(s) as { columns?: string[]; rows?: string[][] };
        if (!Array.isArray(t.columns) || !t.columns.length) return null;
        return t;
      } catch { errors[key] = "Invalid table"; return null; }
    }
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
    data[f.name] = parseField(f, fd.get(f.name), errors, f.name);
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
