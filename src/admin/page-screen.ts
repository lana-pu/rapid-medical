import "server-only";
import { and, count, desc, eq, gte, inArray, isNull, or, sql } from "drizzle-orm";
import { auditLog, comments, contactSubmissions, db, drafts, media, pageViews, pages, solutions } from "@/db";
import type { PageCard } from "./pages-index";
import type { PageVersion } from "./page-tree";
import { getResource } from "./resources";
import { mediaIndex, urlPattern } from "@/lib/media-usage";
import { countingSince } from "./analytics";

/**
 * One page of the site on one screen (docs/screens/admin-sections.md → «Экран страницы»): what each region waits for,
 * how the page did in 30 days, how Google shows it, the files on it, recent changes and open notes.
 */

const DAYS = 30;
const TZ = "Asia/Jerusalem";
const ago = (d: Date) => {
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  const s = Math.round((d.getTime() - Date.now()) / 1000);
  for (const [u, n] of [["day", 86400], ["hour", 3600], ["minute", 60]] as const) if (Math.abs(s) >= n) return rtf.format(Math.round(s / n), u);
  return "just now";
};
const recordKey = (r: string, id: number) => `${r}:${id}`;

export type Google = { key: string; region: PageCard["region"]; path: string; title: string; titleSet: boolean; description: string; settingsHref: string };
export type PageFile = { id: number; filename: string; url: string; kind: "PDF" | "Picture" | "Video" | "File"; opens: number };

export async function pageDetails(cards: PageCard[], versions: PageVersion[]) {
  const since = new Date(Date.now() - DAYS * 86_400_000);
  const paths = [...new Set(versions.map((v) => v.path))];
  const recs = cards.map((c) => ({ r: c.r, id: c.id }));
  const forRecords = recs.length
    ? or(...recs.map((x) => and(eq(auditLog.resource, x.r), eq(auditLog.recordId, String(x.id)))))
    : sql`false`;

  const [schedules, lastSaves, recent, views, leads, sols, pgs, notes, counting, allMedia, index] = await Promise.all([
    recs.length ? db.select().from(drafts).where(or(...recs.map((x) => and(eq(drafts.resource, x.r), eq(drafts.recordId, x.id))))) : [],
    db.select().from(auditLog).where(and(forRecords, inArray(auditLog.action, ["save", "publish", "restore"]))).orderBy(desc(auditLog.createdAt)).limit(100),
    db.select().from(auditLog).where(forRecords).orderBy(desc(auditLog.createdAt)).limit(5),
    paths.length ? db.select({ kind: pageViews.kind, visit: pageViews.visit, source: pageViews.source, file: pageViews.file, path: pageViews.path }).from(pageViews).where(and(gte(pageViews.at, since), inArray(pageViews.path, paths))) : [],
    paths.length
      ? db.select({ id: contactSubmissions.id }).from(contactSubmissions).where(and(gte(contactSubmissions.createdAt, since), sql`${contactSubmissions.status} <> 'spam'`, or(inArray(sql`${contactSubmissions.meta}->>'previous_page'`, paths), inArray(sql`${contactSubmissions.meta}->>'form_page'`, paths))))
      : [],
    cards.some((c) => c.r === "solutions") ? db.select({ id: solutions.id, metaTitle: solutions.metaTitle, metaDescription: solutions.metaDescription, navLabel: solutions.navLabel }).from(solutions).where(inArray(solutions.id, cards.filter((c) => c.r === "solutions").map((c) => c.id))) : [],
    cards.some((c) => c.r === "pages") ? db.select({ id: pages.id, metaTitle: pages.metaTitle, metaDescription: pages.metaDescription, title: pages.title }).from(pages).where(inArray(pages.id, cards.filter((c) => c.r === "pages").map((c) => c.id))) : [],
    recs.length ? db.select({ n: count() }).from(comments).where(and(isNull(comments.parentId), isNull(comments.resolvedAt), or(...recs.map((x) => and(eq(comments.resource, x.r), eq(comments.recordId, x.id)))))) : [{ n: 0 }],
    countingSince().catch(() => null),
    db.select({ id: media.id, filename: media.filename, url: media.url, mime: media.mime }).from(media),
    mediaIndex(),
  ]);

  // per region: a schedule, and who touched it last
  const scheduled = new Map(schedules.filter((d) => d.publishAt).map((d) => [recordKey(d.resource, d.recordId), d.publishAt!]));
  const lastEdit = new Map<string, { who: string; ago: string }>();
  for (const e of lastSaves) {
    const k = recordKey(e.resource ?? "", Number(e.recordId));
    if (!lastEdit.has(k)) lastEdit.set(k, { who: e.userName || "someone", ago: ago(e.createdAt) });
  }
  const when = (d: Date) => new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: TZ }).format(d);

  // how the page did — every region of it together
  const tally = (xs: (string | null)[]) => {
    const m = new Map<string, number>();
    for (const x of xs) if (x) m.set(x, (m.get(x) ?? 0) + 1);
    return [...m].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
  };
  const downloads = views.filter((v) => v.kind === "download");
  const performance = {
    views: views.filter((v) => v.kind === "view").length,
    landings: views.filter((v) => v.visit).length,
    requests: leads.length,
    sources: tally(views.filter((v) => v.visit).map((v) => v.source ?? "Direct")).slice(0, 4),
    since: counting && counting > since ? new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: TZ }).format(counting) : null,
  };

  // how Google shows each region (pages with their own fields; the others use Settings → Google defaults)
  const google: Google[] = cards.flatMap((c) => {
    const row = c.r === "solutions" ? sols.find((x) => x.id === c.id) : c.r === "pages" ? pgs.find((x) => x.id === c.id) : null;
    if (!row) return [];
    const d = schedules.find((x) => x.resource === c.r && x.recordId === c.id)?.data as Record<string, unknown> | null | undefined;
    const metaTitle = String(d?.metaTitle ?? row.metaTitle ?? "");
    const fallback = "navLabel" in row ? `${row.navLabel}` : row.title;
    return [{ key: recordKey(c.r, c.id), region: c.region, path: c.path, title: metaTitle || `${fallback} | Rapid Medical™`, titleSet: !!metaTitle, description: String(d?.metaDescription ?? row.metaDescription ?? ""), settingsHref: c.adminHref }];
  });

  // the files on the page: the media library's files its records (live or pending) point at
  const texts = index.filter((x) => recs.some((r) => r.r === x.r && r.id === x.id)).map((x) => x.text);
  const files: PageFile[] = allMedia
    .filter((m) => texts.some((t) => urlPattern(m.url).test(t)))
    .map((m) => ({
      id: m.id,
      filename: m.filename,
      url: m.url,
      kind: m.mime === "application/pdf" ? ("PDF" as const) : m.mime.startsWith("image/") ? ("Picture" as const) : m.mime.startsWith("video/") ? ("Video" as const) : ("File" as const),
      opens: downloads.filter((v) => v.file === m.url).length,
    }))
    .sort((a, b) => (a.kind === "PDF" ? 0 : 1) - (b.kind === "PDF" ? 0 : 1) || a.filename.localeCompare(b.filename));

  return {
    region: (c: PageCard) => ({ edited: lastEdit.get(recordKey(c.r, c.id)) ?? null, publishes: scheduled.has(recordKey(c.r, c.id)) ? when(scheduled.get(recordKey(c.r, c.id))!) : null }),
    performance,
    google,
    files,
    recent: recent.map((e) => {
      const res = e.resource ? getResource(e.resource) : null;
      const card = cards.find((c) => c.r === e.resource && String(c.id) === e.recordId);
      const region = card?.region ? ` (${card.region.toUpperCase()})` : "";
      const m = e.meta as Record<string, unknown>;
      const did = e.action === "publish" ? "published" : e.action === "unpublish" ? "took it off the site" : e.action === "restore" ? "restored a version" : e.action === "schedule" ? "scheduled it" : e.action === "comment" ? "left a note" : m.addressTo ? `moved it to ${String(m.addressTo)}` : "edited";
      return { id: e.id, text: `${e.userName || "Someone"} ${did}${region}`, ago: ago(e.createdAt), href: res && card ? `${card.adminHref}/history` : null };
    }),
    notes: Number(notes[0]?.n ?? 0),
  };
}
