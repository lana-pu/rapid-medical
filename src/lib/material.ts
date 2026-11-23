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

/** Kinds of material in words (ADR-009). */
export const MATERIAL_KIND_LABELS: Record<string, string> = { study: "Study", publication: "Publication", news: "News", case: "Clinical case", document: "Document" };

type Placed = { id: number; title: string; regions: string[] | null; slug: string | null; showInEvidence: boolean; showInNews: boolean };
const ALL_REGIONS = ["us", "ous", "apac"];

/**
 * Every address of a material's own page (ADR-009): a kept slug (one region → /{region}/{slug}, none → /{slug}); else its
 * Evidence page in each region that shows it; else its News page. A material shown nowhere has no page yet.
 */
export function materialPaths(m: Placed): string[] {
  const regions = m.regions ?? [];
  if (m.slug) return [regions.length === 1 ? `/${regions[0]}/${m.slug}` : `/${m.slug}`];
  if (m.showInEvidence) return ALL_REGIONS.filter((r) => !regions.length || regions.includes(r)).map((r) => publicationHref(r, m));
  if (m.showInNews) return [newsHref(m)];
  return [];
}

/** The one address the admin opens for «View on the site» (the first of `materialPaths`). */
export const materialHref = (m: Placed): string | null => materialPaths(m)[0] ?? null;

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

/**
 * Pages that are materials (ADR-009 step 1, 2026-11-18): the kind of each, by its kept address. The same list moved the
 * rows in drizzle/0032_materials.sql; the seed puts these pages into materials. Legal pages and landings stay pages.
 */
export const MATERIAL_PAGES: Record<string, "study" | "publication" | "case" | "document"> = {
  "success-study-final-results": "study",
  "distals-results": "study",
  "dw24-svin-poster": "study",
  LongTerm_Outcomes: "publication",
  "comaneci-spinal-case-patankar": "case",
  "see-the-comparison": "case",
  "comparison-video": "case",
  "ifu-tigertriever-canada": "document",
};

/**
 * The product of a material kept at its old address — the old pages had none, and a therapy page lists its product's
 * studies, cases and IFU (docs/screens/therapy.md, 2026-11-19). By the title of each: DISTALS is the TIGERTRIEVER 13 trial,
 * SUCCESS and the Patankar case are COMANECI, the DW24 poster DRIVEWIRE, the IFU TIGERTRIEVER. «See the comparison» pages
 * are empty: no product. Same mapping in drizzle/0036.
 */
export const MATERIAL_PRODUCTS: Record<string, string> = {
  "success-study-final-results": "comaneci",
  "distals-results": "tigertriever-13",
  "dw24-svin-poster": "drivewire",
  "comaneci-spinal-case-patankar": "comaneci",
  "ifu-tigertriever-canada": "tigertriever",
};

/** A material kept at its own address in the shape of a text page (one region → that region, else global). */
export function materialAsPage<T extends { regions: string[] | null }>(m: T): Omit<T, "regions"> & { region: "us" | "ous" | "apac" | null } {
  const { regions, ...rest } = m;
  return { ...rest, region: regions && regions.length === 1 ? (regions[0] as "us" | "ous" | "apac") : null };
}

/**
 * Featured on Evidence per region, as on Duda (crawl 2026-11-05; decision 2026-11-18): the beginning of each title. The
 * same list is in drizzle/0034_material_featured_regions.sql; the seed applies it. A material featured in a region is
 * also shown there.
 */
export const FEATURED_ON_DUDA: { region: "us" | "ous" | "apac"; title: string }[] = [
  { region: "us", title: "Radially adjustable Tigertriever demonstrates higher reperfusion" },
  { region: "us", title: "Long-term outcomes of temporary stent-assisted coil embolization" },
  { region: "us", title: "Comaneci-assisted embolization of wide-necked aneurysms: results from the SUCCESS" },
  { region: "ous", title: "Radially adjustable Tigertriever demonstrates higher reperfusion" },
  { region: "ous", title: "Long-term outcomes of temporary stent-assisted coil embolization" },
  { region: "ous", title: "Challenging the limits of angioplasty" },
  { region: "apac", title: "Early experience with the Drivewire 24" },
  { region: "apac", title: "Advancing beyond recent randomized controlled trials" },
  { region: "apac", title: "The Anch'Or Harpoon Technique" },
];

/**
 * A study's card on its product's therapy page (docs/screens/therapy.md, 2026-11-19): «design · N» from its passport, its
 * main figure from its key figures — what the study page itself shows; nothing typed for the card.
 */
export function studyCardOf(m: { title: string; blocks?: { type: string; data: Record<string, unknown> }[] | null }) {
  const blocks = m.blocks ?? [];
  const rows = (blocks.find((b) => b.type === "passport")?.data.rows ?? []) as { label: string; value: string }[];
  const row = (re: RegExp) => rows.find((r) => re.test(r.label))?.value?.trim() || null;
  const short = (v: string | null) => (v && v.length > 40 ? null : v);
  const meta = [short(row(/design/i)), short(row(/patients|enrol|subjects/i))].filter(Boolean).join(" · ") || null;
  const fig = ((blocks.find((b) => b.type === "keyNumbers")?.data.items ?? []) as { value?: string; label?: string }[])[0];
  return { meta, figure: fig?.value ? { value: fig.value, label: fig.label ?? "" } : null };
}
