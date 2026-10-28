import Link from "next/link";
import { notFound } from "next/navigation";
import { getJob } from "@/lib/content";
import { md } from "@/lib/markdown";
import { Section, H1, Btn, Prose } from "@/components/site/primitives";
import { ContactForm } from "@/components/site/ContactForm";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const j = await getJob((await params).slug);
  return { title: j ? `${j.title} – Open Positions` : "Open Positions" };
}

export default async function JobPage({ params }: { params: Promise<{ slug: string }> }) {
  const j = await getJob((await params).slug);
  if (!j) notFound();

  return (
    <Section>
      <Link href="/open-positions" className="text-sm underline">← All positions</Link>
      <H1 className="mt-4">{j.title}</H1>
      <div className="mt-2 text-muted">{[j.department, j.location].filter(Boolean).join(" · ")}</div>
      <Prose html={md(j.descriptionMd)} className="mt-8 max-w-3xl" />
      <div className="mt-8 flex gap-3">
        {j.applyUrl && <Btn href={j.applyUrl}>Apply</Btn>}
        {j.applyEmail && <Btn href={`mailto:${j.applyEmail}?subject=${encodeURIComponent(j.title)}`} variant="secondary">Apply by email</Btn>}
      </div>
      {!j.applyUrl && !j.applyEmail && (
        <div className="mt-10 max-w-2xl border-t border-border pt-8">
          <h2 className="text-xl font-semibold">Apply for this position</h2>
          <div className="mt-4"><ContactForm form="careers" topics={[j.title]} meta={{ job: j.slug }} /></div>
        </div>
      )}
    </Section>
  );
}
