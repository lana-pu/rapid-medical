import { describe, it, expect } from "vitest";
import { fieldPath } from "../../src/blocks/bind";
import { homeToBlocks, careersToBlocks, evidenceToBlocks, therapiesToBlocks, newsPageToBlocks, webinarsToBlocks, chooserToBlocks, jobsToBlocks } from "../../src/blocks/from-settings";
import type { Job, NewsItem, Publication, Webinar } from "../../src/db/schema";
import type { Block, BlockOf } from "../../src/blocks/types";

const types = (bs: Block[]) => bs.map((b) => `${b.type}:${b.variant}`);
const news = (id: number, featured = false) => ({ id, title: `N${id}`, url: "https://x", featured }) as NewsItem;

describe("fieldPath with whole-key mapping", () => {
  it("maps nested keys onto flat record fields", () => {
    const e = { r: "settings:home", map: { "cta.label": "heroCtaLabel", title: "heroLine1" } };
    expect(fieldPath(e, "cta.label")).toBe("heroCtaLabel");
    expect(fieldPath(e, "cta.href")).toBeNull();
    expect(fieldPath(e, "title")).toBe("heroLine1");
  });
});

describe("homeToBlocks", () => {
  it("order, defaults and flat field paths", () => {
    const bs = homeToBlocks({ home: {}, news: [news(1)], region: null });
    expect(types(bs)).toEqual(["hero:banner", "textMedia:statement", "news:cards"]);
    const h = bs[0] as BlockOf<"hero">;
    expect(h.data.title).toBe("EXPAND");
    expect(h.data.cta?.href).toBe("/choose-your-location");
    expect(fieldPath(h.edit, "cta.href")).toBe("heroCtaHref");
    expect(fieldPath(bs[1].edit, "stats.0.value")).toBe("stats.0.value");
  });
  it("uses the remembered region and shows the dark band only with content", () => {
    const bs = homeToBlocks({ home: { engineeredBody: "x" }, news: [], region: "us" });
    expect(types(bs)).toContain("text:dark");
    expect((bs[0] as BlockOf<"hero">).data.cta?.href).toBe("/us/therapies");
    expect((bs[1] as BlockOf<"textMedia">).data.link?.href).toBe("/contact-us?region=us&topic=demo");
  });
});

describe("careersToBlocks", () => {
  it("counts jobs in the button, skips an empty gallery", () => {
    expect((careersToBlocks({ c: {}, jobCount: 3 })[0] as BlockOf<"hero">).data.cta?.label).toBe("View open positions (3)");
    expect((careersToBlocks({ c: {}, jobCount: 0 })[0] as BlockOf<"hero">).data.cta?.label).toBe("View open positions");
    expect(types(careersToBlocks({ c: {}, jobCount: 0 }))).toEqual(["hero:bannerCompact", "columns:principles", "form:section"]);
    const full = careersToBlocks({ c: { quotes: [{ quote: "q" }] }, jobCount: 0 });
    expect(types(full)[1]).toBe("gallery:quotes");
    expect(fieldPath(full[1].edit, "items.0.author")).toBe("quotes.0.author");
  });
});

describe("evidenceToBlocks", () => {
  const pub = (id: number, slug: string, family: string | null, imageUrl = "") => ({ id, title: `P${id}`, imageUrl, product: { slug, family } }) as unknown as Publication & { product: { slug: string; family: string | null } };
  const products = [{ slug: "tt", name: "TT", fullName: "TT 13" }, { slug: "cm", name: "CM", fullName: "CM" }];

  it("tabs by product: sub-products without a tab go under their family, empty products have no tab", () => {
    const bs = evidenceToBlocks({ region: "us", cfg: {}, all: [pub(1, "tt", null), pub(2, "tt-sub", "tt")], featured: [], products });
    expect(types(bs)).toEqual(["hero:bannerCompact", "publications:spotlight", "publications:byProduct"]);
    const by = bs[2] as BlockOf<"publications">;
    expect(by.data.groups!.map((g) => [g.id, g.items.length])).toEqual([["tt", 2]]);
    expect(by.data.groups![0].sublabel).toBe("13");
    expect(by.data.anchors).toEqual(["tt", "cm"]);
  });
  it("counts publications when no number is set; cards need an image", () => {
    const bs = evidenceToBlocks({ region: "us", cfg: {}, all: [pub(1, "tt", null, "/a.jpg")], featured: [], products });
    const s = bs[1] as BlockOf<"publications">;
    expect(s.data.stat?.value).toBe("1+");
    expect(fieldPath(s.edit, "stat.value")).toBe("statValue");
    expect(types(bs)[2]).toBe("publications:cards");
    expect((bs[2] as BlockOf<"publications">).data.items![0].edit).toMatchObject({ r: "publications", id: 1 });
  });
});

describe("therapiesToBlocks", () => {
  const items = [{ slug: "lvo", navLabel: "LVO", heroTitle: "Title" }];
  it("rows from settings", () => {
    const bs = therapiesToBlocks({ region: "ous", landing: { blocks: [{ title: "A", body: "a" }] }, items });
    expect(types(bs)).toEqual(["hero:bannerCompact", "textMedia:links", "cta:light"]);
    expect(fieldPath(bs[1].edit, "links.0.href")).toBe("blocks.0.links.0.href");
    expect((bs[2] as BlockOf<"cta">).data.buttons[0].href).toBe("/contact-us?region=ous");
  });
  it("falls back to cards from the records", () => {
    const bs = therapiesToBlocks({ region: "ous", landing: {}, items });
    expect(types(bs)[1]).toBe("columns:cards");
    expect((bs[1] as BlockOf<"columns">).data.items[0].href).toBe("/ous/therapies/lvo");
  });
});

describe("newsPageToBlocks", () => {
  it("carousel: featured first, otherwise the newest, at most 5", () => {
    const mixed = newsPageToBlocks([news(1), news(2, true)]);
    expect((mixed[1] as BlockOf<"news">).data.items.map((n) => n.id)).toEqual([2]);
    const plain = newsPageToBlocks([1, 2, 3, 4, 5, 6].map((i) => news(i)));
    expect((plain[1] as BlockOf<"news">).data.items).toHaveLength(5);
    expect((plain[2] as BlockOf<"news">).data.items).toHaveLength(6);
  });
  it("no news: no carousel, the list stays", () => {
    expect(types(newsPageToBlocks([]))).toEqual(["hero:title", "news:timeline"]);
  });
});

describe("webinarsToBlocks", () => {
  it("topics come from the webinars, region is preselected", () => {
    const f = webinarsToBlocks({ region: "apac", list: [{ id: 1, title: "W" } as Webinar] })[2] as BlockOf<"form">;
    expect(f.data.topics).toEqual(["W"]);
    expect(f.data.defaultRegion).toBe("Asia Pacific");
    expect((webinarsToBlocks({ region: "us", list: [] })[2] as BlockOf<"form">).data.topics).toEqual(["Webinar recording request"]);
  });
});

describe("chooserToBlocks", () => {
  const opts = (next?: string) => (chooserToBlocks({ regional: {}, suggested: "us", next })[1] as BlockOf<"regionChooser">).data.options;
  it("keeps a safe next and marks the suggested region", () => {
    expect(opts("evidence").find((o) => o.suggested)?.href).toBe("/us/evidence");
    expect(opts().filter((o) => o.suggested)).toHaveLength(1);
  });
  it("ignores an unsafe next", () => {
    expect(opts("//evil.example")[0].href).toMatch(/\/therapies$/);
  });
});

describe("jobsToBlocks", () => {
  it("links each job to its page", () => {
    const j = jobsToBlocks([{ slug: "qa", title: "QA" } as Job])[1] as BlockOf<"jobs">;
    expect(j.data.items[0].href).toBe("/open-positions/qa");
    expect(j.data.generalHref).toBe("/careers#general-interest");
  });
});
