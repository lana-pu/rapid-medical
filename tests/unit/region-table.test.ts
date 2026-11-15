import { describe, it, expect } from "vitest";
import type { StoredBlock } from "../../src/db/schema";
import { regionTextRows, fieldLabel } from "../../src/blocks/region-table";

const us: StoredBlock[] = [
  { id: "h1", type: "hero", variant: "image", data: { title: "A patient-centric approach", body: "Only in the US", imageUrl: "/uploads/a.jpg", cta: { label: "Request a demo", href: "/contact-us" } } },
  { id: "t1", type: "text", variant: "default", data: { body: "Same everywhere" } },
];
const eu: StoredBlock[] = [
  { id: "h2", type: "hero", variant: "image", data: { title: "A patient-centric approach", body: "European text", imageUrl: "/uploads/b.jpg", cta: { label: "Request a demo", href: "/contact-us" } } },
  { id: "k2", type: "keyNumbers", variant: "default", data: { title: "Numbers" } },
  { id: "t2", type: "text", variant: "default", data: { body: "Same everywhere" } },
];

describe("texts in all regions", () => {
  const rows = regionTextRows([us, eu]);
  it("matches sections across regions and gives each cell the path the editor writes", () => {
    const title = rows.find((r) => r.field === "Title" && r.section.startsWith("Hero"))!;
    expect(title.cells).toEqual([
      { f: "blocks.0.data.title", value: "A patient-centric approach", rich: false },
      { f: "blocks.0.data.title", value: "A patient-centric approach", rich: false },
    ]);
    expect(title.differs).toBe(false);
    const body = rows.find((r) => r.section.startsWith("Text"))!;
    expect(body.cells.map((c) => c?.f)).toEqual(["blocks.1.data.body", "blocks.2.data.body"]); // matched across a section only in EU
  });
  it("marks differences; pictures and addresses are not rows", () => {
    expect(rows.find((r) => r.cells[0]?.value === "Only in the US")?.differs).toBe(true);
    expect(rows.some((r) => r.cells.some((c) => c?.value.startsWith("/")))).toBe(false);
    expect(rows.find((r) => r.field.startsWith("Button"))?.cells[0]?.f).toBe("blocks.0.data.cta.label");
  });
  it("a section only in another region comes last, marked", () => {
    const only = rows.filter((r) => r.onlyIn === 1);
    expect(only.map((r) => r.cells)).toEqual([[null, { f: "blocks.1.data.title", value: "Numbers", rich: false }]]);
    expect(rows[rows.length - 1].onlyIn).toBe(1);
  });
  it("names fields inside Product details tabs", () => {
    const pd: StoredBlock = { id: "p", type: "productDetails", variant: "pills", data: { tabs: [{ id: "o", label: "Overview", blocks: [{ group: "Specifications", blocks: [{ type: "text", variant: "default", data: { body: "x" } }] }] }] } };
    expect(fieldLabel(pd, "tabs.0.blocks.0.blocks.0.data.body")).toBe("Tab “Overview” › Specifications › Text › Text");
  });
});

describe("differences between regions with files (the admin's tab)", () => {
  it("adds pictures, videos and PDFs as rows; page links stay out", async () => {
    const { mediaKindOf } = await import("../../src/blocks/region-table");
    const rows = regionTextRows([us, eu], { media: true });
    const pic = rows.find((r) => r.cells[0]?.media === "image")!;
    expect(pic.cells.map((c) => c?.value)).toEqual(["/uploads/a.jpg", "/uploads/b.jpg"]);
    expect(pic.differs).toBe(true);
    expect(pic.cells[0]?.f).toBe("blocks.0.data.imageUrl");
    expect(rows.some((r) => r.cells.some((c) => c?.value === "/contact-us"))).toBe(false);
    expect([mediaKindOf("/uploads/x.MP4"), mediaKindOf("/uploads/ifu.pdf?v=2"), mediaKindOf("/us/evidence")]).toEqual(["video", "pdf", null]);
    // only the site's own or https addresses are files (security review 2026-11-15)
    expect([mediaKindOf("javascript:alert(1)//x.pdf"), mediaKindOf("data:text/html,x.png"), mediaKindOf("//evil.example/x.pdf"), mediaKindOf("http://x.example/a.jpg"), mediaKindOf("https://cdn.example/a.jpg")]).toEqual([null, null, null, null, "image"]);
  });
});
