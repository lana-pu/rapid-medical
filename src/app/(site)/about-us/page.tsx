import Link from "next/link";
import { getSetting } from "@/lib/settings";
import { getTeam } from "@/lib/content";
import { Section, H1, H2, Img, Btn } from "@/components/site/primitives";
import { WorldMap } from "@/components/site/WorldMap";
import { E, EMedia } from "@/components/site/editable";

export const metadata = {
  title: "About Us",
  description: "Learn about our innovative neurovascular solutions for stroke treatment.",
};

type About = { intro?: string; whatWeDoTitle?: string; whatWeDoBody?: string; leadershipIntro?: string; heroImageUrl?: string; mapTitle?: string; mapSub?: string; mapFallbackImageUrl?: string; closingLine?: string };
type Office = { name: string; label?: string; address?: string; phone?: string; fax?: string; ordersEmail?: string; lat?: number; lon?: number };

export default async function AboutPage() {
  const [about, contact, team] = await Promise.all([getSetting<About>("about"), getSetting<{ offices?: Office[] }>("contact"), getTeam()]);
  const offices = contact.offices ?? [];
  const R = { r: "settings:about" } as const;
  const C = { r: "settings:contact" } as const;

  return (
    <>
      <Section>
        <H1>About Us</H1>
        {about.intro && <p className="mt-6 max-w-3xl text-xl"><E {...R} f="intro">{about.intro}</E></p>}
        {about.heroImageUrl && <EMedia {...R} f="heroImageUrl" className="mt-10"><Img src={about.heroImageUrl} className="aspect-[21/9] w-full rounded object-cover" /></EMedia>}
      </Section>

      <Section className="bg-surface">
        <H2><E {...R} f="whatWeDoTitle">{about.whatWeDoTitle ?? "What we do"}</E></H2>
        {about.whatWeDoBody && <p className="mt-4 max-w-3xl text-muted"><E {...R} f="whatWeDoBody">{about.whatWeDoBody}</E></p>}
      </Section>

      <Section id="leadership">
        <H2>Leadership Team</H2>
        {about.leadershipIntro && <p className="mt-4 max-w-3xl text-muted"><E {...R} f="leadershipIntro">{about.leadershipIntro}</E></p>}
        <ul className="mt-10 grid gap-8 sm:grid-cols-2 md:grid-cols-3">
          {team.map((m) => (
            <li key={m.id}>
              <Link href={`/team/${m.slug}`} className="group block">
                <EMedia r="team" id={m.id} f="photoUrl"><Img src={m.photoUrl} alt={m.name} className="aspect-square w-full rounded object-cover" /></EMedia>
                <div className="mt-3 font-semibold uppercase tracking-wide"><E r="team" id={m.id} f="name">{m.name}</E></div>
                <div className="text-sm text-muted group-hover:underline"><E r="team" id={m.id} f="title">{m.title}</E> →</div>
              </Link>
            </li>
          ))}
        </ul>
      </Section>

      {offices.length > 0 && (
        <Section className="bg-surface" id="offices">
          <H2>Global Offices</H2>
          <ul className="mt-8 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {offices.map((o, i) => (
              <li key={i} className="text-sm">
                <div className="font-semibold"><E {...C} f={`offices.${i}.name`}>{o.name}</E></div>
                {o.label && <div className="text-muted"><E {...C} f={`offices.${i}.label`}>{o.label}</E></div>}
                {o.address && <p className="mt-2 whitespace-pre-line"><E {...C} f={`offices.${i}.address`}>{o.address}</E></p>}
                {o.phone && <div className="mt-2">Tel: <a href={`tel:${o.phone}`}><E {...C} f={`offices.${i}.phone`}>{o.phone}</E></a></div>}
                {o.fax && <div>Fax: <E {...C} f={`offices.${i}.fax`}>{o.fax}</E></div>}
                {o.ordersEmail && <div className="mt-2">Orders: <a className="underline" href={`mailto:${o.ordersEmail}`}>{o.ordersEmail}</a></div>}
              </li>
            ))}
          </ul>
        </Section>
      )}

      <Section id="map">
        <div className="max-w-3xl">
          {about.mapTitle && <H2><E {...R} f="mapTitle">{about.mapTitle}</E></H2>}
          {about.mapSub && <p className="mt-3 text-muted"><E {...R} f="mapSub">{about.mapSub}</E></p>}
        </div>
        <div className="mt-8">
          <WorldMap
            offices={offices.filter((o) => o.lat != null && o.lon != null).map((o) => ({ lat: o.lat!, lon: o.lon!, label: o.name }))}
            links={{
              usa: "/contact-us?region=us",
              canada: "/contact-us?region=us",
              latam: "/contact-us?region=ous",
              europe: "/contact-us?region=ous",
              australia: "/contact-us?region=ous",
              middleeast: "/contact-us?region=apac",
              asia: "/contact-us?region=apac",
            }}
            fallbackImageUrl={about.mapFallbackImageUrl}
          />
        </div>
        <div className="mt-10 flex flex-wrap items-center gap-4">
          <p className="text-lg"><E {...R} f="closingLine">{about.closingLine ?? "Have a question? We’d love to hear from you."}</E></p>
          <Btn href="/contact-us">Contact us</Btn>
        </div>
      </Section>
    </>
  );
}
