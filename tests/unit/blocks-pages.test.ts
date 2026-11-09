import { describe, it, expect } from "vitest";
import { fieldPath } from "../../src/blocks/bind";
import { pageToBlocks, contactToBlocks, aboutToBlocks } from "../../src/blocks/from-pages";
import type { Page, TeamMember } from "../../src/db/schema";
import type { BlockOf } from "../../src/blocks/types";

const page = { id: 5, title: "Terms", bodyHtml: "<p>x</p>" } as Page;

describe("pageToBlocks", () => {
  it("page title and rich text, both bound to the record", () => {
    const [h, t] = pageToBlocks(page);
    expect(`${h.type}:${h.variant}`).toBe("hero:page");
    expect(`${t.type}:${t.variant}`).toBe("richText:default");
    expect(fieldPath(h.edit, "title")).toBe("title");
    expect(fieldPath(t.edit, "html")).toBe("bodyHtml");
    expect(fieldPath(h.edit, "eyebrow")).toBeNull();
  });
  it("regional page shows the region above the title", () => {
    expect((pageToBlocks(page, "APAC")[0] as BlockOf<"hero">).data.eyebrow).toBe("APAC");
    expect((pageToBlocks(page)[0] as BlockOf<"hero">).data.eyebrow).toBeUndefined();
  });
});

describe("contactToBlocks", () => {
  it("URL parameters preselect topic and region", () => {
    const f = contactToBlocks({ region: "ous", topic: "demo" })[1] as BlockOf<"form">;
    expect(f.data.defaultRegion).toBe("Europe");
    expect(f.data.defaultTopic).toBe("Request a demo");
    expect(f.data.preview).toBeUndefined();
  });
  it("no or unknown parameters preselect nothing; nothing is editable", () => {
    const [h, f] = contactToBlocks({ topic: "nope" }) as [BlockOf<"hero">, BlockOf<"form">];
    expect(f.data.defaultTopic).toBeUndefined();
    expect(f.data.defaultRegion).toBeUndefined();
    expect(h.edit).toBeUndefined();
  });
});

describe("aboutToBlocks", () => {
  const team = [{ id: 3, slug: "jane", name: "Jane", title: "CEO", photoUrl: "/j.jpg" }] as TeamMember[];
  const office = { name: "HQ", lat: 1, lon: 2 };
  const types = (bs: { type: string; variant: string }[]) => bs.map((b) => `${b.type}:${b.variant}`);

  it("keeps the page order", () => {
    expect(types(aboutToBlocks({ about: { intro: "i" }, offices: [office], team }))).toEqual(["hero:page", "text:large", "text:surface", "people:team", "officesMap:offices", "officesMap:map"]);
  });
  it("skips the intro and the office list when empty, keeps the map and defaults", () => {
    const bs = aboutToBlocks({ about: {}, offices: [], team: [] });
    expect(types(bs)).toEqual(["hero:page", "text:surface", "people:team", "officesMap:map"]);
    expect((bs[1] as BlockOf<"text">).data.title).toBe("What we do");
    expect((bs[3] as BlockOf<"officesMap">).data.closingLine).toBe("Have a question? We’d love to hear from you.");
  });
  it("binds fields to settings and each person to their record", () => {
    const bs = aboutToBlocks({ about: { intro: "i" }, offices: [office], team });
    expect(fieldPath(bs[1].edit, "imageUrl")).toBe("heroImageUrl");
    const people = bs[3] as BlockOf<"people">;
    expect(fieldPath(people.edit, "intro")).toBe("leadershipIntro");
    expect(fieldPath(people.edit, "title")).toBeNull();
    const m = people.data.members![0];
    expect(m.href).toBe("/team/jane");
    expect(m.edit).toMatchObject({ r: "team", id: 3 });
    expect(fieldPath(m.edit, "photoUrl")).toBe("photoUrl");
    expect(bs[4].edit?.r).toBe("settings:contact");
    expect(fieldPath(bs[4].edit, "offices.0.name")).toBe("offices.0.name");
    expect(fieldPath(bs[5].edit, "subtitle")).toBe("mapSub");
  });
});
