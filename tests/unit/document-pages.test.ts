import { describe, expect, it } from "vitest";
import { variantWidths } from "@/lib/document-pages";
import { fileSize, initialPages, textPages, zoomWidth } from "@/lib/document-view";

const page = (w: number, h: number) => ({ w, h });

describe("document on the page (screens/material.md)", () => {
  it("draws every page at 800 and 1600, a large one once more for the enlarged view", () => {
    expect(variantWidths(595)).toEqual([800, 1600]); // A4
    expect(variantWidths(842)).toEqual([800, 1600]); // a landscape slide: 1754 is not worth a third picture
    expect(variantWidths(3456)).toEqual([800, 1600, 4000]); // a 122 cm poster, capped
  });

  it("shows 2 pages first, 3 when landscape, all when only one would stay hidden", () => {
    expect(initialPages([])).toBe(0);
    expect(initialPages([page(1000, 1400)])).toBe(1);
    expect(initialPages([page(1000, 1400), page(1000, 1400), page(1000, 1400)])).toBe(3);
    expect(initialPages(Array(7).fill(page(1000, 1400)))).toBe(2);
    expect(initialPages(Array(20).fill(page(1600, 900)))).toBe(3);
  });

  it("splits the stored text back into pages", () => {
    expect(textPages("")).toEqual([]);
    expect(textPages("one\n\f two \fthree")).toEqual(["one", "two", "three"]);
  });

  it("enlarges an ordinary page to 1200 px and a poster to half its biggest picture", () => {
    expect(zoomWidth({ variants: [{ w: 800, url: "" }, { w: 1600, url: "" }] })).toBe(1200);
    expect(zoomWidth({ variants: [{ w: 800, url: "" }, { w: 1600, url: "" }, { w: 4000, url: "" }] })).toBe(2000);
  });

  it("writes the file size in KB or MB", () => {
    expect(fileSize(286_720)).toBe("280 KB");
    expect(fileSize(1_585_152)).toBe("1.5 MB");
  });
});

describe("document on the page: limits (security check 2026-11-16)", () => {
  it("draws a page at its largest variant, but never above 16 Mpx", async () => {
    const { drawWidth, MAX_PIXELS } = await import("@/lib/document-pages");
    expect(drawWidth(595, 842)).toBe(1600); // A4
    expect(drawWidth(3456, 2592)).toBe(4000); // the 122 × 91 cm poster: 4000 × 3000 = 12 Mpx
    const w = drawWidth(595, 59500); // a strip 100 times taller than wide
    expect(w * Math.round((w * 59500) / 595)).toBeLessThanOrEqual(MAX_PIXELS * 1.01);
  });
});
