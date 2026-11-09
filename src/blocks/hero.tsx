import { Fragment } from "react";
import Link from "next/link";
import type { ActionLink } from "@/db/schema";
import { Container, Section, H1, Btn, Img, Eyebrow } from "@/components/site/primitives";
import { VideoHero } from "@/components/site/Media";
import { F, FM } from "./edit";
import type { BlockDef, BlockProps } from "./types";

export type HeroVariant = "video" | "image" | "title" | "page" | "banner" | "bannerCompact";

export type HeroData = {
  /** Breadcrumb line above the title. */
  eyebrow?: string | null;
  /** Links after the breadcrumb (other regional versions). */
  eyebrowLinks?: ActionLink[];
  title: string;
  /** Second title line. */
  title2?: string | null;
  /** Banners: larger line under the title. */
  subtitle?: string | null;
  body?: string | null;
  /** `bannerCompact`: small note under the text. */
  note?: string | null;
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
        {d.body && <p className="mt-3 max-w-2xl text-muted"><F e={e} k="body">{d.body}</F></p>}
      </>
    );
    return nested ? inner : <Section>{inner}</Section>;
  }
  const links = d.eyebrowLinks ?? [];
  const title = <H1><F e={e} k="title">{d.title}</F>{d.title2 && <><br /><F e={e} k="title2">{d.title2}</F></>}</H1>;
  if (variant === "banner" || variant === "bannerCompact") {
    const large = variant === "banner";
    return (
      <VideoHero videoUrl={d.videoUrl} poster={d.imageUrl}>
        <Container className={large ? "py-24 md:py-40" : "py-20 md:py-28"}>
          {(d.eyebrow || links.length > 0) && (
            <Eyebrow>
              {d.eyebrow}
              {links.map((l) => (
                <Fragment key={l.href}> · <Link href={l.href} className="underline">{l.label}</Link></Fragment>
              ))}
            </Eyebrow>
          )}
          {title}
          {d.subtitle && <p className={large ? "mt-3 text-xl" : "mt-4 text-xl"}><F e={e} k="subtitle">{d.subtitle}</F></p>}
          {d.body && <p className={large ? "mt-4 max-w-xl opacity-90" : `mt-4 max-w-3xl ${d.subtitle ? "opacity-90" : "text-lg"}`}><F e={e} k="body">{d.body}</F></p>}
          {d.note && <p className="mt-3 text-sm opacity-80"><F e={e} k="note">{d.note}</F></p>}
          {d.cta?.href && <div className={large ? "mt-8" : "mt-6"}><Btn href={d.cta.href}><F e={e} k="cta.label" kh="cta.href" kind="link">{d.cta.label}</F></Btn></div>}
        </Container>
      </VideoHero>
    );
  }
  const video = variant === "video" ? d.videoUrl : null;
  if (variant === "title") {
    return (
      <VideoHero videoUrl={null}>
        <Container className="py-16 md:py-24">
          {d.eyebrow && <Eyebrow>{d.eyebrow}</Eyebrow>}
          {title}
          {d.body && <p className="mt-6 text-lg"><F e={e} k="body">{d.body}</F></p>}
          {d.cta?.href && <div className="mt-8"><Btn href={d.cta.href}><F e={e} k="cta.label" kh="cta.href" kind="link">{d.cta.label}</F></Btn></div>}
        </Container>
      </VideoHero>
    );
  }
  return (
    <VideoHero videoUrl={video} poster={video ? d.imageUrl : null}>
      <Container className="grid items-center gap-8 py-16 md:grid-cols-2 md:py-24">
        <div>
          {(d.eyebrow || links.length > 0) && (
            <Eyebrow>
              {d.eyebrow}
              {links.map((l) => (
                <span key={l.href}> · <Link href={l.href} className="underline">{l.label}</Link></span>
              ))}
            </Eyebrow>
          )}
          {title}
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
    { id: "banner", label: "Large banner", description: "Full width, tall, video in the background" },
    { id: "bannerCompact", label: "Compact banner", description: "Full width, lower, with a subtitle or a note" },
    { id: "video", label: "Background video", description: "Dark, video plays in the background, the image is its poster" },
    { id: "image", label: "Image beside", description: "Light, text on the left, image on the right" },
    { id: "title", label: "Title band", description: "Own band with a line under it, no media" },
    { id: "page", label: "Page title", description: "Compact title and short intro, flows into the content below" },
  ],
  fields: [
    { key: "eyebrow", label: "Breadcrumb", kind: "text", note: "filled in automatically" },
    { key: "title", label: "Title", kind: "text", required: true },
    { key: "title2", label: "Second title line", kind: "text" },
    { key: "subtitle", label: "Subtitle (banners)", kind: "text" },
    { key: "note", label: "Note (compact banner)", kind: "text" },
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
