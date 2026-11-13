import { draftMode } from "next/headers";
import { NextResponse } from "next/server";
import { verifyPreviewToken } from "@/lib/preview";
import { safeLocalPath } from "@/lib/safe-path";

/**
 * GET /api/preview?token=…            → enables Next draft mode, redirects to the path in the token
 * GET /api/preview?exit=1             → disables it
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const dm = await draftMode();
  if (url.searchParams.get("exit")) {
    dm.disable();
    return NextResponse.redirect(new URL(safeLocalPath(url.searchParams.get("redirect"), "/"), url.origin));
  }
  const token = url.searchParams.get("token");
  const claims = token ? await verifyPreviewToken(token) : null;
  if (!claims) return NextResponse.json({ error: "Invalid or expired preview link" }, { status: 401 });
  dm.enable();
  const safePath = safeLocalPath(claims.path, "/");
  return NextResponse.redirect(new URL(safePath, url.origin));
}
