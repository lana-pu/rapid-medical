import { NextResponse, type NextRequest } from "next/server";
import { and, eq } from "drizzle-orm";
import { db, solutions, pages } from "@/db";
import { isRegion } from "@/lib/regions";
import { safeLocalPath } from "@/lib/safe-path";

export const dynamic = "force-dynamic";

const YEAR = 60 * 60 * 24 * 365;

/**
 * Header region switcher (spec → Регионы и URL, decision 2026-11-10).
 * GET /api/region?to=ous&back=/us/therapies/lvo → remembers the choice and returns to the same page in the
 * chosen region; a regional page that does not exist there (e.g. MVO in the US) → that region's overview.
 * Global pages (About, News…) are returned to as they are, now with the new region in the menu.
 */
export async function GET(req: NextRequest) {
  const to = req.nextUrl.searchParams.get("to");
  if (!isRegion(to)) return NextResponse.json({ error: "Unknown region" }, { status: 400 });

  const target = await targetFor(to, req.nextUrl.searchParams.get("back"));
  const res = NextResponse.redirect(new URL(target, req.url), 303);
  res.cookies.set("rm_region", to, { path: "/", maxAge: YEAR, sameSite: "lax" });
  // A manual choice wins over the IP: don't offer "go to your region" afterwards.
  res.cookies.set("rm_geo_dismissed", "1", { path: "/", maxAge: 60 * 60 * 24 * 30, sameSite: "lax" });
  return res;
}

async function targetFor(to: string, back: string | null): Promise<string> {
  // Local paths only: no "//host", no scheme, no backslashes (open-redirect guard).
  if (!back || safeLocalPath(back, "") === "") return `/${to}/therapies`;
  const path = back.split(/[?#]/)[0];
  const m = /^\/(us|ous|apac)(\/.*)?$/.exec(path);
  if (!m) return path === "/choose-your-location" ? `/${to}/therapies` : back;

  const rest = (m[2] ?? "").replace(/\/$/, "");
  // the open product tab (#comaneci…) comes along
  const hash = /^#[a-z0-9-]{1,60}$/i.test(back.slice(back.indexOf("#"))) && back.includes("#") ? back.slice(back.indexOf("#")) : "";
  if (rest === "" || rest === "/therapies" || rest === "/evidence" || rest === "/webinars") return `/${to}${rest || "/therapies"}${rest ? hash : ""}`;

  const therapy = /^\/therapies\/([a-z0-9-]+)$/.exec(rest);
  if (therapy) {
    const found = await db.query.solutions.findFirst({ columns: { id: true }, where: and(eq(solutions.region, to as "us"), eq(solutions.slug, therapy[1]), eq(solutions.status, "published")) });
    // not in that region: its overview says so (docs/screens/therapy.md, usability pass 2026-11-13)
    return found ? `/${to}${rest}${hash}` : `/${to}/therapies?missing=${therapy[1]}`;
  }
  const page = /^\/([a-zA-Z0-9_-]+)$/.exec(rest);
  if (page) {
    const found = await db.query.pages.findFirst({ columns: { id: true }, where: and(eq(pages.region, to as "us"), eq(pages.slug, page[1]), eq(pages.status, "published")) });
    return found ? `/${to}${rest}` : `/${to}/therapies`;
  }
  return `/${to}/therapies`;
}
