import { describe, it, expect } from "vitest";
import { SOLUTIONS } from "../../content/seed/solutions";
import type { Page, Region, Solution } from "../../src/db/schema";
import { solutionToBlocks, type SolutionForBlocks } from "../../src/blocks/from-solution";
import { pageToBlocks } from "../../src/blocks/from-pages";
import { solutionToStored, pageToStored } from "../../src/blocks/convert";
import { resolveBlocks, templateHref, fillHref, pageSummary } from "../../src/blocks/stored";
import { fieldPath } from "../../src/blocks/bind";
import { REGION_LABELS } from "../../src/lib/regions";
import type { Block } from "../../src/blocks/types";

/** Rendered blocks without editor bindings and section ids (they differ by design: record fields before, block paths after). */
function plain(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(plain);
  if (v && typeof v === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, x] of Object.entries(v)) if (k !== "edit" && k !== "uid" && x !== undefined) out[k] = plain(x);
    return out;
  }
  return v;
}

// Seed entries as rows, the way scripts/seed.ts inserts them (HTML conversion does not matter for the comparison).
const rows: SolutionForBlocks[] = SOLUTIONS.map((s, i) => {
  const { product, heroCta, ...rest } = s;
  return { id: i + 1, therapyGroup: "", proofPoint: "", shareImageUrl: null, actionNote: null, webinarCtaEnabled: true, specs: null, overviewTitle: "Product overview", overviewFeatures: [], annotatedImage: null, specNote: "", closingTitle: null, closingBody: null, closingEmbedUrl: null, introTitle: null, introBody: null, introImageUrl: null, introVideoUrl: null, heroImageUrl: null, heroVideoUrl: null, overviewImageUrl: null, blocks: null, status: "published", productId: null, createdAt: new Date(), updatedAt: new Date(), ...rest, heroCta: heroCta ?? null, product: product ? { slug: product } : null } as unknown as SolutionForBlocks;
});

describe("therapy pages: stored list renders like the fields did", () => {
  it.each(rows.map((r) => [`${r.region}/${r.slug}`, r] as const))("%s", (_name, s) => {
    const others = (["us", "ous", "apac"] as Region[]).filter((r) => r !== s.region);
    const before = solutionToBlocks(s, { region: s.region, others });
    const stored = JSON.parse(JSON.stringify(solutionToStored(s))); // through JSON, as in the database
    const after = resolveBlocks(stored, { region: s.region, product: s.product?.slug, versions: others.map((o) => ({ region: o, href: `/${o}/therapies/${s.slug}` })) });
    expect(plain(after)).toEqual(plain(JSON.parse(JSON.stringify(before))));
  });

  it("stored links are templates, not region-specific", () => {
    const s = rows.find((r) => r.region === "ous" && r.product)!;
    const text = JSON.stringify(solutionToStored(s));
    expect(text).not.toMatch(/"\/ous\//);
    expect(text).toContain("/{region}/evidence#{product}");
  });
});

describe("text pages", () => {
  const page = { id: 7, title: "Terms", bodyHtml: "<p>x</p>", region: "apac" } as Page;
  it("regional page keeps its region line, global has none", () => {
    const after = resolveBlocks(pageToStored(page), { region: "apac" });
    expect(plain(after)).toEqual(plain(pageToBlocks(page, REGION_LABELS.apac)));
    const global = { ...page, region: null } as Page;
    expect(plain(resolveBlocks(pageToStored(global), { region: null }))).toEqual(plain(pageToBlocks(global)));
  });
});

describe("editor bindings", () => {
  const s = rows.find((r) => r.slug === "lvo" && r.region === "us")! as Solution & { product: { slug: string } | null };
  const blocks = resolveBlocks(solutionToStored(s), { region: "us" }, { r: "solutions", id: 3 });
  it("a block field is addressed by its position", () => {
    expect(blocks[0].edit).toMatchObject({ r: "solutions", id: 3 });
    expect(fieldPath(blocks[0].edit, "title")).toBe("blocks.0.data.title");
    expect(fieldPath(blocks[0].edit, "cta.label")).toBe("blocks.0.data.cta.label");
  });
  it("keys filled by a source are not editable through the block", () => {
    expect(fieldPath(blocks[0].edit, "eyebrowLinks")).toBeNull();
  });
  it("blocks inside product tabs get their own path", () => {
    const i = blocks.findIndex((b) => b.type === "productDetails");
    const tabs = (blocks[i] as Block & { data: { tabs: { blocks: { edit?: unknown; blocks?: { edit?: unknown }[] }[] }[] } }).data.tabs;
    expect(fieldPath(tabs[0].blocks[0].edit as never, "body")).toBe(`blocks.${i}.data.tabs.0.blocks.0.data.body`);
  });
  it("without a page there are no bindings (visitors)", () => {
    expect(resolveBlocks(solutionToStored(s), { region: "us" })[0].edit).toBeUndefined();
  });
});

describe("link templates", () => {
  it("region in the path and in the query, product after #", () => {
    expect(templateHref("/us/webinars", "us")).toBe("/{region}/webinars");
    expect(templateHref("/contact-us?region=us&topic=demo", "us")).toBe("/contact-us?region={region}&topic=demo");
    expect(templateHref("/us/evidence#comaneci", "us", "comaneci")).toBe("/{region}/evidence#{product}");
    expect(templateHref("/usa-news", "us")).toBe("/usa-news");
    expect(templateHref("https://x.com/us/a", "us")).toBe("https://x.com/us/a");
  });
  it("filled from the page", () => {
    expect(fillHref("/{region}/evidence#{product}", { region: "apac", product: "drivewire" })).toBe("/apac/evidence#drivewire");
    expect(fillHref("/{region}/evidence#{product}", { region: "ous" })).toBe("/ous/evidence#browse-by-product");
  });
});

describe("pageSummary", () => {
  it("hero title, text and image", () => {
    expect(pageSummary([{ id: "a", type: "hero", variant: "image", data: { title: "T", body: "B", imageUrl: "/i.jpg" } }])).toEqual({ title: "T", body: "B", imageUrl: "/i.jpg" });
    expect(pageSummary(null)).toEqual({});
  });
});
