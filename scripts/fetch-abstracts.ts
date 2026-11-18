/**
 * Abstracts of the publications from PubMed (decision 2026-11-15: the article on our page — the full text where the
 * licence allows, else its abstract quoted with the source). Free NCBI E-utilities, no key (≤ 3 requests a second).
 *
 * Finds the PubMed id by the record's PubMed link, else its DOI, else its exact title (one hit only), takes the abstract
 * as published (sections «Background: …»), and writes it to records that have none. `--seed` also writes them into
 * content/seed/publications.json (matched by title), so a fresh database gets them.
 *
 *   npx tsx --env-file=.env scripts/fetch-abstracts.ts [--seed]
 */
import { readFile, writeFile } from "node:fs/promises";
import postgres from "postgres";
import { sameArticle, sameArticleByTitle } from "../src/lib/material";

const EUTILS = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils";
const TOOL = "rapid-medical-site";
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function get(url: string): Promise<string> {
  for (let i = 0; i < 3; i++) {
    const res = await fetch(url, { headers: { "User-Agent": TOOL } });
    await wait(400);
    if (res.ok) return res.text();
    if (res.status !== 429) break;
    await wait(2000);
  }
  return "";
}

async function search(term: string): Promise<string[]> {
  const json = await get(`${EUTILS}/esearch.fcgi?db=pubmed&retmode=json&tool=${TOOL}&term=${encodeURIComponent(term)}`);
  try {
    return (JSON.parse(json).esearchresult?.idlist ?? []) as string[];
  } catch {
    return [];
  }
}

const decode = (s: string) =>
  s
    .replace(/<[^>]+>/g, "")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;|&#39;/g, "'").replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16))).replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d))).replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();

/** The abstract as published: «Label: text» paragraphs, or one paragraph; with the article's title to check the hit. */
async function fetchAbstract(pmid: string): Promise<{ abstract: string; title: string }> {
  const xml = await get(`${EUTILS}/efetch.fcgi?db=pubmed&retmode=xml&tool=${TOOL}&id=${pmid}`);
  const title = decode(/<ArticleTitle[^>]*>([\s\S]*?)<\/ArticleTitle>/.exec(xml)?.[1] ?? "");
  const block = /<Abstract>([\s\S]*?)<\/Abstract>/.exec(xml)?.[1] ?? "";
  const parts = [...block.matchAll(/<AbstractText([^>]*)>([\s\S]*?)<\/AbstractText>/g)].map((m) => {
    const label = /Label="([^"]+)"/.exec(m[1])?.[1];
    const text = decode(m[2]);
    return label ? `${label.charAt(0) + label.slice(1).toLowerCase()}: ${text}` : text;
  });
  return { abstract: parts.filter(Boolean).join("\n\n"), title };
}

/** OpenAlex keeps abstracts as word → positions; rebuilt in order. By DOI, else by a title search (first agreeing hit). */
type Row = { id: number; title: string; url: string | null; doi: string | null; year: number | null; authors: string | null; journal: string | null };

async function fromOpenAlex(doi: string, ours: string, row: Row): Promise<{ abstract: string; source: string } | null> {
  type Work = { id: string; title?: string; publication_year?: number; authorships?: { author?: { display_name?: string } }[]; abstract_inverted_index?: Record<string, number[]> | null };
  const works: Work[] = [];
  let bySearch = false;
  if (doi) {
    const w = await get(`https://api.openalex.org/works/doi:${encodeURIComponent(doi)}`);
    try { works.push(JSON.parse(w)); } catch { /* not there */ }
  }
  if (!works.length) {
    const q = ours.replace(/[…"*]/g, " ").replace(/\s+/g, " ").trim();
    const w = await get(`https://api.openalex.org/works?per-page=5&search=${encodeURIComponent(q)}`);
    try { works.push(...(JSON.parse(w).results ?? [])); bySearch = true; } catch { /* nothing */ }
  }
  const agrees = (w: Work) =>
    !!w.abstract_inverted_index && !!w.title &&
    (bySearch
      ? sameArticleByTitle(ours, w.title, { year: row.year, authors: row.authors }, { year: w.publication_year, firstAuthor: w.authorships?.[0]?.author?.display_name })
      : sameArticle(ours, w.title));
  const ok = works.filter(agrees);
  // a search must point at one article: agreeing hits with different titles are ambiguous (OpenAlex often keeps one
  // article twice — the journal's and PubMed's record — with the same title: that is still one article)
  const titles = new Set(ok.map((w) => (w.title ?? "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim()));
  if (bySearch && titles.size !== 1) return null;
  for (const w of ok) {
    const inv = w.abstract_inverted_index!;
    const words: string[] = [];
    for (const [word, at] of Object.entries(inv)) for (const i of at) words[i] = word;
    const abstract = words.filter(Boolean).join(" ").replace(/\s+([.,;:)])/g, "$1").trim();
    if (abstract.length > 80) return { abstract, source: `OpenAlex ${w.id.replace("https://openalex.org/", "")}` };
  }
  return null;
}

/** Crossref has some publishers' abstracts (JATS); by DOI only. */
async function fromCrossref(doi: string, ours: string): Promise<{ abstract: string; source: string } | null> {
  if (!doi) return null;
  const j = await get(`https://api.crossref.org/works/${encodeURIComponent(doi)}`);
  try {
    const m = JSON.parse(j).message as { abstract?: string; title?: string[] };
    const title = m.title?.[0] ?? "";
    if (!m.abstract || !sameArticle(ours, title)) return null;
    const abstract = m.abstract
      .replace(/<jats:title>([^<]*)<\/jats:title>/g, "\n\n$1: ")
      .replace(/<\/jats:p>\s*<jats:p>/g, "\n\n")
      .replace(/<[^>]+>/g, "")
      .replace(/[ \t]+/g, " ")
      .replace(/^\s*Abstract:?\s*/i, "")
      .replace(/(\n\n)+/g, "\n\n")
      .trim();
    return abstract.length > 80 ? { abstract, source: `Crossref, doi:${doi}` } : null;
  } catch {
    return null;
  }
}

async function main() {
  const sql = postgres(process.env.DATABASE_URL!, { max: 1 });
  // --recheck: check the abstracts already written against PubMed's titles again
  const recheck = process.argv.includes("--recheck");
  const rows = await sql<Row[]>`
    select id, title, url, doi, extract(year from published_on)::int as year, authors, journal from materials where kind = 'publication' and ${recheck ? sql`abstract <> ''` : sql`abstract = ''`} order by id`;
  const found: { id: number; title: string; abstract: string; source: string }[] = [];
  const missed: string[] = [];
  for (const r of rows) {
    // a PubMed link or a DOI identifies the article; a title search must agree on the title
    let byTitle = false;
    let pmid = /pubmed\.ncbi\.nlm\.nih\.gov\/(\d+)/.exec(r.url ?? "")?.[1] ?? /ncbi\.nlm\.nih\.gov\/pubmed\/(\d+)/.exec(r.url ?? "")?.[1];
    // the DOI: its field, the link, or a citation pasted into the authors / journal field («Life 2021 … doi.org/10.3390/…»)
    const doi = (r.doi || /doi\.org\/(10\.[^?#\s]+)/.exec(r.url ?? "")?.[1] || /\b(10\.\d{4,9}\/[^\s,;]+[^\s,;.)])/.exec(`${r.authors ?? ""} ${r.journal ?? ""}`)?.[1] || "").replace(/^https?:\/\/doi\.org\//, "");
    if (!pmid && doi) pmid = (await search(`${doi}[doi]`))[0];
    if (!pmid) {
      const hits = await search(`"${r.title.replace(/["…]/g, " ").replace(/\s+/g, " ").trim()}"[ti]`);
      if (hits.length === 1) { pmid = hits[0]; byTitle = true; }
    }
    let got: { abstract: string; source: string } | null = null;
    if (pmid) {
      const { abstract, title } = await fetchAbstract(pmid);
      // the hit must be this article — even by DOI (a record had another article's DOI): most words of our title
      // (often shortened with «…») are in PubMed's title
      if (abstract && sameArticle(r.title, title)) got = { abstract, source: `PubMed ${pmid}` };
    }
    // not in PubMed (conference abstracts, some journals): OpenAlex, then Crossref — the same title check
    if (!got && !recheck) got = (await fromOpenAlex(doi, r.title, r)) ?? (await fromCrossref(doi, r.title));
    if (!got) {
      if (recheck && !(await sql`select abstract_source from materials where id = ${r.id}`)[0]?.abstract_source?.startsWith("PubMed")) continue;
      if (recheck) await sql`update materials set abstract = '', abstract_source = '' where id = ${r.id}`;
      missed.push(`${r.id}${pmid ? ` (PubMed ${pmid}: no agreeing abstract)` : " (nowhere)"}: ${r.title.slice(0, 70)}`);
      continue;
    }
    const { abstract, source } = got;
    if (recheck) continue; // already written and confirmed
    await sql`update materials set abstract = ${abstract}, abstract_source = ${source} where id = ${r.id}`;
    found.push({ id: r.id, title: r.title, abstract, source });
  }
  console.log(`abstracts: ${found.length} written, ${missed.length} without`);
  for (const m of missed) console.log("  –", m);

  if (process.argv.includes("--seed") && found.length) {
    const file = "content/seed/publications.json";
    const seed = JSON.parse(await readFile(file, "utf8")) as { title: string; abstract?: string; abstractSource?: string }[];
    let n = 0;
    for (const f of found) {
      const s = seed.find((x) => x.title === f.title && !x.abstract);
      if (s) { s.abstract = f.abstract; s.abstractSource = f.source; n++; }
    }
    await writeFile(file, JSON.stringify(seed, null, 2) + "\n");
    console.log(`seed: ${n} records updated`);
  }
  await sql.end();
}
main().catch((e) => { console.error(e); process.exit(1); });
