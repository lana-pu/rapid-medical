import { Section, H2, Img } from "@/components/site/primitives";
import { Banner } from "@/components/site/blocks/Blocks";
import { MediaBlock } from "@/components/site/Media";
import { F, FM } from "./edit";
import type { BlockDef, BlockProps } from "./types";

export type TextVariant = "default" | "lead" | "large" | "surface" | "dark";

export type TextData = {
  title?: string | null;
  body?: string | null;
  /** `lead`: beside the text; `large`: wide picture under it; `dark`: band background. */
  imageUrl?: string | null;
  videoUrl?: string | null;
};

function Text({ variant, data: d, edit: e, nested }: BlockProps<"text">) {
  if (variant === "surface") {
    return (
      <Section className="bg-surface">
        {d.title && <H2><F e={e} k="title">{d.title}</F></H2>}
        {d.body && <p className="mt-4 max-w-3xl text-muted"><F e={e} k="body">{d.body}</F></p>}
      </Section>
    );
  }
  if (variant === "dark") {
    return <Banner imageUrl={d.imageUrl} videoUrl={d.videoUrl} title={d.title && <F e={e} k="title">{d.title}</F>} body={d.body && <F e={e} k="body">{d.body}</F>} />;
  }
  if (variant === "large") {
    const inner = (
      <>
        {d.title && <H2><F e={e} k="title">{d.title}</F></H2>}
        {d.body && <p className="mt-6 max-w-3xl text-xl"><F e={e} k="body">{d.body}</F></p>}
        {d.imageUrl && <FM e={e} k="imageUrl" className="mt-10"><Img src={d.imageUrl} className="aspect-[21/9] w-full rounded object-cover" /></FM>}
      </>
    );
    return nested ? inner : <Section>{inner}</Section>;
  }
  if (variant === "lead") {
    return (
      <Section>
        <div className="grid items-center gap-8 md:grid-cols-2">
          <div>
            {d.title && <H2><F e={e} k="title">{d.title}</F></H2>}
            {d.body && <p className="mt-4 text-lg text-muted"><F e={e} k="body">{d.body}</F></p>}
          </div>
          {(d.videoUrl || d.imageUrl) && <FM e={e} k="imageUrl" kv="videoUrl"><MediaBlock videoUrl={d.videoUrl} imageUrl={d.imageUrl} /></FM>}
        </div>
      </Section>
    );
  }
  const inner = (
    <>
      {d.title && <H2><F e={e} k="title">{d.title}</F></H2>}
      {d.body && <p className={d.title ? "mt-4 max-w-3xl text-lg" : "max-w-3xl text-lg"}><F e={e} k="body">{d.body}</F></p>}
    </>
  );
  return nested ? inner : <Section>{inner}</Section>;
}

export const text: BlockDef<"text"> = {
  type: "text",
  name: "Text",
  description: "A title and a paragraph.",
  category: "content",
  nestable: true,
  variants: [
    { id: "default", label: "Default", description: "Title and paragraph in one column" },
    { id: "lead", label: "Lead", description: "Larger intro text, optional media beside it" },
    { id: "large", label: "Large", description: "Large statement, optional wide image under it" },
    { id: "surface", label: "Grey band", description: "Title and paragraph on a grey band" },
    { id: "dark", label: "Dark band", description: "Centred text over a background image or video" },
  ],
  fields: [
    { key: "title", label: "Title", kind: "text" },
    { key: "body", label: "Text", kind: "longText" },
    { key: "imageUrl", label: "Image (lead, large, dark)", kind: "media" },
    { key: "videoUrl", label: "Video (lead, dark)", kind: "media" },
  ],
  example: {
    title: "Designed for distal anatomy",
    body: "A low-profile, adjustable device that reaches medium vessels and gives the physician control over the radial force.",
  },
  examples: {
    lead: {
      title: "Designed for distal anatomy",
      body: "A low-profile, adjustable device that reaches medium vessels and gives the physician control over the radial force.",
      imageUrl: "/uploads/features/comaneci-low-profile.jpg",
    },
    large: {
      body: "A short statement about the company, set larger than ordinary text.",
      imageUrl: "/uploads/features/comaneci-low-profile.jpg",
    },
    dark: {
      title: "Sample band title",
      body: "A short message over a background image.",
      imageUrl: "/uploads/features/comaneci-low-profile.jpg",
    },
  },
  Component: Text,
  flow: (v) => v === "default" || v === "large",
};
