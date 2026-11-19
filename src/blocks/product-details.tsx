import Link from "next/link";
import { Section, Eyebrow } from "@/components/site/primitives";
import { safeHref, siteHref } from "@/lib/safe-path";
import { Tabs } from "@/components/site/Tabs";
import type { Block, BlockDef, BlockProps } from "./types";
import { Mark, listOf } from "./mark";

export type ProductDetailsVariant = "pills" | "underline";

/** Blocks under a small heading inside a tab ("Specifications"). */
export type BlockGroup = { group: string; blocks: Block[] };

export type DetailsTab = {
  id: string;
  label: string;
  /** Small heading at the top of the tab. */
  title?: string;
  /** Link tab: goes to another page instead of opening. */
  href?: string;
  blocks: (Block | BlockGroup)[];
};

/** A study of the product from the library of materials (ADR-009): design · N, the title, its main figure. */
export type StudyCard = { title: string; href: string; meta?: string | null; figure?: { value: string; label: string } | null };
export type CaseCard = { title: string; href: string; meta?: string | null };

export type ProductDetailsData = {
  anchor?: string;
  hint?: string;
  tabs: DetailsTab[];
  /** Filled from the product's materials (source `productMaterials`, docs/screens/therapy.md, 2026-11-19) */
  studies?: StudyCard[];
  cases?: CaseCard[];
  ifu?: { label: string; href: string } | null;
  publications?: number | null;
};

const cardCls = "block rounded border border-border p-5 hover:border-foreground";

function Studies({ items, all, count }: { items: StudyCard[]; all: string; count?: number | null }) {
  return (
    <div>
      <ul className="grid gap-6 md:grid-cols-3">
        {items.map((s) => (
          <li key={s.href}>
            <Link href={siteHref(s.href)} className={cardCls}>
              {s.meta && <div className="text-xs uppercase tracking-wide text-muted">{s.meta}</div>}
              <div className="mt-1 font-medium leading-snug">{s.title}</div>
              {s.figure && (
                <div className="mt-4">
                  <div className="text-3xl font-semibold tabular-nums">{s.figure.value}</div>
                  <div className="text-sm text-muted">{s.figure.label}</div>
                </div>
              )}
            </Link>
          </li>
        ))}
      </ul>
      <Link href={safeHref(all)} className="mt-6 inline-block font-medium underline">{count ? `All ${count} publications →` : "All publications →"}</Link>
    </div>
  );
}

function Cases({ items }: { items: CaseCard[] }) {
  return (
    <div className="mt-12">
      <Eyebrow>Clinical cases</Eyebrow>
      <ul className="mt-4 grid gap-6 md:grid-cols-3">
        {items.map((c) => (
          <li key={c.href}><Link href={siteHref(c.href)} className={cardCls}>{c.meta && <div className="text-xs uppercase tracking-wide text-muted">{c.meta}</div>}<div className="mt-1 font-medium">{c.title}</div></Link></li>
        ))}
      </ul>
    </div>
  );
}

const isGroup = (p: Block | BlockGroup): p is BlockGroup => "group" in p;

function ProductDetails({ variant, data: d, render }: BlockProps<"productDetails">) {
  const studies = d.studies ?? [];
  // a case the tab already links to by hand is not listed twice
  const practice = JSON.stringify(d.tabs.find((t) => t.id === "practice")?.blocks ?? []);
  const cases = (d.cases ?? []).filter((c) => !practice.includes(c.href));
  const ifu = d.ifu?.href ? <Link href={siteHref(d.ifu.href)} className="mt-6 inline-block font-medium underline">{d.ifu.label}</Link> : null;
  const hasSpecs = d.tabs.some((t) => t.id === "overview" && t.blocks.some((p) => isGroup(p) && /spec/i.test(p.group)));
  return (
    <Section id={d.anchor}>
      <Tabs
        hint={d.hint}
        variant={variant}
        tabs={d.tabs.map((t) =>
          // Clinical evidence: the product's studies on the page when the library has some, else the link to Evidence
          t.id === "evidence" && t.href && studies.length
            ? { id: t.id, label: t.label, content: <Studies items={studies} all={t.href} count={d.publications} /> }
          : t.href
            ? { id: t.id, label: t.label, content: null, href: t.href }
            : {
                id: t.id,
                label: t.label,
                content: (
                  <div>
                    {t.title && <Eyebrow>{t.title}</Eyebrow>}
                    {t.blocks.map((p, i) =>
                      isGroup(p) ? (
                        <div key={i} id={/spec/i.test(p.group) ? "specs" : undefined} className="mt-12 scroll-mt-20">
                          <Eyebrow>{p.group}</Eyebrow>
                          {p.blocks.map((b, j) => render(b, true, j))}
                          <ListEnd blocks={p.blocks} />
                          {/spec/i.test(p.group) && ifu}
                        </div>
                      ) : (
                        render(p, true, i)
                      ),
                    )}
                    <ListEnd blocks={t.blocks.flatMap((p) => (isGroup(p) ? [] : [p]))} />
                    {t.id === "overview" && !hasSpecs && ifu}
                    {t.id === "practice" && cases.length > 0 && <Cases items={cases} />}
                  </div>
                ),
              },
        )}
      />
    </Section>
  );
}

/** End of a list of sections inside a tab, for the page editor (the last section ends here). */
function ListEnd({ blocks }: { blocks: Block[] }) {
  const uid = blocks.find((b) => b.uid)?.uid;
  return uid ? <Mark i={-1} uid="end" l={listOf(uid)} /> : null;
}

export const productDetails: BlockDef<"productDetails"> = {
  type: "productDetails",
  name: "Product details",
  description: "Product tabs, each with its own blocks inside. An accordion on phones.",
  category: "content",
  variants: [
    { id: "pills", label: "Pills", description: "Tabs in a rounded bar" },
    { id: "underline", label: "Underline", description: "A line under the active tab" },
  ],
  fields: [
    { key: "hint", label: "Hint above the tabs", kind: "text" },
    { key: "tabs", label: "Tabs: label, title, blocks inside or a link", kind: "items", required: true },
  ],
  example: {
    hint: "Click on a tab below to learn more.",
    tabs: [
      {
        id: "overview",
        label: "Product overview",
        title: "Product overview",
        blocks: [
          { type: "text", variant: "default", data: { body: "Inside a tab any nestable block can be used: text, columns, diagram, spec table, buttons." } },
          { type: "columns", variant: "features", data: { items: [
            { title: "Active technology", body: "Adjustable radial force.", iconUrl: "/uploads/features/tt-active-technology.jpg" },
            { title: "Visibility", body: "Fully visible under fluoroscopy.", iconUrl: "/uploads/features/tt-visibility.jpg" },
          ] } },
          { group: "Specifications", blocks: [
            { type: "specTable", variant: "table", data: { table: { columns: ["Model", "Diameter"], rows: [["Sample model A", "1.0–2.0 mm"]] } } },
          ] },
          { type: "cta", variant: "buttons", data: { buttons: [{ label: "Order", href: "/style-guide#productDetails" }, { label: "IFU", href: "/style-guide#productDetails" }] } },
        ],
      },
      {
        id: "how",
        label: "How it works",
        title: "How it works",
        blocks: [{ type: "columns", variant: "steps", data: { items: [{ title: "Advance" }, { title: "Expand" }, { title: "Retrieve" }] } }],
      },
      { id: "evidence", label: "Clinical evidence", href: "/style-guide#productDetails", blocks: [] },
    ],
  },
  Component: ProductDetails,
};
