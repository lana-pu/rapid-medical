import Link from "next/link";
import { notFound } from "next/navigation";
import { getTeamMember } from "@/lib/content";
import { md } from "@/lib/markdown";
import { Section, Img, Prose } from "@/components/site/primitives";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const m = await getTeamMember((await params).slug);
  return { title: m ? `${m.name} – ${m.longTitle || m.title}` : "Team" };
}

export default async function TeamMemberPage({ params }: { params: Promise<{ slug: string }> }) {
  const m = await getTeamMember((await params).slug);
  if (!m) notFound();

  return (
    <Section>
      <Link href="/about-us#leadership" className="text-sm underline">← Leadership team</Link>
      <div className="mt-6 grid gap-8 md:grid-cols-3">
        <Img src={m.photoUrl} alt={m.name} className="aspect-square w-full rounded object-cover" />
        <div className="md:col-span-2">
          <h1 className="text-2xl font-semibold uppercase tracking-wide">{m.name}</h1>
          <div className="mt-1 text-muted uppercase">{m.longTitle || m.title}</div>
          <Prose html={md(m.bioMd)} className="mt-6 max-w-2xl" />
        </div>
      </div>
    </Section>
  );
}
