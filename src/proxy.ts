import { NextResponse, type NextRequest } from "next/server";
import { LEGACY_HOSTS, regionForCountry } from "@/lib/regions";

const SOLUTION_SLUGS = /^(lvo|mvo|aneurysm|vasospasm|access|drivewire)$/;

/**
 * 1. Legacy regional subdomains (us./ous./apac.) → path-based regions on www.
 * 2. Cheap /admin gate: no session cookie → login. Real validation (DB session,
 *    2FA state, role) happens in requireUser() on every page and action.
 * 3. Remember the visitor's region; suggest one by IP country on first visit.
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
  if (m) {
    const res = withHeaders(NextResponse.next());
    res.cookies.set("rm_region", m[1], { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
    return res;
  }

  if (!req.cookies.get("rm_region") && !req.cookies.get("rm_geo")) {
    const cc = req.headers.get("x-vercel-ip-country") ?? req.headers.get("cf-ipcountry") ?? req.headers.get("x-country-code");
    const suggested = regionForCountry(cc);
    if (suggested) {
      const res = withHeaders(NextResponse.next());
      res.cookies.set("rm_geo", suggested, { path: "/", maxAge: 60 * 60 * 24 * 30, sameSite: "lax" });
      return res;
    }
  }

  return withHeaders(NextResponse.next());
}

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
