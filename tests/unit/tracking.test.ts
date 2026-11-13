import { describe, expect, it } from "vitest";
import { eventForLink } from "@/lib/tracking";

describe("eventForLink", () => {
  const ctx = { inHeader: false, pathname: "/ous/therapies" };
  it("email links", () => {
    expect(eventForLink("mailto:orders.inc@rapid-medical.com?subject=Order", ctx)).toEqual({ name: "click_email", params: { link_url: "orders.inc@rapid-medical.com" } });
  });
  it("therapy pages: source is the menu, the overview or another page", () => {
    expect(eventForLink("/ous/therapies/mvo", ctx)?.params).toEqual({ region: "ous", therapy: "mvo", source: "overview" });
    expect(eventForLink("/us/therapies/lvo", { ...ctx, inHeader: true })?.params.source).toBe("menu");
    expect(eventForLink("/us/therapies/lvo", { inHeader: false, pathname: "/" })?.params.source).toBe("page");
  });
  it("everything else is not reported", () => {
    expect(eventForLink("/ous/therapies", ctx)).toBeNull();
    expect(eventForLink("/about-us", ctx)).toBeNull();
    expect(eventForLink("https://example.com/x.pdf", ctx)).toBeNull();
  });
});

import { mediaKind } from "@/components/site/MediaLightbox";

describe("mediaKind", () => {
  it("videos and pictures open in the window; PDFs and pages do not", () => {
    expect(mediaKind("https://vid.cdn-website.com/x/videos/a-v.mp4")).toBe("video");
    expect(mediaKind("/uploads/duda/case.png?jxl&v=jxl")).toBe("image");
    expect(mediaKind("/uploads/poster.pdf")).toBeNull();
    expect(mediaKind("/ous/therapies/aneurysm")).toBeNull();
  });
});

import { absUrl } from "@/components/site/JsonLd";

describe("absUrl", () => {
  it("resolves relative paths, keeps http(s), drops malformed or other schemes without throwing", () => {
    expect(absUrl("/logo.svg", "https://www.rapid-medical.com")).toBe("https://www.rapid-medical.com/logo.svg");
    expect(absUrl("https://cdn.example.com/a.png", "https://www.rapid-medical.com")).toBe("https://cdn.example.com/a.png");
    expect(absUrl("javascript:alert(1)", "https://www.rapid-medical.com")).toBeUndefined();
    expect(absUrl("http://[bad", "https://www.rapid-medical.com")).toBeUndefined();
    expect(absUrl("", "https://www.rapid-medical.com")).toBeUndefined();
  });
});

import { isPdf } from "@/components/site/MediaLightbox";
describe("isPdf", () => {
  it("links to PDF files, with or without a query", () => {
    expect(isPdf("/uploads/2026-11/case.pdf")).toBe(true);
    expect(isPdf("https://example.com/a/B.PDF?x=1")).toBe(true);
    expect(isPdf("/news/pdf-tools")).toBe(false);
  });
});
