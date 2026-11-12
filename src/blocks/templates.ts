import type { StoredBlock } from "@/db/schema";
import { BLOCKS } from "./registry";
import type { BlockDef, BlockType } from "./types";
import { newBlockId } from "./stored";

/**
 * Starting points for editors (ADR-006/007): page templates for «New page» and section presets for «Add section».
 * Presets come from the block registry — every variant of every content block, with its sample data.
 * List and system blocks (news, team, forms, indications…) are not offered: their content comes from records or rules.
 */

const def = (t: string) => (Object.hasOwn(BLOCKS, t) ? (BLOCKS[t as BlockType] as unknown as BlockDef<BlockType>) : null);

export type Preset = { type: string; variant: string; name: string; label: string; description: string; /** can go inside a Product details tab */ nestable: boolean };

export const PRESETS: Preset[] = Object.values(BLOCKS as unknown as Record<string, BlockDef<BlockType>>)
  .filter((d) => d.category === "content")
  .flatMap((d) => d.variants.map((v) => ({ type: d.type, variant: v.id as string, name: d.name, label: v.label, description: v.description ?? d.description, nestable: !!d.nestable })));

export const isPreset = (type: string, variant: string) => PRESETS.some((p) => p.type === type && p.variant === variant);

/** Sample data of a block variant (what a new section starts with). */
export function sampleData(type: string, variant: string): Record<string, unknown> {
  const d = def(type);
  if (!d) throw new Error(`Unknown block ${type}`);
  const data = (d.examples as Record<string, unknown> | undefined)?.[variant] ?? d.example;
  return JSON.parse(JSON.stringify(data)) as Record<string, unknown>;
}

export function presetBlock(type: string, variant: string): StoredBlock {
  if (!isPreset(type, variant)) throw new Error("This section is not available to editors");
  const data = sampleData(type, variant);
  // style-guide anchors in sample links mean nothing on a real page
  return { id: newBlockId(), type, variant, data: JSON.parse(JSON.stringify(data).replaceAll('"/style-guide#', '"#')) };
}

/* ------------------------------------------------------------------ */
/*  Page templates                                                     */
/* ------------------------------------------------------------------ */

export type TemplateId = "text" | "landing" | "therapy";

export const TEMPLATES: { id: TemplateId; label: string; description: string; resource: "pages" | "solutions" }[] = [
  { id: "text", label: "Text page", description: "Title and formatted text: legal pages, announcements.", resource: "pages" },
  { id: "landing", label: "Landing page", description: "Banner with a button, text with a picture and a call to action. For campaigns.", resource: "pages" },
  { id: "therapy", label: "Therapy page", description: "Product page: banner, benefits, product tabs, questions, indications.", resource: "solutions" },
];

const b = (type: string, variant: string, data: Record<string, unknown>, source?: string): StoredBlock => ({ id: newBlockId(), type, variant, data, ...(source ? { source } : {}) });

export function templateBlocks(id: TemplateId, title: string): StoredBlock[] {
  const demo = { label: "Request a demo", href: "/contact-us?region={region}&topic=demo" };
  switch (id) {
    case "text":
      return [b("hero", "page", { title }, "regionLabel"), b("richText", "default", { html: "<p>Start writing here. Click this text to edit it.</p>" })];
    case "landing":
      return [
        b("hero", "image", { title, body: "One or two sentences about the offer.", cta: demo, imageUrl: null }),
        b("textMedia", "mediaRight", sampleData("textMedia", "mediaRight")),
        b("cta", "band", { title: "Questions?", body: "Our team will get back to you.", buttons: [demo] }),
      ];
    case "therapy":
      return [
        b("hero", "image", { eyebrow: `Our solutions / ${title}`, title, body: "One or two sentences about the therapy.", imageUrl: null }, "regionVersions"),
        b("textMedia", "mediaRight", sampleData("textMedia", "mediaRight")),
        b("productDetails", "pills", {
          anchor: "overview",
          hint: "Click on a tab below to learn more.",
          tabs: [
            { id: "overview", label: "Product overview", title: "Product overview", blocks: [{ type: "text", variant: "default", data: { body: "Describe the device here." } }] },
            { id: "evidence", label: "Clinical evidence", href: "/{region}/evidence#{product}", blocks: [] },
          ],
        }),
        b("cta", "band", { title: "Questions?", buttons: [demo, { label: "Customer support", href: "/contact-us?region={region}" }] }),
        b("indications", "default", { indicationsHtml: "<p>Add the approved indications for this region before publishing.</p>", referencesHtml: "" }),
      ];
  }
}
