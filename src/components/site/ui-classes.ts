/**
 * Classes of the site's elements, one function per element (DESIGN.md → Примитивы). Server and client components both
 * use them; a component never repeats these strings. Values come from the tokens (globals.css), never from the palette.
 */

export type ButtonVariant = "primary" | "secondary";
export type ButtonSize = "sm" | "md" | "lg";

/** A button or a link that looks like one. `onDark`: on a dark band (`--inverse`). `block`: the full width. */
export function buttonClass({ variant = "primary", size = "md", onDark = false, block = false }: { variant?: ButtonVariant; size?: ButtonSize; onDark?: boolean; block?: boolean } = {}) {
  const sz = { sm: "px-3 py-1.5 text-sm", md: "px-4 py-2 text-sm", lg: "px-5 py-2.5 text-sm" }[size];
  const look = onDark
    ? variant === "primary"
      ? "bg-background text-foreground hover:opacity-90"
      : "border border-inverse-foreground text-inverse-foreground hover:bg-inverse-foreground/10"
    : variant === "primary"
      ? "bg-accent text-accent-foreground hover:opacity-90"
      : "border border-foreground hover:bg-surface";
  return `${block ? "flex w-full" : "inline-flex"} items-center justify-center rounded font-medium disabled:cursor-not-allowed disabled:opacity-50 ${sz} ${look}`;
}

/** A chip you switch: on — filled with the text colour, off — a hairline. */
export function chipClass(on: boolean) {
  return `rounded-full border px-3 py-1.5 text-sm ${on ? "border-foreground bg-foreground text-background" : "border-border hover:border-foreground"}`;
}

/** A label on a row: a product, where the region came from. */
export function tagClass(muted = false) {
  return `rounded-full border border-border px-2 py-0.5 text-xs ${muted ? "text-muted" : ""}`;
}

/** A text field, a list, a search box. `error`: the field's error (DESIGN.md → Формы). */
export function inputClass(error = false) {
  return `w-full rounded border bg-background px-3 py-2 text-sm focus:border-foreground focus:outline-none disabled:bg-surface disabled:text-muted ${error ? "border-danger" : "border-border"}`;
}

/** Rows of materials: the left column's width by what is in it. */
export const ROW_LEAD = { date: "sm:grid-cols-[7rem_minmax(0,1fr)]", year: "sm:grid-cols-[4rem_minmax(0,1fr)]", media: "sm:grid-cols-[10rem_minmax(0,1fr)]" } as const;
export type RowLead = keyof typeof ROW_LEAD;
