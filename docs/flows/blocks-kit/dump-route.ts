// Snapshot route for the wireframe flows: the registry metadata and the real block lists of the pages the flows use.
// Not part of the app: snapshot.sh copies it into src/app/api/flows-dump/, fetches it from a running dev server and removes it.
// Each page is built the way its route builds it: site_pages blocks when the page is stored (ADR-007), else the converter.
import { BLOCK_LIST } from "@/blocks/registry";
import { therapyPageBlocks } from "@/blocks/convert";
import { resolveBlocks } from "@/blocks/stored";
import { pageToBlocks, contactToBlocks, aboutToBlocks, companyFacts, type AboutSettings } from "@/blocks/from-pages";
import { homeToBlocks, careersToBlocks, evidenceToBlocks, therapiesToBlocks, publicationCounts, newsPageToBlocks, webinarsToBlocks, chooserToBlocks, jobsToBlocks, jobRow, type HomeSettings, type CareersSettings, type EvidenceSettings, type TherapiesLanding } from "@/blocks/from-settings";
import { getSolution, getSolutionRegions, getSolutionsNav, getPublications, getFeaturedPublications, getProductsForRegion, getNews, getEvents, getFeaturedNews, getWebinars, getJobs, getTeam, getPage, getSitePage, getPublicationCount } from "@/lib/content";
import { getSetting } from "@/lib/settings";
import { REGION_LABELS } from "@/lib/regions";
import type { Office } from "@/blocks/offices-map";

export const dynamic = "force-dynamic";

export async function GET() {
  const meta = BLOCK_LIST.map(({ type, name, description, category, variants, fields, nestable, pinned }) => ({ type, name, description, category, variants, fields, nestable: !!nestable, pinned: !!pinned }));
  const pages: Record<string, unknown> = {};
  const sol = async (slug: string, region: "us" | "ous" | "apac") => {
    const s = await getSolution(region, slug);
    return s ? therapyPageBlocks(s, { region, others: (await getSolutionRegions(slug)).filter((r) => r !== region) }) : null;
  };
  pages["OUS · Large vessel stroke"] = await sol("lvo", "ous");
  pages["APAC · Large vessel stroke"] = await sol("lvo", "apac");
  pages["US · Aneurysm"] = await sol("aneurysm", "us");

  const news4 = await getFeaturedNews(4);
  const home = await getSitePage("home", null);
  pages["Home"] = home
    ? resolveBlocks(home.blocks, { region: "us", lists: { news: news4 } })
    : homeToBlocks({ home: await getSetting<HomeSettings>("home"), news: news4, region: "us" });

  const offices = (await getSetting<{ offices?: Office[] }>("contact")).offices ?? [];
  const team = await getTeam();
  const facts = companyFacts(await getPublicationCount(), offices);
  const about = await getSitePage("about", null);
  pages["About"] = about
    ? resolveBlocks(about.blocks, { region: null, lists: { team, offices, facts } })
    : aboutToBlocks({ about: await getSetting<AboutSettings>("about"), offices, team, facts });

  const jobs = await getJobs();
  const rows = jobs.map(jobRow);
  const careers = await getSitePage("careers", null);
  pages["Careers"] = careers
    ? resolveBlocks(careers.blocks, { region: null, lists: { jobCount: jobs.length, jobs: rows } })
    : careersToBlocks({ c: await getSetting<CareersSettings>("careers"), jobCount: jobs.length, jobs: rows });

  const [all, featured, products] = await Promise.all([getPublications("us"), getFeaturedPublications("us", 6), getProductsForRegion("us")]);
  const evidence = await getSitePage("evidence", "us");
  pages["US · Evidence"] = evidence
    ? resolveBlocks(evidence.blocks, { region: "us", lists: { evidence: { all, featured, products } } })
    : evidenceToBlocks({ region: "us", cfg: await getSetting<EvidenceSettings>("evidence"), all, featured, products });

  const items = await getSolutionsNav("us");
  const publications = publicationCounts({ all, products, featured: [] });
  const therapies = await getSitePage("therapies", "us");
  pages["US · Therapies"] = therapies
    ? resolveBlocks(therapies.blocks, { region: "us", lists: { therapies: items, publicationCounts: publications } })
    : therapiesToBlocks({ region: "us", landing: await getSetting<TherapiesLanding>("therapies:us"), items, publications });

  pages["News & Events"] = newsPageToBlocks(await getNews(), await getEvents());
  pages["US · Webinars"] = webinarsToBlocks({ region: "us", list: await getWebinars("us") });
  pages["Contact"] = contactToBlocks({ region: "us", topic: "demo", country: "US", offices });
  const regional = await getSetting<{ chooserTitle?: string; chooserNote?: string }>("regional");
  pages["Choose location"] = chooserToBlocks({ regional, suggested: null });
  pages["Choose location · from the header"] = chooserToBlocks({ regional, suggested: null, back: "/ous/therapies/lvo", current: { label: "Europe & Middle East", source: "chosen" } });
  pages["Open positions"] = jobsToBlocks(jobs);
  const terms = await getPage("terms", null);
  if (terms) pages["Terms"] = pageToBlocks(terms);
  const poster = await getPage("success-study-final-results", "us");
  if (poster) pages["US · SUCCESS study"] = pageToBlocks(poster, REGION_LABELS.us);
  return Response.json({ meta, pages });
}
