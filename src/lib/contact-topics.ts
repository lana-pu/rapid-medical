/**
 * Contact form topics and where each submission is emailed (spec → Уведомления, decision 2026-11-10).
 * Safe to import from client and server code.
 */
export const TOPIC = {
  demo: "Request a demo",
  support: "Product question / Support",
  orders: "Customer Service / Orders",
  ifu: "Instructions for Use (IFU)",
  events: "Meetings & Events",
  investors: "Investor relations",
  other: "Other",
} as const;

/** Order in the topic list. */
export const TOPICS: string[] = [TOPIC.demo, TOPIC.support, TOPIC.orders, TOPIC.ifu, TOPIC.events, TOPIC.investors, TOPIC.other];

/** `?topic=` keys accepted on /contact-us. */
export const TOPIC_KEYS: Record<string, string> = { demo: TOPIC.demo, support: TOPIC.support, orders: TOPIC.orders, ifu: TOPIC.ifu };

export type RoutingSettings = { ordersEmailInc?: string; ordersEmailLtd?: string; ordersEmailCanada?: string; ifuEmail?: string };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ok = (v?: string) => (v && EMAIL.test(v.trim()) ? v.trim() : undefined);

/**
 * Mailbox for a contact submission; `undefined` = the default MAIL_TO.
 * Orders go where the old "Place an order" mailto links went: Americas → Inc (Canada → its own box),
 * everyone else → Ltd. IFU requests → the IFU mailbox. Everything else (demo, questions…) → MAIL_TO.
 */
export function recipientFor(d: { form: string; topic: string; region: string; country: string }, s: RoutingSettings): string | undefined {
  if (d.form !== "contact") return undefined;
  if (d.topic === TOPIC.orders) {
    if (/canada/i.test(d.country)) return ok(s.ordersEmailCanada) ?? ok(s.ordersEmailInc);
    return d.region === "Americas" ? ok(s.ordersEmailInc) : ok(s.ordersEmailLtd);
  }
  if (d.topic === TOPIC.ifu) return ok(s.ifuEmail);
  return undefined;
}
