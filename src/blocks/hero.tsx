import Link from "next/link";
import type { ActionLink } from "@/db/schema";
import { Container, Section, H1, Btn, Img, Eyebrow } from "@/components/site/primitives";
import { VideoHero } from "@/components/site/Media";
import { F, FM } from "./edit";
import type { BlockDef, BlockProps } from "./types";

export type HeroVariant = "video" | "image" | "title" | "page";

export type HeroData = {
  /** Breadcrumb line above the title. */
  eyebrow?: string | null;
  /** Links after the breadcrumb (other regional versions). */
  eyebrowLinks?: ActionLink[];
  title: string;
  body?: string | null;
  cta?: ActionLink | null;
  /** Image beside the text (`image`) or video poster (`video`). */
  imageUrl?: string | null;
  videoUrl?: string | null;
};

function Hero({ variant, data: d, edit: e, nested }: BlockProps<"hero">) {
  if (variant === "page") {
    const inner = (
      <>
        {d.eyebrow && <Eyebrow>{d.eyebrow}</Eyebrow>}
        <H1><F e={e} k="title">{d.title}</F></H1>
        {d.body && <p className="mt-3 text-muted"><F e={e} k="body">{d.body}</F></p>}
      </>
    );
    return nested ? inner : <Section>{inner}</Section>;
  }
  const video = variant === "video" ? d.videoUrl : null;
  const links = d.eyebrowLinks ?? [];
  return (
    <VideoHero videoUrl={video} poster={video ? d.imageUrl : null}>
      <Container className={variant === "title" ? "py-16 md:py-24" : "grid items-center gap-8 py-16 md:grid-cols-2 md:py-24"}>
        <div>
          {(d.eyebrow || links.length > 0) && (
            <Eyebrow>
              {d.eyebrow}
              {links.map((l) => (
                <span key={l.href}> · <Link href={l.href} className="underline">{l.label}</Link></span>
              ))}
            </Eyebrow>
          )}
          <H1><F e={e} k="title">{d.title}</F></H1>
          {d.body && <p className="mt-6 text-lg"><F e={e} k="body">{d.body}</F></p>}
          {d.cta?.href && <div className="mt-8"><Btn href={d.cta.href}><F e={e} k="cta.label" kh="cta.href" kind="link">{d.cta.label}</F></Btn></div>}
        </div>
        {variant === "image" && <FM e={e} k="imageUrl" kv="videoUrl"><Img src={d.imageUrl} className="w-full rounded object-contain" /></FM>}
      </Container>
    </VideoHero>
  );
}

export const hero: BlockDef<"hero"> = {
  type: "hero",
  name: "Hero",
  description: "First screen of the page: breadcrumb, title, text, button and media.",
  category: "content",
  variants: [
    { id: "video", label: "Background video", description: "Dark, video plays in the background, the image is its poster" },
    { id: "image", label: "Image beside", description: "Light, text on the left, image on the right" },
    { id: "title", label: "Title band", description: "Own band with a line under it, no media" },
    { id: "page", label: "Page title", description: "Compact title and short intro, flows into the content below" },
  ],
  fields: [
    { key: "eyebrow", label: "Breadcrumb", kind: "text", note: "filled in automatically" },
    { key: "title", label: "Title", kind: "text", required: true },
    { key: "body", label: "Text", kind: "longText" },
    { key: "cta", label: "Button", kind: "link" },
    { key: "imageUrl", label: "Image or poster", kind: "media" },
    { key: "videoUrl", label: "Video", kind: "media" },
  ],
  example: {
    eyebrow: "Our solutions / Large vessel stroke",
    eyebrowLinks: [{ label: "OUS version", href: "/style-guide#hero" }],
    title: "Sample page title",
    body: "Sample text under the title. The style guide uses sample content, not product claims.",
    cta: { label: "Request a demo", href: "/style-guide#hero" },
    imageUrl: "/uploads/features/tt-active-technology.jpg",
    videoUrl: "/uploads/duda/636q06j9Tiq4QNRHY6i7_tigerface-wide-v-7c2906.mp4",
  },
  Component: Hero,
  flow: (v) => v === "page",
};
