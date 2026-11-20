import { absoluteTitle } from "@/lib/seo";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { isRegion } from "@/lib/regions";
import { getPage } from "@/lib/content";
import { redirectIfLegacy } from "@/lib/redirects";
import { BlockList } from "@/blocks/render";
import { textPageBlocks } from "@/blocks/convert";
import { PageMark } from "@/components/editor/PageMark";
import { getSetting } from "@/lib/settings";
import { navigationFrom } from "@/lib/navigation";
import type { Block } from "@/blocks/types";

/**
 * /us and /ous  → region landing (therapies index)
 * /anything-else → global page from the `pages` table (privacy-statement, terms…)
 */
export async function generateMetadata({ params }: { params: Promise<{ seg: string }> }): Promise<Metadata> {
  const { seg } = await params;
  if (isRegion(seg)) return {};
  const page = await getPage(seg, null);
  if (!page) return {};
  return { title: absoluteTitle(page.metaTitle, page.title), description: page.metaDescription || undefined, robots: page.noindex ? { index: false } : undefined };
}

export default async function GlobalPage({ params }: { params: Promise<{ seg: string }> }) {
  const { seg } = await params;
  if (isRegion(seg)) redirect(`/${seg}/therapies`);

  const page = await getPage(seg, null);
  if (!page) {
    await redirectIfLegacy(`/${seg}`);
    notFound();
  }

  // Legal pages (the footer's Legal list) read as one set of documents: date, «On this page», the other documents
  // (docs/screens/pages.md, DESIGN.md → Текстовая страница).
  const legal = navigationFrom(await getSetting("navigation")).legal;
  const isLegal = legal.some((l) => l.href === `/${seg}`);
  const blocks: Block[] = textPageBlocks(page).map((b) =>
    isLegal && b.type === "richText" && b.variant === "default"
      ? { ...b, variant: "document", data: { ...b.data, related: legal.map((l) => ({ label: l.label, href: l.href, current: l.href === `/${seg}` })) } }
      : b,
  );
  return <>
      {page.blocks?.length ? <PageMark r={page.resource} id={page.id} /> : null}
      <BlockList blocks={blocks} />
    </>;
}
