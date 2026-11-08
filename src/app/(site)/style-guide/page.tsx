import type { Metadata } from "next";
import { Container, H1, H2, Eyebrow } from "@/components/site/primitives";
import { BLOCK_LIST } from "@/blocks/registry";
import { BlockList } from "@/blocks/render";
import type { Block, BlockCategory } from "@/blocks/types";

/**
 * Style guide: every block in every variant, on the sample data from the
 * registry (no content from the database). Internal: noindex, not in the
 * sitemap, not linked from the menu. Spec: docs/spec.md → «Экраны».
 */
export const metadata: Metadata = { title: "Blocks – style guide", robots: { index: false, follow: false } };

const CATEGORIES: { id: BlockCategory; label: string }[] = [
  { id: "content", label: "Content blocks" },
  { id: "list", label: "List blocks" },
  { id: "system", label: "System blocks" },
];

export default function StyleGuidePage() {
  return (
    <>
      <Container className="py-12 md:py-16">
        <H1>Blocks</H1>
        <p className="mt-4 max-w-2xl text-lg text-muted">
          Every page block in every variant, on sample content. A variant is a setting of the block, not a separate block.
        </p>
        <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm">
          {BLOCK_LIST.map((d) => (
            <li key={d.type}>
              <a href={`#${d.type}`} className="underline">{d.name}</a> <span className="text-muted">{d.variants.length}</span>
            </li>
          ))}
        </ul>
      </Container>

      {CATEGORIES.map((c) => {
        const defs = BLOCK_LIST.filter((d) => d.category === c.id);
        if (!defs.length) return null;
        return (
          <div key={c.id}>
            <Container className="pt-8">
              <Eyebrow>{c.label}</Eyebrow>
            </Container>
            {defs.map((d) => (
              <section key={d.type} id={d.type} className="border-t border-border">
                <Container className="py-8">
                  <H2>{d.name}</H2>
                  <p className="mt-2 max-w-2xl text-muted">{d.description}</p>
                  <p className="mt-2 text-sm text-muted">
                    {[`type: ${d.type}`, d.nestable && "can go inside Product details", d.pinned && "pinned: editors cannot move or remove it"].filter(Boolean).join(" · ")}
                  </p>
                  <details className="mt-3 text-sm">
                    <summary className="cursor-pointer">Fields</summary>
                    <ul className="mt-2 space-y-1">
                      {d.fields.map((f) => (
                        <li key={f.key}>
                          <code>{f.key}</code> — {f.label}
                          {f.required ? " (required)" : ""}
                          <span className="text-muted"> · {f.kind}{f.note ? ` · ${f.note}` : ""}</span>
                        </li>
                      ))}
                    </ul>
                  </details>
                </Container>
                {d.variants.map((v) => {
                  const examples = d.examples as Partial<Record<string, Block["data"]>> | undefined;
                  const block = { type: d.type, variant: v.id, data: examples?.[v.id] ?? d.example } as Block;
                  return (
                    <div key={v.id} className="pb-8">
                      <Container className="pb-3">
                        <div className="text-sm">
                          <span className="font-semibold">{v.label}</span> <code className="text-muted">{v.id}</code>
                          {v.description && <span className="text-muted"> — {v.description}</span>}
                        </div>
                      </Container>
                      <BlockList blocks={[block]} />
                    </div>
                  );
                })}
              </section>
            ))}
          </div>
        );
      })}
    </>
  );
}
