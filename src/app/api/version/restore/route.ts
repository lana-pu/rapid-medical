import { NextResponse, type NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db, revisions } from "@/db";
import { getSession, isReady } from "@/lib/auth";
import { PAGE_RESOURCES } from "@/lib/version";
import { getResource } from "@/admin/resources";
import { getRow } from "@/admin/engine";
import { restoreRevision } from "@/admin/workflow";
import { setEditorMode } from "@/lib/editing";

/**
 * «Restore this version» from the banner over a viewed version: the version becomes the page's draft (as History →
 * Restore), then the page opens in the editor to check and Publish. Same-origin form post; session with 2FA required.
 */
export async function POST(req: NextRequest) {
  const user = await getSession();
  if (!isReady(user)) return NextResponse.redirect(new URL("/admin/login", req.url), 303);
  const id = Number((await req.formData()).get("rev"));
  const rev = Number.isInteger(id) && id > 0 ? await db.query.revisions.findFirst({ where: eq(revisions.id, id) }) : null;
  const res = rev && PAGE_RESOURCES.includes(rev.resource) ? getResource(rev.resource) : null;
  if (!rev || !res) return NextResponse.json({ error: "Version not found" }, { status: 404 });
  await restoreRevision(res, rev.id, user!);
  const row = await getRow(res, rev.recordId);
  await setEditorMode(true);
  return NextResponse.redirect(new URL(res.previewUrl?.(row ?? {}) ?? "/", req.url), 303);
}
