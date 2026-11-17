import { describe, expect, it } from "vitest";
import { documentParts } from "@/blocks/rich-text";

describe("rich text · document (DESIGN.md → Текстовая страница)", () => {
  it("moves «Last Revised» to the rail and anchors every section heading, whatever its level", () => {
    const html = "<h3>Last Revised: January 8, 2024</h3><p>Intro</p><h4>1. Acceptance</h4><p>a</p><h6>2. The Site</h6><h3>2. The Site</h3>";
    const { body, lastRevised, toc } = documentParts(html);
    expect(lastRevised).toBe("January 8, 2024");
    expect(body).not.toContain("Last Revised");
    expect(toc.map((t) => t.title)).toEqual(["1. Acceptance", "2. The Site", "2. The Site"]);
    expect(toc.map((t) => t.id)).toEqual(["1-acceptance", "2-the-site", "2-the-site-2"]);
    expect(body).toContain('<h4 id="1-acceptance"');
  });
  it("leaves a text without a date or headings as it is", () => {
    const { body, lastRevised, toc } = documentParts("<p>Only text</p>");
    expect([body, lastRevised, toc]).toEqual(["<p>Only text</p>", null, []]);
  });
});
