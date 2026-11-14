"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

/**
 * The admin's functions, apart from the site's navigation (docs/screens/admin-sections.md → «Меню слева»): a narrow
 * rail of icons, like the page editor's. Admin chrome: its own neutral palette, as the editor.
 */
type Item = { href: string; icon: string; label: string; badge?: number; match?: (p: string) => boolean; external?: boolean };

export function AdminRail(props: {
  requests: number;
  editHref: string;
  user: { name: string; email: string; role: string };
  isAdmin: boolean;
  logout: () => Promise<void>;
}) {
  const path = usePathname();
  const [menu, setMenu] = useState<"settings" | "account" | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!menu) return;
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setMenu(null);
    const key = (e: KeyboardEvent) => e.key === "Escape" && setMenu(null);
    document.addEventListener("mousedown", close);
    window.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("mousedown", close);
      window.removeEventListener("keydown", key);
    };
  }, [menu]);

  const top: Item[] = [
    { href: "/admin/editor", icon: "🔍", label: "Find a page" },
    { href: "/admin", icon: "🏠", label: "Home — what needs you", match: (p) => p === "/admin" },
    { href: "/admin/submissions", icon: "📥", label: "Requests", badge: props.requests },
    { href: "/admin/media", icon: "🖼", label: "Media library" },
    { href: "/admin/activity", icon: "🕘", label: "Activity" },
  ];
  const settings = [
    { href: "/admin/settings", label: "Site settings" },
    { href: "/admin/redirects", label: "Redirects" },
    { href: "/admin/not-found-log", label: "Broken links" },
    ...(props.isAdmin ? [{ href: "/admin/users", label: "People and roles" }] : []),
  ];
  const on = (i: Item) => (i.match ? i.match(path) : path === i.href || path.startsWith(`${i.href}/`));
  const icon = "relative flex h-10 w-10 items-center justify-center rounded text-lg";
  const tip = (label: string) => ({ "aria-label": label, title: label });

  return (
    <nav aria-label="Admin functions" ref={ref} className="sticky top-0 flex h-screen w-14 flex-none flex-col items-center gap-1 bg-neutral-950 py-3 text-neutral-200">
      <Link href="/admin" {...tip("Rapid Medical admin")} className="mb-2 flex h-9 w-9 items-center justify-center rounded bg-white text-xs font-bold text-black">RM</Link>
      {top.map((i) => (
        <Link key={i.href} href={i.href} {...tip(i.label)} aria-current={on(i) ? "page" : undefined} className={`${icon} ${on(i) ? "bg-white text-black" : "hover:bg-neutral-800"}`}>
          <span aria-hidden>{i.icon}</span>
          {!!i.badge && <span className="absolute -right-0.5 -top-0.5 rounded-full bg-amber-400 px-1 text-[10px] font-bold leading-4 text-black">{i.badge > 99 ? "99+" : i.badge}</span>}
        </Link>
      ))}
      <span className="flex-1" />
      <a href={props.editHref} {...tip("Edit site — open the page editor")} className={`${icon} hover:bg-neutral-800`}><span aria-hidden>✎</span></a>
      <a href="/" target="_blank" rel="noreferrer" {...tip("View site ↗")} className={`${icon} hover:bg-neutral-800`}><span aria-hidden>↗</span></a>
      <div className="relative">
        <button type="button" {...tip("Settings")} aria-expanded={menu === "settings"} onClick={() => setMenu((m) => (m === "settings" ? null : "settings"))} className={`${icon} ${settings.some((x) => path.startsWith(x.href)) ? "bg-white text-black" : "hover:bg-neutral-800"}`}>
          <span aria-hidden>⚙</span>
        </button>
        {menu === "settings" && (
          <div role="menu" aria-label="Settings" className="absolute bottom-0 left-full z-50 ml-2 w-52 overflow-hidden rounded border border-neutral-200 bg-white text-sm text-neutral-900 shadow-xl">
            {settings.map((x) => (
              <Link key={x.href} role="menuitem" href={x.href} onClick={() => setMenu(null)} className="block px-3 py-2 hover:bg-neutral-100">{x.label}</Link>
            ))}
          </div>
        )}
      </div>
      <div className="relative">
        <button type="button" {...tip(`${props.user.name} — account`)} aria-expanded={menu === "account"} onClick={() => setMenu((m) => (m === "account" ? null : "account"))} className={`${icon} hover:bg-neutral-800`}>
          <span aria-hidden className="flex h-7 w-7 items-center justify-center rounded-full bg-neutral-700 text-xs font-semibold">{props.user.name.slice(0, 1).toUpperCase()}</span>
        </button>
        {menu === "account" && (
          <div role="menu" aria-label="Account" className="absolute bottom-0 left-full z-50 ml-2 w-60 overflow-hidden rounded border border-neutral-200 bg-white text-sm text-neutral-900 shadow-xl">
            <div className="border-b border-neutral-200 px-3 py-2">
              <div className="truncate font-medium">{props.user.name}</div>
              <div className="truncate text-xs text-neutral-500">{props.user.email} · {props.user.role}</div>
            </div>
            <Link role="menuitem" href="/admin/account" onClick={() => setMenu(null)} className="block px-3 py-2 hover:bg-neutral-100">My account &amp; security</Link>
            <form action={props.logout}>
              <button role="menuitem" className="block w-full px-3 py-2 text-left hover:bg-neutral-100">Sign out</button>
            </form>
          </div>
        )}
      </div>
    </nav>
  );
}
