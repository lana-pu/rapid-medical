import Link from "next/link";
import { REGION_CHOICES } from "@/lib/regions";
import { withBase } from "@/lib/demo";
import { adminPageHref, pageScreen } from "@/admin/site-tree";
import { Crumbs } from "./ui";

/**
 * The header of a page of the site in Content (docs/screens/admin-sections.md → «Экран страницы»): where it is in the
 * tree, its name, and the tabs Overview · Google & address · History. The two last ones are the page record's form and
 * versions for one region: region pills switch between the regions' records.
 */
export type PageTab = "overview" | "google" | "history";
const regionName = (r: string | null) => (r ? (REGION_CHOICES.find((c) => c.region === r)?.label ?? r) : "All regions");

export async function PageTabs({ pageKey, active, current, actions }: { pageKey: string; active: PageTab; current?: { r: string; id: number }; actions?: React.ReactNode }) {
  const data = await pageScreen(pageKey);
  if (!data) return null;
  const { node, trail, cards } = data;
  const mine = current ? cards.find((c) => c.r === current.r && c.id === current.id) : cards[0];
  const recordTab = (t: PageTab, c = mine) => (c ? (t === "google" ? c.adminHref : `${c.adminHref}/history`) : null);
  const tabs: { key: PageTab; label: string; href: string | null }[] = [
    { key: "overview", label: "Overview", href: adminPageHref(pageKey) },
    { key: "google", label: "Google & address", href: recordTab("google") },
    { key: "history", label: "History", href: recordTab("history") },
  ];
  return (
    <div className="mb-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Crumbs items={[{ label: "Site", href: withBase("/admin/page") }, ...trail.filter((t) => t.versions.length).map((t) => ({ label: t.title, href: withBase(adminPageHref(t.key)) }))]} />
          <h1 className="text-2xl font-semibold text-neutral-900">{node.title}</h1>
          <p className="mt-1 text-sm text-neutral-500">{node.type}</p>
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
      <div className="mt-4 flex flex-wrap items-end justify-between gap-3 border-b border-neutral-200">
        <nav aria-label="Page tabs" className="flex gap-1">
          {tabs.map((t) =>
            t.href ? (
              <Link key={t.key} href={t.href} aria-current={active === t.key ? "page" : undefined} className={`-mb-px border-b-2 px-3 py-2 text-sm ${active === t.key ? "border-neutral-900 font-medium" : "border-transparent text-neutral-500 hover:text-neutral-800"}`}>
                {t.label}
              </Link>
            ) : null,
          )}
        </nav>
        {active !== "overview" && cards.length > 1 && (
          <div role="group" aria-label="Region" className="mb-1.5 flex overflow-hidden rounded border border-neutral-300 text-xs">
            {cards.map((c) => (
              <Link key={`${c.r}:${c.id}`} href={recordTab(active, c)!} aria-current={mine && c.id === mine.id && c.r === mine.r ? "page" : undefined} className={`px-2.5 py-1 ${mine && c.id === mine.id && c.r === mine.r ? "bg-neutral-900 text-white" : "hover:bg-neutral-100"}`}>
                {regionName(c.region)}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
