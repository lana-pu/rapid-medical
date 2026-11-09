import { safeHtml } from "@/lib/html";
import { Container, Prose } from "@/components/site/primitives";
import { F } from "./edit";
import type { BlockDef, BlockProps } from "./types";

export type IndicationsVariant = "default";

export type IndicationsData = { indicationsHtml?: string | null; referencesHtml?: string | null };

function Indications({ data: d, edit: e }: BlockProps<"indications">) {
  if (!d.indicationsHtml && !d.referencesHtml) return null;
  return (
    <section className="border-t border-border py-10">
      <Container>
        {d.indicationsHtml && <F e={e} k="indicationsHtml" kind="rich"><Prose html={safeHtml(d.indicationsHtml)} className="prose-rm-sm max-w-4xl" /></F>}
        {d.referencesHtml && <F e={e} k="referencesHtml" kind="rich" className="mt-6"><Prose html={safeHtml(d.referencesHtml)} className="prose-rm-sm max-w-4xl" /></F>}
      </Container>
    </section>
  );
}

export const indications: BlockDef<"indications"> = {
  type: "indications",
  name: "Indications and references",
  description: "Regulatory text and references at the end of the page.",
  category: "system",
  pinned: true,
  variants: [{ id: "default", label: "Small print under a rule" }],
  fields: [
    { key: "indicationsHtml", label: "Indications and warnings", kind: "rich" },
    { key: "referencesHtml", label: "References", kind: "rich" },
  ],
  example: {
    indicationsHtml: "<p><strong>Indications for use.</strong> Example regulatory text. The real text is set per region and is not editable from page presets.</p>",
    referencesHtml: "<ol><li>Example A, et al. Journal of Examples. 2024.</li><li>Example B, et al. Example Review. 2025.</li></ol>",
  },
  Component: Indications,
};
