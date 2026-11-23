"use client";

import { useState, type ReactNode } from "react";
import { safeHref } from "@/lib/safe-path";
import { Button, Rows, Row } from "../ui";

/** `href` comes ready (base path added by the block); here it is only checked again. */
export type FeedRow = { id: number; date: string; title: ReactNode; meta?: string | null; href: string; external?: boolean };

/** Material rows (DESIGN.md → «Строка материала»): date in its own column, title, kind and source; «Show more». */
export function NewsFeed({ items, pageSize = 10 }: { items: FeedRow[]; pageSize?: number }) {
  const [shown, setShown] = useState(pageSize);
  return (
    <div>
      <Rows>
        {items.slice(0, shown).map((n) => (
          <Row key={n.id} lead={n.date}>
            <a href={safeHref(n.href)} {...(n.external ? { target: "_blank", rel: "noopener noreferrer" } : {})} className="font-medium hover:underline">{n.title}</a>
            {(n.meta || n.external) && <div className="mt-1 text-xs text-muted">{[n.meta, n.external ? "↗" : null].filter(Boolean).join(" ")}</div>}
          </Row>
        ))}
      </Rows>
      {shown < items.length && (
        <Button variant="secondary" size="lg" block onClick={() => setShown((s) => s + pageSize)} className="mt-6">
          Show more
        </Button>
      )}
    </div>
  );
}
