import { Section } from "@/components/site/primitives";
import { ContactForm } from "@/components/site/ContactForm";
import type { BlockDef, BlockProps } from "./types";

export type FormVariant = "default" | "compact";

export type FormBlockData = {
  /** Where the submission goes. */
  form?: "contact" | "webinar" | "careers";
  topics: string[];
  defaultTopic?: string;
  defaultRegion?: string;
  meta?: Record<string, string>;
  /** Style guide: shown, but cannot be sent. */
  preview?: boolean;
};

function Form({ variant, data: d, nested }: BlockProps<"form">) {
  const f = <ContactForm form={d.form} topics={d.topics} defaultTopic={d.defaultTopic} defaultRegion={d.defaultRegion} meta={d.meta} compact={variant === "compact"} />;
  const inner = <div className="mt-10 max-w-2xl">{d.preview ? <fieldset disabled>{f}</fieldset> : f}</div>;
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
  ],
  fields: [{ key: "topics", label: "Topics in the list", kind: "items", required: true, note: "set by the administrator" }],
  example: { topics: ["Sample topic", "Other"], preview: true },
  Component: Form,
  flow: () => true,
};
