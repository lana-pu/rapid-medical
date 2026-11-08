import { Section, Img } from "@/components/site/primitives";
import { MediaBlock } from "@/components/site/Media";
import { FeatureGrid } from "@/components/site/blocks/Blocks";
import { F, FM } from "./edit";
import type { BlockDef, BlockProps } from "./types";

export type ColumnsVariant = "steps" | "features";

export type ColumnItem = { title: string; body?: string; iconUrl?: string; imageUrl?: string; videoUrl?: string };

export type ColumnsData = {
  items: ColumnItem[];
  /** `features`, old format: one picture with the features baked in, shown when there are no items. */
  legacyImageUrl?: string | null;
};

function Columns({ variant, data: d, edit: e, nested }: BlockProps<"columns">) {
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
    inner = <div className="mt-8"><FeatureGrid items={items} render={(f, j, part) => <F e={e} k={`items.${j}.${part}`}>{d.items[j][part]}</F>} /></div>;
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
  description: "Several similar items in columns: steps, features.",
  category: "content",
  nestable: true,
  variants: [
    { id: "steps", label: "Steps with media", description: "Numbered automatically, video or image under each step, 3 columns" },
    { id: "features", label: "Features with icons", description: "Icon, title, text, 2 columns" },
  ],
  fields: [
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
