/**
 * Line icons of the admin, one style with the spaces rail (24×24, stroke 1.75, no fill): docs/screens/admin-home.md →
 * «Иерархия». Decorative: the text beside the icon says what it is, so every icon is aria-hidden.
 */

const PATHS = {
  page: <><path d="M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8z" /><path d="M14 3v5h5" /></>,
  news: <><rect x="3" y="5" width="18" height="14" rx="1.5" /><path d="M7 9h6M7 13h10M7 16h7" /></>,
  event: <><rect x="3" y="5" width="18" height="16" rx="1.5" /><path d="M3 10h18M8 3v4M16 3v4" /></>,
  study: <><path d="M9 3v6l-5 9a2 2 0 0 0 1.8 3h12.4a2 2 0 0 0 1.8-3l-5-9V3" /><path d="M8 3h8M7 15h10" /></>,
  upload: <><path d="M12 16V4M7 9l5-5 5 5" /><path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" /></>,
  mail: <><rect x="3" y="5" width="18" height="14" rx="1.5" /><path d="m3.5 6 8.5 7 8.5-7" /></>,
  publish: <><path d="M12 20V9M7 13l5-5 5 5" /><path d="M5 4h14" /></>,
  brokenLink: <><path d="M9 15 7.5 16.5a3 3 0 0 1-4.2-4.2L6 9.6" /><path d="M15 9l1.5-1.5a3 3 0 0 1 4.2 4.2L18 14.4" /><path d="M8 4v2M4 8h2M16 20v-2M20 16h-2" /></>,
  image: <><rect x="3" y="4" width="18" height="16" rx="1.5" /><circle cx="9" cy="10" r="1.75" /><path d="m21 16-5-5-8 9" /></>,
  search: <><circle cx="11" cy="11" r="6.5" /><path d="m20 20-4.2-4.2" /></>,
  shield: <><path d="M12 3 5 6v5c0 4.5 3 8.2 7 10 4-1.8 7-5.5 7-10V6z" /><path d="m9 12 2 2 4-4" /></>,
  clock: <><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></>,
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  live: <><circle cx="12" cy="12" r="3" /><path d="M6.3 6.3a8 8 0 0 0 0 11.4M17.7 6.3a8 8 0 0 1 0 11.4" /></>,
  info: <><circle cx="12" cy="12" r="8.5" /><path d="M12 11v5M12 8h.01" /></>,
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({ name, className = "h-4 w-4" }: { name: IconName; className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className={`shrink-0 ${className}`} fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      {PATHS[name]}
    </svg>
  );
}
