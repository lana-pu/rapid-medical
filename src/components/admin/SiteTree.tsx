"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import type { SiteNode } from "@/admin/site-tree";

/**
 * The site as a tree in the admin's left column (docs/screens/admin-sections.md → «Меню слева»): pages, the collections
 * under the page that shows them (▤ and how many), Menu and footer. Branches fold; that is kept in this browser.
 */
const KEY = "rm-admin-tree-closed";

export function SiteTree({ tree }: { tree: SiteNode[] }) {
  const path = usePathname();
  const [closed, setClosed] = useState<Set<string>>(new Set());
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) ?? "[]") as string[];
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (saved.length) setClosed(new Set(saved));
    } catch {
      /* storage blocked: all open */
    }
  }, []);
  const toggle = (k: string) =>
    setClosed((c) => {
      const x = new Set(c);
      if (x.has(k)) x.delete(k);
      else x.add(k);
      try {
        localStorage.setItem(KEY, JSON.stringify([...x]));
      } catch {
        /* ignore */
      }
      return x;
    });
  const active = (n: SiteNode) => !!n.href && (n.kind === "page" ? path === n.href : path === n.href || path.startsWith(`${n.href}/`));

  const row = (n: SiteNode, depth: number) => {
    const open = !closed.has(n.key);
    const pad = { paddingLeft: 4 + depth * 14 };
    const caret = n.children.length ? (
      <button type="button" onClick={() => toggle(n.key)} aria-label={open ? `Collapse ${n.title}` : `Expand ${n.title}`} aria-expanded={open} className="w-5 shrink-0 text-xs text-neutral-400 hover:text-neutral-900">
        {open ? "▾" : "▸"}
      </button>
    ) : (
      <span className="w-5 shrink-0" />
    );
    const label =
      n.kind === "group" ? (
        <span className="flex-1 truncate py-1.5 text-[11px] font-semibold uppercase tracking-wide text-neutral-400">{n.title}</span>
      ) : (
        <Link
          href={n.href!}
          aria-current={active(n) ? "page" : undefined}
          className={`flex min-w-0 flex-1 items-center gap-1.5 py-1.5 ${n.kind === "collection" ? "text-neutral-600" : ""}`}
          title={n.kind === "collection" ? `${n.title} — a collection of ${n.count} records` : n.title}
        >
          {n.kind === "collection" && <span aria-hidden className="text-neutral-400">▤</span>}
          {n.kind === "menu" && <span aria-hidden className="text-neutral-400">☰</span>}
          <span className="truncate">{n.title}</span>
          {n.kind === "collection" && <span className="ml-auto shrink-0 rounded bg-neutral-100 px-1.5 text-[10px] text-neutral-500">{n.count}</span>}
          {n.pending && <span className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" title="Unpublished changes or not live in a region" />}
        </Link>
      );
    return (
      <li key={n.key}>
        <div className={`flex items-center rounded pr-2 text-sm ${active(n) ? "bg-neutral-100 font-medium text-neutral-900" : "text-neutral-700 hover:bg-neutral-50"}`} style={pad}>
          {caret}
          {label}
        </div>
        {open && n.children.length > 0 && <ul>{n.children.map((c) => row(c, depth + 1))}</ul>}
      </li>
    );
  };

  return (
    <nav aria-label="Site" className="sticky top-0 flex h-screen w-64 flex-none flex-col border-r border-neutral-200 bg-white">
      <div className="flex items-baseline justify-between px-4 pb-2 pt-4">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500">Site</span>
        <span className="text-[10px] text-neutral-400">▤ collection</span>
      </div>
      <ul className="flex-1 overflow-y-auto px-2 pb-4">{tree.map((n) => row(n, 0))}</ul>
    </nav>
  );
}
