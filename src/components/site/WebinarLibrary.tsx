"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { ContactForm } from "./ContactForm";
import { Dialog, FilterChips, Row, Rows, Tag } from "./ui";

export type WebinarRow = {
  id: number;
  title: ReactNode;
  /** plain title: the request's topic */
  text: string;
  image?: ReactNode;
  /** «Mar 2025 · 45 min» */
  when?: string;
  by?: string;
  product?: string;
  productLabel?: string;
};

/** The filter shows itself from this many webinars on (decision 2026-11-23); coming from a therapy page it is always on. */
export const FILTER_FROM = 9;

/**
 * Webinars on the shared line (docs/screens/webinars.md): rows like the Evidence archive and the news — picture, date ·
 * length, title, speaker · event, product — and one action, «Request this recording», which opens a window with this
 * webinar and the request form. The product filter (the Evidence one) appears with enough webinars to need it.
 */
export function WebinarLibrary({ rows, initialProduct, defaultRegion, emptyLine, contactHref }: { rows: WebinarRow[]; initialProduct?: string; defaultRegion?: string; emptyLine: string; contactHref: string }) {
  const products = useMemo(() => {
    const m = new Map<string, { id: string; label: string; count: number }>();
    for (const r of rows) if (r.product) m.set(r.product, { id: r.product, label: r.productLabel ?? r.product, count: (m.get(r.product)?.count ?? 0) + 1 });
    return [...m.values()];
  }, [rows]);
  const [product, setProduct] = useState(initialProduct && products.some((p) => p.id === initialProduct) ? initialProduct : "");
  const [chosen, setChosen] = useState<WebinarRow | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => { if (chosen && dialog.current && !dialog.current.open) dialog.current.showModal(); }, [chosen]);

  if (rows.length === 0) {
    // nothing in this region yet (APAC on Duda had none): a line, not a gap — like «No upcoming events right now»
    return (
      <div>
        <p>{emptyLine}</p>
        <Link href={contactHref} className="mt-2 inline-block text-sm underline">Ask us about a recording →</Link>
      </div>
    );
  }
  const filter = products.length > 1 && (rows.length >= FILTER_FROM || !!initialProduct);
  const list = product ? rows.filter((r) => r.product === product) : rows;

  return (
    <div>
      {filter && <div className="mb-6"><FilterChips options={products} total={rows.length} value={product} onChange={setProduct} /></div>}
      <Rows>
        {list.map((w) => (
          <Row key={w.id} kind="media" lead={w.image} className="gap-y-3">
            {w.when && <div className="text-xs uppercase tracking-wide text-muted">{w.when}</div>}
            <h3 className="mt-1 font-medium">{w.title}</h3>
            {w.by && <div className="mt-1 text-sm text-muted">{w.by}</div>}
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
              {w.productLabel && <Tag>{w.productLabel}</Tag>}
              <button type="button" className="font-medium underline" onClick={() => setChosen(w)}>Request this recording</button>
            </div>
          </Row>
        ))}
      </Rows>

      <Dialog ref={dialog} labelledBy="webinar-request-title" onClose={() => setChosen(null)}>
        {chosen && (
          <div className="p-6 md:p-8">
            <div className="flex items-start justify-between gap-6">
              <div className="min-w-0">
                <div className="text-xs uppercase tracking-wide text-muted">Request this recording</div>
                <h2 id="webinar-request-title" className="mt-1 text-xl font-semibold">{chosen.text}</h2>
                {(chosen.by || chosen.when) && <p className="mt-1 text-sm text-muted">{[chosen.by, chosen.when].filter(Boolean).join(" · ")}</p>}
              </div>
              <button type="button" onClick={() => dialog.current?.close()} className="text-sm underline">Close</button>
            </div>
            <div className="mt-6 border-t border-border pt-6">
              <ContactForm key={chosen.id} form="webinar" topics={[chosen.text]} defaultTopic={chosen.text} defaultRegion={defaultRegion} compact />
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}
