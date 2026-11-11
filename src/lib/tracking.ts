/**
 * Analytics (decision 2026-11-10, spec → Интеграции → Аналитика): the site reports what matters to GA4 itself
 * (variant Б) and writes where the visitor came from into every form submission (variant Г).
 * Client-side only; every browser API is guarded, so a blocked storage or a missing gtag never breaks a page.
 */

type Gtag = (command: "event", name: string, params?: Record<string, string>) => void;

/** Sends a GA4 event when GA is configured and loaded; otherwise does nothing. */
export function track(name: string, params: Record<string, string> = {}) {
  const gtag = (globalThis as { gtag?: Gtag }).gtag;
  if (typeof gtag === "function") gtag("event", name, params);
}

const KEY = "rm_attr";
const UTM = ["utm_source", "utm_medium", "utm_campaign"] as const;
const cut = (s: string) => s.slice(0, 300);

/** First page of the visit and where it came from, kept for the browser tab's session. Call on every page load. */
export function captureFirstTouch() {
  try {
    if (sessionStorage.getItem(KEY)) return;
    const url = new URL(location.href);
    const first: Record<string, string> = { landing_page: cut(url.pathname + url.search) };
    first.referrer = document.referrer && new URL(document.referrer).host !== location.host ? cut(document.referrer) : "(direct)";
    for (const k of UTM) {
      const v = url.searchParams.get(k);
      if (v) first[k] = cut(v);
    }
    sessionStorage.setItem(KEY, JSON.stringify(first));
  } catch {
    /* storage blocked: the submission just has no source */
  }
}

/** Source fields for a form submission: the page it is sent from plus the first touch of the visit. */
export function attribution(): Record<string, string> {
  const out: Record<string, string> = {};
  try {
    out.form_page = cut(location.pathname);
    const first = JSON.parse(sessionStorage.getItem(KEY) ?? "{}") as Record<string, unknown>;
    for (const [k, v] of Object.entries(first)) if (typeof v === "string") out[k] = cut(v);
  } catch {
    /* ignore */
  }
  return out;
}

const THERAPY = /^\/(us|ous|apac)\/therapies\/([a-z0-9-]+)\/?$/;
const OVERVIEW = /^\/(us|ous|apac)\/therapies\/?$/;

/** GA4 event for a click on a link, or null when the click is not worth reporting. */
export function eventForLink(href: string, ctx: { inHeader: boolean; pathname: string }): { name: string; params: Record<string, string> } | null {
  if (href.startsWith("mailto:")) return { name: "click_email", params: { link_url: cut(href.slice(7).split("?")[0]) } };
  let path: string;
  try {
    path = new URL(href, "https://x.invalid").pathname;
  } catch {
    return null;
  }
  const m = THERAPY.exec(path);
  if (m) {
    const source = ctx.inHeader ? "menu" : OVERVIEW.test(ctx.pathname) ? "overview" : "page";
    return { name: "select_therapy", params: { region: m[1], therapy: m[2], source } };
  }
  return null;
}
