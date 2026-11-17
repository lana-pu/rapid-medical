/**
 * Names and positions came from Duda in CAPITALS ("CO-FOUNDER & CEO"). The site shows them in the usual case
 * (DESIGN.md → About): words capitalised, abbreviations kept, short joining words lower. Text that already has
 * lower-case letters is left as the editor typed it.
 */
const KEEP = new Set(["CEO", "CFO", "CTO", "COO", "CMO", "CCO", "VP", "EVP", "SVP", "R&D", "QA", "RA", "USA", "US", "UK", "EU", "APAC", "EMEA", "MD", "PHD", "MBA"]);
const SMALL = new Set(["and", "of", "the", "for", "in", "on", "at", "to", "a", "an"]);

export function displayCase(s: string | null | undefined): string {
  if (!s) return "";
  if (/[a-z]/.test(s)) return s;
  let first = true;
  return s.replace(/[A-Z][A-Z&.']*/g, (w) => {
    const bare = w.replace(/\.$/, "");
    const out = KEEP.has(bare) ? (bare === "PHD" ? "PhD" : w) : !first && SMALL.has(w.toLowerCase()) ? w.toLowerCase() : w.charAt(0) + w.slice(1).toLowerCase();
    first = false;
    return out;
  });
}

/** First sentences of an HTML text, as plain text — the short bio under a team card. */
export function plainText(html: string | null | undefined): string {
  return (html ?? "").slice(0, 20000).replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&#39;|&rsquo;/g, "’").replace(/\s+/g, " ").trim();
}
