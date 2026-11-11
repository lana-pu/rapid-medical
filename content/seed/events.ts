import type { NewEvent } from "@/db/schema";

/**
 * Event pages from Duda (www /event-details/* and /RSVP), content/duda-archive.md. Only the ones whose dates are
 * on the page; the four without a date (Murcia 2025, First Asia TIGERTRIEVER Workshop, International Partners Summit,
 * Users Meeting) are not invented — their old URLs go to /news-events until marketing gives the dates.
 */
type EventSeed = Omit<NewEvent, "startsOn" | "endsOn"> & { startsOn: string; endsOn?: string; from: string };

export const EVENTS: EventSeed[] = [
  {
    from: "/RSVP",
    slug: "from-physics-to-practice-busan-2026",
    title: "From Physics to Practice",
    subtitle: "Innovation and the Future of Neurointervention",
    startsOn: "2026-10-12",
    city: "Busan",
    venue: "Park Hyatt Busan",
    registration: "form",
    status: "published",
  },
  {
    from: "/event-details/drivewire--24-in-clinical-practice",
    slug: "drivewire-24-in-clinical-practice-esmint-2026",
    title: "DRIVEWIRE™ 24 in Clinical Practice",
    subtitle: "Real-World Experience from Two Perspectives with Dr. Rui de Carvalho and Dr. Markus Holtmannspötter",
    startsOn: "2026-09-03",
    startTime: "12:45 PM",
    city: "Marseille",
    congress: "ESMINT",
    registration: "form",
    status: "published",
  },
  {
    from: "/event-details/tigertriever--workshop-in-partnership-with-kaneka",
    slug: "tigertriever-workshop-kaneka-2026",
    title: "TIGERTRIEVER™ Workshop in partnership with Kaneka",
    startsOn: "2026-09-15",
    endsOn: "2026-09-16",
    registration: "form",
    status: "published",
  },
  {
    from: "/event-details/rapid-medical-at-linnc-paris",
    slug: "more-than-conventional-linnc-paris-2026",
    title: "More than Conventional",
    subtitle: "Dinner & Discussion at LINNC Paris with Dr. Sudipta Roychowdhury",
    startsOn: "2026-06-01",
    startTime: "19:30",
    city: "Paris",
    venue: "Hôtel Regina Louvre",
    congress: "LINNC",
    registration: "form",
    status: "published",
  },
  {
    from: "/event-details/meet-the-experts-dinner-event-at-dgnr-2025-october-22",
    slug: "meet-the-experts-dinner-dgnr-2025",
    title: "Meet The Experts Dinner event at DGNR 2025",
    startsOn: "2025-10-22",
    congress: "DGNR",
    descriptionHtml: "<p>This event is full. Please contact your Rapid Medical representative or speak to us at the booth during the DGNR Conference for further details.</p>",
    registration: "none",
    status: "published",
  },
];

/** Duda event pages with no date on them: to the News & Events page. */
export const UNDATED_EVENT_PATHS = [
  "/event-details/murcia-academic-workshop-spain-2025",
  "/event-details/first-asia-tigertriever-workshop",
  "/event-details/international-partners-summit",
  "/event-details/users-meeting",
];
