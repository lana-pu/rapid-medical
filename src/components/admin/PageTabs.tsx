import Link from "next/link";
import { REGION_CHOICES } from "@/lib/regions";
import { withBase } from "@/lib/demo";
import { adminPageHref, pageScreen } from "@/admin/site-tree";
import { Crumbs } from "./ui";

/**
 * The header of a page's Settings or Versions for one region (docs/screens/admin-sections.md → «Экран страницы»):
 * where it is in the tree, the page's name, what this is («Settings · Americas»), a way back to the page's screen and
 * the regions to switch between. No tabs: the page's screen is one screen.
 */
export type PageTab = "settings" | "history";
const regionName = (r: string | null) => (r ? (REGION_CHOICES.find((c) => c.region === r)?.label ?? r) : "All regions");

export async function PageTabs({ pageKey, active, current, actions }: { pageKey: string; active: PageTab; current?: { r: string; id: number }; actions?: React.ReactNode }) {
  const data = await pageScreen(pageKey);
  if (!data) return null;
  const { node, trail, cards } = data;
  const mine = current ? cards.find((c) => c.r === current.r && c.id === current.id) : cards[0];
  const hrefOf = (c: (typeof cards)[number]) => (active === "settings" ? c.adminHref : `${c.adminHref}/history`);
  return (
    <div className="mb-6">
      <Crumbs items={[{ label: "Site", href: withBase("/admin/page") }, ...[...trail, node].filter((t) => t.versions.length).map((t) => ({ label: t.title, href: withBase(adminPageHref(t.key)) }))]} />
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">{active === "settings" ? "Settings" : "Versions"}</h1>
          <p className="mt-1 text-sm text-neutral-500">
            {node.title}
            {mine?.region ? ` · ${regionName(mine.region)}` : ""} · <Link href={adminPageHref(pageKey)} className="underline">← Page</Link>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {cards.length > 1 && (
            <div role="group" aria-label="Region" className="flex overflow-hidden rounded border border-neutral-300 text-xs">
              {cards.map((c) => (
                <Link key={`${c.r}:${c.id}`} href={hrefOf(c)} aria-current={mine && c.id === mine.id && c.r === mine.r ? "page" : undefined} className={`px-2.5 py-1 ${mine && c.id === mine.id && c.r === mine.r ? "bg-neutral-900 text-white" : "hover:bg-neutral-100"}`}>
                  {regionName(c.region)}
                </Link>
              ))}
            </div>
          )}
          {actions}
        </div>
      </div>
    </div>
  );
}
