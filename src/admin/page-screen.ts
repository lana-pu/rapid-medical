import "server-only";
import { and, count, desc, eq, gte, inArray, isNull, or, sql } from "drizzle-orm";
import { auditLog, comments, contactSubmissions, db, drafts, media, pageViews } from "@/db";
import type { PageCard } from "./pages-index";
import type { PageVersion } from "./page-tree";
import { getResource } from "./resources";
import { mediaIndex, urlPattern } from "@/lib/media-usage";
import { countingSince } from "./analytics";

/**
 * One page of the site on one screen (docs/screens/admin-sections.md → «Экран страницы»): what each region waits for,
 * how the page did in 30 days, the files on it, recent changes and open notes (Google texts: src/admin/seo.ts).
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

export type PageFile = { id: number; filename: string; url: string; kind: "PDF" | "Picture" | "Video" | "File"; opens: number; thumb: string | null };

type MediaRow = { url: string; mime: string; variants: { w: number; url: string }[]; posterUrl: string | null };
/** A small picture of a file: the smallest web copy at least 240 px wide, a video's poster; none for a PDF. */
const thumbOf = (m: MediaRow): string | null =>
  m.mime.startsWith("image/") ? ([...m.variants].sort((a, b) => a.w - b.w).find((v) => v.w >= 240)?.url ?? m.url) : m.mime.startsWith("video/") ? m.posterUrl : null;

/** Previews for these addresses (the media library's files only). */
export async function thumbsFor(urls: string[]): Promise<Record<string, string>> {
  if (!urls.length) return {};
  const rows = await db.select({ url: media.url, mime: media.mime, variants: media.variants, posterUrl: media.posterUrl }).from(media).where(inArray(media.url, [...new Set(urls)]));
  return Object.fromEntries(rows.flatMap((m) => (thumbOf(m) ? [[m.url, thumbOf(m)!]] : [])));
}

export async function pageDetails(cards: PageCard[], versions: PageVersion[]) {
  const since = new Date(Date.now() - DAYS * 86_400_000);
  const paths = [...new Set(versions.map((v) => v.path))];
  const recs = cards.map((c) => ({ r: c.r, id: c.id }));
  const forRecords = recs.length
    ? or(...recs.map((x) => and(eq(auditLog.resource, x.r), eq(auditLog.recordId, String(x.id)))))
    : sql`false`;

  const [schedules, lastSaves, recent, views, leads, notes, counting, allMedia, index] = await Promise.all([
    recs.length ? db.select().from(drafts).where(or(...recs.map((x) => and(eq(drafts.resource, x.r), eq(drafts.recordId, x.id))))) : [],
    db.select().from(auditLog).where(and(forRecords, inArray(auditLog.action, ["save", "publish", "restore"]))).orderBy(desc(auditLog.createdAt)).limit(100),
    db.select().from(auditLog).where(forRecords).orderBy(desc(auditLog.createdAt)).limit(5),
    paths.length ? db.select({ kind: pageViews.kind, visit: pageViews.visit, source: pageViews.source, file: pageViews.file, path: pageViews.path }).from(pageViews).where(and(gte(pageViews.at, since), inArray(pageViews.path, paths))) : [],
    paths.length
      ? db.select({ id: contactSubmissions.id }).from(contactSubmissions).where(and(gte(contactSubmissions.createdAt, since), sql`${contactSubmissions.status} <> 'spam'`, or(inArray(sql`${contactSubmissions.meta}->>'previous_page'`, paths), inArray(sql`${contactSubmissions.meta}->>'form_page'`, paths))))
      : [],
    recs.length ? db.select({ n: count() }).from(comments).where(and(isNull(comments.parentId), isNull(comments.resolvedAt), or(...recs.map((x) => and(eq(comments.resource, x.r), eq(comments.recordId, x.id)))))) : [{ n: 0 }],
    countingSince().catch(() => null),
    db.select({ id: media.id, filename: media.filename, url: media.url, mime: media.mime, variants: media.variants, posterUrl: media.posterUrl }).from(media),
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
      thumb: thumbOf(m),
    }))
    .sort((a, b) => (a.kind === "PDF" ? 0 : 1) - (b.kind === "PDF" ? 0 : 1) || a.filename.localeCompare(b.filename));

  return {
    region: (c: PageCard) => ({ edited: lastEdit.get(recordKey(c.r, c.id)) ?? null, publishes: scheduled.has(recordKey(c.r, c.id)) ? when(scheduled.get(recordKey(c.r, c.id))!) : null }),
    performance,
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
