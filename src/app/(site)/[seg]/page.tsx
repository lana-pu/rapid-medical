import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { isRegion } from "@/lib/regions";
import { getPage } from "@/lib/content";
import { safeHtml } from "@/lib/html";
import { redirectIfLegacy } from "@/lib/redirects";
import { Section, H1, Prose } from "@/components/site/primitives";
import { E } from "@/components/site/editable";

/**
 * /us and /ous  → region landing (therapies index)
 * /anything-else → global page from the `pages` table (privacy-statement, terms…)
 */
export async function generateMetadata({ params }: { params: Promise<{ seg: string }> }): Promise<Metadata> {
  const { seg } = await params;
  if (isRegion(seg)) return {};
  const page = await getPage(seg, null);
  if (!page) return {};
  return { title: page.metaTitle || page.title, description: page.metaDescription || undefined, robots: page.noindex ? { index: false } : undefined };
}

export default async function GlobalPage({ params }: { params: Promise<{ seg: string }> }) {
  const { seg } = await params;
  if (isRegion(seg)) redirect(`/${seg}/therapies`);

  const page = await getPage(seg, null);
  if (!page) {
    await redirectIfLegacy(`/${seg}`);
    notFound();
  }

  return (
    <Section>
      <H1><E r="pages" id={page.id} f="title">{page.title}</E></H1>
      <E r="pages" id={page.id} f="bodyHtml" k="rich" className="mt-8 max-w-3xl"><Prose html={safeHtml(page.bodyHtml)} /></E>
    </Section>
  );
}
