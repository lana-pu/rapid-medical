"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq, isNull } from "drizzle-orm";
import { contactSubmissions, db, requestNotes, users } from "@/db";
import { requireUser } from "@/lib/auth";
import { audit } from "@/lib/audit";

/**
 * A request's actions, each applied at once (docs/screens/admin-requests.md): read on opening, Reply, Done / Reopen,
 * Spam / Not spam, who answers, notes for the team.
 */

const STATUSES = ["new", "in_progress", "done", "spam"] as const;
type Status = (typeof STATUSES)[number];
const isStatus = (s: string): s is Status => (STATUSES as readonly string[]).includes(s);

async function load(id: number) {
  const r = Number.isInteger(id) ? await db.query.contactSubmissions.findFirst({ where: eq(contactSubmissions.id, id) }) : null;
  if (!r) redirect("/admin/inbox");
  return r;
}

const label = (r: { firstName: string; lastName: string; topic: string; form: string }) => `${r.topic || r.form}: ${r.firstName} ${r.lastName}`.trim();

function refresh(id: number) {
  revalidatePath("/admin/inbox");
  revalidatePath("/admin/submissions");
  revalidatePath(`/admin/submissions/${id}`);
}

/** Opened by someone in the team: read from now on (the status does not change). */
export async function markRead(id: number): Promise<void> {
  await requireUser();
  if (!Number.isInteger(id)) return;
  const done = await db.update(contactSubmissions).set({ readAt: new Date() }).where(and(eq(contactSubmissions.id, id), isNull(contactSubmissions.readAt))).returning({ id: contactSubmissions.id });
  if (done.length) refresh(id);
}

/** «Reply» opened the ready email: I answer, if nobody did; a new request is now In progress. */
export async function startReply(id: number): Promise<void> {
  const user = await requireUser();
  const r = await load(id);
  const next = { assignedToId: r.assignedToId ?? user.id, status: r.status === "new" ? ("in_progress" as const) : r.status, readAt: r.readAt ?? new Date() };
  await db.update(contactSubmissions).set(next).where(eq(contactSubmissions.id, id));
  await audit(user, "request", { recordId: id, label: label(r), meta: { replied: true, ...(r.assignedToId ? {} : { assignedToId: user.id }), ...(r.status === "new" ? { status: "in_progress" } : {}) } });
  refresh(id);
}

/** Done, Reopen, Spam, Not spam. */
export async function setStatus(fd: FormData): Promise<void> {
  const user = await requireUser();
  const id = Number(fd.get("id"));
  const r = await load(id);
  const status = String(fd.get("status") ?? "");
  if (!isStatus(status) || status === r.status) return;
  await db.update(contactSubmissions).set({ status, readAt: r.readAt ?? new Date() }).where(eq(contactSubmissions.id, id));
  await audit(user, "request", { recordId: id, label: label(r), meta: { status } });
  refresh(id);
}

/** Who answers — saved as soon as it is chosen. */
export async function assignRequest(fd: FormData): Promise<void> {
  const user = await requireUser();
  const id = Number(fd.get("id"));
  const r = await load(id);
  const raw = String(fd.get("assignedToId") ?? "");
  let assignedToId: number | null = raw ? Number(raw) : null;
  if (assignedToId !== null) {
    const u = Number.isInteger(assignedToId) ? await db.query.users.findFirst({ where: eq(users.id, assignedToId) }) : null;
    if (!u || !u.active) assignedToId = null; // only people who can sign in
  }
  if (assignedToId === r.assignedToId) return;
  await db.update(contactSubmissions).set({ assignedToId, status: assignedToId && r.status === "new" ? "in_progress" : r.status }).where(eq(contactSubmissions.id, id));
  await audit(user, "request", { recordId: id, label: label(r), meta: { assignedToId } });
  refresh(id);
}

/** A note for the team: one more entry of the thread. */
export async function addNote(fd: FormData): Promise<void> {
  const user = await requireUser();
  const id = Number(fd.get("id"));
  const r = await load(id);
  const body = String(fd.get("body") ?? "").trim().slice(0, 4000);
  if (!body) return;
  await db.insert(requestNotes).values({ submissionId: id, userId: user.id, userName: user.name, body });
  await audit(user, "request", { recordId: id, label: label(r), meta: { note: "added" } });
  refresh(id);
}
