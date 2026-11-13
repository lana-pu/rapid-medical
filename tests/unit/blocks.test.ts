import { describe, it, expect } from "vitest";
import { fieldPath } from "../../src/blocks/bind";
import { solutionToBlocks, type SolutionForBlocks } from "../../src/blocks/from-solution";
import type { Block, BlockOf } from "../../src/blocks/types";
import type { BlockGroup } from "../../src/blocks/product-details";

describe("fieldPath", () => {
  const e = { r: "solutions", id: 7, map: { title: "heroTitle", cta: "heroCta", items: "howItWorks", eyebrow: null } };
  it("maps the first segment and keeps the rest", () => {
    expect(fieldPath(e, "title")).toBe("heroTitle");
    expect(fieldPath(e, "cta.label")).toBe("heroCta.label");
    expect(fieldPath(e, "items.2.body")).toBe("howItWorks.2.body");
  });
  it("null in the map = not editable", () => {
    expect(fieldPath(e, "eyebrow")).toBeNull();
  });
  it("unmapped key without a prefix is not editable", () => {
    expect(fieldPath(e, "body")).toBeNull();
    expect(fieldPath(e, "constructor")).toBeNull();
    expect(fieldPath(undefined, "title")).toBeNull();
  });
  it("prefix applies to unmapped keys", () => {
    expect(fieldPath({ r: "solutions", prefix: "benefits.1." }, "stats.0.value")).toBe("benefits.1.stats.0.value");
    expect(fieldPath({ r: "pages", prefix: "blocks.3.data.", map: { title: null } }, "title")).toBeNull();
  });
});

const base: SolutionForBlocks = {
  id: 42,
  slug: "lvo",
  region: "ous",
  productId: 1,
  status: "published",
  sortOrder: 0,
  navLabel: "Large vessel stroke",
  breadcrumb: "",
  metaTitle: "",
  metaDescription: "",
  heroTitle: "Hero title",
  heroBody: "Hero body",
  heroImageUrl: "/h.jpg",
  heroVideoUrl: "/h.mp4",
  heroCta: { label: "Demo", href: "/contact-us" },
  introTitle: "",
  introBody: "",
  introVideoUrl: "",
  introImageUrl: "",
  benefits: [
    { title: "A", body: "a", imageUrl: "/a.jpg" },
    { title: "B", body: "b", stats: [{ value: "47%", label: "FPE" }] },
    { title: "C", body: "c", imageUrl: "/c.jpg", secondaryImageUrl: "/c2.jpg" },
    { title: "D", body: "d", videoUrl: "/d.mp4" },
  ],
  overviewTitle: "",
  overviewBody: "Overview",
  overviewFeatures: [{ title: "F1", body: "f1" }],
  annotatedImage: { imageUrl: "/diagram.jpg", markers: [{ x: 1, y: 2, label: "Tip" }] },
  overviewImageUrl: "",
  specImageUrls: ["/diagram.jpg", "/spec.jpg"],
  specNote: "Note",
  howItWorks: [],
  inPractice: [],
  actionLinks: [{ label: "Order", href: "/order" }],
  actionNote: "",
  webinarCtaEnabled: false,
  closingTitle: "",
  closingBody: "Questions? Call us",
  closingEmbedUrl: "",
  specs: null,
  regulatoryHtml: "<p>reg</p>",
  referencesHtml: "",
  createdAt: new Date(0),
  updatedAt: new Date(0),
  product: { slug: "tigertriever" },
} as unknown as SolutionForBlocks;

const ctx = { region: "ous" as const, others: ["us" as const, "apac" as const] };
const of = <T extends Block["type"]>(bs: Block[], t: T) => bs.filter((b) => b.type === t) as unknown as BlockOf<T>[];
const tabsOf = (bs: Block[]) => of(bs, "productDetails")[0].data.tabs;

describe("solutionToBlocks", () => {
  const blocks = solutionToBlocks(base, ctx);

  it("keeps the template order and skips empty sections", () => {
    expect(blocks.map((b) => b.type)).toEqual(["hero", "textMedia", "textMedia", "textMedia", "textMedia", "productDetails", "cta", "indications"]);
  });

  it("hero: video variant, breadcrumb with other regions, record paths", () => {
    const [h] = of(blocks, "hero");
    expect(h.variant).toBe("video");
    expect(h.data.eyebrow).toBe("Our solutions / Large vessel stroke");
    expect(h.data.eyebrowLinks).toEqual([
      { label: "Americas version", href: "/us/therapies/lvo" },
      { label: "Asia & Pacific version", href: "/apac/therapies/lvo" },
    ]);
    expect(fieldPath(h.edit, "title")).toBe("heroTitle");
    expect(fieldPath(h.edit, "cta.href")).toBe("heroCta.href");
    expect(fieldPath(h.edit, "eyebrow")).toBeNull();
    expect(solutionToBlocks({ ...base, heroVideoUrl: "" }, ctx)[0].variant).toBe("image");
  });

  it("text-and-media rows alternate; a second picture makes three columns", () => {
    const rows = of(blocks, "textMedia");
    expect(rows.map((r) => r.variant)).toEqual(["mediaRight", "mediaLeft", "threeColumn", "mediaLeft"]);
    expect(fieldPath(rows[1].edit, "stats.0.value")).toBe("benefits.1.stats.0.value");
  });

  it("intro becomes a lead text block when any intro field is set", () => {
    const bs = solutionToBlocks({ ...base, introImageUrl: "/i.jpg" }, ctx);
    expect(bs[1].type).toBe("text");
    expect(bs[1].variant).toBe("lead");
    expect(fieldPath(bs[1].edit, "imageUrl")).toBe("introImageUrl");
  });

  it("overview tab: text, features, specifications group; no buttons inside tabs", () => {
    const [overview] = tabsOf(blocks);
    expect(overview.title).toBe("Product overview");
    const parts = overview.blocks;
    expect(parts.map((p) => ("group" in p ? `group:${p.group}` : `${p.type}:${p.variant}`))).toEqual(["text:default", "columns:features", "group:Specifications"]);
    const spec = (parts[2] as BlockGroup).blocks;
    expect(spec.map((b) => `${b.type}:${b.variant}`)).toEqual(["deviceDiagram:default", "specTable:images"]);
    expect(fieldPath(spec[0].edit, "markers.0.label")).toBe("annotatedImage.markers.0.label");
    // the diagram picture is not repeated among the old spec images
    expect((spec[1] as BlockOf<"specTable">).data.images).toEqual(["/spec.jpg"]);
  });

  it("spec table wins over old images and is not editable on the page", () => {
    const bs = solutionToBlocks({ ...base, specs: { columns: ["A"], rows: [["1"]], note: "" } }, ctx);
    const spec = (tabsOf(bs)[0].blocks[2] as BlockGroup).blocks[1] as BlockOf<"specTable">;
    expect(spec.variant).toBe("table");
    expect(spec.data.note).toBe("Note");
    expect(spec.edit).toBeUndefined();
  });

  it("optional tabs appear only with content; evidence is a link tab", () => {
    expect(tabsOf(blocks).map((t) => t.id)).toEqual(["overview", "evidence"]);
    expect(tabsOf(blocks)[1].href).toBe("/ous/evidence#tigertriever");
    const full = solutionToBlocks({ ...base, howItWorks: [{ title: "Go" }], webinarCtaEnabled: true, product: null }, ctx);
    const tabs = tabsOf(full);
    expect(tabs.map((t) => t.id)).toEqual(["overview", "how", "practice", "evidence"]);
    expect(tabs[2].blocks.map((b) => ("group" in b ? "group" : `${b.type}:${b.variant}`))).toEqual(["cta:panel", "people:physicians"]);
    expect((tabs[2].blocks[0] as BlockOf<"cta">).data.buttons[0].href).toBe("/ous/webinars");
    expect(tabs[3].href).toBe("/ous/evidence#browse-by-product");
  });

  it("closing: demo + customer support, prefix stripped; video band only with title or video", () => {
    const [q] = of(blocks, "cta").filter((b) => b.variant === "band");
    expect(q.data.body).toBe("Call us");
    expect(q.data.buttons).toEqual([{ label: "Demo", href: "/contact-us" }, { label: "Customer support", href: "/contact-us?region=ous&topic=support" }]);
    const noCta = of(solutionToBlocks({ ...base, heroCta: null, closingBody: "" }, ctx), "cta").filter((b) => b.variant === "band")[0];
    expect(noCta.data.body).toBeNull();
    expect(noCta.data.buttons[0]).toEqual({ label: "Request a demo", href: "/contact-us?region=ous&topic=demo" });
    expect(fieldPath(q.edit, "body")).toBe("closingBody");
    expect(fieldPath(q.edit, "title")).toBeNull();
    expect(of(blocks, "video")).toHaveLength(0);
    const v = of(solutionToBlocks({ ...base, closingEmbedUrl: "https://youtu.be/x" }, ctx), "video");
    expect(v).toHaveLength(1);
  });

  it("indications map to the regulatory fields", () => {
    const [r] = of(blocks, "indications");
    expect(fieldPath(r.edit, "indicationsHtml")).toBe("regulatoryHtml");
    expect(fieldPath(r.edit, "referencesHtml")).toBe("referencesHtml");
  });
});
