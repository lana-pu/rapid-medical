import "server-only";
import { and, count, desc, eq, isNull } from "drizzle-orm";
import { comments, contactSubmissions, db } from "@/db";
import { getResource } from "./resources";
import { getRow } from "./engine";
import { formLabel } from "./request-labels";

/**
 * Inbox — messages only (docs/admin-ia.md → «Уточнения 2026-11-15»): what visitors sent through the site's forms and
 * the team's notes on pages (open comment threads). Everything else that needs someone is on the dashboard.
 */

export type MessageFolder = "contact" | "webinar" | "careers" | "event" | "notes";
export type Message = {
  key: string;
  kind: "request" | "note";
  href: string;
  /** opens outside the admin (a note opens its page in the editor) */
  external?: boolean;
  from: string;
  subject: string;
  snippet: string;
  at: string;
  unread: boolean;
  folder: MessageFolder | string;
  /** requests: new · in-progress · done · spam */
  status?: string;
};

const LIMIT = 300;

export async function inboxMessages(): Promise<Message[]> {
  const [reqs, notes] = await Promise.all([
    db.select().from(contactSubmissions).orderBy(desc(contactSubmissions.createdAt)).limit(LIMIT),
    db.select().from(comments).where(and(isNull(comments.parentId), isNull(comments.resolvedAt))).orderBy(desc(comments.createdAt)).limit(LIMIT),
  ]);
  const out: Message[] = reqs.map((r) => ({
    key: `r${r.id}`,
    kind: "request",
    href: `/admin/submissions/${r.id}`,
    from: [`${r.firstName ?? ""} ${r.lastName ?? ""}`.trim() || r.email, r.organization].filter(Boolean).join(" · "),
    subject: r.topic ? `${formLabel(r.form)} · ${r.topic}` : formLabel(r.form),
    snippet: (r.message ?? "").replace(/\s+/g, " ").slice(0, 160),
    at: r.createdAt.toISOString(),
    unread: r.status === "new",
    folder: r.form,
    status: r.status,
  }));
  for (const c of notes) {
    const res = getResource(c.resource);
    const row = res ? await getRow(res, c.recordId) : null;
    if (!res || !row) continue;
    const path = res.previewUrl?.(row) ?? null;
    out.push({
      key: `c${c.id}`,
      kind: "note",
      href: path ? `/api/editor?on=1&redirect=${encodeURIComponent(path)}` : `/admin/${res.slug}/${c.recordId}`,
      external: !!path,
      from: c.authorName || "Someone",
      subject: `Note on ${String(row[res.labelField] ?? res.titleSingular)}`,
      snippet: c.body.replace(/\s+/g, " ").slice(0, 160),
      at: c.createdAt.toISOString(),
      unread: true,
      folder: "notes",
    });
  }
  return out.sort((a, b) => b.at.localeCompare(a.at));
}

/** For the rail: requests nobody has opened yet, and open notes. */
export async function unreadCount(): Promise<number> {
  const [[a], [b]] = await Promise.all([
    db.select({ n: count() }).from(contactSubmissions).where(eq(contactSubmissions.status, "new")),
    db.select({ n: count() }).from(comments).where(and(isNull(comments.parentId), isNull(comments.resolvedAt))),
  ]);
  return Number(a?.n ?? 0) + Number(b?.n ?? 0);
}
