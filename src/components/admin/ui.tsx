import Link from "next/link";
import type { ReactNode } from "react";
import type { Region } from "@/db/schema";
import { REGION_CHOICES, REGION_SHORT } from "@/lib/regions";
import { Icon } from "./icons";

/* Small, unstyled-ish primitives for the admin. Swap freely later. */

/**
 * A tooltip (docs/screens/admin-home.md → «Иерархия»): shown on hover and on keyboard focus inside, CSS only. It
 * adds to what is already visible, never carries the only copy of something important. The bubble is a sibling of
 * the trigger, so a link's name stays its own text; it is not displayed at all until wanted, so it never widens the page. `focusable` makes a non-interactive trigger reachable by Tab.
 */
export function Tip({ tip, children, align = "center", focusable = false, className = "", style }: { tip: ReactNode; children: ReactNode; align?: "start" | "center" | "end"; focusable?: boolean; className?: string; style?: React.CSSProperties }) {
  const pos = { start: "left-0", center: "left-1/2 -translate-x-1/2", end: "right-0" }[align];
  return (
    <span className={`group/tip relative inline-flex ${className}`} style={style} tabIndex={focusable ? 0 : undefined}>
      {children}
      <span role="tooltip" className={`pointer-events-none absolute bottom-full z-50 mb-2 hidden w-max max-w-[min(16rem,calc(100vw-2rem))] rounded-md bg-neutral-900 px-2.5 py-1.5 text-xs font-normal leading-snug text-white shadow-lg group-hover/tip:block group-focus-within/tip:block ${pos}`}>
        {tip}
      </span>
    </span>
  );
}

/** Underlined quietly: a link inside text or a block's way out. */
export const quietLink = "underline decoration-neutral-300 underline-offset-[3px] hover:decoration-neutral-900";

/**
 * A block's head on the dashboards and the page screen (docs/screens/admin-home.md → «Иерархия»): the name in sentence
 * case, a number beside it, an (i) with what the block is, the way into its space on the right.
 */
export function SectionHead({ title, count, tip, href, link }: { title: string; count?: ReactNode; tip?: string; href?: string; link?: string }) {
  return (
    <div className="mb-3 flex flex-wrap items-baseline gap-x-2 gap-y-1">
      <h2 className="text-[15px] font-semibold text-neutral-900">{title}</h2>
      {count != null && <span className="text-xs tabular-nums text-neutral-500">{count}</span>}
      {tip && (
        <Tip tip={tip} focusable className="self-center text-neutral-400 hover:text-neutral-700">
          <Icon name="info" className="h-3.5 w-3.5" />
        </Tip>
      )}
      {href && link && <Link href={href} className={`ml-auto text-[13px] text-neutral-600 ${quietLink}`}>{link} →</Link>}
    </div>
  );
}

/** Good news or an empty state in one line, no card: it does not compete with what needs doing. */
export function Calm({ children, check = true }: { children: ReactNode; check?: boolean }) {
  return (
    <p className="flex items-center gap-2 text-sm text-neutral-600">
      {check && <Icon name="check" className="h-4 w-4 text-emerald-600" />}
      {children}
    </p>
  );
}

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
  // words, not codes (docs/audits/admin-walkthrough-2026-11-15.md)
  const WORDS: Record<string, string> = { published: "On the site", draft: "Draft", new: "New", in_progress: "In progress", done: "Done", spam: "Spam" };
  return <span className={`whitespace-nowrap rounded px-2 py-0.5 text-xs font-medium ${cls}`}>{WORDS[status] ?? status}</span>;
}

/**
 * A record's state as a dot and a word (docs/screens/admin-list.md → «Иерархия»): the same look in a list row, the
 * status card and the form's bottom bar. `big` — the status card's headline.
 */
export type StateTone = "live" | "changed" | "scheduled" | "draft";
export function StateDot({ tone, children, big = false, className = "" }: { tone: StateTone; children: ReactNode; big?: boolean; className?: string }) {
  const dot = { live: "bg-emerald-500", changed: "bg-amber-500", scheduled: "bg-blue-500", draft: "bg-neutral-400" }[tone];
  const ink = { live: "text-neutral-900", changed: "text-amber-900", scheduled: "text-blue-800", draft: "text-neutral-700" }[tone];
  return (
    <span className={`inline-flex items-center ${big ? "gap-2 text-[15px] font-semibold" : "gap-1.5 text-xs font-medium"} ${ink} ${className}`}>
      <span aria-hidden className={`${big ? "h-2.5 w-2.5" : "h-[7px] w-[7px]"} shrink-0 rounded-full ${dot}`} />
      {children}
    </span>
  );
}

export function RegionBadge({ region }: { region: Region | null | undefined }) {
  if (!region) return <span className="text-xs text-neutral-400">All regions</span>;
  // names as in the region menu, not codes (docs/screens/admin-list.md)
  return <span className="rounded bg-neutral-100 px-2 py-0.5 text-xs text-neutral-700">{REGION_CHOICES.find((c) => c.region === region)?.label ?? REGION_SHORT[region]}</span>;
}

export type Crumb = { label: string; href?: string };

/** «Website › Evidence › Publications»: where this screen is in the site (docs/screens/admin-sections.md). */
export function Crumbs({ items, flush = false }: { items: Crumb[]; flush?: boolean }) {
  return (
    <nav aria-label="Breadcrumb" className={`${flush ? "" : "mb-1 "}text-xs text-neutral-500`}>
      {items.map((c, i) => (
        <span key={i}>
          {i > 0 && <span className="px-1">›</span>}
          {c.href ? <a href={c.href} className="hover:underline">{c.label}</a> : c.label}
        </span>
      ))}
    </nav>
  );
}

/**
 * A screen's head. `back` — a small «← Back» beside the crumbs; `tag` — what kind of thing this is («News item»), a quiet
 * label under the title (docs/screens/admin-record-edit.md → «Иерархия»).
 */
export function PageHeader({ title, actions, subtitle, crumbs, back, tag }: { title: string; subtitle?: string; actions?: ReactNode; crumbs?: Crumb[]; back?: ReactNode; tag?: string }) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
      <div className="min-w-0 flex-1 break-words">
        {back ? (
          <div className="mb-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
            {back}
            {crumbs && <Crumbs items={crumbs} flush />}
          </div>
        ) : (
          crumbs && <Crumbs items={crumbs} />
        )}
        <h1 className="text-2xl font-semibold text-neutral-900">{title}</h1>
        {tag && <span className="mt-2 inline-block rounded bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-600">{tag}</span>}
        {subtitle && <p className="mt-1 text-sm text-neutral-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
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
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return "";
  // toLocaleDateString rejects timeStyle; use the full formatter when a time is requested
  return opts.timeStyle ? new Intl.DateTimeFormat("en-GB", opts).format(date) : date.toLocaleDateString("en-US", opts);
}
