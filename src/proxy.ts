import { NextResponse, type NextRequest } from "next/server";
import { LEGACY_HOSTS, regionForCountry } from "@/lib/regions";

const SOLUTION_SLUGS = /^(lvo|mvo|aneurysm|vasospasm|access|drivewire)$/;

/**
 * 1. Legacy regional subdomains (us./ous./apac.) → path-based regions on www.
 * 2. Cheap /admin gate: no session cookie → login. Real validation (DB session,
 *    2FA state, role) happens in requireUser() on every page and action.
 * 3. Region (spec → Регионы и URL, decision 2026-11-10): a regional path sets `rm_region`; with no region yet,
 *    the IP country's region is applied at once — written to the request too, so the very first page already
 *    renders with it. `rm_geo` keeps the IP region for the "you seem to be in …" banner on other regions' pages.
 *    No country → no region, and the menu falls back to the location chooser.
 * 4. Security headers.
 */
export async function proxy(req: NextRequest) {
  const url = req.nextUrl;
  const host = req.headers.get("host")?.split(":")[0] ?? "";

  const legacy = LEGACY_HOSTS[host];
  if (legacy) {
    const canonical = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.rapid-medical.com";
    const seg = url.pathname.replace(/^\/|\/$/g, "");
    const path = seg === "" ? "/therapies" : SOLUTION_SLUGS.test(seg) ? `/therapies/${seg}` : url.pathname;
    return NextResponse.redirect(new URL(`/${legacy}${path}${url.search}`, canonical), 301);
  }

  if (url.pathname.startsWith("/admin") && !url.pathname.startsWith("/admin/login") && !url.pathname.startsWith("/admin/reset")) {
    const cookie = req.cookies.get("rm_admin")?.value;
    if (!cookie || !/^[a-f0-9]{64}$/.test(cookie)) {
      const login = new URL("/admin/login", req.url);
      login.searchParams.set("next", url.pathname);
      return NextResponse.redirect(login);
    }
    return withHeaders(NextResponse.next());
  }

  const m = /^\/(us|ous|apac)(\/|$)/.exec(url.pathname);
  const cc = req.headers.get("x-vercel-ip-country") ?? req.headers.get("cf-ipcountry") ?? req.headers.get("x-country-code");
  const ipRegion = regionForCountry(cc);
  const set: [name: string, value: string, maxAge: number][] = [];
  if (m) {
    if (req.cookies.get(REGION_COOKIE)?.value !== m[1]) set.push([REGION_COOKIE, m[1], YEAR]);
  } else if (!req.cookies.get(REGION_COOKIE) && ipRegion) {
    set.push([REGION_COOKIE, ipRegion, YEAR]);
  }
  if (ipRegion && req.cookies.get(GEO_COOKIE)?.value !== ipRegion) set.push([GEO_COOKIE, ipRegion, 60 * 60 * 24 * 30]);
  if (set.length === 0) return withHeaders(NextResponse.next());

  // Same request sees the new values (server components read request cookies), the browser keeps them.
  for (const [name, value] of set) req.cookies.set(name, value);
  const res = withHeaders(NextResponse.next({ request: { headers: req.headers } }));
  for (const [name, value, maxAge] of set) res.cookies.set(name, value, { path: "/", maxAge, sameSite: "lax" });
  return res;
}

const REGION_COOKIE = "rm_region";
const GEO_COOKIE = "rm_geo";
const YEAR = 60 * 60 * 24 * 365;

function withHeaders(res: NextResponse) {
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("X-Frame-Options", "SAMEORIGIN");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  if (process.env.NODE_ENV === "production") res.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  return res;
}

export const config = {
  matcher: ["/((?!_next/|api/|uploads/|map/|favicon.ico|robots.txt|sitemap.xml).*)"],
};
