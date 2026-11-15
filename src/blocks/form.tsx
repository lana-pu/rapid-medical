import Link from "next/link";
import { Section, H2, KeyValue } from "@/components/site/primitives";
import { ContactForm } from "@/components/site/ContactForm";
import { F } from "./edit";
import type { BlockDef, BlockProps } from "./types";

export type FormVariant = "default" | "compact" | "section" | "split";

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
  /** Contact form: preselected country (ISO code). */
  defaultCountry?: string;
  /** `split`: key — value rows beside the form (contacts of the region) and a link under them. */
  contacts?: { label: string; value: string; href?: string }[];
  contactsLink?: { label: string; href: string } | null;
};

function Form({ variant, data: d, edit: e, nested }: BlockProps<"form">) {
  const f = <ContactForm form={d.form} topics={d.topics} defaultTopic={d.defaultTopic} defaultRegion={d.defaultRegion} defaultCountry={d.defaultCountry} meta={d.meta} compact={variant !== "default" && variant !== "split"} />;
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
  if (variant === "split") {
    // «Shared line» (DESIGN.md → Решения по страницам): a hairline, then the context (4/12) and the form (7/12) start level.
    const rows = (d.contacts ?? []).map((c) => ({ label: c.label, value: c.href ? <a href={c.href} className="underline">{c.value}</a> : c.value }));
    const inner = (
      <div className="mt-8 grid gap-10 border-t border-border pt-8 md:grid-cols-12">
        <div className="md:col-span-4">
          {rows.length > 0 && <KeyValue rows={rows} footer={d.contactsLink && <Link href={d.contactsLink.href} className="text-sm underline">{d.contactsLink.label}</Link>} />}
        </div>
        <div className="md:col-span-7 md:col-start-6">{form}</div>
      </div>
    );
    return nested ? inner : <Section>{inner}</Section>;
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
    { id: "split", label: "Beside contacts", description: "A hairline, contacts on the left, the form on the right (Contact Us)" },
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
