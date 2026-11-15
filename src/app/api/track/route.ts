import { NextResponse, type NextRequest } from "next/server";
import { db, pageViews } from "@/db";
import { hostOf, sourceOf } from "@/lib/source";
import { regionForCountry } from "@/lib/regions";

/**
 * The site's own visit counter, without cookies (spec.md → Аналитика → В). The page sends a beacon: a view (first page
 * of the visit or not) or a PDF download. Stored without IP, cookie or visitor id. Bots and people signed in to the
 * admin are not counted; one address — at most 120 requests a minute (in memory, per instance).
 */
const BOT = /bot|crawl|spider|slurp|preview|headless|lighthouse|monitor|curl|wget|python|axios|node-fetch/i;
/** A page of the site: plain address characters only, no «//», no %-escapes (security review 2026-11-15). */
const PAGE = /^\/(?!\/)[A-Za-z0-9\-._~/]{0,299}$/;
/** A PDF of the site: the same, plus valid %-escapes (file names with spaces). */
const FILE = /^\/(?!\/)(?:[A-Za-z0-9\-._~/]|%[0-9A-Fa-f]{2}){0,299}\.pdf$/i;
const WINDOW = 60_000;
const PER_ADDRESS = 120;
/** All addresses together, per instance: a ceiling on writes whatever the address says. */
const PER_MINUTE = 3_000;
const hits = new Map<string, number[]>();
let minute = { start: 0, n: 0 };
function limited(key: string) {
  const now = Date.now();
  if (now - minute.start > WINDOW) minute = { start: now, n: 0 };
  if (++minute.n > PER_MINUTE) return true;
  const arr = (hits.get(key) ?? []).filter((t) => now - t < WINDOW);
  arr.push(now);
  hits.set(key, arr);
  // keep memory bounded: drop addresses that have been quiet for a minute, one by one (no global reset)
  if (hits.size > 10_000) for (const [k, v] of hits) if (now - v[v.length - 1] >= WINDOW) hits.delete(k);
  return arr.length > PER_ADDRESS;
}
/** The client's address as the host sets it (Vercel: x-real-ip / x-vercel-forwarded-for), not a client-sent list. */
const clientAddress = (req: NextRequest) => req.headers.get("x-real-ip") ?? req.headers.get("x-vercel-forwarded-for")?.split(",")[0].trim() ?? (req.headers.get("x-forwarded-for") ?? "").split(",").pop()?.trim() ?? "local";
const cut = (v: unknown, n = 200) => (typeof v === "string" && v.trim() ? v.trim().slice(0, n) : null);

export async function POST(req: NextRequest) {
  const ua = req.headers.get("user-agent") ?? "";
  if (!ua || BOT.test(ua) || req.cookies.get("rm_admin")) return new NextResponse(null, { status: 204 });
  if (limited(clientAddress(req) || "local")) return new NextResponse(null, { status: 204 });
  let b: Record<string, unknown>;
  try {
    const text = await req.text();
    if (text.length > 4000) return new NextResponse(null, { status: 413 });
    b = JSON.parse(text) as Record<string, unknown>;
  } catch {
    return new NextResponse(null, { status: 400 });
  }
  const kind = b.k === "download" ? "download" : b.k === "view" ? "view" : null;
  const path = typeof b.p === "string" ? b.p.split(/[?#]/)[0] : null;
  if (!kind || !path || !PAGE.test(path) || /^\/(admin|api)(\/|$)/i.test(path)) return new NextResponse(null, { status: 400 });
  const visit = kind === "view" && b.v === true;
  const cc = req.headers.get("x-vercel-ip-country"); // set by the host; no client-sent country
  const m = /^\/(us|ous|apac)(\/|$)/.exec(path);
  const region = m?.[1] ?? req.cookies.get("rm_region")?.value ?? regionForCountry(cc) ?? null;
  const ref = visit ? cut(b.r, 500) : null;
  const utm = { utm_source: visit ? cut(b.us) : null, utm_medium: visit ? cut(b.um) : null, utm_campaign: visit ? cut(b.uc) : null };
  await db.insert(pageViews).values({
    kind,
    path,
    visit,
    region: region && /^(us|ous|apac)$/.test(region) ? region : null,
    country: cc && /^[A-Z]{2}$/.test(cc) ? cc : null,
    source: visit ? sourceOf({ referrer: ref, ...utm }) : null,
    referrerHost: visit ? hostOf(ref) : null,
    utmSource: utm.utm_source,
    utmMedium: utm.utm_medium,
    utmCampaign: utm.utm_campaign,
    file: kind === "download" && typeof b.f === "string" && FILE.test(b.f.split(/[?#]/)[0]) ? b.f.split(/[?#]/)[0] : null,
  });
  return new NextResponse(null, { status: 204 });
}
