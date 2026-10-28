import Link from "next/link";
import { regionOr404 } from "@/lib/region-param";
import { getSolutionsNav } from "@/lib/content";
import { REGION_LABELS } from "@/lib/regions";
import { Section, H1, Eyebrow, Img } from "@/components/site/primitives";

export async function generateMetadata({ params }: { params: Promise<{ seg: string }> }) {
  const region = regionOr404((await params).seg);
  return { title: `Our Therapies – ${REGION_LABELS[region]}`, description: "Our devices enable real-time responses for stroke patients." };
}

export default async function TherapiesIndex({ params }: { params: Promise<{ seg: string }> }) {
  const region = regionOr404((await params).seg);
  const items = await getSolutionsNav(region);

  return (
    <Section>
      <Eyebrow>{REGION_LABELS[region]} · <Link href="/choose-your-location" className="underline">change</Link></Eyebrow>
      <H1>Our Therapies</H1>
      <ul className="mt-10 grid gap-6 md:grid-cols-2">
        {items.map((s) => (
          <li key={s.slug}>
            <Link href={`/${region}/therapies/${s.slug}`} className="group block rounded border border-border p-6 hover:bg-surface">
              <Img src={s.heroImageUrl} className="mb-4 aspect-video w-full rounded object-cover" />
              <div className="text-xs font-semibold uppercase tracking-widest text-muted">{s.navLabel}</div>
              <h2 className="mt-1 text-xl font-medium group-hover:underline">{s.heroTitle}</h2>
              {s.heroBody && <p className="mt-2 line-clamp-3 text-sm text-muted">{s.heroBody}</p>}
            </Link>
          </li>
        ))}
      </ul>
    </Section>
  );
}
