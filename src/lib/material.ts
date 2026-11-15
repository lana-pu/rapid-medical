/**
 * Own pages of publications and news (ADR-009 «material», decision 2026-11-15: every record has one). Addresses carry
 * the record id and a readable slug from the title: /{region}/evidence/{id}-{slug}, /news-events/{id}-{slug}.
 * The id decides; a different slug redirects to the right one. Safe on client and server.
 */
export function titleSlug(title: string): string {
  return title
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[™®©]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .replace(/^(.{0,80})-.*$/, (all, head: string) => (all.length > 80 ? head : all))
    .replace(/-+$/, "") || "item";
}

export const publicationHref = (region: string, p: { id: number; title: string }) => `/${region}/evidence/${p.id}-${titleSlug(p.title)}`;
export const newsHref = (n: { id: number; title: string }) => `/news-events/${n.id}-${titleSlug(n.title)}`;

/** «123-some-title» → 123; anything else → null. */
export function idFromParam(param: string): number | null {
  const m = /^(\d{1,9})(?:-[a-z0-9-]*)?$/.exec(param);
  return m ? Number(m[1]) : null;
}

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[^a-z0-9]+/g, " ").trim();

/**
 * Our title (maybe shortened, maybe with a «Technical video:» prefix) and PubMed's: at least 60% of our words longer than
 * 3 letters are in PubMed's title; hyphens do not matter («Post-Traumatic» = «Posttraumatic»).
 */
export function sameArticle(ours: string, theirs: string): boolean {
  const flat = (s: string) => s.replace(/(\w)-(\w)/g, "$1$2");
  const words = norm(flat(ours)).split(" ").filter((w) => w.length > 3);
  const pool = new Set(norm(flat(theirs)).split(" "));
  if (!words.length) return false;
  return words.filter((w) => pool.has(w)).length / words.length >= 0.6;
}

/**
 * A hit found only by searching our title (no DOI, no PubMed link) is trusted only when the title says enough and
 * something else agrees (security review 2026-11-15 — a short or cut title had matched other articles):
 * at least 4 words longer than 3 letters, all of them in the hit's title **in the same order**; a title cut with «…»
 * agrees with the hit's beginning; and the year (±1) or the first author's surname agrees with the record.
 */
export function sameArticleByTitle(
  ours: string,
  theirs: string,
  record?: { year?: number | null; authors?: string | null },
  hit?: { year?: number | null; firstAuthor?: string | null },
): boolean {
  // hyphens both ways: «Single center» = «Single-Center», «Post-Traumatic» = «Posttraumatic»
  const check = (flat: (x: string) => string) => {
    const words = flat(ours).split(" ").filter((w) => w.length > 3);
    if (words.length < 4) return false;
    const seq = flat(theirs).split(" ");
    let at = 0;
    for (const w of words) {
      const i = seq.indexOf(w, at);
      if (i < 0) return false;
      at = i + 1;
    }
    if (!ours.includes("…")) return true;
    const first = ours.split("…").map((x) => flat(x)).filter(Boolean)[0];
    return flat(theirs).startsWith(first);
  };
  if (!(check((x) => norm(x.replace(/(\w)-(\w)/g, "$1$2"))) || check((x) => norm(x)))) return false;
  if (!record || !hit) return true;
  const yearOk = !!record.year && !!hit.year && Math.abs(record.year - hit.year) <= 1;
  const surname = norm(hit.firstAuthor ?? "").split(" ").filter((w) => w.length > 2).pop();
  const authorOk = !!surname && norm(record.authors ?? "").split(" ").includes(surname);
  return yearOk || authorOk;
}
