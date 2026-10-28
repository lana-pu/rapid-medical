import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { LEGACY_HOSTS } from "@/lib/regions";

/**
 * 1. Legacy regional subdomains (us./ous.) → path-based regions on www.
 * 2. Guard /admin (cheap JWT check only; real authz happens in pages/actions).
 */
export async function proxy(req: NextRequest) {
  const url = req.nextUrl;
  const host = req.headers.get("host")?.split(":")[0] ?? "";

  // --- 1. Legacy subdomain redirects ----------------------------------
  const region = LEGACY_HOSTS[host];
  if (region) {
    const canonical = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.rapid-medical.com";
    const seg = url.pathname.replace(/^\/|\/$/g, "");
    const path =
      seg === "" ? "/therapies" : /^(lvo|mvo|aneurysm|vasospasm|access)$/.test(seg) ? `/therapies/${seg}` : url.pathname;
    return NextResponse.redirect(new URL(`/${region}${path}${url.search}`, canonical), 301);
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
  }

  // --- 3. Remember the visitor's region --------------------------------
  const m = /^\/(us|ous)(\/|$)/.exec(url.pathname);
  if (m) {
    const res = NextResponse.next();
    res.cookies.set("rm_region", m[1], { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
    return res;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/|api/|uploads/|favicon.ico|robots.txt|sitemap.xml).*)"],
};
