"use client";

/**
 * The site's controls (DESIGN.md → Примитивы): button, chips, tag, form fields, window, rows of materials. Shown in all
 * their states on /style-guide. Classes — ui-classes.ts.
 */
import { forwardRef, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { buttonClass, chipClass, inputClass, tagClass, ROW_LEAD, type ButtonSize, type ButtonVariant, type RowLead } from "./ui-classes";

export function Button({ variant, size, onDark, block, className = "", type = "button", ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; size?: ButtonSize; onDark?: boolean; block?: boolean }) {
  return <button type={type} className={`${buttonClass({ variant, size, onDark, block })} ${className}`} {...rest} />;
}

export function Chip({ on, className = "", ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { on: boolean }) {
  return <button type="button" aria-pressed={on} className={`${chipClass(on)} ${className}`} {...rest} />;
}

export type FilterOption = { id: string; label: string; count: number };

/** «All n» and one chip per option with its count. `id` "" is «All». */
export function FilterChips({ options, total, value, onChange, label = "Product" }: { options: FilterOption[]; total: number; value: string; onChange: (id: string) => void; label?: string }) {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label={label}>
      {[{ id: "", label: "All", count: total }, ...options].map((p) => (
        <Chip key={p.id || "all"} on={value === p.id} onClick={() => onChange(p.id)}>
          {p.label} <span className="opacity-60">{p.count}</span>
        </Chip>
      ))}
    </div>
  );
}

export function Tag({ children, muted }: { children: ReactNode; muted?: boolean }) {
  return <span className={tagClass(muted)}>{children}</span>;
}

function FieldShell({ label, error, children }: { label: ReactNode; error?: string | null; children: ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block">{label}</span>
      {children}
      {error && <span className="mt-1 block text-xs text-danger">{error}</span>}
    </label>
  );
}

export function Field({ label, error, className = "", ...rest }: InputHTMLAttributes<HTMLInputElement> & { label: ReactNode; error?: string | null }) {
  return (
    <FieldShell label={label} error={error}>
      <input aria-invalid={!!error || undefined} className={`${inputClass(!!error)} ${className}`} {...rest} />
    </FieldShell>
  );
}

export function SelectField({ label, error, children, className = "", ...rest }: SelectHTMLAttributes<HTMLSelectElement> & { label: ReactNode; error?: string | null }) {
  return (
    <FieldShell label={label} error={error}>
      <select aria-invalid={!!error || undefined} className={`${inputClass(!!error)} ${className}`} {...rest}>{children}</select>
    </FieldShell>
  );
}

export function TextAreaField({ label, error, className = "", ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement> & { label: ReactNode; error?: string | null }) {
  return (
    <FieldShell label={label} error={error}>
      <textarea aria-invalid={!!error || undefined} className={`${inputClass(!!error)} ${className}`} {...rest} />
    </FieldShell>
  );
}

export function CheckboxField({ label, ...rest }: InputHTMLAttributes<HTMLInputElement> & { label: ReactNode }) {
  return (
    <label className="flex items-start gap-2 text-sm">
      <input type="checkbox" className="mt-1" {...rest} />
      <span>{label}</span>
    </label>
  );
}

/**
 * A window over the page (`<dialog>`, opened with showModal): centred, full screen on a phone; Esc and a click on the
 * backdrop close it. `md` — a form (webinar request), `lg` — a choice across columns (region).
 */
export const Dialog = forwardRef<HTMLDialogElement, { labelledBy: string; size?: "md" | "lg"; onClose?: () => void; children: ReactNode }>(function Dialog({ labelledBy, size = "md", onClose, children }, ref) {
  return (
    <dialog
      ref={ref}
      aria-labelledby={labelledBy}
      onClick={(e) => { if (e.target === e.currentTarget) e.currentTarget.close(); }}
      onClose={onClose}
      className={`bg-background p-0 text-foreground backdrop:bg-foreground/40 max-md:m-0 max-md:h-full max-md:max-h-none max-md:w-full max-md:max-w-none md:m-auto md:w-full md:rounded ${size === "lg" ? "md:max-w-4xl" : "md:max-w-2xl"}`}
    >
      {children}
    </dialog>
  );
});

/** Rows of materials (DESIGN.md → «Строка материала»): hairlines between, above and below. */
export function Rows({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <ul className={`divide-y divide-border border-y border-border ${className}`}>{children}</ul>;
}

/** One row: the left column (`lead`: a date, a year, a picture) and the rest. */
export function Row({ lead, kind = "date", children, className = "" }: { lead: ReactNode; kind?: RowLead; children: ReactNode; className?: string }) {
  return (
    <li className={`grid gap-x-6 gap-y-1 py-4 ${ROW_LEAD[kind]} ${className}`}>
      <div className="text-sm text-muted">{lead}</div>
      <div className="min-w-0">{children}</div>
    </li>
  );
}
