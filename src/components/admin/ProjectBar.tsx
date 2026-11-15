import Link from "next/link";
import { AccountMenu } from "./AccountMenu";

/**
 * The header above the admin (docs/admin-ia.md → «проект отдельно»): the chosen project with an arrow back to the
 * project picker; with no project — only the company and the account. Admin chrome: its own neutral palette.
 */

export function ProjectBar({ project, editHref, user }: { project?: { name: string; icon: string; href: string }; editHref?: string; user: { name: string; email: string; role: string } }) {
  return (
    <header className="sticky top-0 z-40 flex h-12 flex-none items-center gap-3 border-b border-neutral-200 bg-white px-3 text-sm text-neutral-900">
      {project && (
        <Link href="/admin" aria-label="All projects" title="All projects" className="flex h-8 w-8 items-center justify-center rounded text-lg text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900">
          <span aria-hidden>←</span>
        </Link>
      )}
      <Link href={project?.href ?? "/admin"} className="flex items-center gap-2 rounded px-1 py-1 hover:bg-neutral-100">
        <span aria-hidden className="flex h-7 w-7 items-center justify-center rounded bg-neutral-900 text-[10px] font-bold text-white">RM</span>
        <span className={project ? "text-neutral-500" : "font-semibold"}>Rapid Medical</span>
      </Link>
      {project && (
        <>
          <span aria-hidden className="text-neutral-300">/</span>
          <span aria-label="Project" className="flex items-center gap-1.5 font-semibold"><span aria-hidden>{project.icon}</span>{project.name}</span>
        </>
      )}
      <span className="flex-1" />
      {project && editHref && <a href={editHref} className="rounded px-2.5 py-1.5 hover:bg-neutral-100">✎ Edit site</a>}
      {project && <a href="/" target="_blank" rel="noreferrer" className="rounded px-2.5 py-1.5 hover:bg-neutral-100">View site ↗</a>}
      <AccountMenu user={user} />
    </header>
  );
}
