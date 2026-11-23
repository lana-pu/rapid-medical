import type { Metadata } from "next";
import { Container, H1, H2, Eyebrow, Lead, Btn, KeyValue, SharedLine } from "@/components/site/primitives";
import { ComponentsKit, TokenSwatch } from "@/components/site/StyleGuideKit";
import { BLOCK_LIST } from "@/blocks/registry";
import { BlockList } from "@/blocks/render";
import type { Block, BlockCategory } from "@/blocks/types";

/**
 * The UI kit (DESIGN.md → Как устроено): foundations (tokens with their live values, type, layout), components in every
 * state, then every block in every variant on the sample data from the registry (no content from the database).
 * Internal: noindex, not in the sitemap, not linked from the menu. Spec: docs/spec.md → «Экраны».
 */
export const metadata: Metadata = { title: "UI kit – style guide", robots: { index: false, follow: false } };

const TOKENS: [string, string][] = [
  ["--background", "Page background"],
  ["--foreground", "Text"],
  ["--muted", "Secondary text"],
  ["--accent", "Primary button (brand colour later)"],
  ["--accent-foreground", "Text on the accent"],
  ["--surface", "Grey band, filled box"],
  ["--border", "Hairlines, field borders"],
  ["--danger", "Field error"],
  ["--inverse", "Dark band"],
  ["--inverse-foreground", "Text on a dark band"],
  ["--scrim", "Over video and photos, with opacity"],
  ["--map-sea", "Map: background"],
  ["--map-land", "Map: land"],
  ["--map-region", "Map: region under the pointer"],
  ["--map-pin", "Map: office"],
];

function KitPart({ id, label, children }: { id: string; label: string; children: React.ReactNode }) {
  return (
    <section id={id} className="border-t border-border">
      <Container className="py-10">
        <Eyebrow>{label}</Eyebrow>
        {children}
      </Container>
    </section>
  );
}

const CATEGORIES: { id: BlockCategory; label: string }[] = [
  { id: "content", label: "Content blocks" },
  { id: "list", label: "List blocks" },
  { id: "system", label: "System blocks" },
];

export default function StyleGuidePage() {
  return (
    <>
      <Container className="py-12 md:py-16">
        <H1>UI kit</H1>
        <p className="mt-4 max-w-2xl text-lg text-muted">
          The site&apos;s design system in code: the tokens, the components in every state, and every page block in every
          variant on sample content. The look is neutral on purpose: a brand changes the token values, not the pages.
        </p>
        <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium">
          <li><a href="#foundations" className="underline">Foundations</a></li>
          <li><a href="#components" className="underline">Components</a></li>
          <li><a href="#blocks" className="underline">Blocks</a></li>
        </ul>
      </Container>

      <KitPart id="foundations" label="Foundations">
        <H2>Colour tokens</H2>
        <p className="mt-2 max-w-2xl text-sm text-muted">globals.css → Tailwind utilities (bg-accent, text-muted, border-border…). The values are read from the page.</p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {TOKENS.map(([name, role]) => <TokenSwatch key={name} name={name} role={role} />)}
        </div>

        <H2 className="mt-12">Type</H2>
        <div className="mt-6 space-y-6">
          <div><div className="mb-1 text-xs text-muted">H1 · page</div><H1>Webinars</H1></div>
          <div><div className="mb-1 text-xs text-muted">H1 · long (a material&apos;s title)</div><H1 size="long">Rapid Medical announces FDA clearance of a sample device</H1></div>
          <div><div className="mb-1 text-xs text-muted">H2</div><H2>All publications</H2></div>
          <div><div className="mb-1 text-xs text-muted">H3 · a card, a row</div><h3 className="text-lg font-semibold">Sample card title</h3></div>
          <div><div className="mb-1 text-xs text-muted">Eyebrow</div><Eyebrow>Clinical evidence</Eyebrow></div>
          <div><div className="mb-1 text-xs text-muted">Lead</div><Lead>A lead paragraph under a page title, in the secondary colour.</Lead></div>
          <div><div className="mb-1 text-xs text-muted">Body · small · caption</div><p>Body text.</p><p className="text-sm">Small text.</p><p className="text-xs text-muted">Caption, meta line.</p></div>
        </div>

        <H2 className="mt-12">Layout</H2>
        <p className="mt-2 max-w-2xl text-sm text-muted">Container max-w-6xl with px-4; a section py-12 → md:py-16. «Shared line»: a hairline, the name on the left (4/12), the content on the right (7/12).</p>
        <div className="mt-6">
          <SharedLine title="Shared line" aside="aside: 8 roles">
            <KeyValue rows={[{ label: "Phone", value: "+1 000 000 0000" }, { label: "Email", value: "sample@example.com" }]} footer={<a href="#foundations" className="text-sm underline">Key — value: the last row is a link</a>} />
          </SharedLine>
        </div>
      </KitPart>

      <KitPart id="components" label="Components">
        <H2>Links that look like buttons (Btn)</H2>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Btn href="#components">Primary link</Btn>
          <Btn href="#components" variant="secondary">Secondary link</Btn>
          <Btn href="#components" size="sm">Small</Btn>
        </div>
        <div className="mt-8"><ComponentsKit /></div>
      </KitPart>

      <Container className="pt-10" >
        <div id="blocks" className="scroll-mt-16"><Eyebrow>Blocks</Eyebrow></div>
        <ul className="mt-2 flex flex-wrap gap-x-6 gap-y-2 text-sm">
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
                      {/* the demo's «Add section» copies a new section from here (no server in the static build) */}
                      <div data-rm-preset={`${d.type}:${v.id}`}>
                        <BlockList blocks={[block]} />
                      </div>
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
