import Link from "next/link";
import { notFound } from "next/navigation";
import { getTeamMember } from "@/lib/content";
import { safeHtml } from "@/lib/html";
import { Section, Img, Prose } from "@/components/site/primitives";
import { E, EMedia } from "@/components/site/editable";

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
        <EMedia r="team" id={m.id} f="photoUrl"><Img src={m.photoUrl} alt={m.name} className="aspect-square w-full rounded object-cover" /></EMedia>
        <div className="md:col-span-2">
          <h1 className="text-2xl font-semibold uppercase tracking-wide"><E r="team" id={m.id} f="name">{m.name}</E></h1>
          <div className="mt-1 text-muted uppercase"><E r="team" id={m.id} f={m.longTitle ? "longTitle" : "title"}>{m.longTitle || m.title}</E></div>
          <E r="team" id={m.id} f="bioHtml" k="rich" className="mt-6 max-w-2xl"><Prose html={safeHtml(m.bioHtml)} /></E>
        </div>
      </div>
    </Section>
  );
}
