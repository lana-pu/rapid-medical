import "server-only";
import { eq } from "drizzle-orm";
import { db, materials } from "@/db";

/**
 * Admin addresses from before the move to one «materials» list (ADR-009, 2026-11-18): /admin/publications and
 * /admin/news (list, new, a record) lead to the same place in Publications & news. Publications kept their ids; a news
 * item is found by where it came from. null = not an old address.
 */
export async function movedAdminPath(resource: string, rest: "list" | "new" | number): Promise<string | null> {
  const only = resource === "publications" ? "showInEvidence" : resource === "news" ? "showInNews" : null;
  if (!only) return null;
  if (rest === "list") return `/admin/materials?${only}=true`;
  if (rest === "new") return `/admin/materials/new?kind=${resource === "news" ? "news" : "publication"}&${only}=true`;
  const ref = `${resource === "news" ? "news_items" : "publications"}:${rest}`;
  const row = await db.query.materials.findFirst({ columns: { id: true }, where: eq(materials.legacyRef, ref) });
  return row ? `/admin/materials/${row.id}` : `/admin/materials?${only}=true`;
}
