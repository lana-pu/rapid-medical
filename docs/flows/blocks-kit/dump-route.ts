// Snapshot route for the wireframe flows: the registry metadata and the real block lists of the pages the flows use.
// Not part of the app: snapshot.sh copies it into src/app/api/flows-dump/, fetches it from a running dev server and removes it.
import { BLOCK_LIST } from "@/blocks/registry";
import { solutionToBlocks } from "@/blocks/from-solution";
import { pageToBlocks, contactToBlocks, aboutToBlocks, type AboutSettings } from "@/blocks/from-pages";
import { homeToBlocks, careersToBlocks, evidenceToBlocks, therapiesToBlocks, newsPageToBlocks, webinarsToBlocks, chooserToBlocks, jobsToBlocks, type HomeSettings, type CareersSettings, type EvidenceSettings, type TherapiesLanding } from "@/blocks/from-settings";
import { getSolution, getSolutionRegions, getSolutionsNav, getPublications, getFeaturedPublications, getProductsForRegion, getNews, getFeaturedNews, getWebinars, getJobs, getTeam, getPage } from "@/lib/content";
import { getSetting } from "@/lib/settings";
import { REGION_LABELS } from "@/lib/regions";
import type { Office } from "@/blocks/offices-map";

export const dynamic = "force-dynamic";

export async function GET() {
  const meta = BLOCK_LIST.map(({ type, name, description, category, variants, fields, nestable, pinned }) => ({ type, name, description, category, variants, fields, nestable: !!nestable, pinned: !!pinned }));
  const pages: Record<string, unknown> = {};
  const sol = async (slug: string, region: "us" | "ous" | "apac") => {
    const s = await getSolution(region, slug);
    return s ? solutionToBlocks(s, { region, others: (await getSolutionRegions(slug)).filter((r) => r !== region) }) : null;
  };
  pages["OUS · Large vessel stroke"] = await sol("lvo", "ous");
  pages["APAC · Large vessel stroke"] = await sol("lvo", "apac");
  pages["US · Aneurysm"] = await sol("aneurysm", "us");
  pages["Home"] = homeToBlocks({ home: await getSetting<HomeSettings>("home"), news: await getFeaturedNews(4), region: "us" });
  pages["About"] = aboutToBlocks({ about: await getSetting<AboutSettings>("about"), offices: (await getSetting<{ offices?: Office[] }>("contact")).offices ?? [], team: await getTeam() });
  pages["Careers"] = careersToBlocks({ c: await getSetting<CareersSettings>("careers"), jobCount: (await getJobs()).length });
  const [all, featured, products] = await Promise.all([getPublications("us"), getFeaturedPublications("us", 6), getProductsForRegion("us")]);
  pages["US · Evidence"] = evidenceToBlocks({ region: "us", cfg: await getSetting<EvidenceSettings>("evidence"), all, featured, products });
  pages["US · Therapies"] = therapiesToBlocks({ region: "us", landing: await getSetting<TherapiesLanding>("therapies:us"), items: await getSolutionsNav("us") });
  pages["News & Events"] = newsPageToBlocks(await getNews());
  pages["US · Webinars"] = webinarsToBlocks({ region: "us", list: await getWebinars("us") });
  pages["Contact"] = contactToBlocks({ region: "us", topic: "demo" });
  pages["Choose location"] = chooserToBlocks({ regional: await getSetting("regional"), suggested: null });
  pages["Open positions"] = jobsToBlocks(await getJobs());
  const terms = await getPage("terms", null);
  if (terms) pages["Terms"] = pageToBlocks(terms);
  const poster = await getPage("success-study-final-results", "us");
  if (poster) pages["US · SUCCESS study"] = pageToBlocks(poster, REGION_LABELS.us);
  return Response.json({ meta, pages });
}
