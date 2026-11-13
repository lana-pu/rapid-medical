import Link from "next/link";
import { headers } from "next/headers";
import { and, eq } from "drizzle-orm";
import { db, solutions } from "@/db";
import { Section, H1 } from "@/components/site/primitives";
import { REGION_CHOICES } from "@/lib/regions";

const regionName = (r: string) => REGION_CHOICES.find((c) => c.region === r)?.label ?? r;

/**
 * Page not found. A therapy that exists in other regions but not in this one is not a dead end: it says so and links
 * to it where it exists and to this region's therapies (docs/screens/therapy.md, usability pass 2026-11-13).
 */
export default async function NotFound() {
  const path = (await headers()).get("x-rm-path") ?? "";
  const m = /^\/(us|ous|apac)\/therapies\/([a-z0-9-]+)\/?$/.exec(path);
  const elsewhere = m
    ? await db
        .select({ region: solutions.region, label: solutions.navLabel })
        .from(solutions)
        .where(and(eq(solutions.slug, m[2]), eq(solutions.status, "published")))
    : [];
  if (m && elsewhere.length) {
    const [, region, slug] = m;
    return (
      <Section>
        <title>{`${elsewhere[0].label} — not available in ${regionName(region)} | Rapid Medical™`}</title>
        <H1>{elsewhere[0].label} is not available in {regionName(region)}</H1>
        <p className="mt-4 text-muted">Product availability differs by region. This therapy is available in:</p>
        <ul className="mt-4 space-y-2">
          {elsewhere.map((e) => (
            <li key={e.region}>
              <Link href={`/${e.region}/therapies/${slug}`} className="underline">{e.label} — {regionName(e.region)}</Link>
            </li>
          ))}
        </ul>
        <Link href={`/${region}/therapies`} className="mt-6 inline-block underline">All therapies in {regionName(region)}</Link>
      </Section>
    );
  }
  return (
    <Section>
      {/* the tab and the history say what this is (metadata does not reach a group's not-found) */}
      <title>Page not found | Rapid Medical™</title>
      <H1>Page not found</H1>
      <p className="mt-4 text-muted">The page you’re looking for doesn’t exist or has moved.</p>
      <Link href="/" className="mt-6 inline-block underline">Back to home</Link>
    </Section>
  );
}
