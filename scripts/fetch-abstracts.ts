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
import { sameArticle } from "../src/lib/material";

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

async function main() {
  const sql = postgres(process.env.DATABASE_URL!, { max: 1 });
  // --recheck: check the abstracts already written against PubMed's titles again
  const recheck = process.argv.includes("--recheck");
  const rows = await sql<{ id: number; title: string; url: string | null; doi: string | null }[]>`
    select id, title, url, doi from publications where ${recheck ? sql`abstract <> ''` : sql`abstract = ''`} order by id`;
  const found: { id: number; title: string; abstract: string; source: string }[] = [];
  const missed: string[] = [];
  for (const r of rows) {
    // a PubMed link or a DOI identifies the article; a title search must agree on the title
    let byTitle = false;
    let pmid = /pubmed\.ncbi\.nlm\.nih\.gov\/(\d+)/.exec(r.url ?? "")?.[1] ?? /ncbi\.nlm\.nih\.gov\/pubmed\/(\d+)/.exec(r.url ?? "")?.[1];
    const doi = (r.doi || /doi\.org\/(10\.[^?#\s]+)/.exec(r.url ?? "")?.[1] || "").replace(/^https?:\/\/doi\.org\//, "");
    if (!pmid && doi) pmid = (await search(`${doi}[doi]`))[0];
    if (!pmid) {
      const hits = await search(`"${r.title.replace(/["…]/g, " ").replace(/\s+/g, " ").trim()}"[ti]`);
      if (hits.length === 1) { pmid = hits[0]; byTitle = true; }
    }
    if (!pmid) { missed.push(`${r.id} (not in PubMed): ${r.title.slice(0, 70)}`); continue; }
    const { abstract, title } = await fetchAbstract(pmid);
    // the hit must be this article — even by DOI (a record had another article's DOI): most words of our title
    // (often shortened with «…») are in PubMed's title
    if (!abstract || !sameArticle(r.title, title)) {
      if (recheck) await sql`update publications set abstract = '', abstract_source = '' where id = ${r.id}`;
      missed.push(`${r.id} (${abstract ? `title differs: «${title.slice(0, 50)}»` : "no abstract"} — PubMed ${pmid}): ${r.title.slice(0, 70)}`);
      continue;
    }
    const source = `PubMed ${pmid}`;
    if (recheck) continue; // already written and confirmed
    await sql`update publications set abstract = ${abstract}, abstract_source = ${source} where id = ${r.id}`;
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
