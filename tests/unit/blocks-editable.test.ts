import { describe, it, expect, vi, beforeEach } from "vitest";
import { createElement } from "react";
import { prerender } from "react-dom/static";

// the editor is on (or off) for the whole render; library lookups are not needed for the markup
const mode = vi.hoisted(() => ({ editing: true }));
vi.mock("@/lib/editing", () => ({ isEditing: async () => mode.editing }));
vi.mock("@/lib/media-lookup", () => ({ lookupMedia: async () => new Map() }));

import { BLOCKS } from "../../src/blocks/registry";
import { presetBlock } from "../../src/blocks/templates";
import { checkBlockPath } from "../../src/blocks/paths";
import { resolveBlocks } from "../../src/blocks/stored";
import type { EditBinding } from "../../src/blocks/bind";
import type { StoredBlock } from "../../src/db/schema";

type Tag = { r: string; id: number; f: string; k: string; fh?: string; fv?: string };

async function render(type: string, variant: string, data: Record<string, unknown>, edit?: EditBinding): Promise<string> {
  const { Component } = (BLOCKS as unknown as Record<string, { Component: unknown }>)[type];
  const { prelude } = await prerender(createElement(Component as never, { variant, data, edit, nested: false, render: () => null }));
  return new Response(prelude).text();
}

const unescape = (s: string) => s.replaceAll("&quot;", '"').replaceAll("&amp;", "&").replaceAll("&#x27;", "'").replaceAll("&lt;", "<").replaceAll("&gt;", ">");
const tagsOf = (html: string): Tag[] => [...html.matchAll(/data-e="([^"]*)"/g)].map((m) => JSON.parse(unescape(m[1])) as Tag);

const PREFIX = "blocks.0.data.";
const bound = { r: "pages", id: 1, prefix: PREFIX };
/** Field keys of the block as `text` / `link label|href` / `media image|video`, without the page prefix. */
const keysOf = (tags: Tag[]) =>
  tags.map((t) => {
    const k = (p: string) => p.slice(PREFIX.length);
    return t.k === "media" ? `media ${k(t.f)}${t.fv ? `|${k(t.fv)}` : ""}` : t.k === "link" ? `link ${k(t.f)}|${t.fh ? k(t.fh) : ""}` : `${t.k} ${k(t.f)}`;
  });

/** Every path a tag writes must be one the server accepts for this stored block. */
function expectWritable(block: StoredBlock, tags: Tag[]) {
  for (const t of tags) {
    for (const p of [t.f, t.fh, t.fv]) {
      if (!p) continue;
      expect(p.startsWith(PREFIX), p).toBe(true);
      const check = checkBlockPath([block], p.split(".").slice(1));
      expect(check, `${block.type}:${block.variant} ${p}`).toMatchObject({ ok: true });
    }
  }
}

async function preset(type: string, variant: string, patch?: (d: Record<string, unknown>) => void) {
  const block = presetBlock(type, variant);
  patch?.(block.data as Record<string, unknown>);
  const html = await render(type, variant, block.data as Record<string, unknown>, bound);
  const tags = tagsOf(html);
  expectWritable(block, tags);
  return keysOf(tags);
}

describe("section fields are editable on the page (presets)", () => {
  beforeEach(() => {
    mode.editing = true;
  });

  it("Columns · Link cards: eyebrow, title with the card's address, text, proof line, picture, second link", async () => {
    const keys = await preset("columns", "cards");
    expect(keys).toEqual(expect.arrayContaining(["text items.0.eyebrow", "link items.0.title|items.0.href", "text items.0.body", "text items.0.note", "link items.1.title|items.1.href"]));
    const more = await preset("columns", "cards", (d) => {
      const items = d.items as Record<string, unknown>[];
      items[0] = { ...items[0], imageUrl: "/uploads/a.jpg", more: { label: "3 publications →", href: "/us/evidence" } };
      delete items[1].href; // a card without an address yet: its address can be added
    });
    expect(more).toEqual(expect.arrayContaining(["media items.0.imageUrl", "link items.0.title|items.0.href", "link items.0.more.label|items.0.more.href", "link items.1.title|items.1.href"]));
  });

  it("Columns · Features: the icons", async () => {
    const keys = await preset("columns", "features");
    expect(keys).toEqual(expect.arrayContaining(["media items.0.iconUrl", "media items.3.iconUrl"]));
  });

  it("Spec table · Table: caption, header and body cells", async () => {
    const keys = await preset("specTable", "table", (d) => {
      (d.table as Record<string, unknown>).caption = "Sizes";
    });
    expect(keys).toEqual(expect.arrayContaining(["text table.caption", "text table.columns.0", "text table.columns.3", "text table.rows.0.0", "text table.rows.1.3"]));
  });

  it("Video · Dark band: the clip", async () => {
    expect(await preset("video", "band")).toContain("media url|url");
  });

  it("Gallery · Photos with quotes: the photos", async () => {
    expect(await preset("gallery", "quotes")).toEqual(expect.arrayContaining(["media items.0.imageUrl", "media items.1.imageUrl"]));
  });

  it("Device diagram: the legend title and the image", async () => {
    expect(await preset("deviceDiagram", "default")).toEqual(expect.arrayContaining(["text caption", "media imageUrl"]));
  });

  it("Hero · banners and background video: the background", async () => {
    for (const v of ["banner", "bannerCompact", "video"]) expect(await preset("hero", v), v).toContain("media imageUrl|videoUrl");
  });

  it("Text · Dark band: the background; Beside facts: the facts and the values of countries and headquarters", async () => {
    expect(await preset("text", "dark")).toContain("media imageUrl|videoUrl");
    expect(await preset("text", "facts")).toEqual(expect.arrayContaining(["text countries", "text facts.0.label", "text facts.0.value", "text facts.1.value", "text headquarters"]));
  });

  it("Key numbers · Row and Badge: the icons", async () => {
    expect(await preset("keyNumbers", "row")).toEqual(expect.arrayContaining(["media items.0.iconUrl", "media items.2.iconUrl"]));
    expect(await preset("keyNumbers", "badge")).toContain("media items.0.iconUrl");
  });

  it("Study at a glance: the source's name and address", async () => {
    expect(await preset("passport", "default")).toContain("link source.label|source.href");
    expect(await preset("passport", "default", (d) => ((d.source as Record<string, unknown>).href = "https://clinicaltrials.gov/"))).toContain("link source.label|source.href");
  });

  it("facts filled from records (About) stay not editable; the page's own values are", async () => {
    const stored: StoredBlock = { ...presetBlock("text", "facts"), source: "companyFacts" };
    const [b] = resolveBlocks([stored], { region: "us", lists: { facts: [{ label: "Clinical publications", value: "120" }] } }, { r: "pages", id: 1 });
    const keys = keysOf(tagsOf(await render(b.type, b.variant as string, b.data as Record<string, unknown>, b.edit)));
    expect(keys.some((k) => k.includes("facts."))).toBe(false);
    expect(keys).toEqual(expect.arrayContaining(["text countries", "text headquarters"]));
  });
});

describe("visitors get the same markup", () => {
  it("no editor marks and no wrappers outside the editor", async () => {
    mode.editing = false;
    const cases: [string, string][] = [
      ["columns", "cards"], ["columns", "features"], ["specTable", "table"], ["video", "band"], ["gallery", "quotes"], ["deviceDiagram", "default"],
      ["hero", "banner"], ["hero", "bannerCompact"], ["hero", "video"], ["text", "dark"], ["text", "facts"], ["keyNumbers", "row"], ["keyNumbers", "badge"], ["passport", "default"],
    ];
    for (const [type, variant] of cases) {
      const data = presetBlock(type, variant).data as Record<string, unknown>;
      const withBinding = await render(type, variant, data, bound);
      expect(withBinding).not.toContain("data-e");
      expect(withBinding).not.toContain("rm-e-media");
      // `<!-- -->` only separates text chunks in server HTML; the DOM visitors get is the same
      const plain = (h: string) => h.replaceAll("<!-- -->", "");
      expect(plain(withBinding), `${type}:${variant}`).toBe(plain(await render(type, variant, data)));
    }
  });
});

describe("checkBlockPath: a link's address can be added where its text is", () => {
  const blocks = [
    { id: "a", type: "passport", variant: "default", data: { rows: [{ label: "Design", value: "x" }], source: { label: "Doc" } } },
    { id: "b", type: "columns", variant: "cards", data: { items: [{ title: "Card" }] } },
  ];
  const ok = (p: string) => checkBlockPath(blocks, p.split("."));
  it("href of an existing source or card is accepted as an address", () => {
    expect(ok("0.data.source.href")).toMatchObject({ ok: true, url: true });
    expect(ok("1.data.items.0.href")).toMatchObject({ ok: true, url: true });
  });
  it("other missing keys stay refused", () => {
    expect(ok("0.data.source.whatever").ok).toBe(false);
    expect(ok("1.data.items.0.note").ok).toBe(false);
    expect(ok("1.data.items.0.title.href").ok).toBe(false);
  });
});
