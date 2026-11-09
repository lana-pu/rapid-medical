import type { ActionLink, Chart, Stat } from "@/db/schema";
import { Section, H2, Btn, Img, Eyebrow } from "@/components/site/primitives";
import { MediaBlock, Video } from "@/components/site/Media";
import { StatCircles, StatRow } from "@/components/site/blocks/Stats";
import { BarChart } from "@/components/site/blocks/BarChart";
import { F, FM } from "./edit";
import type { BlockDef, BlockProps } from "./types";

export type TextMediaVariant = "mediaRight" | "mediaLeft" | "threeColumn" | "links" | "statement";

/** Same shape as a stored `Benefit` row. Media shows, in order: key numbers, chart, video or image. */
export type TextMediaData = {
  eyebrow?: string | null;
  title: string;
  body?: string | null;
  footnote?: string | null;
  link?: ActionLink | null;
  /** `links`: buttons under the text. */
  links?: ActionLink[];
  stats?: Stat[];
  statsCaption?: string | null;
  chart?: Chart | null;
  imageUrl?: string | null;
  videoUrl?: string | null;
  /** `threeColumn`: extra picture (device photo) in the third column. */
  secondaryImageUrl?: string | null;
};

const isChart = (c: unknown): c is Chart => !!c && typeof c === "object" && Array.isArray((c as Chart).categories) && (c as Chart).categories.length > 0;

function TextMedia({ variant, data: d, edit: e }: BlockProps<"textMedia">) {
  if (variant === "statement") {
    return (
      <Section>
        <div className="grid items-center gap-8 md:grid-cols-2">
          <div>{d.title && <p className="max-w-xl text-2xl font-medium leading-snug"><F e={e} k="title">{d.title}</F></p>}</div>
          {d.videoUrl && <FM e={e} k="videoUrl"><Video src={d.videoUrl} /></FM>}
        </div>
        {d.stats && d.stats.length > 0 && <div className="mt-16"><StatRow items={d.stats} render={(s, i, part) => <F e={e} k={`stats.${i}.${part}`}>{s[part]}</F>} /></div>}
        {d.body && <p className="mt-12 text-lg"><F e={e} k="body">{d.body}</F></p>}
        {d.link?.href && <div className="mt-6"><Btn href={d.link.href} variant="secondary"><F e={e} k="link.label" kh="link.href" kind="link">{d.link.label}</F></Btn></div>}
      </Section>
    );
  }
  if (variant === "links") {
    return (
      <div className="grid items-center gap-8 md:grid-cols-2">
        <div>
          <H2><F e={e} k="title">{d.title}</F></H2>
          <p className="mt-4 text-muted"><F e={e} k="body">{d.body}</F></p>
          <div className="mt-6 flex flex-wrap gap-3">
            {d.links?.map((l, j) => <Btn key={l.href} href={l.href} variant="secondary"><F e={e} k={`links.${j}.label`} kh={`links.${j}.href`} kind="link">{l.label}</F> →</Btn>)}
          </div>
        </div>
        {d.imageUrl ? <FM e={e} k="imageUrl"><Img src={d.imageUrl} className="w-full rounded" /></FM> : <div />}
      </div>
    );
  }
  const stats = d.stats?.filter((x) => x.value) ?? [];
  const chart = isChart(d.chart) ? d.chart : null;
  const hasMedia = stats.length > 0 || chart || d.videoUrl || d.imageUrl;
  const text = (
    <div>
      {d.eyebrow && <Eyebrow><F e={e} k="eyebrow">{d.eyebrow}</F></Eyebrow>}
      <H2><F e={e} k="title">{d.title}</F></H2>
      {d.body && <p className="mt-4 text-muted"><F e={e} k="body">{d.body}</F></p>}
      {d.footnote && <p className="mt-3 text-sm text-muted"><F e={e} k="footnote">{d.footnote}</F></p>}
      {d.link?.href && (
        <div className="mt-5">
          <Btn href={d.link.href} variant="secondary"><F e={e} k="link.label" kh="link.href" kind="link">{d.link.label}</F></Btn>
        </div>
      )}
    </div>
  );
  const media = hasMedia && (
    <div className="space-y-6">
      {stats.length > 0 && (
        <StatCircles
          items={stats}
          caption={d.statsCaption ? <F e={e} k="statsCaption">{d.statsCaption}</F> : undefined}
          render={(st, j, part) => <F e={e} k={`stats.${j}.${part}`}>{st[part]}</F>}
        />
      )}
      {chart && <BarChart chart={chart} />}
      {(d.videoUrl || d.imageUrl) && (
        <FM e={e} k="imageUrl" kv="videoUrl"><MediaBlock videoUrl={d.videoUrl} imageUrl={d.imageUrl} alt={d.title} /></FM>
      )}
    </div>
  );
  if (variant === "threeColumn") {
    const secondary = d.secondaryImageUrl && (
      <FM e={e} k="secondaryImageUrl"><Img src={d.secondaryImageUrl} className="mx-auto max-h-64 w-auto object-contain" /></FM>
    );
    return (
      <div className="grid items-center gap-8 md:grid-cols-[1.2fr_1fr_0.8fr]">
        {media}{text}{secondary}
      </div>
    );
  }
  return (
    <div className={`grid items-center gap-8 md:grid-cols-2 ${variant === "mediaLeft" ? "md:[&>*:first-child]:order-2" : ""}`}>
      {text}{media}
    </div>
  );
}

export const textMedia: BlockDef<"textMedia"> = {
  type: "textMedia",
  name: "Text and media",
  description: "Text next to media: an image, a video, key numbers or a chart.",
  category: "content",
  variants: [
    { id: "mediaRight", label: "Media right" },
    { id: "mediaLeft", label: "Media left" },
    { id: "threeColumn", label: "Three columns", description: "Media, text and a second image (device photo)" },
    { id: "links", label: "With link buttons", description: "On white, image on the right, several buttons" },
    { id: "statement", label: "Statement", description: "Large line and video, then key numbers, a closing line and a button" },
  ],
  fields: [
    { key: "eyebrow", label: "Eyebrow", kind: "text" },
    { key: "title", label: "Title", kind: "text", required: true },
    { key: "body", label: "Text", kind: "longText" },
    { key: "footnote", label: "Footnote", kind: "text" },
    { key: "link", label: "Button", kind: "link" },
    { key: "links", label: "Buttons (with link buttons)", kind: "links" },
    { key: "stats", label: "Key numbers", kind: "items" },
    { key: "statsCaption", label: "Numbers caption", kind: "text" },
    { key: "chart", label: "Chart", kind: "chart" },
    { key: "imageUrl", label: "Image", kind: "media" },
    { key: "videoUrl", label: "Video", kind: "media" },
    { key: "secondaryImageUrl", label: "Second image (three columns)", kind: "media" },
  ],
  example: {
    eyebrow: "Gain active",
    title: "Control",
    body: "Adjust the device during the procedure to match the clot and the vessel.",
    footnote: "Based on in-vitro testing.",
    link: { label: "See the data", href: "/style-guide#textMedia" },
    imageUrl: "/uploads/features/tt-distal-protection.jpg",
  },
  examples: {
    links: {
      title: "Sample direction",
      body: "A short description of a therapy area.",
      imageUrl: "/uploads/features/tt-distal-protection.jpg",
      links: [{ label: "First product", href: "/style-guide#textMedia" }, { label: "Second product", href: "/style-guide#textMediaB" }],
    },
    statement: {
      title: "A large statement about the problem the company solves.",
      videoUrl: "/uploads/duda/636q06j9Tiq4QNRHY6i7_tigerface-wide-v-7c2906.mp4",
      stats: [{ value: "00%", label: "Sample number" }, { value: "00", label: "Sample number" }, { value: "00K", label: "Sample number" }],
      body: "A closing line that leads to the button.",
      link: { label: "Request a demo", href: "/style-guide#textMedia" },
    },
    mediaLeft: {
      title: "Numbers instead of a picture",
      body: "Key numbers stand in for the picture when the proof is a figure.",
      stats: [
        { value: "40%", label: "Sample" },
        { value: "0%", label: "Sample" },
      ],
      statsCaption: "Sample numbers, not study results",
    },
    threeColumn: {
      title: "Visible under fluoroscopy",
      body: "The third column holds a device photo next to the main picture.",
      imageUrl: "/uploads/features/tt-visibility.jpg",
      secondaryImageUrl: "/uploads/features/tt-microcatheter.jpg",
    },
  },
  Component: TextMedia,
  stack: {
    group: (v) => (v === "statement" ? null : v === "links" ? "white" : "grey"),
    wrap: (rows, group) =>
      group === "white" ? (
        <Section>
          <div className="space-y-16">{rows}</div>
        </Section>
      ) : (
        <Section className="bg-surface">
          <div className="space-y-20">{rows}</div>
        </Section>
      ),
  },
};
