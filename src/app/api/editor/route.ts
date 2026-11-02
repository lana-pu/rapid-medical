import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { setEditorMode } from "@/lib/editing";

/**
 * GET /api/editor?on=1&redirect=/path  → turn on the on-page editor (draft mode + rm_edit cookie)
 * GET /api/editor?off=1&redirect=/path → turn it off
 * Requires a verified admin session; any role may edit (publishing is gated separately).
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const to = url.searchParams.get("redirect") ?? "/";
  const safe = to.startsWith("/") && !to.startsWith("//") ? to : "/";
  if (url.searchParams.get("off")) {
    await setEditorMode(false);
    return NextResponse.redirect(new URL(safe, url.origin));
  }

  const user = await getSession();
  if (!user) return NextResponse.redirect(new URL(`/admin/login?next=${encodeURIComponent(`/api/editor?on=1&redirect=${safe}`)}`, url.origin));
  if (user.totpPending) return NextResponse.redirect(new URL("/admin/login/2fa", url.origin));
  await setEditorMode(true);
  return NextResponse.redirect(new URL(safe, url.origin));
}
