/**
 * Audit: for every crawled page, list everything a visitor can see or click,
 * so we can diff against the migrated content.
 *   npx tsx scripts/audit-duda.ts > content/audit.md
 */
import * as cheerio from "cheerio";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

const RAW = path.resolve("content/raw");
const CHROME = /Get in touch|HQ: \+972|US: \+1-469|info@rapid-medical\.com|^Welcome$|^Our Therapies$|^Evidence$|^News & Events$|^About Us$|^Careers$|^Contact Us$|Privacy Statement|Terms of Use|Compliance Statement|^Patents$|^Rapid Medical™?$|Share by|^© ?20|^Large vessel stroke$|^Aneurysm$|^Access$|^Medium vessel stroke$|^Vasospasm$|choose-your-location/;

for (const host of readdirSync(RAW).filter((d) => d.endsWith(".com"))) {
  for (const f of readdirSync(path.join(RAW, host)).filter((f) => f.endsWith(".html"))) {
    const $ = cheerio.load(readFileSync(path.join(RAW, host, f), "utf8"));
    const page = f.replace(/\.html$/, "");
    console.log(`\n\n## ${host}/${page}\n`);
    console.log(`title: ${$("title").text().trim()}`);

    // Hidden elements / popups / lightboxes
    const popups = $("[class*=popup], [class*=lightbox], [data-popup], .dmPopup").length;
    if (popups) console.log(`popups/lightboxes: ${popups}`);

    // Videos / iframes
    $("video, video source").each((_, el) => { const s = $(el).attr("src") || $(el).attr("data-src"); if (s) console.log(`VIDEO ${s}`); });
    $("[data-video-src], [data-src*=mp4], [data-bg-video]").each((_, el) => console.log(`BGVIDEO ${$(el).attr("data-video-src") || $(el).attr("data-src") || $(el).attr("data-bg-video")}`));
    $("iframe").each((_, el) => console.log(`IFRAME ${$(el).attr("src") || $(el).attr("data-src")}`));
    // Inline JSON widgets (Duda stores sliders/lists as JSON)
    const html = $.html();
    for (const m of html.matchAll(/vid\.cdn-website\.com\/[^"'\s\\]+/g)) console.log(`VIDEO-REF https://${m[0]}`);
    for (const m of html.matchAll(/youtu(?:\.be|be\.com)\/[^"'\s\\<)]+/g)) console.log(`YOUTUBE ${m[0]}`);
    for (const m of html.matchAll(/vimeo\.com\/[^"'\s\\<)]+/g)) console.log(`VIMEO ${m[0]}`);

    // Forms
    $("form").each((_, form) => {
      const fields = $(form).find("input, select, textarea").map((_, i) => `${i.tagName}:${$(i).attr("name") || $(i).attr("placeholder") || $(i).attr("type") || "?"}`).get().filter((x) => !/hidden|submit/.test(x));
      console.log(`FORM fields=[${fields.join(", ")}]`);
    });

    // Text blocks & links & images in document order, deduped
    $("script, style, noscript, header, nav, footer, .dmHeaderContainer, .dmFooterContainer, #dm_hidden").remove();
    const seen = new Set<string>();
    $("h1,h2,h3,h4,h5,h6,p,li,a[href],img,blockquote,td,th,span.product-name,.tab-btn,button").each((_, el) => {
      const tag = el.tagName.toLowerCase();
      if (tag === "img") {
        const src = $(el).attr("src") || $(el).attr("data-src") || "";
        if (src && !seen.has(src) && !/logo|RapidMedical_logo/i.test(src)) { seen.add(src); console.log(`IMG ${src}`); }
        return;
      }
      const t = $(el).text().replace(/[​﻿ ]/g, " ").replace(/\s+/g, " ").trim();
      if (!t || t.length < 2 || seen.has(t) || CHROME.test(t)) return;
      if ($(el).find("h1,h2,h3,h4,p,li").length > 0 && tag !== "li") return;
      seen.add(t);
      if (tag === "a") console.log(`A ${t} -> ${$(el).attr("href")}`);
      else console.log(`${tag.toUpperCase()} ${t}`);
    });
  }
}
