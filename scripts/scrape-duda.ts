/**
 * Crawls the three Duda sites (www / us / ous) and dumps every page as
 * raw HTML + a cleaned text/markdown snapshot into content/raw/.
 *
 * Usage:  npx tsx scripts/scrape-duda.ts
 *
 * Output:
 *   content/raw/<host>/<path>.html   – raw HTML as served
 *   content/raw/<host>/<path>.md     – cleaned text with headings, links, images
 *   content/raw/inventory.json       – list of pages, assets, external links
 */
import * as cheerio from "cheerio";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const HOSTS = ["www.rapid-medical.com", "us.rapid-medical.com", "ous.rapid-medical.com", "apac.rapid-medical.com"];
const STAGING_HOSTS = ["us-rapid-medical.juuced.co", "ous-rapid-medical.juuced.co", "apac-rapid-medical.juuced.co"];
const OUT = path.resolve("content/raw");

type PageRecord = {
  host: string;
  path: string;
  url: string;
  title: string;
  description: string;
  canonical: string;
  images: string[];
  files: string[];
  internalLinks: string[];
  externalLinks: string[];
  videos: string[];
};

const seen = new Set<string>();
const queue: string[] = HOSTS.map((h) => `https://${h}/`);
const pages: PageRecord[] = [];
const assets = new Set<string>();
const broken: string[] = [];

function normalize(raw: string, base: string): string | null {
  try {
    const u = new URL(raw, base);
    // Staging domains mirror the real subdomains
    if (u.hostname === STAGING_HOSTS[0]) u.hostname = "us.rapid-medical.com";
    if (u.hostname === STAGING_HOSTS[1]) u.hostname = "ous.rapid-medical.com";
    if (u.hostname === STAGING_HOSTS[2]) u.hostname = "apac.rapid-medical.com";
    if (!HOSTS.includes(u.hostname)) return null;
    u.hash = "";
    u.search = "";
    u.protocol = "https:";
    const p = u.pathname.replace(/\/+$/, "") || "/";
    if (/\.(pdf|jpg|jpeg|png|svg|gif|webp|mp4|zip)$/i.test(p)) return null;
    return `https://${u.hostname}${p}`;
  } catch {
    return null;
  }
}

function slugPath(p: string) {
  return p === "/" ? "index" : p.replace(/^\//, "").replace(/\//g, "__");
}

async function crawl(url: string) {
  if (seen.has(url)) return;
  seen.add(url);
  const res = await fetch(url, { headers: { "user-agent": "Mozilla/5.0 (migration bot)" } });
  if (!res.ok) {
    broken.push(`${res.status} ${url}`);
    return;
  }
  const html = await res.text();
  const $ = cheerio.load(html);
  const u = new URL(url);

  const rec: PageRecord = {
    host: u.hostname,
    path: u.pathname,
    url,
    title: $("title").first().text().trim(),
    description: $('meta[name="description"]').attr("content") ?? "",
    canonical: $('link[rel="canonical"]').attr("href") ?? "",
    images: [],
    files: [],
    internalLinks: [],
    externalLinks: [],
    videos: [],
  };

  // Images: Duda uses data-src / srcset / background-image
  $("img").each((_, el) => {
    const src = $(el).attr("src") || $(el).attr("data-src") || "";
    if (src.startsWith("http")) rec.images.push(src);
    const srcset = $(el).attr("srcset") || $(el).attr("data-srcset") || "";
    srcset.split(",").forEach((s) => {
      const cand = s.trim().split(" ")[0];
      if (cand.startsWith("http")) rec.images.push(cand);
    });
  });
  $("[style*='background-image']").each((_, el) => {
    const m = /url\(["']?(https?:[^"')]+)["']?\)/.exec($(el).attr("style") ?? "");
    if (m) rec.images.push(m[1]);
  });
  $("video source, video").each((_, el) => {
    const src = $(el).attr("src");
    if (src) rec.videos.push(src);
  });
  $("iframe").each((_, el) => {
    const src = $(el).attr("src");
    if (src) rec.videos.push(src);
  });

  $("a[href]").each((_, el) => {
    const href = $(el).attr("href")!;
    if (/\.(pdf|docx?|pptx?)(\?|$)/i.test(href)) {
      rec.files.push(href);
      return;
    }
    const n = normalize(href, url);
    if (n) {
      rec.internalLinks.push(n);
      queue.push(n);
    } else if (/^https?:/.test(href)) {
      rec.externalLinks.push(href);
    }
  });

  rec.images = [...new Set(rec.images)];
  rec.files = [...new Set(rec.files)];
  rec.internalLinks = [...new Set(rec.internalLinks)];
  rec.externalLinks = [...new Set(rec.externalLinks)];
  rec.images.forEach((i) => assets.add(i));
  rec.files.forEach((f) => assets.add(f));
  pages.push(rec);

  // Cleaned snapshot: drop nav/footer chrome, keep headings/paragraphs/links/images in order
  $("script, style, noscript, header, nav, footer, .dmHeaderContainer, .dmFooterContainer, #dm_hidden").remove();
  const lines: string[] = [];
  $("body")
    .find("h1,h2,h3,h4,h5,h6,p,li,a[href],img,blockquote,td,th")
    .each((_, el) => {
      const tag = el.tagName.toLowerCase();
      const text = $(el).text().replace(/\s+/g, " ").trim();
      if (tag === "img") {
        const src = $(el).attr("src") || $(el).attr("data-src");
        if (src) lines.push(`![${$(el).attr("alt") ?? ""}](${src})`);
        return;
      }
      if (tag === "a") {
        const href = $(el).attr("href");
        if (text && href && $(el).children("h1,h2,h3,h4,p").length === 0) lines.push(`[${text}](${href})`);
        return;
      }
      if (!text) return;
      if (/^h[1-6]$/.test(tag)) lines.push(`${"#".repeat(Number(tag[1]))} ${text}`);
      else if (tag === "li") lines.push(`- ${text}`);
      else lines.push(text);
    });
  // de-dupe consecutive duplicates (Duda renders desktop + mobile copies)
  const dedup = lines.filter((l, i) => i === 0 || l !== lines[i - 1]);

  const dir = path.join(OUT, u.hostname);
  await mkdir(dir, { recursive: true });
  const base = slugPath(u.pathname);
  await writeFile(path.join(dir, `${base}.html`), html);
  await writeFile(path.join(dir, `${base}.md`), `# ${rec.title}\n\n${rec.description}\n\n---\n\n${dedup.join("\n\n")}\n`);
  console.log(`✓ ${url}  (${rec.images.length} img, ${rec.files.length} files)`);
}

/** Pages that nothing links to (PDF wrappers, event forms) are only listed in the sitemaps. */
async function seedFromSitemaps() {
  for (const host of HOSTS) {
    const res = await fetch(`https://${host}/sitemap.xml`, { headers: { "user-agent": "Mozilla/5.0 (migration bot)" } });
    if (!res.ok) {
      broken.push(`${res.status} https://${host}/sitemap.xml`);
      continue;
    }
    for (const m of (await res.text()).matchAll(/<loc>\s*([^<\s]+)/g)) {
      const n = normalize(m[1], `https://${host}/`);
      if (n) queue.push(n);
    }
  }
}

async function main() {
  await seedFromSitemaps();
  await mkdir(OUT, { recursive: true });
  while (queue.length) {
    const next = queue.shift()!;
    try {
      await crawl(next);
    } catch (e) {
      broken.push(`ERR ${next} ${(e as Error).message}`);
    }
  }
  await writeFile(
    path.join(OUT, "inventory.json"),
    JSON.stringify({ crawledAt: new Date().toISOString(), pages, assets: [...assets], broken }, null, 2),
  );
  console.log(`\n${pages.length} pages, ${assets.size} assets, ${broken.length} broken`);
}

main();
