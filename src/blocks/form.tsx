import { Section, H2 } from "@/components/site/primitives";
import { ContactForm } from "@/components/site/ContactForm";
import { F } from "./edit";
import type { BlockDef, BlockProps } from "./types";

export type FormVariant = "default" | "compact" | "section";

export type FormBlockData = {
  /** Where the submission goes. */
  form?: "contact" | "webinar" | "careers";
  topics: string[];
  defaultTopic?: string;
  defaultRegion?: string;
  meta?: Record<string, string>;
  /** `section`: heading, note and anchor. */
  title?: string | null;
  note?: string | null;
  anchor?: string;
  /** Style guide: shown, but cannot be sent. */
  preview?: boolean;
};

function Form({ variant, data: d, edit: e, nested }: BlockProps<"form">) {
  const f = <ContactForm form={d.form} topics={d.topics} defaultTopic={d.defaultTopic} defaultRegion={d.defaultRegion} meta={d.meta} compact={variant !== "default"} />;
  const form = d.preview ? <fieldset disabled>{f}</fieldset> : f;
  if (variant === "section") {
    return (
      <Section id={d.anchor}>
        {d.title && <H2><F e={e} k="title">{d.title}</F></H2>}
        {d.note && <p className="mt-4 max-w-3xl text-sm text-muted"><F e={e} k="note">{d.note}</F></p>}
        <div className="mt-8 max-w-2xl">{form}</div>
      </Section>
    );
  }
  const inner = <div className={variant === "compact" ? "mt-12 max-w-2xl" : "mt-10 max-w-2xl"}>{form}</div>;
  return nested ? inner : <Section>{inner}</Section>;
}

export const form: BlockDef<"form"> = {
  type: "form",
  name: "Form",
  description: "A contact or request form. Fields and recipients come from the settings.",
  category: "system",
  variants: [
    { id: "default", label: "Full", description: "All fields" },
    { id: "compact", label: "Compact", description: "Without country and state" },
    { id: "section", label: "Section", description: "Compact form in its own section, with a heading and a note" },
  ],
  fields: [
    { key: "title", label: "Title (section)", kind: "text" },
    { key: "note", label: "Note (section)", kind: "longText" },
    { key: "topics", label: "Topics in the list", kind: "items", required: true, note: "set by the administrator" },
  ],
  example: { topics: ["Sample topic", "Other"], preview: true },
  examples: { section: { title: "Sample form section", note: "A short legal note above the form.", topics: ["Sample topic", "Other"], preview: true } },
  Component: Form,
  flow: (v) => v !== "section",
};
