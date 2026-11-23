import type { ReactNode } from "react";
import { E, EMedia, type EKind } from "@/components/site/editable";
import { fieldPath, type EditBinding } from "./bind";

export type { EditBinding };

/** Editable text / rich / link field of a block. Renders children untouched when not editable. */
export function F({ e, k, kh, kind, className, children }: { e?: EditBinding; k: string; kh?: string; kind?: EKind; className?: string; children?: ReactNode }) {
  const f = fieldPath(e, k);
  if (!e || f === null) return <>{children}</>;
  const fh = kh ? (fieldPath(e, kh) ?? undefined) : undefined;
  return (
    <E r={e.r} id={e.id} f={f} k={kind} fh={fh} className={className}>
      {children}
    </E>
  );
}

/**
 * Editable image (+ optional video) slot of a block.
 * `cover`: the media is a band's background (absolutely placed): in the editor the slot covers the band, so the
 * background stays where it is (`!` wins over the editor's own `.rm-e-media{position:relative}`). Visitors get no wrapper.
 */
export function FM({ e, k, kv, cover, className, children }: { e?: EditBinding; k: string; kv?: string; cover?: boolean; className?: string; children?: ReactNode }) {
  const f = fieldPath(e, k);
  if (!e || f === null) return <>{children}</>;
  const fv = kv ? (fieldPath(e, kv) ?? undefined) : undefined;
  return (
    <EMedia r={e.r} id={e.id} f={f} fv={fv} className={cover ? `absolute! inset-0 ${className ?? ""}` : className}>
      {children}
    </EMedia>
  );
}
