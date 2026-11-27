import Link from "next/link";

/**
 * Old links (docs/screens/admin-settings.md → «Обзор Settings»): broken links and redirects are one job — an address
 * that leads nowhere is sent somewhere — so they are two tabs of one screen. Admin chrome palette.
 */
export function OldLinksTabs({ active, broken, aside }: { active: "broken" | "redirects"; broken?: number; /** right of the tabs: the count and «New» */ aside?: React.ReactNode }) {
  return (
    <div className="mb-6">
      <div className="mb-1 text-xs text-neutral-500"><Link href="/admin/settings" className="hover:underline">Settings</Link> › Search &amp; sharing</div>
      <h1 className="text-2xl font-semibold text-neutral-900">Old links</h1>
      <p className="mt-1 text-sm text-neutral-600">When an address leads nowhere, send visitors to a page that exists. Old site addresses already redirect here.</p>
      <div className="mt-4 flex flex-wrap items-end justify-between gap-x-4 gap-y-2 border-b border-neutral-200">
      <nav aria-label="Old links" className="flex gap-1">
        {([["broken", "Broken links", "/admin/not-found-log"], ["redirects", "Redirects", "/admin/redirects"]] as const).map(([k, label, href]) => (
          <Link key={k} href={href} aria-current={active === k ? "page" : undefined} className={`-mb-px border-b-2 px-3 py-2 text-sm ${active === k ? "border-neutral-900 font-medium" : "border-transparent text-neutral-500 hover:text-neutral-800"}`}>
            {label}{k === "broken" && broken ? <span className="ml-1.5 rounded-full bg-amber-100 px-1.5 text-[11px] text-amber-900">{broken}</span> : null}
          </Link>
        ))}
      </nav>
      {aside && <div className="mb-2 flex items-center gap-3">{aside}</div>}
      </div>
    </div>
  );
}
