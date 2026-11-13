import { describe, it, expect } from "vitest";
import { sniffType, svgIsSafe } from "../../src/lib/file-type";

const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==", "base64");

describe("what a file really is", () => {
  it("by its first bytes", () => {
    expect(sniffType(PNG)).toEqual({ mime: "image/png", ext: ".png" });
    expect(sniffType(Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0]))?.mime).toBe("image/jpeg");
    expect(sniffType(Buffer.from("%PDF-1.7\n"))?.mime).toBe("application/pdf");
    expect(sniffType(Buffer.from([0, 0, 0, 0x18, 0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6f, 0x6d]))?.mime).toBe("video/mp4");
    expect(sniffType(Buffer.from('<?xml version="1.0"?>\n<svg xmlns="http://www.w3.org/2000/svg"></svg>'))?.mime).toBe("image/svg+xml");
  });
  it("an HTML page named and typed as a picture is not a picture", () => {
    expect(sniffType(Buffer.from("<!doctype html><script>alert(1)</script>"))).toBeNull();
    expect(sniffType(Buffer.from("<html><svg></svg></html>"))).toBeNull();
  });
  it("SVG with scripts is refused", () => {
    expect(svgIsSafe(Buffer.from('<svg><circle r="1"/><use href="#a"/></svg>'))).toBe(true);
    for (const s of ['<svg><script>alert(1)</script></svg>', '<svg onload="x()"></svg>', '<svg><a href="javascript:x()"/></svg>', "<svg><foreignObject><div/></foreignObject></svg>", '<svg><use href="https://evil/x.svg#a"/></svg>'])
      expect(svgIsSafe(Buffer.from(s))).toBe(false);
  });
});
