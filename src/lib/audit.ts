import "server-only";
import { headers } from "next/headers";
import { db, auditLog } from "@/db";
import type { SessionUser } from "./auth";

export type AuditAction = "login" | "login_failed" | "logout" | "save" | "publish" | "unpublish" | "delete" | "restore" | "bulk" | "settings" | "user" | "media" | "schedule" | "request" | "comment";

/** Best-effort audit entry; never throws into the caller. */
export async function audit(user: SessionUser | null, action: AuditAction, opts: { resource?: string; recordId?: number | string; label?: string; meta?: Record<string, unknown> } = {}) {
  try {
    let ip: string | null = null;
    try {
      const h = await headers();
      ip = (h.get("x-forwarded-for") ?? "").split(",")[0].trim() || null;
    } catch { /* outside a request */ }
    await db.insert(auditLog).values({
      userId: user && user.id > 0 ? user.id : null,
      userName: user?.name ?? (opts.meta?.email as string | undefined) ?? "",
      action,
      resource: opts.resource ?? null,
      recordId: opts.recordId != null ? String(opts.recordId) : null,
      label: opts.label ?? "",
      meta: opts.meta ?? {},
      ip,
    });
  } catch (e) {
    console.error("audit failed", e);
  }
}
