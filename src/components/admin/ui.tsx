import Link from "next/link";
import type { ReactNode } from "react";
import type { Region } from "@/db/schema";
import { REGION_SHORT } from "@/lib/regions";

/* Small, unstyled-ish primitives for the admin. Swap freely later. */

export const inputCls =
  "w-full rounded border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-neutral-900 focus:outline-none";

export function Button({
  children,
  variant = "primary",
  ...rest
}: { children: ReactNode; variant?: "primary" | "secondary" | "danger" } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const base = "inline-flex items-center gap-2 rounded px-3 py-2 text-sm font-medium disabled:opacity-50";
  const v = {
    primary: "bg-neutral-900 text-white hover:bg-neutral-700",
    secondary: "border border-neutral-300 bg-white text-neutral-800 hover:bg-neutral-100",
    danger: "border border-red-300 bg-white text-red-700 hover:bg-red-50",
  }[variant];
  return (
    <button className={`${base} ${v}`} {...rest}>
      {children}
    </button>
  );
}

export function LinkButton({ href, children, variant = "secondary" }: { href: string; children: ReactNode; variant?: "primary" | "secondary" }) {
  const base = "inline-flex items-center gap-2 rounded px-3 py-2 text-sm font-medium";
  const v = variant === "primary" ? "bg-neutral-900 text-white hover:bg-neutral-700" : "border border-neutral-300 bg-white text-neutral-800 hover:bg-neutral-100";
  return (
    <Link href={href} className={`${base} ${v}`}>
      {children}
    </Link>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const cls =
    status === "published"
      ? "bg-green-100 text-green-800"
      : status === "draft"
        ? "bg-amber-100 text-amber-800"
        : status === "new"
          ? "bg-blue-100 text-blue-800"
          : "bg-neutral-100 text-neutral-700";
  return <span className={`rounded px-2 py-0.5 text-xs font-medium ${cls}`}>{status}</span>;
}

export function RegionBadge({ region }: { region: Region | null | undefined }) {
  if (!region) return <span className="text-xs text-neutral-400">global</span>;
  return <span className="rounded bg-neutral-200 px-2 py-0.5 text-xs font-medium text-neutral-800">{REGION_SHORT[region]}</span>;
}

export function PageHeader({ title, actions, subtitle }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-neutral-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex gap-2">{actions}</div>}
    </div>
  );
}

export function Notice({ kind = "info", children }: { kind?: "info" | "success" | "error"; children: ReactNode }) {
  const cls = {
    info: "border-blue-200 bg-blue-50 text-blue-900",
    success: "border-green-200 bg-green-50 text-green-900",
    error: "border-red-200 bg-red-50 text-red-900",
  }[kind];
  return <div className={`mb-4 rounded border px-3 py-2 text-sm ${cls}`}>{children}</div>;
}

export function formatDate(d: Date | string | null | undefined, opts: Intl.DateTimeFormatOptions = { year: "numeric", month: "short" }) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-US", opts);
}
