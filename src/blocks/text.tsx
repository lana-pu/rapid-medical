import { Section, H2 } from "@/components/site/primitives";
import { MediaBlock } from "@/components/site/Media";
import { F, FM } from "./edit";
import type { BlockDef, BlockProps } from "./types";

export type TextVariant = "default" | "lead";

export type TextData = {
  title?: string | null;
  body?: string | null;
  /** `lead` only: picture or video beside the text. */
  imageUrl?: string | null;
  videoUrl?: string | null;
};

function Text({ variant, data: d, edit: e, nested }: BlockProps<"text">) {
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
  ],
  fields: [
    { key: "title", label: "Title", kind: "text" },
    { key: "body", label: "Text", kind: "longText" },
    { key: "imageUrl", label: "Image (lead)", kind: "media" },
    { key: "videoUrl", label: "Video (lead)", kind: "media" },
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
  },
  Component: Text,
};
