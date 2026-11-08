import { Container } from "@/components/site/primitives";
import { Embed, Video as VideoFile } from "@/components/site/Media";
import { F } from "./edit";
import type { BlockDef, BlockProps } from "./types";

export type VideoVariant = "band";

export type VideoData = {
  title?: string | null;
  /** `.mp4` plays as the band background; other URLs (YouTube) embed under the title. */
  url?: string | null;
};

function VideoBand({ data: d, edit: e }: BlockProps<"video">) {
  const isFile = !!d.url && /\.mp4(\?|$)/i.test(d.url);
  return (
    <section className="relative overflow-hidden bg-neutral-900 py-16 text-white md:py-24">
      {isFile && <VideoFile src={d.url} background />}
      <Container className="relative text-center">
        {d.title && <h2 className="text-2xl font-medium md:text-3xl"><F e={e} k="title">{d.title}</F></h2>}
        {d.url && !isFile && <div className="mx-auto mt-10 max-w-3xl"><Embed url={d.url} /></div>}
      </Container>
    </section>
  );
}

export const video: BlockDef<"video"> = {
  type: "video",
  name: "Video",
  description: "A video with a title on a dark band.",
  category: "content",
  variants: [{ id: "band", label: "Dark band", description: "A file plays in the background, a YouTube link as a player under the title" }],
  fields: [
    { key: "title", label: "Title", kind: "text" },
    { key: "url", label: "Video: file or YouTube link", kind: "media", required: true },
  ],
  example: {
    title: "See the device in action",
    url: "/uploads/duda/636q06j9Tiq4QNRHY6i7_tigerface-wide-v-7c2906.mp4",
  },
  Component: VideoBand,
};
