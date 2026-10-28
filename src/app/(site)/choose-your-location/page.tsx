import Link from "next/link";
import { getSetting } from "@/lib/settings";
import { Section, H1 } from "@/components/site/primitives";

export const metadata = { title: "Choose Your Location" };

const OPTIONS: { label: string; region: "us" | "ous" }[] = [
  { label: "Americas", region: "us" },
  { label: "Asia & Pacific", region: "ous" },
  { label: "Europe & Middle East", region: "ous" },
];

export default async function ChooseLocation({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const sp = await searchParams;
  const regional = await getSetting<{ chooserTitle?: string }>("regional");
  const next = sp.next && /^[a-z-]+$/.test(sp.next) ? sp.next : "therapies";

  return (
    <Section>
      <H1>{regional.chooserTitle ?? "Choose your location."}</H1>
      <p className="mt-3 max-w-xl text-muted">Product availability and regulatory information differ by region.</p>
      <ul className="mt-10 grid gap-4 sm:grid-cols-3">
        {OPTIONS.map((o) => (
          <li key={o.label}>
            <Link href={`/${o.region}/${next}`} className="block rounded border border-border p-6 text-lg font-medium hover:bg-surface">
              {o.label} →
            </Link>
          </li>
        ))}
      </ul>
    </Section>
  );
}
