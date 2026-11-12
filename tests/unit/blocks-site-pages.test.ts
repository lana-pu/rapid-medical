import { describe, it, expect } from "vitest";
import { SETTINGS } from "../../content/seed/settings";
import type { NewsItem, Publication, TeamMember } from "../../src/db/schema";
import { homeToBlocks, careersToBlocks, evidenceToBlocks, therapiesToBlocks, type PublicationRow, type OverviewTherapy } from "../../src/blocks/from-settings";
import { aboutToBlocks } from "../../src/blocks/from-pages";
import { homeToStored, careersToStored, aboutToStored, evidenceToStored, therapiesToStored } from "../../src/blocks/site-pages";
import { resolveBlocks, fillHref, type SourceLists } from "../../src/blocks/stored";
import type { Office } from "../../src/blocks/offices-map";

/** Singleton pages (ADR-007): the stored list with its sources renders like the settings did. */

function plain(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(plain);
  if (v && typeof v === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, x] of Object.entries(v)) if (k !== "edit" && k !== "uid" && x !== undefined) out[k] = plain(x);
    return out;
  }
  return v;
}
const db = <T,>(x: T) => JSON.parse(JSON.stringify(x)) as T; // through JSON, as in the database

const S = SETTINGS as Record<string, Record<string, unknown>>;
const news = [
  { id: 1, title: "News one", url: "https://x.com/1", imageUrl: "/n1.jpg", publishedOn: new Date("2026-01-01"), source: "X", featured: true },
  { id: 2, title: "News two", url: "https://x.com/2", imageUrl: null, publishedOn: new Date("2026-02-01"), source: null, featured: false },
] as unknown as NewsItem[];
const team = [{ id: 3, name: "Ronen", title: "CEO", longTitle: "Chief", photoUrl: "/r.jpg", slug: "ronen", bioHtml: "<p>bio</p>" }] as unknown as TeamMember[];
const offices: Office[] = [{ name: "Rapid Medical Ltd", label: "HQ", address: "Yokneam", lat: 32, lon: 35 }];
const pub = (id: number, product: string | null, imageUrl: string | null) => ({ id, title: `Study ${id}`, journal: "J", authors: "A", publishedOn: new Date("2025-01-01"), imageUrl, url: null, pdfUrl: null, doi: null, product: product ? { slug: product, family: null } : null }) as unknown as PublicationRow;
const all = [pub(1, "tigertriever", "/p1.jpg"), pub(2, "comaneci", null), pub(3, "comaneci", "/p3.jpg")];
const evidence = { all, featured: [all[0]] as Publication[], products: [{ slug: "tigertriever", name: "TIGERTRIEVER™", fullName: "TIGERTRIEVER™ 13" }, { slug: "comaneci", name: "COMANECI™", fullName: "COMANECI™" }] };
const therapies: OverviewTherapy[] = [
  { slug: "lvo", navLabel: "Large vessel stroke", heroTitle: "A", therapyGroup: "ischemic", productName: "TIGERTRIEVER™" },
  { slug: "aneurysm", navLabel: "Aneurysm", heroTitle: "B", therapyGroup: "hemorrhagic" },
  { slug: "other", navLabel: "Other", heroTitle: "C", therapyGroup: "" },
];
const lists: SourceLists = { news, team, offices, jobCount: 4, evidence, therapies };

describe("singleton pages render like before", () => {
  it("Home, with and without a known region", () => {
    const stored = db(homeToStored(S.home));
    for (const region of ["ous", null] as const) {
      expect(plain(db(resolveBlocks(stored, { region, lists })))).toEqual(plain(db(homeToBlocks({ home: S.home, news, region }))));
    }
  });
  it("Careers (open positions counted)", () => {
    const stored = db(careersToStored(S.careers));
    expect(plain(db(resolveBlocks(stored, { region: null, lists })))).toEqual(plain(db(careersToBlocks({ c: S.careers, jobCount: 4 }))));
  });
  it("About (team and offices from their records)", () => {
    const stored = db(aboutToStored(S.about));
    expect(plain(db(resolveBlocks(stored, { region: null, lists })))).toEqual(plain(db(aboutToBlocks({ about: S.about, offices, team }))));
    // no offices → no offices section, as before
    expect(plain(db(resolveBlocks(stored, { region: null, lists: { ...lists, offices: [] } })))).toEqual(plain(db(aboutToBlocks({ about: S.about, offices: [], team }))));
  });
  it.each(["us", "ous", "apac"] as const)("Evidence %s", (region) => {
    const stored = db(evidenceToStored(S.evidence, region));
    expect(plain(db(resolveBlocks(stored, { region, lists })))).toEqual(plain(db(evidenceToBlocks({ region, cfg: S.evidence, ...evidence }))));
    // no studies with pictures → no «latest» section
    const none = { ...evidence, all: all.map((p) => ({ ...p, imageUrl: null })) };
    expect(plain(db(resolveBlocks(stored, { region, lists: { ...lists, evidence: none } })))).toEqual(plain(db(evidenceToBlocks({ region, cfg: S.evidence, ...none }))));
  });
  it.each(["us", "ous", "apac"] as const)("Therapies overview %s", (region) => {
    const landing = S[`therapies:${region}`];
    const stored = db(therapiesToStored(landing, region));
    expect(plain(db(resolveBlocks(stored, { region, lists })))).toEqual(plain(db(therapiesToBlocks({ region, landing, items: therapies }))));
  });
});

describe("offices are edited in Contact details", () => {
  it("the offices section is bound to the contact settings, not to the page", () => {
    const blocks = resolveBlocks(aboutToStored(S.about), { region: null, lists }, { r: "site-pages", id: 2 });
    expect(blocks.find((b) => b.type === "officesMap" && b.variant === "offices")?.edit).toEqual({ r: "settings:contact", map: { offices: "offices" } });
  });
});

describe("links when the region is not known", () => {
  it("regional pages go through the chooser, region parameters are dropped", () => {
    expect(fillHref("/{region}/therapies", { region: null })).toBe("/choose-your-location");
    expect(fillHref("/contact-us?region={region}&topic=demo", { region: null })).toBe("/contact-us?topic=demo");
    expect(fillHref("/contact-us?region={region}", { region: null })).toBe("/contact-us");
    expect(fillHref("/contact-us?topic=demo&region={region}", { region: null })).toBe("/contact-us?topic=demo");
  });
});
