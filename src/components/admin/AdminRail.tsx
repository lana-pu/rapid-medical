"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UNDER_HEADER } from "./chrome";

/**
 * The project's spaces (docs/admin-ia.md → «проект отдельно»): Home, Content, Inbox, Analytics, Media, Settings — a
 * narrow rail of icons under the project header; each space has its own second column. The project, Edit site,
 * View site and the account live in the header. Admin chrome: its own neutral palette, as the editor.
 */

export type Space = "home" | "content" | "inbox" | "analytics" | "media" | "settings";

/** Which space a screen belongs to (docs/admin-ia.md). */
export function spaceOf(path: string): Space {
  if (path === "/admin/website") return "home";
  if (/^\/admin\/(inbox|submissions)(\/|$)/.test(path)) return "inbox";
  if (/^\/admin\/media(\/|$)/.test(path)) return "media";
  if (/^\/admin\/analytics(\/|$)/.test(path)) return "analytics";
  if (/^\/admin\/(settings|users|activity|account|redirects|not-found-log)(\/|$)/.test(path)) return "settings";
  return "content";
}

/** Line icons of one style (24×24, stroke 1.75): the rail reads as one set, not as emoji (docs/screens/admin-sections.md). */
const ICONS: Record<Space, React.ReactNode> = {
  home: <><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9v11h5v-6h4v6h5V9" /></>,
  content: <><path d="M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8z" /><path d="M14 3v5h5" /><path d="M8 13h8M8 17h6" /></>,
  inbox: <><path d="M3 13h5l1.5 3h5L16 13h5" /><path d="M5.5 5h13L21 13v6a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-6z" /></>,
  analytics: <><path d="M4 20V10M10 20V4M16 20v-8M22 20H2" /></>,
  media: <><rect x="3" y="4" width="18" height="16" rx="1.5" /><circle cx="9" cy="10" r="1.75" /><path d="m21 16-5-5-8 9" /></>,
  settings: <><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" /></>,
};

export function AdminRail(props: {
  /** unread messages in the Inbox */
  unread: number;
}) {
  const space = spaceOf(usePathname());
  const spaces: { key: Space; href: string; label: string; badge?: number }[] = [
    { key: "home", href: "/admin/website", label: "Home — what needs you, what is coming up, the week" },
    { key: "content", href: "/admin/page", label: "Content — the site's pages and collections" },
    { key: "inbox", href: "/admin/inbox", label: "Inbox — messages from the site's forms and notes", badge: props.unread },
    { key: "analytics", href: "/admin/analytics", label: "Analytics — visits, sources and requests" },
    { key: "media", href: "/admin/media", label: "Media library" },
    { key: "settings", href: "/admin/settings", label: "Settings — the site and the team" },
  ];

  return (
    <nav aria-label="Admin spaces" className={`${UNDER_HEADER} flex w-16 flex-none flex-col items-center gap-1 bg-neutral-950 py-3 text-neutral-200`}>
      {spaces.map((i) => (
        <Link key={i.key} href={i.href} aria-label={i.label} title={i.label} aria-current={space === i.key ? "page" : undefined} className={`relative flex h-12 w-12 flex-col items-center justify-center rounded ${space === i.key ? "bg-white text-black" : "text-neutral-300 hover:bg-neutral-800 hover:text-white"}`}>
          <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">{ICONS[i.key]}</svg>
          <span aria-hidden className="mt-0.5 text-[10px] leading-3">{i.label.split(" ")[0]}</span>
          {!!i.badge && <span className="absolute -right-0.5 -top-0.5 rounded-full bg-amber-400 px-1 text-[10px] font-bold leading-4 text-black">{i.badge > 99 ? "99+" : i.badge}</span>}
        </Link>
      ))}
    </nav>
  );
}
