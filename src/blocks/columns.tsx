import Link from "next/link";
import { Section, H2, Img } from "@/components/site/primitives";
import { MediaBlock } from "@/components/site/Media";
import { FeatureGrid, Principles } from "@/components/site/blocks/Blocks";
import { F, FM } from "./edit";
import type { BlockDef, BlockProps } from "./types";

export type ColumnsVariant = "steps" | "features" | "principles" | "cards";

export type ColumnItem = { title: string; body?: string; iconUrl?: string; imageUrl?: string; videoUrl?: string; /** `cards` */ eyebrow?: string; href?: string; /** `cards`: one emphasised line under the text (proof point) */ note?: string; /** `cards`: a second link under the card's own («N publications →»); the card then links by its «Explore →» */ more?: { label: string; href: string } | null };

export type ColumnsData = {
  /** `principles`: heading, text and a picture above the columns. */
  title?: string | null;
  intro?: string | null;
  imageUrl?: string | null;
  items: ColumnItem[];
  /** `features`, old format: one picture with the features baked in, shown when there are no items. */
  legacyImageUrl?: string | null;
};

function Columns({ variant, data: d, edit: e, nested }: BlockProps<"columns">) {
  if (variant === "principles") {
    return (
      <Section className="bg-surface">
        {d.title && <H2><F e={e} k="title">{d.title}</F></H2>}
        {d.intro && <p className="mt-3 text-muted"><F e={e} k="intro">{d.intro}</F></p>}
        {d.imageUrl && <FM e={e} k="imageUrl" className="mx-auto mt-8 max-w-xl"><Img src={d.imageUrl} className="w-full" /></FM>}
        {d.items.length > 0 && <div className="mt-10"><Principles items={d.items.map((p) => ({ title: p.title, body: p.body ?? "" }))} render={(i, part) => <F e={e} k={`items.${i}.${part}`}>{d.items[i][part]}</F>} /></div>}
      </Section>
    );
  }
  if (variant === "cards") {
    return (
      <Section>
        {d.title && <H2><F e={e} k="title">{d.title}</F></H2>}
        <ul className={`grid gap-6 md:grid-cols-2 lg:grid-cols-3 ${d.title ? "mt-6" : ""}`}>
          {d.items.map((c, i) => {
            const k = (part: string) => `items.${i}.${part}`;
            // the card's own link: its title is the label, `href` the address
            const title = <F e={e} k={k("title")} kh={k("href")} kind="link">{c.title}</F>;
            return (
            <li key={i}>
              {c.more ? (
                // two links: the card's page and the publications about it (DESIGN.md → Обзор терапий)
                <div className="flex h-full flex-col overflow-hidden rounded border border-border">
                  {c.imageUrl && <FM e={e} k={k("imageUrl")}><Img src={c.imageUrl} className="aspect-[4/3] w-full object-cover" /></FM>}
                  <div className="flex flex-1 flex-col p-6">
                    {c.eyebrow && <div className="text-xs font-semibold uppercase tracking-widest text-muted"><F e={e} k={k("eyebrow")}>{c.eyebrow}</F></div>}
                    <h3 className="mt-1 text-xl font-medium"><Link href={c.href ?? "#"} className="hover:underline">{title}</Link></h3>
                    {c.body && <p className="mt-2 text-sm text-muted"><F e={e} k={k("body")}>{c.body}</F></p>}
                    {c.note && <p className="mt-3 text-sm font-medium"><F e={e} k={k("note")}>{c.note}</F></p>}
                    <div className="mt-auto flex flex-wrap gap-x-6 gap-y-2 pt-6 text-sm">
                      <Link href={c.href ?? "#"} className="font-medium underline" aria-label={`Explore ${c.title}`}>Explore →</Link>
                      <Link href={c.more.href} className="underline"><F e={e} k={k("more.label")} kh={k("more.href")} kind="link">{c.more.label}</F></Link>
                    </div>
                  </div>
                </div>
              ) : (
              <Link href={c.href ?? "#"} className="group block h-full overflow-hidden rounded border border-border hover:bg-surface">
                {c.imageUrl && <FM e={e} k={k("imageUrl")}><Img src={c.imageUrl} className="aspect-video w-full object-cover" /></FM>}
                <div className="p-6">
                  {c.eyebrow && <div className="text-xs font-semibold uppercase tracking-widest text-muted"><F e={e} k={k("eyebrow")}>{c.eyebrow}</F></div>}
                  <h3 className="mt-1 text-xl font-medium group-hover:underline">{title}</h3>
                  {c.body && <p className="mt-2 text-sm text-muted"><F e={e} k={k("body")}>{c.body}</F></p>}
                  {c.note && <p className="mt-3 text-sm font-medium"><F e={e} k={k("note")}>{c.note}</F></p>}
                </div>
              </Link>
              )}
            </li>
            );
          })}
        </ul>
      </Section>
    );
  }
  let inner;
  if (variant === "steps") {
    inner = (
      <ol className="grid gap-6 md:grid-cols-3">
        {d.items.map((st, i) => (
          <li key={i}>
            <div className="mb-3 text-sm"><span className="font-semibold text-accent">{i + 1}. <F e={e} k={`items.${i}.title`}>{st.title}</F></span>{st.body && <span className="text-muted"> <F e={e} k={`items.${i}.body`}>{st.body}</F></span>}</div>
            {(st.videoUrl || st.imageUrl) && <FM e={e} k={`items.${i}.imageUrl`} kv={`items.${i}.videoUrl`}><MediaBlock videoUrl={st.videoUrl} imageUrl={st.imageUrl} className="aspect-video object-cover" /></FM>}
          </li>
        ))}
      </ol>
    );
  } else if (d.items.length > 0) {
    const items = d.items.map((f) => ({ ...f, body: f.body ?? "" }));
    inner = (
      <div className="mt-8">
        <FeatureGrid
          items={items}
          render={(f, j, part) => <F e={e} k={`items.${j}.${part}`}>{d.items[j][part]}</F>}
          icon={(img, j) => <FM e={e} k={`items.${j}.iconUrl`} className="flex-none">{img}</FM>}
        />
      </div>
    );
  } else if (d.legacyImageUrl) {
    inner = <FM e={e} k="legacyImageUrl" className="mt-8"><Img src={d.legacyImageUrl} className="w-full rounded" /></FM>;
  } else {
    return null;
  }
  return nested ? inner : <Section>{inner}</Section>;
}

export const columns: BlockDef<"columns"> = {
  type: "columns",
  name: "Columns",
  description: "Several similar items in columns: steps, features, principles, link cards.",
  category: "content",
  nestable: true,
  variants: [
    { id: "steps", label: "Steps with media", description: "Numbered automatically, video or image under each step, 3 columns" },
    { id: "features", label: "Features with icons", description: "Icon, title, text, 2 columns" },
    { id: "principles", label: "Principles", description: "Grey band, first letter highlighted, optional picture above" },
    { id: "cards", label: "Link cards", description: "Bordered cards that link to a page: optional heading above, picture, text and a proof line; up to 3 columns" },
  ],
  fields: [
    { key: "title", label: "Title (principles, cards)", kind: "text" },
    { key: "intro", label: "Intro (principles)", kind: "longText" },
    { key: "imageUrl", label: "Picture (principles)", kind: "media" },
    { key: "items", label: "Items: title (required), text, icon or media", kind: "items", required: true },
    { key: "legacyImageUrl", label: "Image instead of the list (old format)", kind: "media" },
  ],
  example: {
    items: [
      { title: "Advance", body: "Deliver the device through the microcatheter.", imageUrl: "/uploads/features/tt-microcatheter.jpg" },
      { title: "Expand", body: "Adjust the radial force to engage the clot.", imageUrl: "/uploads/features/tt-active-technology.jpg" },
      { title: "Retrieve", body: "Withdraw the device with the clot captured.", imageUrl: "/uploads/features/tt-distal-protection.jpg" },
    ],
  },
  examples: {
    principles: {
      title: "Sample principles",
      intro: "A short line above the columns.",
      items: [
        { title: "Respect", body: "Sample text." },
        { title: "Agility", body: "Sample text." },
        { title: "Passion", body: "Sample text." },
        { title: "Integrity", body: "Sample text." },
        { title: "Drive", body: "Sample text." },
      ],
    },
    cards: {
      title: "Sample group",
      items: [
        { eyebrow: "Sample product", title: "Sample card title", body: "One line about the page.", note: "Sample proof point", href: "/style-guide#columns" },
        { eyebrow: "Sample product", title: "Another card title", href: "/style-guide#columns" },
      ],
    },
    features: {
      items: [
        { title: "Active technology", body: "Adjustable radial force during the procedure.", iconUrl: "/uploads/features/comaneci-active-technology.jpg" },
        { title: "Low profile", body: "Compatible with small microcatheters.", iconUrl: "/uploads/features/comaneci-low-profile.jpg" },
        { title: "Non-occlusive", body: "Blood keeps flowing while the device is open.", iconUrl: "/uploads/features/comaneci-non-occlusive.jpg" },
        { title: "Visibility", body: "Fully visible under fluoroscopy.", iconUrl: "/uploads/features/comaneci-visibility.jpg" },
      ],
    },
  },
  Component: Columns,
};
