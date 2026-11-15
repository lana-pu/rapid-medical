import { describe, it, expect } from "vitest";
import { buildReport, type ViewRow, type LeadRow } from "../../src/lib/analytics";

const now = new Date("2026-11-15T12:00:00Z");
const ago = (d: number) => new Date(now.getTime() - d * 86_400_000);
const view = (d: number, x: Partial<ViewRow> = {}): ViewRow => ({ at: ago(d), kind: "view", path: "/us/therapies/lvo", visit: false, region: "us", country: "US", source: null, utmCampaign: null, file: null, ...x });
const lead = (d: number, meta: Record<string, string>, x: Partial<LeadRow> = {}): LeadRow => ({ at: ago(d), form: "contact", topic: "Request a demo", region: "us", country: "US", meta, ...x });

describe("analytics report", () => {
  const r = buildReport({
    days: 7,
    now,
    views: [
      view(1, { visit: true, source: "LinkedIn", utmCampaign: "post-1" }),
      view(1),
      view(2, { visit: true, source: "Google", path: "/" }),
      view(3, { kind: "download", file: "/uploads/duda/IFU%20TT.pdf" }),
      view(10, { visit: true, source: "LinkedIn" }), // previous period
    ],
    leads: [lead(1, { utm_source: "linkedin", utm_campaign: "post-1", previous_page: "/us/therapies/lvo?x=1" }), lead(9, {})],
    pageTitle: (p) => (p === "/" ? "Home" : p === "/us/therapies/lvo" ? "Large vessel stroke (Americas)" : p),
    formLabel: (f) => (f === "contact" ? "Contact form" : f),
    regionLabel: (r) => (r === "us" ? "Americas" : r),
  });
  it("counts the period against the one before", () => {
    expect(r.tiles).toEqual({ visits: [2, 1], views: [3, 1], leads: [1, 1] });
    expect(r.visitsByDay).toHaveLength(8);
  });
  it("visits and leads by source, the page that led to the request, in words", () => {
    expect(r.sources).toEqual([{ label: "LinkedIn", value: 1, extra: 1 }, { label: "Google", value: 1 }]);
    expect(r.headline).toBe("LinkedIn brought 1 visit and 1 lead");
    expect(r.leadPages).toEqual([{ label: "Large vessel stroke (Americas)", value: 1 }]);
    expect(r.campaigns).toEqual([{ label: "post-1", value: 1, extra: 1 }]);
    expect(r.leadForms).toEqual([{ label: "Contact form · Request a demo", value: 1 }]);
    expect(r.downloads).toEqual([{ label: "IFU TT.pdf", value: 1 }]);
  });
});
