"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { contactSubmissions, db, users } from "@/db";
import { requireUser } from "@/lib/auth";
import { audit } from "@/lib/audit";

/** Requests: status, who answers, note for the team (docs/screens/admin-requests.md). */

const STATUSES = ["new", "in_progress", "done", "spam"] as const;
type Status = (typeof STATUSES)[number];
const isStatus = (s: string): s is Status => (STATUSES as readonly string[]).includes(s);

async function load(id: number) {
  const r = await db.query.contactSubmissions.findFirst({ where: eq(contactSubmissions.id, id) });
  if (!r) redirect("/admin/submissions");
  return r;
}

const label = (r: { firstName: string; lastName: string; topic: string; form: string }) => `${r.topic || r.form}: ${r.firstName} ${r.lastName}`.trim();

/** Status, who answers and the note, from the request page. */
export async function saveRequest(fd: FormData): Promise<void> {
  const user = await requireUser();
  const id = Number(fd.get("id"));
  const r = await load(id);
  const status = String(fd.get("status") ?? "");
  const ownerRaw = String(fd.get("assignedToId") ?? "");
  let assignedToId: number | null = ownerRaw ? Number(ownerRaw) : null;
  if (assignedToId !== null) {
    const u = Number.isInteger(assignedToId) ? await db.query.users.findFirst({ where: eq(users.id, assignedToId) }) : null;
    if (!u || !u.active) assignedToId = null; // only people who can sign in
  }
  const next = {
    status: isStatus(status) ? status : r.status,
    assignedToId,
    note: String(fd.get("note") ?? "").slice(0, 4000),
  };
  await db.update(contactSubmissions).set(next).where(eq(contactSubmissions.id, id));
  const changed = Object.fromEntries(Object.entries(next).filter(([k, v]) => (r as Record<string, unknown>)[k] !== v).map(([k, v]) => [k, k === "note" ? "changed" : v]));
  if (Object.keys(changed).length) await audit(user, "request", { recordId: id, label: label(r), meta: changed });
  revalidatePath("/admin/submissions");
  redirect(`/admin/submissions/${id}?saved=1`);
}

/** «I'll answer»: I am the one who answers; a new request becomes In progress. */
export async function takeRequest(fd: FormData): Promise<void> {
  const user = await requireUser();
  const id = Number(fd.get("id"));
  const r = await load(id);
  await db.update(contactSubmissions).set({ assignedToId: user.id, status: r.status === "new" ? "in_progress" : r.status }).where(eq(contactSubmissions.id, id));
  await audit(user, "request", { recordId: id, label: label(r), meta: { assignedToId: user.id, took: true } });
  revalidatePath("/admin/submissions");
  redirect(`/admin/submissions/${id}?saved=1`);
}
