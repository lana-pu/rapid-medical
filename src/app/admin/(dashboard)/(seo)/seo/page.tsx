import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { seoPages } from "@/admin/seo";
import { adminPageHref } from "@/admin/site-tree";
import { PAUSED_REGIONS } from "@/lib/regions";
import { Notice } from "@/components/admin/ui";
import { SeoList } from "@/components/admin/SeoList";
import { SeoEditor } from "@/components/admin/SeoEditor";
import { SpaceColumn } from "@/components/admin/SpaceColumn";
import { MAIN_BLEED, MAIN_PAD } from "@/components/admin/chrome";

/**
 * Search & sharing (docs/screens/admin-seo.md): every page's Google title and description in one place — the pages
 * on the left with what needs fixing, the chosen page on the right with a live preview per region.
 */
export default async function SearchAndSharing({ searchParams }: { searchParams: Promise<{ page?: string; published?: string }> }) {
  await requireUser();
  const sp = await searchParams;
  const pages = await seoPages();
  const page = pages.find((p) => p.key === sp.page) ?? pages.find((p) => p.problems) ?? pages[0];
  const back = `/admin/seo?page=${encodeURIComponent(page?.key ?? "/")}`;
  const inUse = page?.versions.filter((v) => !v.region || !PAUSED_REGIONS.includes(v.region)) ?? [];
  const paused = page?.versions.filter((v) => v.region && PAUSED_REGIONS.includes(v.region)) ?? [];
  // pages, the same number as «Only problems» and the Settings overview (docs/screens/admin-seo.md)
  const problems = pages.filter((p) => p.problems).length;

  return (
    <div className={`${MAIN_BLEED} flex min-h-[calc(100vh-3rem)] flex-col lg:flex-row`}>
      <SpaceColumn label="Pages">
      <div className="w-64 max-w-[calc(100vw-3rem)] shrink-0 overflow-y-auto border-r border-neutral-200 bg-white">
        <SeoList items={pages.map((p) => ({ key: p.key, name: p.name, section: p.section, problems: p.problems, regions: p.versions.length }))} current={page?.key ?? ""} />
      </div>
      </SpaceColumn>
      <div className={`@container min-w-0 flex-1 ${MAIN_PAD}`}>
        <div className="mb-1 text-xs text-neutral-500"><Link href="/admin/settings" className="hover:underline">Settings</Link> › Search &amp; sharing</div>
        <h1 className="text-2xl font-semibold text-neutral-900">{page?.name ?? "Search & sharing"}</h1>
        <p className="mt-1 max-w-3xl text-sm text-neutral-600">
          How this page looks in Google. The same texts are in the page&apos;s own Settings — change them here or there.
          {problems ? ` ${problems} page${problems > 1 ? "s" : ""} need${problems > 1 ? "" : "s"} a look across the site.` : " Every page is fine."}
        </p>
        {page && page.key !== "/webinars" && page.key !== "/news-events" && page.key !== "/open-positions" && page.key !== "/contact-us" && (
          <Link href={adminPageHref(page.key)} className="mt-2 inline-block text-sm underline">Open the page</Link>
        )}
        {sp.published && <div className="mt-4"><Notice kind="success">Published.</Notice></div>}
        <div className="mt-6 space-y-4">
          {inUse.map((v) => <SeoEditor key={v.key} v={v} back={back} />)}
          {paused.length > 0 && (
            <details className="rounded-lg border border-dashed border-neutral-300 bg-white/60 p-4">
              <summary className="cursor-pointer text-sm text-neutral-600">{paused.map((v) => v.label).join(", ")} — not in use now</summary>
              <div className="mt-4 space-y-4">{paused.map((v) => <SeoEditor key={v.key} v={v} back={back} />)}</div>
            </details>
          )}
        </div>
      </div>
    </div>
  );
}
