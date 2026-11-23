import Link from "next/link";
import { AccountMenu } from "./AccountMenu";
import { BackLink } from "./BackLink";

/**
 * The header above the admin (docs/admin-ia.md → «проект отдельно»): an arrow back to the previous page, the company
 * (→ the project picker) and the chosen project (→ its Home); with no project — only the company and the account.
 * Admin chrome: its own neutral palette.
 */

export function ProjectBar({ project, editHref, user }: { project?: { name: string; icon: string; href: string }; editHref?: string; user: { name: string; email: string; role: string } }) {
  return (
    // on a phone: RM without «Rapid Medical», «Edit» and «↗» (docs/admin-ia.md → «Адаптив»)
    <header className="sticky top-0 z-40 flex h-12 flex-none items-center gap-1 border-b border-neutral-200 bg-white px-2 text-sm text-neutral-900 sm:gap-3 sm:px-3">
      {project && (
        <BackLink fallback="/admin" label="Back" className="flex h-8 w-8 items-center justify-center rounded text-lg text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900">
          <span aria-hidden>←</span>
        </BackLink>
      )}
      <Link href="/admin" title={project ? "All projects" : undefined} className="flex items-center gap-2 rounded px-1 py-1 hover:bg-neutral-100">
        <span aria-hidden className="flex h-7 w-7 items-center justify-center rounded bg-neutral-900 text-[10px] font-bold text-white">RM</span>
        <span className={project ? "sr-only text-neutral-500 sm:not-sr-only" : "font-semibold"}>Rapid Medical</span>
      </Link>
      {project && (
        <>
          <span aria-hidden className="text-neutral-300">/</span>
          <Link href={project.href} title={`${project.name} — Home`} className="flex items-center gap-1.5 rounded px-1 py-1 font-semibold hover:bg-neutral-100"><span aria-hidden>{project.icon}</span>{project.name}</Link>
        </>
      )}
      <span className="flex-1" />
      {project && editHref && <a href={editHref} className="shrink-0 rounded px-2 py-1.5 hover:bg-neutral-100 sm:px-2.5">✎ Edit<span className="hidden sm:inline"> the site</span></a>}
      {project && <a href="/" target="_blank" rel="noreferrer" aria-label="View site" className="shrink-0 rounded px-2 py-1.5 hover:bg-neutral-100 sm:px-2.5"><span aria-hidden className="hidden sm:inline">View site </span>↗</a>}
      <AccountMenu user={user} />
    </header>
  );
}
