/**
 * Turns the raw crawl (content/raw) into structured seed JSON (content/seed).
 * Re-run after re-crawling. Hand-curated files in content/seed
 * (solutions.json, settings.json, products.json) are NOT touched.
 *
 *   npx tsx scripts/extract-duda.ts
 */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import * as cheerio from "cheerio";

const RAW = path.resolve("content/raw");
const OUT = path.resolve("content/seed");

const html = (host: string, page: string) => readFile(path.join(RAW, host, `${page}.html`), "utf8");
const md = (host: string, page: string) => readFile(path.join(RAW, host, `${page}.md`), "utf8");

function monthYear(m: string): string {
  const [mo, yy] = m.split("/").map(Number); // "7/26" → "2026-07-01"
  return `20${String(yy).padStart(2, "0")}-${String(mo).padStart(2, "0")}-01`;
}

function clean(s: string) {
  return s.replace(/[​﻿ ‭‬]/g, " ").replace(/\s+/g, " ").replace(/\s+([,.])/g, "$1").trim();
}

function sourceOf(url: string) {
  const h = new URL(url).hostname.replace(/^www\./, "");
  const map: Record<string, string> = {
    "businesswire.com": "BusinessWire", "secure.businesswire.com": "BusinessWire", "prnewswire.com": "PR Newswire", "prnewswire.co.uk": "PR Newswire",
    "neuronewsinternational.com": "NeuroNews", "evtoday.com": "Endovascular Today", "medscape.com": "Medscape", "irp.cdn-website.com": "Rapid Medical",
  };
  return map[h] ?? h;
}

/* ------------------------------------------------------------------ */
/*  News                                                               */
/* ------------------------------------------------------------------ */
type N = { title: string; publishedOn: string; url: string; source: string; imageUrl: string | null; featured: boolean };

async function news(): Promise<N[]> {
  const $ = cheerio.load(await html("www.rapid-medical.com", "news-events"));
  const items: N[] = [];

  // 1. Full list: <li class="listItem"><a href><span.itemName>M/YY</span><span.itemText>Title</span>
  $("li.listItem").each((_, li) => {
    const url = $(li).find("a").first().attr("href");
    const date = clean($(li).find(".itemName").text()).split(" ")[0];
    const title = clean($(li).find(".itemText").text());
    if (!url || !/^\d{1,2}\/\d{2}$/.test(date) || !title) return;
    items.push({ title, publishedOn: monthYear(date), url, source: sourceOf(url), imageUrl: null, featured: false });
  });

  // 2. Featured carousel widget (JSON with images) – merge images in, add missing items
  const m = /\[\{"uuid":"\d+","title":[\s\S]*?\}\](?=[,}\]])/.exec($.html());
  if (m) {
    const arr = JSON.parse(m[0]) as { title: string; desc: string; media?: { imgSrc?: string }; linkDomAttributes?: { href?: string } }[];
    for (const it of arr) {
      const title = clean(cheerio.load(it.desc).text());
      const url = it.linkDomAttributes?.href;
      if (!title || !url) continue;
      const img = it.media?.imgSrc && !/Rapid-Logo/.test(it.media.imgSrc) ? it.media.imgSrc : null;
      const d = new Date(`1 ${it.title.replace(",", "")}`);
      const publishedOn = Number.isNaN(d.getTime()) ? "2026-01-01" : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
      const ex = items.find((x) => x.title.toLowerCase().slice(0, 50) === title.toLowerCase().slice(0, 50));
      if (ex) ex.imageUrl ??= img;
      else items.push({ title, publishedOn, url, source: sourceOf(url), imageUrl: img, featured: false });
    }
  }
  items.sort((a, b) => (a.publishedOn < b.publishedOn ? 1 : -1));
  items.slice(0, 4).forEach((i) => (i.featured = true));
  return items;
}

/* ------------------------------------------------------------------ */
/*  Publications                                                       */
/* ------------------------------------------------------------------ */
type Pub = {
  title: string; authors: string; journal: string; doi: string | null; url: string | null; pdfUrl: string | null;
  publishedOn: string; product: string; variant: string | null; regions: string[]; featured: boolean; imageUrl: string | null;
};

/** Map a tab label to a product slug (see content/seed/settings.ts PRODUCTS). */
function productForTab(tab: string): string {
  const t = tab.toLowerCase().replace(/\s+/g, "");
  if (/comaneci/.test(t)) return "comaneci";
  if (/drivewire|columbus/.test(t)) return "drivewire";
  if (/tigertriever13/.test(t)) return "tigertriever-13";
  if (/25|xl/.test(t)) return "tigertriever-xl";
  return "tigertriever";
}

async function publicationsFrom(host: string, region: "us" | "ous" | "apac"): Promise<Pub[]> {
  const $ = cheerio.load(await html(host, "evidence"));
  const out: Pub[] = [];
  const btnSel = $(".tab-btn").length ? ".tab-btn" : ".product-name";
  const panelSel = $(".tab-panel").length ? ".tab-panel" : ".tab-content";
  const tabNames = $(btnSel).map((_, b) => clean($(b).text())).get();
  $(panelSel).each((pi, panel) => {
    const tab = tabNames[pi] ?? "";
    const product = productForTab(tab);
    $(panel).find("li").each((_, li) => {
      const strong = $(li).find("strong").first();
      const date = clean(strong.find("span").first().text());
      if (!/^\d{1,2}\/\d{2}$/.test(date)) return;
      const title = clean(strong.text().replace(date, ""));
      const small = $(li).find("small").first();
      const parts = (small.html() ?? "").split(/<br\s*\/?>/i).map((x) => clean(cheerio.load(x).text()));
      let authors = parts[0] ?? "";
      if (/^(https?:\/\/|doi)/i.test(authors)) { parts.unshift(""); authors = ""; }
      const citation = parts.slice(1).join(" ");
      const links = [$(li).closest("a").attr("href"), ...$(li).find("a").map((_, a) => $(a).attr("href")).get()].filter((x): x is string => !!x);
      const link = links.find((x) => !/\.pdf(\?|$)/i.test(x)) ?? links[0] ?? null;
      const pdf = links.find((x) => /\.pdf(\?|$)/i.test(x)) ?? null;
      const doi = /10\.\d{4,}\/[^\s)]+/.exec(`${citation} ${link ?? ""}`)?.[0]?.replace(/[.,]$/, "") ?? null;
      out.push({
        title, authors,
        journal: clean(citation.replace(/https?:\/\/\S+/g, "").replace(/\b(doi|DOI):?\s*\S+/g, "")),
        doi,
        url: link && !/\.pdf(\?|$)/i.test(link) ? link : doi ? `https://doi.org/${doi}` : null,
        pdfUrl: pdf,
        publishedOn: monthYear(date),
        product,
        variant: null,
        regions: [region], featured: false, imageUrl: null,
      });
    });
  });
  return out;
}

async function publications() {
  const [us, ous, apac] = await Promise.all([publicationsFrom("us.rapid-medical.com", "us"), publicationsFrom("ous.rapid-medical.com", "ous"), publicationsFrom("apac.rapid-medical.com", "apac")]);
  const key = (p: Pub) => p.title.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim().slice(0, 70);
  const merged = new Map<string, Pub>();
  for (const p of [...us, ...ous, ...apac]) {
    const k = key(p);
    const ex = merged.get(k);
    if (ex) {
      ex.regions = [...new Set([...ex.regions, ...p.regions])];
      ex.url ??= p.url; ex.pdfUrl ??= p.pdfUrl; ex.doi ??= p.doi;
      // prefer the more specific product (tigertriever-13 over tigertriever)
      if (p.product.length > ex.product.length) ex.product = p.product;
      if (!ex.authors) ex.authors = p.authors;
    } else merged.set(k, { ...p });
  }
  const list = [...merged.values()].map((p) => ({ ...p, regions: p.regions.length === 3 ? [] : p.regions }));
  list.sort((a, b) => (a.publishedOn < b.publishedOn ? 1 : a.publishedOn > b.publishedOn ? -1 : 0));
  // "Latest" block on Evidence = 3 most recent; take their images from the US page in order
  const $ = cheerio.load(await html("us.rapid-medical.com", "evidence"));
  const imgs = $("img").map((_, i) => $(i).attr("src") ?? $(i).attr("data-src") ?? "").get().filter((u) => /WhatsApp|Untitled-1|Screenshot\+2025-11/.test(u));
  list.slice(0, 3).forEach((p, i) => { p.featured = true; p.imageUrl = imgs[i] ?? null; });
  return list;
}

/* ------------------------------------------------------------------ */
/*  Team                                                               */
/* ------------------------------------------------------------------ */
async function team() {
  const about = await md("www.rapid-medical.com", "about-us");
  const order = [...about.matchAll(/\n([A-Z][A-Z .]+[A-Z])\n\n\[([^\]]+) →\]\(\/(\w+)\)/g)];
  const seen = new Set<string>();
  const out: { slug: string; name: string; title: string; longTitle: string; bioMd: string; photoUrl: string | null; sortOrder: number }[] = [];
  for (const m of order) {
    const slug = m[3];
    if (seen.has(slug)) continue;
    seen.add(slug);
    const $ = cheerio.load(await html("www.rapid-medical.com", slug));
    $("script, style, header, nav, footer").remove();
    const photo = $("img").map((_, i) => $(i).attr("src") ?? $(i).attr("data-src") ?? "").get().find((u) => /dms3rep\/multi\/opt\/[A-Z][a-z]+-1920w\.jpg$/.test(u)) ?? null;
    const paras = $("p, h1, h2, h3, h4").map((_, p) => clean($(p).text())).get().filter((t) => t.length > 2);
    const name = clean(m[1]);
    const upper = paras.filter((t) => t.toUpperCase() === t && /^[A-Z.,&'\- ]{6,}$/.test(t));
    const withName = upper.find((t) => t.startsWith(name));
    const rest = withName ? clean(withName.slice(name.length)) : "";
    const longTitle = rest || upper.find((t) => t !== name && !t.startsWith(name)) || clean(m[2]);
    const bio = paras.filter((t) => t.length > 80 && !/Privacy Statement|Share by|Get in touch/.test(t)).join("\n\n");
    out.push({ slug, name, title: clean(m[2]), longTitle, bioMd: bio, photoUrl: photo, sortOrder: out.length });
  }
  return out;
}

/* ------------------------------------------------------------------ */
/*  Generic pages                                                      */
/* ------------------------------------------------------------------ */
const PAGES: { host: string; slug: string; region: "us" | "ous" | "apac" | null; noindex?: boolean; title: string }[] = [
  { host: "www.rapid-medical.com", slug: "privacy-statement", region: null, title: "Privacy Statement" },
  { host: "www.rapid-medical.com", slug: "terms", region: null, title: "Terms of Use" },
  { host: "www.rapid-medical.com", slug: "compliance-statement", region: null, title: "Compliance Statement" },
  { host: "www.rapid-medical.com", slug: "patents", region: null, title: "Patents" },
  { host: "www.rapid-medical.com", slug: "distals-results", region: null, title: "DISTALS Trial Results" },
  { host: "us.rapid-medical.com", slug: "success-study-final-results", region: "us", noindex: true, title: "SUCCESS Study – Final Results" },
  { host: "us.rapid-medical.com", slug: "see-the-comparison", region: "us", noindex: true, title: "See the comparison" },
  { host: "ous.rapid-medical.com", slug: "success-study-final-results", region: "ous", noindex: true, title: "SUCCESS Study – Final Results" },
  { host: "ous.rapid-medical.com", slug: "comparison-video", region: "ous", noindex: true, title: "See the comparison" },
  { host: "ous.rapid-medical.com", slug: "comaneci-spinal-case-patankar", region: "ous", noindex: true, title: "COMANECI spinal case – Dr. Patankar" },
  { host: "ous.rapid-medical.com", slug: "comaneci-for-vasospasm", region: "ous", noindex: true, title: "COMANECI for vasospasm" },
  { host: "apac.rapid-medical.com", slug: "success-study-final-results", region: "apac", noindex: true, title: "SUCCESS Study – Final Results" },
  { host: "apac.rapid-medical.com", slug: "see-the-comparison", region: "apac", noindex: true, title: "See the comparison" },
  { host: "apac.rapid-medical.com", slug: "comaneci-for-vasospasm", region: "apac", noindex: true, title: "COMANECI for vasospasm" },
];

async function pages() {
  const out = [];
  for (const p of PAGES) {
    const $ = cheerio.load(await html(p.host, p.slug));
    const metaTitle = clean($("title").first().text());
    const description = $('meta[name="description"]').attr("content") ?? "";

    // Background / inline videos live in Duda widget JSON, not in <video> tags.
    const raw = $.html();
    const videos = [...new Set([...raw.matchAll(/https?:\/\/vid\.cdn-website\.com\/[^"'\s\\<)&]+\.mp4/g)].map((m) => m[0]))];

    $("script, style, noscript, header, nav, footer, .dmHeaderContainer, .dmFooterContainer, #dm_hidden, #dmPopup, .dmPopupMask").remove();
    const seen = new Set<string>();
    const lines: string[] = [];
    const CHROME = /Get in touch|HQ: \+972|US: \+1-469|^info@rapid-medical\.com$|^Welcome$|^Our Therapies$|^Evidence$|^News & Events$|^About Us$|^Careers$|^Contact Us$|^Privacy Statement$|^Terms of Use$|^Compliance Statement$|^Patents$|^Rapid Medical™?$|Share by|^© ?20|^Large vessel stroke$|^Aneurysm$|^Access$|^Medium vessel stroke$|^Vasospasm$|^choose-your-location/;

    $("h1,h2,h3,h4,h5,h6,p,li,img,a[href]").each((_, el) => {
      const tag = el.tagName.toLowerCase();
      if (tag === "img") {
        const src = $(el).attr("src") || $(el).attr("data-src") || "";
        // skip logos, responsive duplicates (-391w etc.), tiny icons
        if (!src || seen.has(src) || /logo|RapidMedical_logo|-\d{2,3}w\./i.test(src)) return;
        // skip the mobile variant when a desktop one with the same stem exists
        if (/obile/i.test(src)) return;
        seen.add(src);
        lines.push(`![${$(el).attr("alt") ?? ""}](${src})`);
        return;
      }
      const text = clean($(el).text());
      if (!text || text.length < 2 || seen.has(text) || CHROME.test(text)) return;
      if ($(el).find("h1,h2,h3,h4,p,li").length > 0 && tag !== "li") return; // container
      seen.add(text);
      if (tag === "a") {
        const href = $(el).attr("href") ?? "";
        if (/^(https?:|mailto:|\/)/.test(href) && !/rapid-medical\.com\/?$/.test(href)) lines.push(`[${text}](${href})`);
        return;
      }
      if (/^h[1-6]$/.test(tag)) lines.push(`${"#".repeat(Number(tag[1]))} ${text}`);
      else if (tag === "li") lines.push(`- ${text}`);
      else lines.push(text);
    });

    // Standalone video pages: put the video first
    const body = [...videos.map((v) => `@[video](${v})`), ...lines].join("\n\n");
    out.push({ slug: p.slug, region: p.region, title: p.title, metaTitle, metaDescription: description, noindex: p.noindex ?? false, bodyMd: body });
  }
  return out;
}

/* ------------------------------------------------------------------ */
async function main() {
  await mkdir(OUT, { recursive: true });
  const [n, pubs, t, pg] = await Promise.all([news(), publications(), team(), pages()]);
  await writeFile(path.join(OUT, "news.json"), JSON.stringify(n, null, 2));
  await writeFile(path.join(OUT, "publications.json"), JSON.stringify(pubs, null, 2));
  await writeFile(path.join(OUT, "team.json"), JSON.stringify(t, null, 2));
  await writeFile(path.join(OUT, "pages.json"), JSON.stringify(pg, null, 2));
  console.log(`news ${n.length}, publications ${pubs.length}, team ${t.length}, pages ${pg.length}`);
}
main();
