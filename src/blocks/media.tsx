import type { ActionLink } from "@/db/schema";
import { Section, Btn, Img } from "@/components/site/primitives";
import { MediaBlock } from "@/components/site/Media";
import { F, FM } from "./edit";
import type { BlockDef, BlockProps } from "./types";

export type MediaVariant = "image" | "video" | "document";

export type MediaData = {
  imageUrl?: string | null;
  /** File or YouTube link. */
  videoUrl?: string | null;
  alt?: string | null;
  /** `document`: button that opens the file. */
  document?: ActionLink | null;
};

function Media({ variant, data: d, edit: e, nested }: BlockProps<"media">) {
  const inner = (
    <div className="mt-8">
      {variant === "image" && <FM e={e} k="imageUrl"><Img src={d.imageUrl} alt={d.alt ?? ""} className="w-full rounded" /></FM>}
      {variant === "video" && <FM e={e} k="imageUrl" kv="videoUrl"><MediaBlock videoUrl={d.videoUrl} imageUrl={d.imageUrl} /></FM>}
      {variant === "document" && d.document?.href && <Btn href={d.document.href} external><F e={e} k="document.label" kh="document.href" kind="link">{d.document.label}</F></Btn>}
    </div>
  );
  return nested ? inner : <Section>{inner}</Section>;
}

export const media: BlockDef<"media"> = {
  type: "media",
  name: "Media",
  description: "One image, one video or a button to a document.",
  category: "content",
  variants: [
    { id: "image", label: "Image", description: "Full width of the column" },
    { id: "video", label: "Video", description: "File or YouTube link" },
    { id: "document", label: "Document", description: "Button that opens a PDF" },
  ],
  fields: [
    { key: "imageUrl", label: "Image or poster", kind: "media" },
    { key: "videoUrl", label: "Video", kind: "media" },
    { key: "alt", label: "Image description", kind: "text" },
    { key: "document", label: "Document button", kind: "link" },
  ],
  example: { imageUrl: "/uploads/features/comaneci-low-profile.jpg" },
  examples: {
    video: { videoUrl: "/uploads/duda/636q06j9Tiq4QNRHY6i7_tigerface-wide-v-7c2906.mp4" },
    document: { document: { label: "Open PDF", href: "/style-guide#media" } },
  },
  Component: Media,
  flow: () => true,
};
