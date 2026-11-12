import "server-only";
import { and, count, desc, eq, isNull, like, max, notInArray } from "drizzle-orm";
import { auditLog, comments, contactSubmissions, db, media, publications, users } from "@/db";
import { listSettingDrafts } from "@/lib/settings";
import { getSettingsGroup, mayEditOnPage } from "./settings";
import { getResource } from "./resources";
import { pendingDrafts } from "./workflow";
import { getRow } from "./engine";

/** «Website — what needs you» (docs/screens/admin-home.md): what waits for someone, recent activity, a summary. */

export type Attention = { key: string; text: string; by?: string; at?: Date; action: string; href: string };

const TZ = "Asia/Jerusalem";
const when = (d: Date) => new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: TZ }).format(d);

/** What waits, for this person: settings groups their role cannot open are left out. */
export async function attention(user: { role: string }): Promise<Attention[]> {
  const [drafts, settingDrafts, [{ n: newRequests }], [{ n: noAlt }]] = await Promise.all([
    pendingDrafts(),
    listSettingDrafts(),
    db.select({ n: count() }).from(contactSubmissions).where(eq(contactSubmissions.status, "new")),
    db.select({ n: count() }).from(media).where(and(like(media.mime, "image/%"), eq(media.alt, ""))),
  ]);
  const out: Attention[] = [];
  for (const d of drafts) {
    const res = getResource(d.resource);
    const path = res && d.data ? res.previewUrl?.({ ...(d.data as Record<string, unknown>), id: d.recordId }) : null;
    if (d.data) {
      out.push({
        key: `d${d.id}`,
        text: `${d.label} — unpublished changes`,
        by: d.updatedByName,
        at: d.updatedAt,
        action: path ? "Open on page" : "Open",
        href: path ? `/api/editor?on=1&redirect=${encodeURIComponent(path)}` : `/admin/${d.resource}/${d.recordId}`,
      });
    }
    if (d.publishAt) out.push({ key: `s${d.id}`, text: `${d.label} — publishes ${when(d.publishAt)} (Israel time)`, at: d.updatedAt, action: "Open", href: `/admin/${d.resource}/${d.recordId}` });
  }
  for (const s of settingDrafts) {
    const g = getSettingsGroup(s.key);
    if (!g || !mayEditOnPage(user, g)) continue;
    out.push({ key: `g${s.key}`, text: `${g.title} — unpublished changes`, by: s.updatedByName, at: s.updatedAt, action: "Open", href: `/admin/settings?group=${s.key}` });
  }
  out.sort((a, b) => (b.at?.getTime() ?? 0) - (a.at?.getTime() ?? 0));
  if (newRequests) out.unshift({ key: "requests", text: `${newRequests} new request${newRequests > 1 ? "s" : ""}`, action: "Open requests", href: "/admin/submissions?status=new" });
  // open comment threads, per page
  const open = await db.select({ resource: comments.resource, recordId: comments.recordId, n: count() }).from(comments).where(and(isNull(comments.parentId), isNull(comments.resolvedAt))).groupBy(comments.resource, comments.recordId);
  for (const c of open) {
    const res = getResource(c.resource);
    const row = res ? await getRow(res, c.recordId) : null;
    if (!res || !row) continue;
    const path = res.previewUrl?.(row) ?? null;
    out.push({ key: `c${c.resource}${c.recordId}`, text: `${c.n} open comment${c.n > 1 ? "s" : ""} on ${String(row[res.labelField] ?? `#${c.recordId}`)}`, action: path ? "Open on page" : "Open", href: path ? `/api/editor?on=1&redirect=${encodeURIComponent(path)}` : `/admin/${res.slug}/${c.recordId}` });
  }
  if (noAlt) out.push({ key: "alt", text: `${noAlt} picture${noAlt > 1 ? "s" : ""} without a description`, action: "Describe pictures", href: "/admin/media?describe=1" });
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

function phrase(e: typeof auditLog.$inferSelect): string {
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
    case "save": return m.discardedDraft ? `discarded changes to ${what}` : m.created ? `created ${what}` : `saved ${what}`;
    default: return `${e.action} ${what}`.trim();
  }
}

export async function recentActivity(limit = 8): Promise<{ id: number; who: string; text: string; ago: string; href: string | null }[]> {
  const rows = await db.select().from(auditLog).where(notInArray(auditLog.action, ["login", "login_failed", "logout"])).orderBy(desc(auditLog.createdAt)).limit(limit);
  return rows.map((e) => {
    const r = e.resource ? getResource(e.resource) : null;
    return { id: e.id, who: e.userName || "Someone", text: phrase(e), ago: ago(e.createdAt), href: r && e.recordId ? `/admin/${r.slug}/${e.recordId}` : null };
  });
}

/* ------------------------------------------------------------------ */
/*  Summary                                                           */
/* ------------------------------------------------------------------ */

export async function summary() {
  const [[pub], [files], [noAlt], people] = await Promise.all([
    db.select({ n: count(), last: max(publications.createdAt) }).from(publications),
    db.select({ n: count() }).from(media),
    db.select({ n: count() }).from(media).where(and(like(media.mime, "image/%"), eq(media.alt, ""))),
    db.select({ totp: users.totpEnabledAt }).from(users).where(eq(users.active, true)),
  ]);
  return {
    studies: pub.n,
    lastStudy: pub.last ? new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeZone: TZ }).format(pub.last) : null,
    files: files.n,
    filesNoAlt: noAlt.n,
    people: people.length,
    peopleWithout2fa: people.filter((p) => !p.totp).length,
  };
}
