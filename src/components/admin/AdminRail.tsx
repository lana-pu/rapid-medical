"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

/**
 * The admin's spaces (docs/admin-ia.md): Content, Inbox, Media, Settings — a narrow rail of icons, like the page
 * editor's; each space has its own second column. Admin chrome: its own neutral palette, as the editor.
 */

export type Space = "home" | "content" | "inbox" | "media" | "settings";

/** Which space a screen belongs to (docs/admin-ia.md). */
export function spaceOf(path: string): Space {
  if (path === "/admin") return "home";
  if (/^\/admin\/(inbox|submissions)(\/|$)/.test(path)) return "inbox";
  if (/^\/admin\/media(\/|$)/.test(path)) return "media";
  if (/^\/admin\/(settings|users|activity|account|redirects|not-found-log)(\/|$)/.test(path)) return "settings";
  return "content";
}

export function AdminRail(props: {
  /** unread messages in the Inbox */
  unread: number;
  editHref: string;
  user: { name: string; email: string; role: string };
  logout: () => Promise<void>;
}) {
  const path = usePathname();
  const space = spaceOf(path);
  const [menu, setMenu] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!menu) return;
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setMenu(false);
    const key = (e: KeyboardEvent) => e.key === "Escape" && setMenu(false);
    document.addEventListener("mousedown", close);
    window.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("mousedown", close);
      window.removeEventListener("keydown", key);
    };
  }, [menu]);

  const spaces: { key: Space; href: string; icon: string; label: string; badge?: number }[] = [
    { key: "content", href: "/admin/page", icon: "📝", label: "Content — the site's pages and collections" },
    { key: "inbox", href: "/admin/inbox", icon: "📥", label: "Inbox — messages from the site's forms and notes", badge: props.unread },
    { key: "media", href: "/admin/media", icon: "🖼", label: "Media library" },
    { key: "settings", href: "/admin/settings", icon: "⚙", label: "Settings — the site and the team" },
  ];
  const icon = "relative flex h-11 w-11 flex-col items-center justify-center rounded text-lg";
  const tip = (label: string) => ({ "aria-label": label, title: label });

  return (
    <nav aria-label="Admin spaces" ref={ref} className="sticky top-0 flex h-screen w-16 flex-none flex-col items-center gap-1 bg-neutral-950 py-3 text-neutral-200">
      {/* above the projects: the dashboard — choose a project, what needs someone (docs/admin-ia.md) */}
      <Link href="/admin" {...tip("Dashboard — projects and what needs you")} aria-current={space === "home" ? "page" : undefined} className={`mb-2 flex h-10 w-10 items-center justify-center rounded text-xs font-bold ${space === "home" ? "bg-amber-400 text-black ring-2 ring-white" : "bg-white text-black hover:bg-neutral-200"}`}>RM</Link>
      <span aria-hidden className="mb-1 h-px w-8 bg-neutral-700" />
      {spaces.map((i) => (
        <Link key={i.key} href={i.href} {...tip(i.label)} aria-current={space === i.key ? "page" : undefined} className={`${icon} ${space === i.key ? "bg-white text-black" : "hover:bg-neutral-800"}`}>
          <span aria-hidden>{i.icon}</span>
          <span aria-hidden className="text-[9px] leading-3">{i.label.split(" ")[0]}</span>
          {!!i.badge && <span className="absolute -right-0.5 -top-0.5 rounded-full bg-amber-400 px-1 text-[10px] font-bold leading-4 text-black">{i.badge > 99 ? "99+" : i.badge}</span>}
        </Link>
      ))}
      <span className="flex-1" />
      <a href={props.editHref} {...tip("Edit site — open the page editor")} className={`${icon} hover:bg-neutral-800`}><span aria-hidden>✎</span></a>
      <a href="/" target="_blank" rel="noreferrer" {...tip("View site ↗")} className={`${icon} hover:bg-neutral-800`}><span aria-hidden>↗</span></a>
      <div className="relative">
        <button type="button" {...tip(`${props.user.name} — account`)} aria-expanded={menu} onClick={() => setMenu((m) => !m)} className={`${icon} hover:bg-neutral-800`}>
          <span aria-hidden className="flex h-7 w-7 items-center justify-center rounded-full bg-neutral-700 text-xs font-semibold">{props.user.name.slice(0, 1).toUpperCase()}</span>
        </button>
        {menu && (
          <div role="menu" aria-label="Account" className="absolute bottom-0 left-full z-50 ml-2 w-60 overflow-hidden rounded border border-neutral-200 bg-white text-sm text-neutral-900 shadow-xl">
            <div className="border-b border-neutral-200 px-3 py-2">
              <div className="truncate font-medium">{props.user.name}</div>
              <div className="truncate text-xs text-neutral-500">{props.user.email} · {props.user.role}</div>
            </div>
            <Link role="menuitem" href="/admin/account" onClick={() => setMenu(false)} className="block px-3 py-2 hover:bg-neutral-100">My account &amp; security</Link>
            <form action={props.logout}>
              <button role="menuitem" className="block w-full px-3 py-2 text-left hover:bg-neutral-100">Sign out</button>
            </form>
          </div>
        )}
      </div>
    </nav>
  );
}
