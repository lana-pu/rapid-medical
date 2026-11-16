import "server-only";
import { and, count, desc, eq, gte, inArray, isNotNull, isNull, like, max, notInArray, sql } from "drizzle-orm";
import { auditLog, comments, contactSubmissions, db, events, media, newsItems, notFoundLog, pages, publications, users } from "@/db";
import { day, today } from "@/lib/events";
import { REGION_CHOICES } from "@/lib/regions";
import { whereTo } from "@/lib/subscribers";
import { listSettingDrafts } from "@/lib/settings";
import { getSettingsGroup, mayEditGroup, mayEditOnPage } from "./settings";
import { getResource } from "./resources";
import { pendingDrafts } from "./workflow";
import { getRow } from "./engine";

/** The Website dashboard (docs/screens/admin-home.md): what waits, what I worked on, what is coming up, health, activity. */

/** Requests and comments are for the Inbox; changes to publish and broken links for the dashboard (docs/screens/admin-home.md). */
export type AttentionKind = "request" | "comment" | "publish" | "links";
export type Attention = { key: string; kind: AttentionKind; text: string; by?: string; at?: Date; action: string; href: string };

const TZ = "Asia/Jerusalem";
const when = (d: Date) => new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: TZ }).format(d);

/** What waits, for this person: settings groups their role cannot open are left out. */
export async function attention(user: { role: string }): Promise<Attention[]> {
  const [drafts, settingDrafts, [{ n: newRequests }]] = await Promise.all([
    pendingDrafts(),
    listSettingDrafts(),
    db.select({ n: count() }).from(contactSubmissions).where(eq(contactSubmissions.status, "new")),
  ]);
  const out: Attention[] = [];
  for (const d of drafts) {
    const res = getResource(d.resource);
    const path = res && d.data ? res.previewUrl?.({ ...(d.data as Record<string, unknown>), id: d.recordId }) : null;
    if (d.data) {
      out.push({
        kind: "publish",
        key: `d${d.id}`,
        text: `${d.label} — unpublished changes`,
        by: d.updatedByName,
        at: d.updatedAt,
        action: path ? "Open on page" : "Open",
        href: path ? `/api/editor?on=1&redirect=${encodeURIComponent(path)}` : `/admin/${d.resource}/${d.recordId}`,
      });
    }
    // a scheduled publication is not waiting for anyone: it is in «Coming up»
  }
  for (const s of settingDrafts) {
    const g = getSettingsGroup(s.key);
    if (!g || !mayEditOnPage(user, g)) continue;
    // page-label rights only: the way in is the page, not the limited settings screen
    const own = mayEditGroup(user, g);
    out.push({ kind: "publish", key: `g${s.key}`, text: `${g.title} — unpublished changes`, by: s.updatedByName, at: s.updatedAt, action: own ? "Open" : "Open on page", href: own ? `/admin/settings?group=${s.key}` : "/api/editor?on=1&redirect=%2F" });
  }
  out.sort((a, b) => (b.at?.getTime() ?? 0) - (a.at?.getTime() ?? 0));
  if (newRequests) out.unshift({ kind: "request", key: "requests", text: `${newRequests} new request${newRequests > 1 ? "s" : ""}`, action: "Open requests", href: "/admin/submissions?status=new" });
  // open comment threads, per page
  const open = await db.select({ resource: comments.resource, recordId: comments.recordId, n: count() }).from(comments).where(and(isNull(comments.parentId), isNull(comments.resolvedAt))).groupBy(comments.resource, comments.recordId);
  for (const c of open) {
    const res = getResource(c.resource);
    const row = res ? await getRow(res, c.recordId) : null;
    if (!res || !row) continue;
    const path = res.previewUrl?.(row) ?? null;
    out.push({ kind: "comment", key: `c${c.resource}${c.recordId}`, text: `${c.n} open comment${c.n > 1 ? "s" : ""} on ${String(row[res.labelField] ?? `#${c.recordId}`)}`, action: path ? "Open on page" : "Open", href: path ? `/api/editor?on=1&redirect=${encodeURIComponent(path)}` : `/admin/${res.slug}/${c.recordId}` });
  }
  const [{ n: broken }] = await db.select({ n: count() }).from(notFoundLog).where(isNull(notFoundLog.resolvedAt));
  if (broken) out.push({ kind: "links", key: "links", text: `${broken} broken link${broken > 1 ? "s" : ""} visitors hit`, action: "Fix links", href: "/admin/not-found-log" });
  return out;
}

/* ------------------------------------------------------------------ */
/*  Recent activity in words                                          */
/* ------------------------------------------------------------------ */

const ago = (d: Date, now = Date.now()) => {
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  const s = Math.round((d.getTime() - now) / 1000);
  for (const [u, n] of [["day", 86400], ["hour", 3600], ["minute", 60]] as const) if (Math.abs(s) >= n) return rtf.format(Math.round(s / n), u);
  return "just now";
};

export function phrase(e: typeof auditLog.$inferSelect): string {
  const what = e.label || (e.resource ? `${getResource(e.resource)?.titleSingular ?? e.resource}${e.recordId ? ` #${e.recordId}` : ""}` : "");
  const m = e.meta as Record<string, unknown>;
  switch (e.action) {
    case "publish": return `published ${what}`;
    case "unpublish": return `took ${what} off the site`;
    case "delete": return `deleted ${what}`;
    case "restore": return `restored an earlier version of ${what}`;
    case "schedule": return m.at ? `scheduled ${what}` : `cancelled the schedule of ${what}`;
    case "bulk": return `changed several ${getResource(e.resource ?? "")?.title.toLowerCase() ?? "records"} (${String(m.action ?? "")})`;
    case "settings": return `changed settings: ${what}`;
    case "user": return `changed people and roles${what ? `: ${what}` : ""}`;
    case "media": return m.replaced ? `replaced ${what} in ${String(m.places ?? "")} places` : m.alt ? `described ${what}` : `changed ${what} in the media library`;
    case "comment": return m.deleted ? `deleted a comment on ${getResource(e.resource ?? "")?.titleSingular.toLowerCase() ?? "a page"}` : m.resolved === true ? `resolved a comment: “${what}”` : m.resolved === false ? `reopened a comment: “${what}”` : `commented: “${what}”`;
    case "request": return m.took ? `took the request ${what}` : `updated the request ${what}`;
    case "save": return m.addressTo ? `changed the address of ${what} to ${String(m.addressTo)} (redirect added)` : m.discardedDraft ? `discarded changes to ${what}` : m.created ? `created ${what}` : `saved ${what}`;
    default: return `${e.action} ${what}`.trim();
  }
}

/**
 * The names of the records an entry is about, as the site shows them: the record's own label (not «Therapy page #10»)
 * and, for a page in a region, its region («Medium vessel stroke (Europe & Middle East)»).
 */
export async function namesFor(entries: (typeof auditLog.$inferSelect)[]): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  for (const e of entries) {
    if (!e.resource || !e.recordId) continue;
    const key = `${e.resource}:${e.recordId}`;
    if (out.has(key)) continue;
    const res = getResource(e.resource);
    const row = res ? await getRow(res, Number(e.recordId)).catch(() => null) : null;
    const name = row ? String(row[res!.labelField] ?? "") : "";
    const region = row?.region ? REGION_CHOICES.find((c) => c.region === row.region)?.label : null;
    out.set(key, name ? `${name}${region ? ` (${region})` : ""}` : e.label || `a deleted ${res?.titleSingular.toLowerCase() ?? "record"}`);
  }
  return out;
}

/** The team's actions in words; the same action on the same record, one after another, reads once with a count. */
export async function recentActivity(limit = 8): Promise<{ id: number; who: string; text: string; ago: string; href: string | null }[]> {
  const rows = await db.select().from(auditLog).where(notInArray(auditLog.action, ["login", "login_failed", "logout"])).orderBy(desc(auditLog.createdAt)).limit(limit * 6);
  const runs: { e: (typeof auditLog.$inferSelect); n: number }[] = [];
  for (const e of rows) {
    const last = runs[runs.length - 1];
    const same = last && last.e.userName === e.userName && last.e.action === e.action && last.e.resource === e.resource && last.e.recordId === e.recordId && (e.resource || last.e.label === e.label);
    if (same) last.n += 1;
    else if (runs.length < limit) runs.push({ e, n: 1 });
    else break;
  }
  const names = await namesFor(runs.map((x) => x.e));
  return runs.map(({ e, n }) => {
    const r = e.resource ? getResource(e.resource) : null;
    const named = e.resource && e.recordId ? { ...e, label: names.get(`${e.resource}:${e.recordId}`) ?? e.label } : e;
    return { id: e.id, who: e.userName || "Someone", text: `${phrase(named)}${n > 1 ? ` · ${n} times` : ""}`, ago: ago(e.createdAt), href: r && e.recordId ? `/admin/${r.slug}/${e.recordId}` : null };
  });
}

/* ------------------------------------------------------------------ */
/*  The header line, «Continue where you left off»                     */
/* ------------------------------------------------------------------ */

const label = (e: typeof auditLog.$inferSelect) => e.label || (e.resource ? `${getResource(e.resource)?.titleSingular ?? e.resource}${e.recordId ? ` #${e.recordId}` : ""}` : "");
const recordHref = (e: typeof auditLog.$inferSelect) => {
  const r = e.resource ? getResource(e.resource) : null;
  return r && e.recordId ? `/admin/${r.slug}/${e.recordId}` : null;
};

/** The last publication on the site: what, who, how long ago. */
export async function lastPublished(): Promise<{ what: string; who: string; ago: string } | null> {
  const [e] = await db.select().from(auditLog).where(eq(auditLog.action, "publish")).orderBy(desc(auditLog.createdAt)).limit(1);
  return e ? { what: label(e), who: e.userName || "someone", ago: ago(e.createdAt) } : null;
}

/** What this person saved or published lately — each record once, newest first. */
export async function myRecent(userId: number, limit = 5): Promise<{ key: string; text: string; ago: string; href: string }[]> {
  const rows = await db.select().from(auditLog)
    .where(and(eq(auditLog.userId, userId), inArray(auditLog.action, ["save", "publish", "restore"]), isNotNull(auditLog.resource), isNotNull(auditLog.recordId)))
    .orderBy(desc(auditLog.createdAt)).limit(60);
  const seen = new Set<string>();
  const picked: (typeof auditLog.$inferSelect)[] = [];
  for (const e of rows) {
    const key = `${e.resource}:${e.recordId}`;
    if (seen.has(key) || !recordHref(e)) continue;
    seen.add(key);
    picked.push(e);
    if (picked.length >= limit) break;
  }
  const names = await namesFor(picked);
  // a record deleted since cannot be continued: it is not offered
  return picked
    .filter((e) => !names.get(`${e.resource}:${e.recordId}`)?.startsWith("a deleted "))
    .map((e) => ({ key: `${e.resource}:${e.recordId}`, text: names.get(`${e.resource}:${e.recordId}`) ?? label(e), ago: ago(e.createdAt), href: recordHref(e)! }));
}

/* ------------------------------------------------------------------ */
/*  Coming up                                                          */
/* ------------------------------------------------------------------ */

export type ComingUp = { key: string; when: string; text: string; note: string; href: string };

/** Scheduled publications and the next published events with their registration (docs/screens/admin-home.md). */
export async function comingUp(): Promise<ComingUp[]> {
  const now = today();
  const [drafts, evs] = await Promise.all([
    pendingDrafts(),
    db.select().from(events).where(and(eq(events.status, "published"), gte(sql`coalesce(${events.endsOn}, ${events.startsOn})`, sql`${now}::date`))).orderBy(events.startsOn).limit(4),
  ]);
  const regs = evs.length
    ? await db.select({ slug: sql<string>`${contactSubmissions.meta}->>'event'`, n: count() }).from(contactSubmissions)
        .where(and(eq(contactSubmissions.form, "event"), inArray(sql<string>`${contactSubmissions.meta}->>'event'`, evs.map((e) => e.slug))))
        .groupBy(sql`${contactSubmissions.meta}->>'event'`)
    : [];
  const short = (d: Date | string) => new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(day(d)));
  const out: ComingUp[] = [];
  for (const d of drafts) {
    if (!d.publishAt) continue;
    out.push({ key: `s${d.id}`, when: when(d.publishAt), text: d.label, note: "publishes (Israel time)", href: `/admin/${d.resource}/${d.recordId}` });
  }
  for (const e of evs) {
    const closes = day(e.registrationClosesOn ?? e.startsOn);
    const n = Number(regs.find((r) => r.slug === e.slug)?.n ?? 0);
    const note =
      e.registration === "form" ? `${n} registered${now <= closes ? ` · closes ${short(closes)}` : " · registration closed"}`
      : e.registration === "link" ? `registration on ${whereTo(e.registrationUrl) ?? "another site"}`
      : "no registration";
    out.push({ key: `e${e.id}`, when: short(e.startsOn) + (e.endsOn && day(e.endsOn) !== day(e.startsOn) ? `–${short(e.endsOn)}` : ""), text: e.title, note, href: `/admin/events/${e.id}` });
  }
  return out;
}

/* ------------------------------------------------------------------ */
/*  Site health — only what can be fixed                               */
/* ------------------------------------------------------------------ */

export type Health = { key: string; text: string; ok: boolean; action?: string; href?: string };

const STALE_DAYS = 60;

export async function health(user: { role: string }): Promise<Health[]> {
  const [[{ n: noAlt }], [{ n: noDescription }], people, [news], [studies]] = await Promise.all([
    db.select({ n: count() }).from(media).where(and(like(media.mime, "image/%"), eq(media.alt, ""))),
    db.select({ n: count() }).from(pages).where(and(eq(pages.status, "published"), eq(pages.metaDescription, ""))),
    db.select({ totp: users.totpEnabledAt }).from(users).where(eq(users.active, true)),
    db.select({ last: max(newsItems.publishedOn) }).from(newsItems).where(eq(newsItems.status, "published")),
    db.select({ last: max(publications.publishedOn) }).from(publications).where(eq(publications.status, "published")),
  ]);
  const out: Health[] = [];
  if (noAlt) out.push({ key: "alt", ok: false, text: `${noAlt} picture${noAlt > 1 ? "s" : ""} without a description`, action: "Describe pictures", href: "/admin/media?describe=1" });
  if (noDescription) out.push({ key: "seo", ok: false, text: `${noDescription} page${noDescription > 1 ? "s" : ""} without a description for Google`, action: "Open pages", href: "/admin/pages" });
  const without2fa = people.filter((p) => !p.totp).length;
  if (user.role === "admin" && without2fa) out.push({ key: "2fa", ok: false, text: `${without2fa} ${without2fa > 1 ? "people" : "person"} without two-step sign-in`, action: "People", href: "/admin/users" });
  const age = (d: Date | null) => (d ? Math.max(0, Math.round((Date.parse(today()) - Date.parse(day(d))) / 86400_000)) : null);
  const fresh = (key: string, what: string, d: Date | null, href: string) => {
    const n = age(d);
    if (n == null) return;
    out.push({ key, ok: n <= STALE_DAYS, text: `Last ${what}: ${n === 0 ? "today" : n === 1 ? "yesterday" : `${n} days ago`}`, action: n > STALE_DAYS ? "Add one" : undefined, href });
  };
  fresh("news", "news item", news?.last ?? null, "/admin/news/new");
  fresh("studies", "study on Evidence", studies?.last ?? null, "/admin/publications/new");
  return out;
}
