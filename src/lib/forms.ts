"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { db, contactSubmissions } from "@/db";
import { sendMail } from "@/lib/mail";
import { getSetting } from "@/lib/settings";
import { recipientFor, type RoutingSettings } from "@/lib/contact-topics";

export type FormState = { ok: true } | { ok: false; errors?: Record<string, string>; message?: string } | null;

const schema = z.object({
  form: z.enum(["contact", "webinar", "careers"]),
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
  meta: z.record(z.string(), z.string()).default({}),
});

// Very small in-memory rate limiter (per instance). Replace with Redis/Upstash in multi-instance hosting.
const hits = new Map<string, number[]>();
function limited(ip: string) {
  const now = Date.now();
  const arr = (hits.get(ip) ?? []).filter((t) => now - t < 10 * 60 * 1000);
  arr.push(now);
  hits.set(ip, arr);
  return arr.length > 8;
}

export async function submitForm(_prev: FormState, fd: FormData): Promise<FormState> {
  // Honeypot – bots fill every field
  if (fd.get("website")) return { ok: true };

  const h = await headers();
  const ip = (h.get("x-forwarded-for") ?? "").split(",")[0].trim() || null;
  if (ip && limited(ip)) return { ok: false, message: "Too many requests. Please try again later." };

  let meta: Record<string, string> = {};
  try { meta = JSON.parse(String(fd.get("meta") ?? "{}")); } catch { meta = {}; }

  const parsed = schema.safeParse({
    form: fd.get("form"),
    topic: fd.get("topic") ?? "",
    firstName: fd.get("firstName"),
    lastName: fd.get("lastName"),
    organization: fd.get("organization") ?? "",
    email: fd.get("email"),
    phone: fd.get("phone") ?? "",
    region: fd.get("region") ?? "",
    country: fd.get("country") ?? "",
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
    `Opt-in: ${d.optIn ? "yes" : "no"}`, ...Object.entries(d.meta).map(([k, v]) => `${k}: ${v}`), "", d.message,
    "", `View in admin: ${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/admin/submissions/${row.id}`,
  ];
  try {
    const to = recipientFor(d, await getSetting<RoutingSettings>("contact"));
    await sendMail({ to, subject: `[Website] ${d.form}: ${d.topic || "new submission"} – ${d.firstName} ${d.lastName}`, text: lines.join("\n"), replyTo: d.email });
  } catch (e) {
    console.error("mail failed", e);
  }
  return { ok: true };
}
