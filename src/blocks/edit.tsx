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

/** Editable image (+ optional video) slot of a block. */
export function FM({ e, k, kv, className, children }: { e?: EditBinding; k: string; kv?: string; className?: string; children?: ReactNode }) {
  const f = fieldPath(e, k);
  if (!e || f === null) return <>{children}</>;
  const fv = kv ? (fieldPath(e, kv) ?? undefined) : undefined;
  return (
    <EMedia r={e.r} id={e.id} f={f} fv={fv} className={className}>
      {children}
    </EMedia>
  );
}
