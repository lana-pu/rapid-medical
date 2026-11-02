import type { ReactNode } from "react";
import { isEditing } from "@/lib/editing";

/**
 * On-page editor hooks. Wrap a rendered field in <E> (text / rich HTML /
 * link) or <EMedia> (image / video). Outside editor mode they render their
 * children untouched; in editor mode they add a `data-e` attribute that the
 * client overlay turns into click-to-edit.
 *
 *   <E r="solutions" id={s.id} f="heroTitle">{s.heroTitle}</E>
 *   <E r="settings:home" f="stats.0.value">{v}</E>
 *   <EMedia r="solutions" id={s.id} f="benefits.0.imageUrl" fv="benefits.0.videoUrl"><MediaBlock … /></EMedia>
 */
export type EKind = "text" | "rich" | "link";

type Base = { r: string; id?: number; f: string; children?: ReactNode; className?: string };

export async function E({ r, id = 0, f, k = "text", fh, as, children, className }: Base & { k?: EKind; /** href path for k="link" */ fh?: string; as?: "span" | "div" }) {
  if (!(await isEditing())) return <>{children}</>;
  const Tag = as ?? (k === "rich" ? "div" : "span");
  return (
    <Tag data-e={JSON.stringify({ r, id, f, k, fh })} className={className}>
      {children}
    </Tag>
  );
}

/** Image and/or video slot. `f` = image url path, `fv` = video url path (optional). */
export async function EMedia({ r, id = 0, f, fv, children, className = "" }: Base & { fv?: string }) {
  if (!(await isEditing())) return <>{children}</>;
  return (
    <div data-e={JSON.stringify({ r, id, f, fv, k: "media" })} className={`rm-e-media ${className}`}>
      {children}
    </div>
  );
}
