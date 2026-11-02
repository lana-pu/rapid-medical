import Link from "next/link";
import { getSetting } from "@/lib/settings";
import { getTeam } from "@/lib/content";
import { Section, H1, H2, Img, Btn } from "@/components/site/primitives";
import { WorldMap } from "@/components/site/WorldMap";

export const metadata = {
  title: "About Us",
  description: "Learn about our innovative neurovascular solutions for stroke treatment.",
};

type About = { intro?: string; whatWeDoTitle?: string; whatWeDoBody?: string; leadershipIntro?: string; heroImageUrl?: string; mapTitle?: string; mapSub?: string; mapFallbackImageUrl?: string; closingLine?: string };
type Office = { name: string; label?: string; address?: string; phone?: string; fax?: string; ordersEmail?: string; lat?: number; lon?: number };

export default async function AboutPage() {
  const [about, contact, team] = await Promise.all([getSetting<About>("about"), getSetting<{ offices?: Office[] }>("contact"), getTeam()]);
  const offices = contact.offices ?? [];

  return (
    <>
      <Section>
        <H1>About Us</H1>
        {about.intro && <p className="mt-6 max-w-3xl text-xl">{about.intro}</p>}
        {about.heroImageUrl && <Img src={about.heroImageUrl} className="mt-10 aspect-[21/9] w-full rounded object-cover" />}
      </Section>

      <Section className="bg-surface">
        <H2>{about.whatWeDoTitle ?? "What we do"}</H2>
        {about.whatWeDoBody && <p className="mt-4 max-w-3xl text-muted">{about.whatWeDoBody}</p>}
      </Section>

      <Section id="leadership">
        <H2>Leadership Team</H2>
        {about.leadershipIntro && <p className="mt-4 max-w-3xl text-muted">{about.leadershipIntro}</p>}
        <ul className="mt-10 grid gap-8 sm:grid-cols-2 md:grid-cols-3">
          {team.map((m) => (
            <li key={m.id}>
              <Link href={`/team/${m.slug}`} className="group block">
                <Img src={m.photoUrl} alt={m.name} className="aspect-square w-full rounded object-cover" />
                <div className="mt-3 font-semibold uppercase tracking-wide">{m.name}</div>
                <div className="text-sm text-muted group-hover:underline">{m.title} →</div>
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
                <div className="font-semibold">{o.name}</div>
                {o.label && <div className="text-muted">{o.label}</div>}
                {o.address && <p className="mt-2 whitespace-pre-line">{o.address}</p>}
                {o.phone && <div className="mt-2">Tel: <a href={`tel:${o.phone}`}>{o.phone}</a></div>}
                {o.fax && <div>Fax: {o.fax}</div>}
                {o.ordersEmail && <div className="mt-2">Orders: <a className="underline" href={`mailto:${o.ordersEmail}`}>{o.ordersEmail}</a></div>}
              </li>
            ))}
          </ul>
        </Section>
      )}

      <Section id="map">
        <div className="max-w-3xl">
          {about.mapTitle && <H2>{about.mapTitle}</H2>}
          {about.mapSub && <p className="mt-3 text-muted">{about.mapSub}</p>}
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
          <p className="text-lg">{about.closingLine ?? "Have a question? We’d love to hear from you."}</p>
          <Btn href="/contact-us">Contact us</Btn>
        </div>
      </Section>
    </>
  );
}
