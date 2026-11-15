"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { safeHref } from "@/lib/safe-path";

export type LibraryRow = {
  id: number;
  title: ReactNode;
  /** plain title, for the search */
  text: string;
  journal?: string | null;
  authors?: string | null;
  date: number;
  year: string;
  url?: string | null;
  doi?: string | null;
  pdfUrl?: string | null;
  product: string;
  productLabel: string;
  /** the publication's own page */
  page?: string | null;
};

const PAGE = 20;
const fold = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** «Salem MM, Khalife J, …» → «Salem MM et al.»; one author stays as is. */
export function firstAuthor(authors: string | null | undefined): string {
  const list = (authors ?? "").split(/,|;/).map((a) => a.trim()).filter(Boolean);
  if (list.length === 0) return "";
  // affiliation numbers copied with the names («Zain Tariq 1») are not part of the name
  const first = list[0].replace(/(\s*\d+[*†‡]*)+$/, "");
  return list.length > 1 ? `${first} et al.` : first;
}

/**
 * Evidence archive (DESIGN.md → Evidence): search, product filter with counts, sort, rows — year · title · first author
 * et al. · journal · product · Read / PDF; «Show more». A product's anchor (#tigertriever, from therapy pages) opens it
 * filtered.
 */
export function PublicationLibrary({ rows, products }: { rows: LibraryRow[]; products: { id: string; label: string; count: number }[] }) {
  const [q, setQ] = useState("");
  const [product, setProduct] = useState("");
  const [sort, setSort] = useState<"new" | "old">("new");
  const [shown, setShown] = useState(PAGE);
  const [open, setOpen] = useState<number | null>(null);

  useEffect(() => {
    // Product ids are plain slugs: the hash is compared as is (no decoding — a malformed «%» must not throw).
    const fromHash = () => {
      const id = window.location.hash.slice(1);
      if (products.some((p) => p.id === id)) {
        setProduct(id);
        setShown(PAGE);
      }
    };
    fromHash();
    window.addEventListener("hashchange", fromHash);
    return () => window.removeEventListener("hashchange", fromHash);
  }, [products]);

  const list = useMemo(() => {
    const words = fold(q).split(/\s+/).filter(Boolean);
    const hit = (r: LibraryRow) => {
      const hay = fold([r.text, r.authors, r.journal].filter(Boolean).join(" "));
      return words.every((w) => hay.includes(w));
    };
    return rows.filter((r) => (!product || r.product === product) && hit(r)).sort((a, b) => (sort === "new" ? b.date - a.date : a.date - b.date));
  }, [rows, q, product, sort]);

  const chip = (on: boolean) => `rounded-full border px-3 py-1.5 text-sm ${on ? "border-foreground bg-foreground text-background" : "border-border hover:border-foreground"}`;
  const input = "rounded border border-border bg-background px-3 py-2 text-sm focus:border-foreground focus:outline-none";

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <input type="search" value={q} onChange={(e) => { setQ(e.target.value); setShown(PAGE); }} placeholder="Search title, author, journal" aria-label="Search publications" className={`${input} min-w-0 flex-1 basis-64`} />
        <select value={sort} onChange={(e) => setSort(e.target.value as "new" | "old")} aria-label="Sort" className={input}>
          <option value="new">Newest first</option>
          <option value="old">Oldest first</option>
        </select>
      </div>
      {products.length > 1 && (
        <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Product">
          {[{ id: "", label: "All", count: rows.length }, ...products].map((p) => (
            <button key={p.id || "all"} type="button" aria-pressed={product === p.id} className={chip(product === p.id)} onClick={() => { setProduct(p.id); setShown(PAGE); }}>
              {p.label} <span className="opacity-60">{p.count}</span>
            </button>
          ))}
        </div>
      )}

      <p className="mt-4 text-xs text-muted" aria-live="polite">
        {list.length === 0 ? "Nothing found. Try fewer words or another product." : `Showing ${Math.min(shown, list.length)} of ${list.length}`}
      </p>

      <ul className="mt-2 divide-y divide-border border-y border-border">
        {list.slice(0, shown).map((p) => {
          const short = firstAuthor(p.authors);
          const more = !!p.authors && short !== p.authors.trim();
          return (
            <li key={p.id} className="grid gap-x-6 gap-y-1 py-4 sm:grid-cols-[4rem_minmax(0,1fr)]">
              <span className="text-sm text-muted">{p.year}</span>
              <div className="min-w-0">
                <div className="font-medium">{p.page ? <a href={p.page} className="hover:underline">{p.title}</a> : p.title}</div>
                {(short || p.journal) && (
                  <div className="mt-1 text-sm text-muted">
                    {open === p.id ? p.authors : short}
                    {short && p.journal ? " · " : ""}
                    {p.journal}
                    {more && (
                      <button type="button" onClick={() => setOpen(open === p.id ? null : p.id)} aria-expanded={open === p.id} className="ml-2 text-xs underline">
                        {open === p.id ? "Fewer authors" : "All authors"}
                      </button>
                    )}
                  </div>
                )}
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                  <span className="rounded-full border border-border px-2 py-0.5 text-xs">{p.productLabel}</span>
                  {p.url && <a href={safeHref(p.url)} target="_blank" rel="noopener noreferrer" className="underline">{p.doi ? `doi:${p.doi}` : "Read"} ↗</a>}
                  {p.pdfUrl && <a href={safeHref(p.pdfUrl)} target="_blank" rel="noopener noreferrer" className="underline">Download PDF</a>}
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      {shown < list.length && (
        <button type="button" onClick={() => setShown((s) => s + PAGE)} className="mt-6 w-full rounded border border-border px-5 py-2.5 text-sm font-medium hover:border-foreground">
          Show more
        </button>
      )}
    </div>
  );
}
