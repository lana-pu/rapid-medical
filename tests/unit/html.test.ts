import { describe, it, expect } from "vitest";
import { safeHtml, markdownToHtml, youtubeId, looksLikeHtml } from "../../src/lib/html";
import { regionForCountry, isRegion } from "../../src/lib/regions";

describe("safeHtml", () => {
  it("strips scripts and event handlers", () => {
    expect(safeHtml('<p onclick="x()">hi<script>alert(1)</script></p>')).toBe("<p>hi</p>");
  });
  it("keeps tables, videos and youtube iframes", () => {
    const html = '<table><tr><td>a</td></tr></table><video src="/u/v.mp4" controls></video><div data-youtube-video><iframe src="https://www.youtube.com/embed/abc123"></iframe></div>';
    const out = safeHtml(html);
    expect(out).toContain("<table>");
    expect(out).toContain('<video src="/u/v.mp4"');
    expect(out).toContain("youtube.com/embed/abc123");
  });
  it("drops iframes from other hosts", () => {
    expect(safeHtml('<iframe src="https://evil.example/x"></iframe>')).toBe("");
  });
  it("adds rel/target to external links only", () => {
    expect(safeHtml('<a href="https://doi.org/1">x</a>')).toContain('target="_blank"');
    expect(safeHtml('<a href="/contact-us">x</a>')).not.toContain("target");
  });
});

describe("markdownToHtml", () => {
  it("converts lists and the video shorthand", () => {
    const out = markdownToHtml("1. one\n2. two\n\n@[video](/u/a.mp4)");
    expect(out).toContain("<ol>");
    expect(out).toContain('<video class="rm-video" src="/u/a.mp4"');
  });
  it("passes HTML through untouched", () => {
    expect(markdownToHtml("<p>x</p>")).toBe("<p>x</p>");
    expect(looksLikeHtml("<p>x</p>")).toBe(true);
  });
});

describe("youtubeId", () => {
  it("parses common URL shapes", () => {
    expect(youtubeId("https://youtu.be/ja2bTvMJRLs")).toBe("ja2bTvMJRLs");
    expect(youtubeId("https://www.youtube.com/watch?v=kdIcJW-QDL4&feature=youtu.be")).toBe("kdIcJW-QDL4");
    expect(youtubeId("https://example.com")).toBeNull();
  });
});

describe("regions", () => {
  it("maps countries to sales regions", () => {
    expect(regionForCountry("US")).toBe("us");
    expect(regionForCountry("de")).toBe("ous");
    expect(regionForCountry("JP")).toBe("apac");
    expect(regionForCountry("IL")).toBe("apac");
    expect(regionForCountry(null)).toBeNull();
  });
  it("validates region strings", () => {
    expect(isRegion("apac")).toBe(true);
    expect(isRegion("eu")).toBe(false);
  });
});
