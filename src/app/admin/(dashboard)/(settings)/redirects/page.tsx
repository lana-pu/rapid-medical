import { count } from "drizzle-orm";
import { db, redirects } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { ResourceListView } from "../../(content)/[resource]/page";
import { OldLinksTabs } from "@/components/admin/OldLinksTabs";
import { LinkButton } from "@/components/admin/ui";

/**
 * Redirects — a tab of Old links in Settings (docs/admin-ia.md): the generic list without a heading of its own; the
 * count and «New redirect» sit in the tabs' row (docs/screens/admin-not-found-log.md, 2026-11-27).
 */
export default async function Redirects({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requireAdmin();
  const [{ n }] = await db.select({ n: count() }).from(redirects);
  return (
    <>
      <OldLinksTabs active="redirects" aside={<><span className="text-sm text-neutral-500">{n} redirect{n === 1 ? "" : "s"}</span><LinkButton href="/admin/redirects/new" variant="primary">+ New redirect</LinkButton></>} />
      {await ResourceListView({ params: Promise.resolve({ resource: "redirects" }), searchParams, embedded: true })}
    </>
  );
}
