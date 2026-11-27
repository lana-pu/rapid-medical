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

/**
 * Settings → Where requests go (docs/screens/admin-settings.md, decision 2026-11-27): a mailbox per topic and per
 * form, a main address per region; empty → the main address of the visitor's region, both empty → the server's
 * MAIL_TO. Several addresses — separated by commas.
 */
export type RoutingSettings = {
  mainEmailAmericas?: string; mainEmail?: string;
  demoEmail?: string; supportEmail?: string; ordersEmailInc?: string; ordersEmailCanada?: string; ordersEmailLtd?: string;
  ifuEmail?: string; eventsEmail?: string; investorsEmail?: string; otherEmail?: string;
  webinarEmail?: string; careersEmail?: string; eventFormEmail?: string;
};

/** The addresses that used to live in Contact details: read from there until Where requests go is saved once. */
export const LEGACY_ROUTING_KEYS = ["ordersEmailInc", "ordersEmailCanada", "ordersEmailLtd", "ifuEmail"] as const;

/** The routing as the form and the mail see it: the old Contact details addresses, then Where requests go. */
export function routingOf(requests: Record<string, unknown>, contact: Record<string, unknown>): RoutingSettings {
  const legacy = Object.fromEntries(LEGACY_ROUTING_KEYS.filter((k) => typeof contact[k] === "string").map((k) => [k, contact[k]]));
  return { ...legacy, ...requests } as RoutingSettings;
}

const EMAIL = /^[^\s@,;]+@[^\s@,;]+\.[^\s@,;]+$/;
/** «a@x.com, b@y.com» → the valid addresses, comma-joined; none → undefined. */
export const emailList = (v?: string) => {
  const ok = (v ?? "").split(/[,;\s]+/).map((x) => x.trim()).filter((x) => EMAIL.test(x));
  return ok.length ? ok.join(", ") : undefined;
};
/** Is every part of a typed list an email address? (empty is fine) */
export const isEmailList = (v: string) => v.split(/[,;]/).map((x) => x.trim()).filter(Boolean).every((x) => EMAIL.test(x));

const BY_TOPIC: Record<string, keyof RoutingSettings> = {
  [TOPIC.demo]: "demoEmail", [TOPIC.support]: "supportEmail", [TOPIC.ifu]: "ifuEmail",
  [TOPIC.events]: "eventsEmail", [TOPIC.investors]: "investorsEmail", [TOPIC.other]: "otherEmail",
};
const BY_FORM: Record<string, keyof RoutingSettings> = { webinar: "webinarEmail", careers: "careersEmail", event: "eventFormEmail" };

/**
 * Mailbox(es) for a submission; `undefined` = the server's MAIL_TO.
 * Orders go where the old "Place an order" mailto links went: Americas → Inc (Canada → its own box), everyone else → Ltd.
 */
export function recipientFor(d: { form: string; topic: string; region: string; country: string }, s: RoutingSettings): string | undefined {
  const americas = d.region === "Americas";
  const main = americas ? emailList(s.mainEmailAmericas) ?? emailList(s.mainEmail) : emailList(s.mainEmail) ?? emailList(s.mainEmailAmericas);
  let own: string | undefined;
  if (d.form === "contact") {
    if (d.topic === TOPIC.orders) own = /canada/i.test(d.country) ? emailList(s.ordersEmailCanada) ?? emailList(s.ordersEmailInc) : americas ? emailList(s.ordersEmailInc) : emailList(s.ordersEmailLtd);
    else own = emailList(s[BY_TOPIC[d.topic] ?? "otherEmail"]);
  } else if (BY_FORM[d.form]) own = emailList(s[BY_FORM[d.form]]);
  return own ?? main;
}
