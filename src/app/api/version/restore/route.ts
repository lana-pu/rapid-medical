import { NextResponse, type NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db, revisions } from "@/db";
import { getSession, isReady } from "@/lib/auth";
import { PAGE_RESOURCES, revisionPath } from "@/lib/version";
import { getResource } from "@/admin/resources";
import { getRow } from "@/admin/engine";
import { restoreRevision } from "@/admin/workflow";
import { setEditorMode } from "@/lib/editing";

/**
 * «Restore this version» from the banner over a viewed version: the version becomes the page's draft (as History →
 * Restore), then the page opens in the editor to check and Publish. Same-origin form post; session with 2FA required.
 */
export async function POST(req: NextRequest) {
  // a form on this site only (the session cookie is SameSite=Lax as well): security review 2026-11-15
  const origin = req.headers.get("origin");
  const site = req.headers.get("sec-fetch-site");
  if ((origin && new URL(origin).host !== req.headers.get("host")) || (site && site !== "same-origin")) return NextResponse.json({ error: "Bad origin" }, { status: 403 });
  const user = await getSession();
  if (!isReady(user)) return NextResponse.redirect(new URL("/admin/login", req.url), 303);
  const fd = await req.formData();
  const id = Number(fd.get("rev"));
  const rev = Number.isInteger(id) && id > 0 ? await db.query.revisions.findFirst({ where: eq(revisions.id, id) }) : null;
  const res = rev && PAGE_RESOURCES.includes(rev.resource) ? getResource(rev.resource) : null;
  if (!rev || !res) return NextResponse.json({ error: "Version not found" }, { status: 404 });
  // the version must belong to the page it was viewed on
  if ((await revisionPath(rev)) !== String(fd.get("path") ?? "")) return NextResponse.json({ error: "This version is not of this page" }, { status: 400 });
  await restoreRevision(res, rev.id, user!);
  const row = await getRow(res, rev.recordId);
  await setEditorMode(true);
  return NextResponse.redirect(new URL(res.previewUrl?.(row ?? {}) ?? "/", req.url), 303);
}
