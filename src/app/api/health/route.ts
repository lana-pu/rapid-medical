import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/db";

export const dynamic = "force-dynamic";

/** Uptime probe: checks the database round-trip. */
export async function GET() {
  const t0 = Date.now();
  try {
    await db.execute(sql`select 1`);
    return NextResponse.json({ ok: true, db: "up", ms: Date.now() - t0 });
  } catch (e) {
    console.error("health: database down", e); // the reason goes to the log, not to whoever asks
    return NextResponse.json({ ok: false, db: "down" }, { status: 503 });
  }
}
