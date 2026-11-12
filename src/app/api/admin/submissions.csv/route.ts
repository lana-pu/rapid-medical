import { desc } from "drizzle-orm";
import { getSession, isReady } from "@/lib/auth";
import { db, contactSubmissions } from "@/db";
import { audit } from "@/lib/audit";

/** GET /api/admin/submissions.csv — all form submissions as CSV (Excel-friendly). */
export async function GET() {
  const session = await getSession();
  if (!isReady(session)) return new Response("Unauthorized", { status: 401 });
  const rows = await db.select().from(contactSubmissions).orderBy(desc(contactSubmissions.createdAt));
  const cols = ["id", "createdAt", "form", "topic", "firstName", "lastName", "organization", "email", "phone", "region", "country", "state", "optIn", "status", "message"] as const;
  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const lines = [cols.join(","), ...rows.map((r) => cols.map((c) => esc(c === "createdAt" ? r.createdAt.toISOString() : r[c])).join(","))];
  await audit(session, "settings", { label: "Exported submissions CSV", meta: { rows: rows.length } });
  return new Response("﻿" + lines.join("\r\n"), {
    headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="submissions-${new Date().toISOString().slice(0, 10)}.csv"` },
  });
}
