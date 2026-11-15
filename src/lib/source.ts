/**
 * Where a visit or a request came from, in words (docs/screens/admin-analytics.md): the same rules for the visit
 * counter and the requests, so the two can be read side by side. Pure.
 */
export type SourceInput = { referrer?: string | null; utm_source?: string | null; utm_medium?: string | null };

const SEARCH = /(^|\.)(google|bing|duckduckgo|yahoo|yandex|baidu|ecosia)\./i;

export function hostOf(url: string | null | undefined): string | null {
  if (!url || url === "(direct)") return null;
  try {
    return new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return null;
  }
}

export function sourceOf(x: SourceInput): string {
  const utm = (x.utm_source ?? "").toLowerCase();
  const medium = (x.utm_medium ?? "").toLowerCase();
  const host = hostOf(x.referrer);
  if (/linkedin|lnkd/.test(utm) || (host && /(^|\.)(linkedin\.com|lnkd\.in)$/.test(host))) return "LinkedIn";
  if (/^(e-?mail|newsletter)$/.test(medium) || /mailchimp|newsletter/.test(utm)) return "Email";
  if (utm === "google" || (host && /(^|\.)google\./.test(host))) return "Google";
  if (host && SEARCH.test(`${host}.`)) return "Other search engines";
  if (utm) return `Campaign: ${x.utm_source}`;
  if (!host) return "Direct";
  return host;
}
