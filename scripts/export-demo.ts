/**
 * Static demo export (GitHub Pages).
 *
 * Builds the app in demo mode, starts it, crawls every public page plus a
 * representative set of admin pages, and writes a fully static site to out/.
 * The on-page editor and admin forms "save" into the visitor's browser only
 * (see src/lib/demo.ts, src/components/editor/demo-store.ts, DemoShell.tsx).
 *
 *   DATABASE_URL=… npx tsx scripts/export-demo.ts            # BASE defaults to /rapid-medical
 *   DEMO_BASE_PATH=/other-repo npx tsx scripts/export-demo.ts
 *   SKIP_BUILD=1 … → reuse the existing .next build
 */
import { execSync, spawn } from "node:child_process";
import { cp, mkdir, readdir, rm, writeFile } from "node:fs/promises";
import crypto from "node:crypto";
import path from "node:path";
import postgres from "postgres";

const BASE = process.env.DEMO_BASE_PATH ?? "/rapid-medical";
const PORT = Number(process.env.DEMO_PORT ?? 3100);
const ORIGIN = `http://localhost:${PORT}`;
const SITE_URL = process.env.DEMO_SITE_URL ?? `https://lana-pu.github.io${BASE}`;
const OUT = path.resolve("out");
const DB = process.env.DATABASE_URL!;
if (!DB) throw new Error("DATABASE_URL is not set");

const env = { ...process.env, NEXT_PUBLIC_DEMO: "1", NEXT_PUBLIC_BASE_PATH: BASE, NEXT_PUBLIC_SITE_URL: SITE_URL, NODE_ENV: "production" as const };

function outFile(p: string) {
  const clean = p.replace(/^\//, "").replace(/\/$/, "");
  return path.join(OUT, clean, "index.html");
}

/** Absolute references to files in public/ must carry the basePath on GitHub Pages. */
let publicEntries: string[] = [];
function rewrite(html: string) {
  const names = publicEntries.map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
  const re = new RegExp(`(?<!${BASE.replace(/\//g, "\\/")})/(${names})(?=[/"'?\\s,)\\\\])`, "g");
  return html.replace(re, `${BASE}/$1`);
}

async function main() {
  if (!process.env.SKIP_BUILD) {
    console.log("building demo bundle…");
    execSync("npx next build", { stdio: "inherit", env });
  }

  // admin session for crawling the admin
  const sql = postgres(DB, { max: 1 });
  const [admin] = await sql<{ id: number }[]>`select id from users where role = 'admin' and active order by id limit 1`;
  if (!admin) throw new Error("no admin user in the database");
  const sid = crypto.randomBytes(32).toString("hex");
  await sql`insert into sessions (id, user_id, verified, expires_at) values (${sid}, ${admin.id}, true, now() + interval '1 hour')`;
  const resources = ["site-pages", "solutions", "publications", "events", "news", "webinars", "team", "jobs", "pages", "products", "redirects"];
  const table: Record<string, string> = { news: "news_items", team: "team_members", "site-pages": "site_pages" };
  const ids: Record<string, number[]> = {};
  for (const r of resources) ids[r] = (await sql.unsafe<{ id: number }[]>(`select id from "${table[r] ?? r}" order by id`)).map((x) => x.id);
  // The demo is public and its admin pages show drafts, history and who edited: only test accounts may exist
  // (the e2e setup creates them), so a real database is never exported.
  const [people] = await sql<{ n: number }[]>`select count(*)::int as n from users where email not ilike '%@e2e.test' and email <> 'e2e@rapid-medical.com' and email not ilike '%@example.com'`;
  if (people.n > 0) throw new Error(`the database has ${people.n} real user accounts — build the demo from a test database (npm run test:e2e seeds one)`);
  // The demo is public: form submissions (list and details) may only be test data on the reserved example.com domain.
  const [real] = await sql<{ n: number }[]>`select count(*)::int as n from contact_submissions where email not ilike '%@example.com'`;
  if (real.n > 0) throw new Error(`the database has ${real.n} real form submissions — build the demo from a test database (npm run test:e2e seeds one)`);
  const submissionIds = (await sql<{ id: number }[]>`select id from contact_submissions order by id`).map((x) => x.id);
  const media = await sql<{ id: number; url: string; filename: string; mime: string; size: number; alt: string; createdAt: Date }[]>`select id, url, filename, mime, size, alt, created_at as "createdAt" from media where url like '/uploads/%' order by id desc`;
  const hiddenPages = await sql<{ slug: string; region: string | null }[]>`select slug, region from pages where noindex and status = 'published'`;
  await sql.end();

  try {
    await fetch(`${ORIGIN}${BASE}/api/health`);
    throw new Error(`port ${PORT} is already in use – stop that server first (pkill -f next-server)`);
  } catch (e) {
    if ((e as Error).message.startsWith("port")) throw e;
  }
  console.log("starting server…");
  const server = spawn(process.execPath, [path.resolve("node_modules/next/dist/bin/next"), "start", "-p", String(PORT)], { env, stdio: "ignore" });
  const stop = () => { try { server.kill("SIGTERM"); } catch { /* ignore */ } };
  process.on("exit", stop);
  let up = false;
  for (let i = 0; i < 60 && !up; i++) {
    try {
      up = (await fetch(`${ORIGIN}${BASE}/api/health`)).ok;
    } catch { /* not yet */ }
    if (!up) await new Promise((r) => setTimeout(r, 1000));
  }
  if (!up || server.exitCode !== null) throw new Error(`server did not start on port ${PORT} (already in use by a stale server?)`);

  const get = async (p: string, cookie = "") => {
    const res = await fetch(`${ORIGIN}${BASE}${p === "/" ? "" : p}`, { headers: cookie ? { cookie } : {}, redirect: "manual" });
    return { status: res.status, location: res.headers.get("location"), html: await res.text() };
  };

  publicEntries = await readdir(path.resolve("public"));
  await rm(OUT, { recursive: true, force: true });
  await mkdir(OUT, { recursive: true });

  // 1. public pages (from the sitemap) + redirect stubs
  const sm = await (await fetch(`${ORIGIN}${BASE}/sitemap.xml`)).text();
  const paths = Array.from(sm.matchAll(/<loc>([^<]+)<\/loc>/g)).map((m) => new URL(m[1]).pathname.replace(new RegExp(`^${BASE}`), "") || "/");
  // noindex, so not in the sitemap: the style guide, and the location chooser (Pages has no IP region, so every page without one links to it)
  for (const extra of ["/us", "/ous", "/apac", "/style-guide", "/choose-your-location", "/this-page-does-not-exist"]) paths.push(extra);
  for (const p of hiddenPages) paths.push(p.region ? `/${p.region}/${p.slug}` : `/${p.slug}`); // noindex pages are not in the sitemap
  let n = 0;
  for (const p of paths) {
    const r = await get(p);
    let html = r.html;
    if (r.status >= 300 && r.status < 400 && r.location) {
      const to = new URL(r.location, ORIGIN).pathname;
      html = `<!doctype html><meta http-equiv="refresh" content="0;url=${to}"><a href="${to}">${to}</a>`;
    } else if (r.status !== 200 && p !== "/this-page-does-not-exist") {
      console.warn(`  ✗ ${p} → ${r.status}`);
      continue;
    }
    const file = p === "/this-page-does-not-exist" ? path.join(OUT, "404.html") : outFile(p);
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, rewrite(html));
    n++;
  }
  console.log(`${n} public pages`);

  // 2. admin pages (read-only preview; forms are intercepted client-side)
  const cookie = `rm_admin=${sid}`;
  // /admin/start after sign-in (admin-choose.md), /admin = what needs you (admin-home.md), /admin/editor = Pages
  const adminPaths = ["/admin/start", "/admin", "/admin/editor", ...["home", "therapies", "evidence", "webinars", "news-events", "about", "careers", "contact", "other", "menu"].map((k) => `/admin/site/${k}`), "/admin/login", "/admin/settings", "/admin/media", "/admin/submissions", "/admin/users", "/admin/activity", "/admin/account", "/admin/not-found-log"];
  for (const r of resources) {
    adminPaths.push(`/admin/${r}`);
    if (r !== "site-pages") adminPaths.push(`/admin/${r}/new`); // site pages exist once: no «new»
    for (const id of ids[r]) adminPaths.push(`/admin/${r}/${id}`);
    if (ids[r][0]) adminPaths.push(`/admin/${r}/${ids[r][0]}/history`);
  }
  for (const id of submissionIds) adminPaths.push(`/admin/submissions/${id}`);
  // page screens of the site tree (docs/screens/admin-sections.md): their links are in every admin page's left column
  const home = await get("/admin", cookie);
  for (const m of home.html.matchAll(/href="(\/admin\/page[^"#?]*)"/g)) if (!adminPaths.includes(m[1])) adminPaths.push(m[1]);
  let a = 0;
  for (const p of adminPaths) {
    const r = await get(p, p === "/admin/login" ? "" : cookie); // login page redirects when signed in
    if (r.status !== 200) { console.warn(`  ✗ ${p} → ${r.status}`); continue; }
    const file = outFile(p);
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, rewrite(r.html));
    a++;
  }
  console.log(`${a} admin pages`);

  // 3. static assets + demo data
  await cp(path.resolve(".next/static"), path.join(OUT, "_next/static"), { recursive: true });
  await cp(path.resolve("public"), OUT, { recursive: true });
  await mkdir(path.join(OUT, "demo"), { recursive: true });
  await writeFile(path.join(OUT, "demo/media.json"), JSON.stringify(media.map((m) => ({ ...m, url: `${BASE}${m.url}` }))));
  await writeFile(path.join(OUT, ".nojekyll"), "");
  await writeFile(path.join(OUT, "index.html"), rewrite((await get("/")).html)); // ensure root exists even if sitemap changed
  console.log(`done → ${OUT}`);
  stop();
  process.exit(0);
}
main().catch((e) => { console.error(e); process.exit(1); });
