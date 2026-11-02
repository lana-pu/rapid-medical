import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { LEGACY_HOSTS, regionForCountry } from "@/lib/regions";

const SOLUTION_SLUGS = /^(lvo|mvo|aneurysm|vasospasm|access)$/;

/**
 * 1. Legacy regional subdomains (us./ous./apac.) → path-based regions on www.
 * 2. Guard /admin (cheap JWT check only; real authz happens in pages/actions).
 * 3. Remember the visitor's region; suggest one by IP country on first visit.
 */
export async function proxy(req: NextRequest) {
  const url = req.nextUrl;
  const host = req.headers.get("host")?.split(":")[0] ?? "";

  // --- 1. Legacy subdomain redirects ----------------------------------
  const legacy = LEGACY_HOSTS[host];
  if (legacy) {
    const canonical = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.rapid-medical.com";
    const seg = url.pathname.replace(/^\/|\/$/g, "");
    const path = seg === "" ? "/therapies" : SOLUTION_SLUGS.test(seg) ? `/therapies/${seg}` : url.pathname;
    return NextResponse.redirect(new URL(`/${legacy}${path}${url.search}`, canonical), 301);
  }

  // --- 2. Admin guard ---------------------------------------------------
  if (url.pathname.startsWith("/admin") && url.pathname !== "/admin/login") {
    const token = req.cookies.get("rm_admin")?.value;
    let ok = false;
    if (token && process.env.AUTH_SECRET) {
      try {
        await jwtVerify(token, new TextEncoder().encode(process.env.AUTH_SECRET));
        ok = true;
      } catch {
        ok = false;
      }
    }
    if (!ok) {
      const login = new URL("/admin/login", req.url);
      login.searchParams.set("next", url.pathname);
      return NextResponse.redirect(login);
    }
    return NextResponse.next();
  }

  // --- 3. Region memory + geo suggestion --------------------------------
  const m = /^\/(us|ous|apac)(\/|$)/.exec(url.pathname);
  if (m) {
    const res = NextResponse.next();
    res.cookies.set("rm_region", m[1], { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
    return res;
  }

  // Duda had a geo-redirect; we only *suggest* (banner on the chooser / header),
  // so the IP country is passed down as a cookie once.
  if (!req.cookies.get("rm_region") && !req.cookies.get("rm_geo")) {
    const cc = req.headers.get("x-vercel-ip-country") ?? req.headers.get("cf-ipcountry") ?? req.headers.get("x-country-code");
    const suggested = regionForCountry(cc);
    if (suggested) {
      const res = NextResponse.next();
      res.cookies.set("rm_geo", suggested, { path: "/", maxAge: 60 * 60 * 24 * 30, sameSite: "lax" });
      return res;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/|api/|uploads/|favicon.ico|robots.txt|sitemap.xml).*)"],
};
