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

export function AdminRail(props: {
  /** unread messages in the Inbox */
  unread: number;
}) {
  const space = spaceOf(usePathname());
  const spaces: { key: Space; href: string; icon: string; label: string; badge?: number }[] = [
    { key: "home", href: "/admin/website", icon: "🏠", label: "Home — what needs you, what is coming up, the week" },
    { key: "content", href: "/admin/page", icon: "📝", label: "Content — the site's pages and collections" },
    { key: "inbox", href: "/admin/inbox", icon: "📥", label: "Inbox — messages from the site's forms and notes", badge: props.unread },
    { key: "analytics", href: "/admin/analytics", icon: "📊", label: "Analytics — visits, sources and requests" },
    { key: "media", href: "/admin/media", icon: "🖼", label: "Media library" },
    { key: "settings", href: "/admin/settings", icon: "⚙", label: "Settings — the site and the team" },
  ];

  return (
    <nav aria-label="Admin spaces" className={`${UNDER_HEADER} flex w-16 flex-none flex-col items-center gap-1 bg-neutral-950 py-3 text-neutral-200`}>
      {spaces.map((i) => (
        <Link key={i.key} href={i.href} aria-label={i.label} title={i.label} aria-current={space === i.key ? "page" : undefined} className={`relative flex h-11 w-11 flex-col items-center justify-center rounded text-lg ${space === i.key ? "bg-white text-black" : "hover:bg-neutral-800"}`}>
          <span aria-hidden>{i.icon}</span>
          <span aria-hidden className="text-[9px] leading-3">{i.label.split(" ")[0]}</span>
          {!!i.badge && <span className="absolute -right-0.5 -top-0.5 rounded-full bg-amber-400 px-1 text-[10px] font-bold leading-4 text-black">{i.badge > 99 ? "99+" : i.badge}</span>}
        </Link>
      ))}
    </nav>
  );
}
