import { describe, it, expect } from "vitest";
import { swapUrl, urlPattern, usageIn } from "../../src/lib/media-usage";

describe("replacing a file's address", () => {
  const re = urlPattern("/uploads/2026-11/a.png");
  it("everywhere it is a whole address: fields, blocks, rich text, lists", () => {
    const at = new Date("2026-01-01");
    const row = {
      heroImageUrl: "/uploads/2026-11/a.png",
      blocks: [{ id: "x", type: "media", variant: "image", data: { imageUrl: "/uploads/2026-11/a.png", items: ["/uploads/2026-11/a.png", "/uploads/2026-11/b.png"] } }],
      bodyHtml: '<p><img src="/uploads/2026-11/a.png" alt=""></p>',
      updatedAt: at,
    };
    const out = swapUrl(row, re, "/uploads/2026-11/new.png") as typeof row;
    expect(out.heroImageUrl).toBe("/uploads/2026-11/new.png");
    expect(out.blocks[0].data.items).toEqual(["/uploads/2026-11/new.png", "/uploads/2026-11/b.png"]);
    expect(out.bodyHtml).toContain('src="/uploads/2026-11/new.png"');
    expect(out.updatedAt).toBe(at);
  });
  it("not where it is only the start of a longer name", () => {
    expect(swapUrl("/uploads/2026-11/a.png.webp", re, "X")).toBe("/uploads/2026-11/a.png.webp");
    expect(swapUrl("/uploads/2026-11/a.png-480.webp", re, "X")).toBe("/uploads/2026-11/a.png-480.webp");
    expect(swapUrl("/uploads/2026-11/a.png?x=1", re, "X")).toBe("X?x=1");
  });
  it("special characters in the address are taken literally", () => {
    expect(swapUrl("/uploads/a(1).png", urlPattern("/uploads/a(1).png"), "X")).toBe("X");
    expect(swapUrl("/uploads/a11.png", urlPattern("/uploads/a(1).png"), "X")).toBe("/uploads/a11.png");
  });
});

describe("where a file is used", () => {
  const index = [
    { r: "solutions", id: 1, table: "solutions", label: "LVO (us)", path: "/us/therapies/lvo", text: "x /uploads/a.png y", draft: false },
    { r: "solutions", id: 1, table: "solutions", label: "LVO (us)", path: "/us/therapies/lvo", text: "/uploads/a.png", draft: true },
    { r: "pages", id: 2, table: "pages", label: "Terms", path: "/terms", text: "/uploads/a.png", draft: true },
    { r: "settings:contact", id: 0, table: "site_settings", label: "Settings: contact", path: null, text: "/uploads/b.png", draft: false },
  ];
  it("one entry per record; a file only in a draft is marked", () => {
    const u = usageIn(index, "/uploads/a.png");
    expect(u.map((x) => [x.r, x.draftOnly])).toEqual([["solutions", false], ["pages", true]]);
    expect(u[0].pagePath).toBe("/us/therapies/lvo");
    expect(usageIn(index, "/uploads/b.png")[0].adminHref).toBe("/admin/settings?group=contact");
  });
});
