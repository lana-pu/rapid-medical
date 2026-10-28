import Link from "next/link";
import { getJobs } from "@/lib/content";
import { Section, H1 } from "@/components/site/primitives";

export const metadata = { title: "Open Positions", description: "Explore job opportunities at Rapid Medical." };

export default async function OpenPositionsPage() {
  const jobs = await getJobs();
  return (
    <Section>
      <H1>Join us</H1>
      {jobs.length === 0 ? (
        <p className="mt-6 text-muted">
          There are no open positions right now. You can still <Link href="/careers#general-interest" className="underline">submit general interest</Link>.
        </p>
      ) : (
        <ul className="mt-10 divide-y divide-border">
          {jobs.map((j) => (
            <li key={j.id} className="py-4">
              <Link href={`/open-positions/${j.slug}`} className="text-lg font-medium hover:underline">{j.title}</Link>
              <div className="text-sm text-muted">{[j.department, j.location].filter(Boolean).join(" · ")}</div>
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}
