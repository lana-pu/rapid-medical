import Link from "next/link";
import { getSetting } from "@/lib/settings";
import { getTeam } from "@/lib/content";
import { Section, H1, H2, Img } from "@/components/site/primitives";

export const metadata = {
  title: "About Us",
  description: "Learn about our innovative neurovascular solutions for stroke treatment.",
};

type About = { intro?: string; whatWeDoTitle?: string; whatWeDoBody?: string; leadershipIntro?: string; heroImageUrl?: string };
type Office = { name: string; label?: string; address?: string; phone?: string; fax?: string; ordersEmail?: string };

export default async function AboutPage() {
  const [about, contact, team] = await Promise.all([getSetting<About>("about"), getSetting<{ offices?: Office[] }>("contact"), getTeam()]);

  return (
    <>
      <Section>
        <H1>About Us</H1>
        {about.intro && <p className="mt-6 max-w-3xl text-xl">{about.intro}</p>}
        <Img src={about.heroImageUrl} className="mt-10 aspect-[21/9] w-full rounded object-cover" />
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

      {contact.offices && contact.offices.length > 0 && (
        <Section className="bg-surface">
          <H2>Global Offices</H2>
          <ul className="mt-8 grid gap-8 md:grid-cols-2">
            {contact.offices.map((o, i) => (
              <li key={i} className="text-sm">
                <div className="font-semibold">{o.name}</div>
                {o.label && <div className="text-muted">{o.label}</div>}
                {o.address && <p className="mt-2 whitespace-pre-line">{o.address}</p>}
                {o.phone && <div className="mt-2">Tel: {o.phone}</div>}
                {o.fax && <div>Fax: {o.fax}</div>}
                {o.ordersEmail && <div className="mt-2">Orders: <a className="underline" href={`mailto:${o.ordersEmail}`}>{o.ordersEmail}</a></div>}
              </li>
            ))}
          </ul>
        </Section>
      )}
    </>
  );
}
