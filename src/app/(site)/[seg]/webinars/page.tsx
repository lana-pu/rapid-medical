import { regionOr404 } from "@/lib/region-param";
import { REGION_FORM_VALUE } from "@/lib/regions";
import { getWebinars } from "@/lib/content";
import { Section, H1, Img } from "@/components/site/primitives";
import { ContactForm } from "@/components/site/ContactForm";
import { E, EMedia } from "@/components/site/editable";

export async function generateMetadata({ params }: { params: Promise<{ seg: string }> }) {
  regionOr404((await params).seg);
  return { title: "Webinars" };
}

export default async function WebinarsPage({ params }: { params: Promise<{ seg: string }> }) {
  const region = regionOr404((await params).seg);
  const list = await getWebinars(region);

  return (
    <Section>
      <H1>Webinars</H1>
      <p className="mt-4 max-w-2xl text-muted">Physician-led webinars are available to view on-demand. To request a recording, please fill in the form below.</p>

      {list.length > 0 && (
        <ul className="mt-10 grid gap-6 md:grid-cols-3">
          {list.map((w) => (
            <li key={w.id} className="rounded border border-border p-5">
              <EMedia r="webinars" id={w.id} f="imageUrl" className="mb-4"><Img src={w.imageUrl} className="aspect-video w-full rounded object-cover" /></EMedia>
              <div className="font-medium"><E r="webinars" id={w.id} f="title">{w.title}</E></div>
              <div className="mt-1 text-sm text-muted">{[w.speaker, w.event].filter(Boolean).join(" · ")}</div>
              {w.product && <div className="mt-1 text-xs uppercase text-muted">{w.product.name}</div>}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-12 max-w-2xl">
        <ContactForm form="webinar" topics={list.length ? list.map((w) => w.title) : ["Webinar recording request"]} defaultRegion={REGION_FORM_VALUE[region]} compact />
      </div>
    </Section>
  );
}
