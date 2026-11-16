"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { and, eq, gt, lt, sql } from "drizzle-orm";
import { db, contactSubmissions, loginAttempts } from "@/db";
import { clientIp } from "./client-ip";
import { sendMail } from "@/lib/mail";
import { getLiveSetting } from "@/lib/settings";
import { recipientFor, type RoutingSettings } from "@/lib/contact-topics";
import { sourceLabel } from "./tracking";
import { countryName, formRegionForCountry, isCountryCode } from "./countries";

const MAX_META = 20;

export type FormState = { ok: true } | { ok: false; errors?: Record<string, string>; message?: string } | null;

const schema = z.object({
  form: z.enum(["contact", "webinar", "careers", "event"]),
  topic: z.string().max(120).default(""),
  firstName: z.string().trim().min(1, "Required").max(80),
  lastName: z.string().trim().min(1, "Required").max(80),
  organization: z.string().trim().max(160).default(""),
  email: z.string().trim().email("Enter a valid email").max(160),
  phone: z.string().trim().max(40).default(""),
  region: z.string().max(40).default(""),
  country: z.string().trim().max(80).default(""),
  state: z.string().trim().max(80).default(""),
  message: z.string().trim().max(4000).default(""),
  optIn: z.boolean().default(false),
  // visit source, webinar and the like — a handful; a request stuffed with more is refused (security check 2026-11-13)
  meta: z.record(z.string().max(40), z.string().max(500)).refine((m) => Object.keys(m).length <= MAX_META, "Too many fields").default({}),
});

/**
 * More than FORM_MAX sends from one address in FORM_WINDOW_MS → «Too many requests». Counted in the database (the
 * sign-in attempts table, key «form:{address}»): the same for every server instance and kept across restarts
 * (docs/screens/contact-us.md → Лимит). A request without a known address shares one bucket with a wider cap — it is
 * never let through uncounted. Counted first: a refused send writes nothing; the address's old rows go on each call.
 */
const FORM_MAX = 8;
const FORM_MAX_UNKNOWN = 60; // direct requests with no proxy in front (development, e2e) all land here
const FORM_WINDOW_MS = 10 * 60 * 1000;
async function limited(ip: string | null): Promise<boolean> {
  const key = `form:${ip ?? "unknown"}`;
  const since = new Date(Date.now() - FORM_WINDOW_MS);
  await db.delete(loginAttempts).where(and(eq(loginAttempts.key, key), lt(loginAttempts.at, since)));
  const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(loginAttempts).where(and(eq(loginAttempts.key, key), gt(loginAttempts.at, since)));
  if (n >= (ip ? FORM_MAX : FORM_MAX_UNKNOWN)) return true;
  await db.insert(loginAttempts).values({ key });
  return false;
}

export async function submitForm(_prev: FormState, fd: FormData): Promise<FormState> {
  // Honeypot – bots fill every field
  if (fd.get("website")) return { ok: true };

  const h = await headers();
  const ip = clientIp(h);
  if (await limited(ip)) return { ok: false, message: "Too many requests. Please try again later." };

  let meta: Record<string, string> = {};
  try { meta = JSON.parse(String(fd.get("meta") ?? "{}")); } catch { meta = {}; }

  // Contact form: a country from the list (ISO code) → its name, and the mail region follows from it (no Region field).
  const code = fd.get("countryCode");
  const fromList = isCountryCode(code);
  const parsed = schema.safeParse({
    form: fd.get("form"),
    topic: fd.get("topic") ?? "",
    firstName: fd.get("firstName"),
    lastName: fd.get("lastName"),
    organization: fd.get("organization") ?? "",
    email: fd.get("email"),
    phone: fd.get("phone") ?? "",
    region: fromList ? formRegionForCountry(code) : (fd.get("region") ?? ""),
    country: fromList ? countryName(code) : (fd.get("country") ?? ""),
    state: fd.get("state") ?? "",
    message: fd.get("message") ?? "",
    optIn: fd.get("optIn") === "on",
    meta,
  });
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) errors[String(issue.path[0])] = issue.message;
    return { ok: false, errors, message: "Please check the highlighted fields." };
  }

  const d = parsed.data;
  const [row] = await db
    .insert(contactSubmissions)
    .values({ ...d, ip, userAgent: h.get("user-agent")?.slice(0, 300) ?? null })
    .returning({ id: contactSubmissions.id });

  const lines = [
    `Form: ${d.form}`, `Topic: ${d.topic}`, `Name: ${d.firstName} ${d.lastName}`, `Organization: ${d.organization}`,
    `Email: ${d.email}`, `Phone: ${d.phone}`, `Region: ${d.region}`, `Country: ${d.country}`, `State: ${d.state}`,
    `Opt-in: ${d.optIn ? "yes" : "no"}`, ...Object.entries(d.meta).map(([k, v]) => `${sourceLabel(k)}: ${v}`), "", d.message,
    "", `View in admin: ${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/admin/submissions/${row.id}`,
  ];
  try {
    const to = recipientFor(d, await getLiveSetting<RoutingSettings>("contact")); // published values only, never a preview draft
    await sendMail({ to, subject: `[Website] ${d.form}: ${d.topic || "new submission"} – ${d.firstName} ${d.lastName}`, text: lines.join("\n"), replyTo: d.email });
  } catch (e) {
    console.error("mail failed", e);
  }
  return { ok: true };
}
