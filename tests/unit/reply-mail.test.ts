import { describe, expect, it } from "vitest";
import { replyBody, replyHref, replySubject, type ReplyInput } from "@/lib/reply-mail";

const base: ReplyInput = {
  to: "laura@hospital.example",
  cc: "info@rapid-medical.com",
  firstName: "Laura",
  lastName: "Mendes",
  form: "contact",
  topic: "Request a demo",
  formLabel: "Contact form",
  message: "Please call me back.\nThursday works.",
  createdAt: new Date("2026-11-14T10:00:00Z"),
  sender: "Svetlana P",
  phone: "+1-469-991-7712",
};

describe("the ready reply", () => {
  it("greets by name, says what it answers, quotes the message and signs with the office phone", () => {
    const body = replyBody(base);
    expect(body).toContain("Dear Laura Mendes,");
    expect(body).toContain("Thank you for contacting Rapid Medical about “Request a demo”.");
    expect(body).toContain("On 14 November 2026 you wrote:\n> Please call me back.\n> Thursday works.");
    expect(body).toMatch(/Best regards,\nSvetlana P\nRapid Medical\n\+1-469-991-7712\nwww\.rapid-medical\.com$/);
    expect(replySubject(base)).toBe("Re: Request a demo — Rapid Medical");
  });

  it("a webinar request gets the recording link; an event — its dates and place", () => {
    expect(replyBody({ ...base, form: "webinar", topic: "DISTALS update", webinar: { title: "DISTALS update", url: "https://vimeo.com/123" } })).toContain("You can watch the recording here:\nhttps://vimeo.com/123");
    expect(replyBody({ ...base, form: "event", event: { title: "Meet the experts", when: "3 Sep", where: "Paris" } })).toContain("Thank you for registering for Meet the experts (3 Sep, Paris).");
    expect(replyBody({ ...base, form: "careers", topic: "General interest" })).toContain("Thank you for your interest in joining Rapid Medical.");
  });

  it("builds a mailto: link with the copy, subject and body; a long message is shortened to fit", () => {
    const href = replyHref(base);
    expect(href.startsWith("mailto:laura%40hospital.example?cc=info%40rapid-medical.com&subject=Re%3A%20Request%20a%20demo")).toBe(true);
    expect(decodeURIComponent(href)).toContain("Dear Laura Mendes,\r\n");
    const long = replyHref({ ...base, message: "word ".repeat(2000) });
    expect(long.length).toBeLessThanOrEqual(1900);
    expect(decodeURIComponent(long)).toContain("Best regards");
  });
});
