import type { ActionLink } from "@/db/schema";
import { Section, Container, Btn } from "@/components/site/primitives";
import { F } from "./edit";
import type { BlockDef, BlockProps } from "./types";

export type CtaVariant = "band" | "panel" | "buttons";

export type CtaData = {
  title?: string | null;
  body?: string | null;
  /** First button is primary, the rest secondary. */
  buttons: ActionLink[];
  /** `buttons`: short note after the buttons. */
  note?: string | null;
};

function Cta({ variant, data: d, edit: e, nested }: BlockProps<"cta">) {
  const buttons = d.buttons.map((a, i) => (
    <Btn key={i} href={a.href} variant={i === 0 ? "primary" : "secondary"}><F e={e} k={`buttons.${i}.label`} kh={`buttons.${i}.href`} kind="link">{a.label}</F></Btn>
  ));
  if (variant === "band") {
    return (
      <section className="bg-black py-12 text-white">
        <Container className="flex flex-wrap items-center gap-6 md:gap-12">
          {d.title && <h2 className="text-3xl font-light uppercase tracking-wide"><F e={e} k="title">{d.title}</F></h2>}
          {d.body != null && <p className="max-w-md flex-1 text-sm opacity-90"><F e={e} k="body">{d.body}</F></p>}
          {buttons}
        </Container>
      </section>
    );
  }
  const inner =
    variant === "panel" ? (
      <div className="relative mb-6 overflow-hidden rounded bg-neutral-900 px-6 py-10 text-center text-white">
        {d.title && <h3 className="text-xl font-semibold uppercase tracking-wide"><F e={e} k="title">{d.title}</F></h3>}
        {d.body && <p className="mx-auto mt-2 max-w-xl text-sm opacity-90"><F e={e} k="body">{d.body}</F></p>}
        {buttons.length > 0 && <div className="mt-5">{buttons}</div>}
      </div>
    ) : (
      <div className="mt-8 flex flex-wrap items-center gap-3">
        {buttons}
        {d.note && <span className="text-sm text-muted"><F e={e} k="note">{d.note}</F></span>}
      </div>
    );
  return nested ? inner : <Section>{inner}</Section>;
}

export const cta: BlockDef<"cta"> = {
  type: "cta",
  name: "Call to action",
  description: "Call to action: short text and a button.",
  category: "content",
  nestable: true,
  variants: [
    { id: "band", label: "Dark band", description: "Full width: title, text and button in one line" },
    { id: "panel", label: "Dark panel", description: "A panel inside a section, centred" },
    { id: "buttons", label: "Button row", description: "Buttons and a short note" },
  ],
  fields: [
    { key: "title", label: "Title", kind: "text" },
    { key: "body", label: "Text", kind: "longText" },
    { key: "buttons", label: "Buttons", kind: "links", required: true },
    { key: "note", label: "Note (button row)", kind: "text" },
  ],
  example: {
    title: "Questions?",
    body: "Our team is ready to help with product information and training.",
    buttons: [{ label: "Contact us", href: "/style-guide#cta" }],
  },
  examples: {
    panel: {
      title: "Webinars",
      body: "Physician-led webinars are available to view on-demand.",
      buttons: [{ label: "Request to view", href: "/style-guide#cta" }],
    },
    buttons: {
      buttons: [
        { label: "Order", href: "/style-guide#cta" },
        { label: "Ask a question", href: "/style-guide#cta" },
        { label: "IFU", href: "/style-guide#cta" },
      ],
      note: "Available in selected markets",
    },
  },
  Component: Cta,
};
