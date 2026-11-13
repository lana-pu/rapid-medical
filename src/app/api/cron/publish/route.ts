import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { publishDue } from "@/admin/workflow";

/**
 * Publishes scheduled drafts. Call every few minutes:
 *   - Vercel: vercel.json → { "crons": [{ "path": "/api/cron/publish", "schedule": "*\/5 * * * *" }] }
 *   - elsewhere: curl -H "Authorization: Bearer $CRON_SECRET" https://site/api/cron/publish
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  // in production the secret is required (Vercel sends it); without one only a dev server may call this
  if (!secret && process.env.NODE_ENV === "production") return NextResponse.json({ error: "CRON_SECRET is not set" }, { status: 503 });
  if (secret && auth !== `Bearer ${secret}`) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const done = await publishDue();
  if (done.length) revalidatePath("/", "layout");
  return NextResponse.json({ published: done });
}
