/**
 * The ready reply behind a request's «Reply» button (docs/screens/admin-requests.md → «Готовое письмо по Reply»):
 * a mailto: link with the recipient, a copy to the team's mailbox, the subject and a plain-text draft. The wording
 * is a draft — the client owns the texts.
 */

export type ReplyInput = {
  to: string;
  /** the team's mailbox the request went to */
  cc?: string;
  firstName: string;
  lastName: string;
  /** contact · webinar · careers · event */
  form: string;
  topic: string;
  /** the form in words, when there is no topic */
  formLabel: string;
  message: string;
  createdAt: Date;
  /** who answers: the signature */
  sender: string;
  phone?: string;
  webinar?: { title: string; url: string | null } | null;
  event?: { title: string; when: string; where: string } | null;
  job?: string | null;
};

/** Outlook on Windows stops at ~2000 characters of a link. */
const MAX = 1900;
const QUOTE = 600;

function line(i: ReplyInput): string {
  switch (i.form) {
    case "webinar": {
      const title = i.webinar?.title || i.topic;
      return i.webinar?.url
        ? `Thank you for your interest in the webinar “${title}”. You can watch the recording here:\n${i.webinar.url}`
        : `Thank you for your interest in the webinar “${title}”.`;
    }
    case "event":
      return i.event ? `Thank you for registering for ${i.event.title} (${[i.event.when, i.event.where].filter(Boolean).join(", ")}).` : `Thank you for registering for ${i.topic || "the event"}.`;
    case "careers":
      return `Thank you for your interest in ${i.job || (i.topic && i.topic !== "General interest" ? i.topic : "joining Rapid Medical")}.`;
    default:
      return `Thank you for contacting Rapid Medical${i.topic ? ` about “${i.topic}”` : ""}.`;
  }
}

export function replyBody(i: ReplyInput, quoteLimit = QUOTE): string {
  const name = `${i.firstName} ${i.lastName}`.trim();
  const date = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Jerusalem" }).format(i.createdAt);
  const msg = i.message.trim();
  const quote = msg && quoteLimit > 0 ? `On ${date} you wrote:\n${(msg.length > quoteLimit ? `${msg.slice(0, quoteLimit).trimEnd()}…` : msg).split(/\r?\n/).map((l) => `> ${l}`).join("\n")}` : "";
  const signature = ["Best regards,", i.sender, "Rapid Medical", i.phone, "www.rapid-medical.com"].filter(Boolean).join("\n");
  return [`Dear ${name || "Sir or Madam"},`, line(i), quote, signature].filter(Boolean).join("\n\n");
}

export function replySubject(i: Pick<ReplyInput, "topic" | "formLabel" | "webinar" | "event">): string {
  return `Re: ${i.webinar?.title || i.event?.title || i.topic || i.formLabel} — Rapid Medical`;
}

/** The mailto: link; the quote is shortened, then dropped, to keep the link within what mail programs open. */
export function replyHref(i: ReplyInput): string {
  const enc = (s: string) => encodeURIComponent(s.replace(/\r?\n/g, "\r\n"));
  for (const limit of [QUOTE, 200, 0]) {
    const params = [i.cc ? `cc=${enc(i.cc)}` : "", `subject=${enc(replySubject(i))}`, `body=${enc(replyBody(i, limit))}`].filter(Boolean).join("&");
    const href = `mailto:${encodeURIComponent(i.to)}?${params}`;
    if (href.length <= MAX || limit === 0) return href;
  }
  return `mailto:${encodeURIComponent(i.to)}`;
}
