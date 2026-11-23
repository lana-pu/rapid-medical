import { youtubeId } from "@/lib/html";
import { lookupMedia } from "@/lib/media-lookup";
import { Img } from "./primitives";

/**
 * Media primitives. Video backgrounds autoplay muted; inline videos get
 * controls. Replace styling freely – the markup is intentionally plain.
 */

export async function Video({ src, poster, className = "", background = false }: { src?: string | null; poster?: string | null; className?: string; background?: boolean }) {
  if (!src) return null;
  if (!poster) poster = (await lookupMedia([src])).get(src)?.posterUrl ?? null;
  if (background)
    return <video className={`pointer-events-none absolute inset-0 h-full w-full object-cover ${className}`} src={src} poster={poster ?? undefined} autoPlay muted loop playsInline aria-hidden preload="metadata" />;
  return <video className={`w-full rounded ${className}`} src={src} poster={poster ?? undefined} autoPlay muted loop playsInline controls preload="metadata" />;
}

/** Image, video or YouTube – whichever is set. Video wins over image. */
export function MediaBlock({ imageUrl, videoUrl, alt = "", className = "" }: { imageUrl?: string | null; videoUrl?: string | null; alt?: string; className?: string }) {
  if (videoUrl) {
    const yt = youtubeId(videoUrl);
    if (yt) return <Embed url={videoUrl} className={className} />;
    return <Video src={videoUrl} poster={imageUrl} className={className} />;
  }
  // library pictures get their variants and description (docs/screens/admin-media.md → «Описание на сайте»)
  if (imageUrl) return <Img src={imageUrl} alt={alt} className={`w-full rounded ${className}`} />;
  return <div className={`aspect-[4/3] w-full rounded bg-surface ${className}`} aria-hidden />;
}

export function Embed({ url, className = "" }: { url: string; className?: string }) {
  const id = youtubeId(url);
  const src = id ? `https://www.youtube.com/embed/${id}` : url;
  return (
    <div className={`relative aspect-video w-full overflow-hidden rounded ${className}`}>
      <iframe
        src={src}
        title="Video"
        className="absolute inset-0 h-full w-full"
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}

/**
 * Section with an optional background video and a dark overlay for legibility.
 * `media` wraps the background (video + overlay) when there is one — the on-page editor's media slot.
 */
export function VideoHero({ videoUrl, poster, children, className = "", media }: { videoUrl?: string | null; poster?: string | null; children: React.ReactNode; className?: string; media?: (background: React.ReactNode) => React.ReactNode }) {
  const background = (
    <>
      <Video src={videoUrl} poster={poster} background />
      {videoUrl && <div className="absolute inset-0 bg-scrim/50" aria-hidden />}
    </>
  );
  return (
    <section className={`relative overflow-hidden ${videoUrl ? "bg-inverse text-inverse-foreground" : "border-b border-border"} ${className}`}>
      {videoUrl && media ? media(background) : background}
      <div className="relative">{children}</div>
    </section>
  );
}
