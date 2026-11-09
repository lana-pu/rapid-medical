import type { ActionLink, Chart, Stat } from "@/db/schema";
import { Section, H2, Btn, Img, Eyebrow } from "@/components/site/primitives";
import { MediaBlock } from "@/components/site/Media";
import { StatCircles } from "@/components/site/blocks/Stats";
import { BarChart } from "@/components/site/blocks/BarChart";
import { F, FM } from "./edit";
import type { BlockDef, BlockProps } from "./types";

export type TextMediaVariant = "mediaRight" | "mediaLeft" | "threeColumn";

/** Same shape as a stored `Benefit` row. Media shows, in order: key numbers, chart, video or image. */
export type TextMediaData = {
  eyebrow?: string | null;
  title: string;
  body?: string | null;
  footnote?: string | null;
  link?: ActionLink | null;
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
  ],
  fields: [
    { key: "eyebrow", label: "Eyebrow", kind: "text" },
    { key: "title", label: "Title", kind: "text", required: true },
    { key: "body", label: "Text", kind: "longText" },
    { key: "footnote", label: "Footnote", kind: "text" },
    { key: "link", label: "Button", kind: "link" },
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
  stack: (rows) => (
    <Section className="bg-surface">
      <div className="space-y-20">{rows}</div>
    </Section>
  ),
};
