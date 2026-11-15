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
const PATH = /^\/[^\s<>"']{0,299}$/;
const hits = new Map<string, number[]>();
function limited(key: string) {
  const now = Date.now();
  const arr = (hits.get(key) ?? []).filter((t) => now - t < 60_000);
  arr.push(now);
  hits.set(key, arr);
  if (hits.size > 10_000) hits.clear(); // keep memory bounded
  return arr.length > 120;
}
const cut = (v: unknown, n = 200) => (typeof v === "string" && v.trim() ? v.trim().slice(0, n) : null);

export async function POST(req: NextRequest) {
  const ua = req.headers.get("user-agent") ?? "";
  if (!ua || BOT.test(ua) || req.cookies.get("rm_admin")) return new NextResponse(null, { status: 204 });
  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "local";
  if (limited(ip)) return new NextResponse(null, { status: 204 });
  let b: Record<string, unknown>;
  try {
    const text = await req.text();
    if (text.length > 4000) return new NextResponse(null, { status: 413 });
    b = JSON.parse(text) as Record<string, unknown>;
  } catch {
    return new NextResponse(null, { status: 400 });
  }
  const kind = b.k === "download" ? "download" : b.k === "view" ? "view" : null;
  const path = typeof b.p === "string" && PATH.test(b.p) ? b.p.split(/[?#]/)[0] : null;
  if (!kind || !path || path.startsWith("/admin") || path.startsWith("/api")) return new NextResponse(null, { status: 400 });
  const visit = kind === "view" && b.v === true;
  const cc = req.headers.get("x-vercel-ip-country") ?? req.headers.get("cf-ipcountry") ?? req.headers.get("x-country-code");
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
    file: kind === "download" && typeof b.f === "string" && PATH.test(b.f) ? b.f.split(/[?#]/)[0] : null,
  });
  return new NextResponse(null, { status: 204 });
}
