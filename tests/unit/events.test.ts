import { describe, expect, it } from "vitest";
import { formatEventDates, isPast, registrationOpen, splitEvents } from "@/lib/events";
import { newsPageToBlocks } from "@/blocks/from-settings";
import type { Event } from "@/db/schema";

const ev = (id: number, startsOn: string, extra: Partial<Event> = {}) =>
  ({ id, slug: `e${id}`, title: `E${id}`, subtitle: "", startsOn: new Date(startsOn), startTime: "", endsOn: null, city: "Paris", venue: "", congress: "", descriptionHtml: "", imageUrl: null, registration: "form", registrationUrl: null, registrationClosesOn: null, recapHtml: "", recapPhotos: [], status: "published", createdAt: new Date(0), updatedAt: new Date(0), ...extra }) as Event;

describe("event dates", () => {
  it("upcoming through the last day, past from the next day", () => {
    expect(isPast(ev(1, "2026-09-15"), "2026-09-15")).toBe(false);
    expect(isPast(ev(1, "2026-09-15"), "2026-09-16")).toBe(true);
    expect(isPast(ev(1, "2026-09-15", { endsOn: new Date("2026-09-16") }), "2026-09-16")).toBe(false);
  });
  it("registration: needs a type, closes after the closing day (default: the first day)", () => {
    expect(registrationOpen(ev(1, "2026-09-15"), "2026-09-15")).toBe(true);
    expect(registrationOpen(ev(1, "2026-09-15", { endsOn: new Date("2026-09-16") }), "2026-09-16")).toBe(false);
    expect(registrationOpen(ev(1, "2026-09-15", { registrationClosesOn: new Date("2026-09-01") }), "2026-09-02")).toBe(false);
    expect(registrationOpen(ev(1, "2026-09-15", { registration: "none" }), "2026-09-01")).toBe(false);
    expect(registrationOpen(ev(1, "2026-09-15", { registration: "link" }), "2026-09-01")).toBe(false);
    expect(registrationOpen(ev(1, "2026-09-15", { registration: "link", registrationUrl: "https://x" }), "2026-09-01")).toBe(true);
  });
  it("formats single and multi-day dates", () => {
    expect(formatEventDates(ev(1, "2026-09-03"))).toBe("3 September 2026");
    expect(formatEventDates(ev(1, "2026-09-15", { endsOn: new Date("2026-09-16") }))).toBe("15–16 September 2026");
    expect(formatEventDates(ev(1, "2026-09-30", { endsOn: new Date("2026-10-02") }))).toBe("30 September – 2 October 2026");
  });
  it("upcoming soonest first, past newest first", () => {
    const { upcoming, past } = splitEvents([ev(1, "2026-12-01"), ev(2, "2026-11-20"), ev(3, "2025-10-22"), ev(4, "2026-06-01")], "2026-11-11");
    expect(upcoming.map((e) => e.id)).toEqual([2, 1]);
    expect(past.map((e) => e.id)).toEqual([4, 3]);
  });
});

describe("News & Events with events", () => {
  it("upcoming events on top, archive at the bottom, nothing when there are none", () => {
    const bs = newsPageToBlocks([], [ev(1, "2026-12-01"), ev(2, "2025-10-22")], "2026-11-11");
    expect(bs.map((b) => `${b.type}:${b.variant}`)).toEqual(["hero:title", "events:upcoming", "news:timeline", "events:archive"]);
    expect(newsPageToBlocks([], [], "2026-11-11").map((b) => b.type)).toEqual(["hero", "news"]);
  });
});
