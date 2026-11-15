/**
 * Inbox helpers without the database (docs/screens/admin-inbox.md): the Mailchimp list from requests with the
 * newsletter box ticked, and where an external registration or application leads, in words.
 */

export type SubscriberSource = {
  email: string;
  firstName: string;
  lastName: string;
  organization: string;
  country: string;
  region: string;
  form: string;
  optIn: boolean;
  status: string;
  createdAt: Date;
};

/** One row per person (email, case-insensitive) from their latest request; spam and unticked boxes left out. */
export function subscribers<T extends SubscriberSource>(rows: T[]): T[] {
  const latest = new Map<string, T>();
  for (const r of rows) {
    if (!r.optIn || r.status === "spam") continue;
    const key = r.email.trim().toLowerCase();
    if (!key) continue;
    const had = latest.get(key);
    if (!had || had.createdAt < r.createdAt) latest.set(key, r);
  }
  return [...latest.values()].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

/** "spark-hire.com" for a link, the address for an email; null when it is neither. */
export function whereTo(urlOrEmail: string | null | undefined): string | null {
  const v = (urlOrEmail ?? "").trim();
  if (!v) return null;
  if (/^mailto:/i.test(v)) return v.slice(7).split("?")[0] || null;
  if (/^[^\s@/]+@[^\s@/]+$/.test(v)) return v;
  try {
    return new URL(v).host.replace(/^www\./, "") || null;
  } catch {
    return null;
  }
}
