import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getEvent } from "@/lib/content";
import { safeHtml } from "@/lib/html";
import { day, formatEventDates, isPast, registrationOpen } from "@/lib/events";
import { Section, H1, Btn, Prose, Img } from "@/components/site/primitives";
import { ContactForm } from "@/components/site/ContactForm";
import { E } from "@/components/site/editable";
import { JsonLd, plain, absUrl, siteUrl } from "@/components/site/JsonLd";

/**
 * Event page (docs/screens/events.md): before the date — description and registration; after — "has taken place"
 * and the recap. The state comes from the dates on every render; nobody moves an event to the archive.
 */
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const e = await getEvent((await params).slug);
  if (!e) return { title: "Event" };
  return { title: `${e.title} – Events`, description: plain(e.descriptionHtml, 160) || `${formatEventDates(e)}${e.city ? `, ${e.city}` : ""}` };
}

export default async function EventPage({ params }: { params: Promise<{ slug: string }> }) {
  const e = await getEvent((await params).slug);
  if (!e) notFound();

  const past = isPast(e);
  const open = registrationOpen(e);
  const place = [e.venue, e.city].filter(Boolean).join(", ");
  const showRecap = past && (e.recapHtml || e.recapPhotos.length > 0);
  const site = siteUrl();

  return (
    <Section>
      <JsonLd
        data={{
          "@type": "Event",
          name: e.title,
          startDate: day(e.startsOn),
          endDate: day(e.endsOn ?? e.startsOn),
          eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
          eventStatus: "https://schema.org/EventScheduled",
          location: { "@type": "Place", name: e.venue || e.city || undefined, address: e.city || undefined },
          description: plain(e.descriptionHtml) || undefined,
          image: absUrl(e.imageUrl, site),
          organizer: { "@type": "Organization", name: "Rapid Medical", url: site },
          url: `${site}/events/${e.slug}`,
        }}
      />
      <Link href={`/news-events#${past ? "past-events" : "upcoming-events"}`} className="text-sm underline">← News &amp; Events</Link>
      {e.congress && <div className="mt-6 text-sm font-semibold uppercase tracking-widest text-muted">{e.congress}</div>}
      <H1 className={e.congress ? "mt-2" : "mt-6"}><E r="events" id={e.id} f="title">{e.title}</E></H1>
      {e.subtitle && <p className="mt-3 text-lg text-muted"><E r="events" id={e.id} f="subtitle">{e.subtitle}</E></p>}
      <div className="mt-4 font-medium">{formatEventDates(e)}{e.startTime ? ` · ${e.startTime}` : ""}</div>
      {place && <div className="text-muted">{place}</div>}

      {past && <p className="mt-8 max-w-2xl rounded border border-border bg-surface px-4 py-3 text-sm">This event has taken place.</p>}

      <div className="mt-8 grid gap-10 lg:grid-cols-[3fr_2fr]">
        <div>
          {showRecap ? (
            <>
              {e.recapHtml && <E r="events" id={e.id} f="recapHtml" k="rich"><Prose html={safeHtml(e.recapHtml)} /></E>}
              {e.recapPhotos.length > 0 && (
                <ul className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3">
                  {e.recapPhotos.map((src) => <li key={src}><Img src={src} className="aspect-[4/3] w-full rounded object-cover" /></li>)}
                </ul>
              )}
            </>
          ) : (
            <>
              {e.imageUrl && <Img src={e.imageUrl} className="mb-6 w-full rounded" />}
              {e.descriptionHtml && <E r="events" id={e.id} f="descriptionHtml" k="rich"><Prose html={safeHtml(e.descriptionHtml)} /></E>}
            </>
          )}
        </div>

        {!past && e.registration !== "none" && (
          <div>
            {!open ? (
              <p className="rounded border border-border bg-surface px-4 py-3 text-sm">Registration is closed.</p>
            ) : e.registration === "link" && e.registrationUrl ? (
              <Btn href={e.registrationUrl} external>Register</Btn>
            ) : (
              <div className="rounded border border-border p-6">
                <h2 className="text-xl font-semibold">Register</h2>
                <p className="mt-1 text-sm text-muted">Please provide a few contact details below.</p>
                <div className="mt-4"><ContactForm form="event" topics={[e.title]} defaultTopic={e.title} meta={{ event: e.slug }} compact /></div>
              </div>
            )}
          </div>
        )}
      </div>
    </Section>
  );
}
