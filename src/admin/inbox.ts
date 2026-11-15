import "server-only";
import { and, count, desc, eq, gte, isNull, like, ne, or } from "drizzle-orm";
import { comments, contactSubmissions, db, events, jobs, pageViews } from "@/db";
import { isPast } from "@/lib/events";
import { whereTo } from "@/lib/subscribers";
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
  /** requests: the newsletter box was ticked (the Subscribed folder) */
  optIn?: boolean;
  /** requests: the sender's address (Subscribed counts people by it) */
  email?: string;
};

/** Something sent from the site that does not reach us: an external registration or application (screens/admin-inbox.md). */
export type Elsewhere = { key: string; folder: "event" | "careers"; title: string; where: string; button: string; clicks: number; href: string };

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
    unread: !r.readAt && r.status !== "spam", // open = read, like mail (docs/screens/admin-requests.md)
    folder: r.form,
    status: r.status,
    optIn: r.optIn,
    email: r.email,
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

/** For the rail: requests nobody has opened yet (not spam), and open notes. */
export async function unreadCount(): Promise<number> {
  const [[a], [b]] = await Promise.all([
    db.select({ n: count() }).from(contactSubmissions).where(and(isNull(contactSubmissions.readAt), ne(contactSubmissions.status, "spam"))),
    db.select({ n: count() }).from(comments).where(and(isNull(comments.parentId), isNull(comments.resolvedAt))),
  ]);
  return Number(a?.n ?? 0) + Number(b?.n ?? 0);
}

const CLICK_DAYS = 30;

/**
 * Published upcoming events registered through an outside link and published jobs applied for outside the site,
 * with how many clicked the button in the last 30 days — so an empty Events or Careers folder is not read as
 * "nobody is interested".
 */
export async function elsewhere(): Promise<Elsewhere[]> {
  const since = new Date(Date.now() - CLICK_DAYS * 86400_000);
  const [evs, js, clicks] = await Promise.all([
    db.select({ id: events.id, slug: events.slug, title: events.title, url: events.registrationUrl, startsOn: events.startsOn, endsOn: events.endsOn })
      .from(events).where(and(eq(events.status, "published"), eq(events.registration, "link"))),
    db.select({ id: jobs.id, slug: jobs.slug, title: jobs.title, url: jobs.applyUrl, email: jobs.applyEmail }).from(jobs).where(eq(jobs.status, "published")),
    db.select({ path: pageViews.path, n: count() }).from(pageViews)
      .where(and(eq(pageViews.kind, "out"), gte(pageViews.at, since), or(like(pageViews.path, "/events/%"), like(pageViews.path, "/open-positions/%"))))
      .groupBy(pageViews.path),
  ]);
  const n = (path: string) => Number(clicks.find((c) => c.path === path)?.n ?? 0);
  const out: Elsewhere[] = [];
  for (const e of evs) {
    const where = whereTo(e.url);
    if (!where || isPast(e)) continue;
    out.push({ key: `e${e.id}`, folder: "event", title: e.title, where, button: "Register", clicks: n(`/events/${e.slug}`), href: `/admin/events/${e.id}` });
  }
  for (const j of js) {
    const where = [whereTo(j.url), whereTo(j.email)].filter(Boolean).join(" or ");
    if (!where) continue;
    out.push({ key: `j${j.id}`, folder: "careers", title: j.title, where, button: "Apply", clicks: n(`/open-positions/${j.slug}`), href: `/admin/jobs/${j.id}` });
  }
  return out;
}
