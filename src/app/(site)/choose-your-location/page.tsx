import Link from "next/link";
import { getSetting } from "@/lib/settings";
import { getSuggestedRegion } from "@/lib/region-cookie";
import { REGION_CHOICES } from "@/lib/regions";
import { Section, H1 } from "@/components/site/primitives";

export const metadata = { title: "Choose Your Location", description: "Access tailored neurovascular therapy options worldwide." };

export default async function ChooseLocation({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const sp = await searchParams;
  const [regional, suggested] = await Promise.all([getSetting<{ chooserTitle?: string; chooserNote?: string }>("regional"), getSuggestedRegion()]);
  const next = sp.next && /^[a-z-]+$/.test(sp.next) ? sp.next : "therapies";

  return (
    <Section>
      <H1>{regional.chooserTitle ?? "Choose your location."}</H1>
      <p className="mt-3 max-w-xl text-muted">{regional.chooserNote ?? "Product availability and regulatory information differ by region."}</p>
      <ul className="mt-10 grid gap-4 sm:grid-cols-3">
        {REGION_CHOICES.map((o) => (
          <li key={o.label}>
            <Link href={`/${o.region}/${next}`} className={`block rounded border p-6 text-lg font-medium hover:bg-surface ${suggested === o.region ? "border-foreground" : "border-border"}`}>
              {o.label} →
              {suggested === o.region && <span className="mt-1 block text-xs font-normal text-muted">Suggested for your location</span>}
            </Link>
          </li>
        ))}
      </ul>
    </Section>
  );
}
