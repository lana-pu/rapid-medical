import { and, desc, eq, inArray, type SQL } from "drizzle-orm";
import { getSession, isReady } from "@/lib/auth";
import { db, contactSubmissions } from "@/db";
import { audit } from "@/lib/audit";
import { subscribers } from "@/lib/subscribers";

/**
 * GET /api/admin/submissions.csv — all form submissions as CSV (Excel-friendly).
 * `?subscribed=1` — the Mailchimp list: one row per person who ticked the newsletter box (docs/screens/admin-inbox.md).
 * Inbox's «Export ↓» passes what is shown: `state` (open · mine · done · spam), `form`, `region`.
 */
export async function GET(req: Request) {
  const session = await getSession();
  if (!isReady(session)) return new Response("Unauthorized", { status: 401 });
  const sp = new URL(req.url).searchParams;
  const list = sp.get("subscribed") === "1";
  const where: SQL[] = [];
  if (!list) {
    const state = sp.get("state");
    if (state === "open" || state === "mine") where.push(inArray(contactSubmissions.status, ["new", "in_progress"]));
    if (state === "mine") where.push(eq(contactSubmissions.assignedToId, session.id));
    if (state === "done" || state === "spam") where.push(eq(contactSubmissions.status, state));
    if (sp.get("form")) where.push(eq(contactSubmissions.form, sp.get("form")!));
    if (sp.get("region")) where.push(eq(contactSubmissions.region, sp.get("region")!));
  }
  const all = await db.select().from(contactSubmissions).where(where.length ? and(...where) : undefined).orderBy(desc(contactSubmissions.createdAt));
  const rows = list ? subscribers(all) : all;
  const cols = list
    ? (["email", "firstName", "lastName", "organization", "country", "region", "form", "createdAt"] as const)
    : (["id", "createdAt", "form", "topic", "firstName", "lastName", "organization", "email", "phone", "region", "country", "state", "optIn", "status", "message"] as const);
  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const lines = [cols.join(","), ...rows.map((r) => cols.map((c) => esc(c === "createdAt" ? r.createdAt.toISOString() : r[c])).join(","))];
  await audit(session, "settings", { label: list ? "Exported newsletter subscribers CSV" : "Exported submissions CSV", meta: { rows: rows.length } });
  const name = `${list ? "subscribers" : "submissions"}-${new Date().toISOString().slice(0, 10)}.csv`;
  return new Response("﻿" + lines.join("\r\n"), {
    headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="${name}"` },
  });
}
