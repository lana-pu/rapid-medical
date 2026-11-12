"use server";

import crypto from "node:crypto";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db, users } from "@/db";
import { createInvite, hashPassword, requireAdmin, revokeAccess } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { sendMail } from "@/lib/mail";

/** People and roles (docs/screens/admin-people.md). Admins only. */

export type Role = "editor" | "designer" | "admin";
const ROLES: Role[] = ["editor", "designer", "admin"];
const isRole = (r: string): r is Role => (ROLES as string[]).includes(r);

async function origin() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  return `${h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https")}://${host}`;
}

async function mailInvite(to: string, name: string, link: string, by: string) {
  await sendMail({
    to,
    subject: "You are invited to edit the Rapid Medical website",
    text: `Hi ${name},\n\n${by} invited you to edit the Rapid Medical website.\nSet your password here (the link works for 7 days):\n${link}\n\nOn the first visit you will also set up two-step sign-in with an app on your phone.`,
  }).catch((e) => console.error("invite mail failed", e));
}

export async function invitePerson(email: string, name: string, role: string): Promise<{ link: string } | { error: string }> {
  const me = await requireAdmin();
  const e = String(email ?? "").toLowerCase().trim();
  const n = String(name ?? "").trim().slice(0, 120);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return { error: "Enter an email address" };
  if (!n) return { error: "Enter a name" };
  if (!isRole(role)) return { error: "Choose what they can do" };
  if (await db.query.users.findFirst({ where: eq(users.email, e) })) return { error: "Already has access" };
  // nobody knows this password: the invite link sets the real one
  const [u] = await db.insert(users).values({ email: e, name: n, role, passwordHash: await hashPassword(crypto.randomBytes(32).toString("hex")) }).returning();
  const link = `${await origin()}/admin/welcome?token=${await createInvite(u.id)}`;
  await mailInvite(e, n, link, me.name);
  await audit(me, "user", { recordId: u.id, label: e, meta: { invited: true, role } });
  revalidatePath("/admin/users");
  return { link };
}

/** A new invite link for someone who has not signed in yet; the old one stops working. */
export async function inviteAgain(id: number): Promise<{ link: string } | { error: string }> {
  const me = await requireAdmin();
  const u = await db.query.users.findFirst({ where: eq(users.id, Number(id)) });
  if (!u || !u.active) return { error: "Not found" };
  if (u.lastLoginAt) return { error: "Already signed in" };
  const link = `${await origin()}/admin/welcome?token=${await createInvite(u.id)}`;
  await mailInvite(u.email, u.name, link, me.name);
  await audit(me, "user", { recordId: u.id, label: u.email, meta: { invitedAgain: true } });
  return { link };
}

export async function setRole(fd: FormData): Promise<void> {
  const me = await requireAdmin();
  const id = Number(fd.get("id"));
  const role = String(fd.get("role"));
  if (!isRole(role) || id === me.id) return; // your own role is changed by another admin
  await db.update(users).set({ role }).where(eq(users.id, id));
  await audit(me, "user", { recordId: id, meta: { role } });
  revalidatePath("/admin/users");
}

export async function setActive(fd: FormData): Promise<void> {
  const me = await requireAdmin();
  const id = Number(fd.get("id"));
  if (id === me.id) return;
  const u = await db.query.users.findFirst({ where: eq(users.id, id) });
  if (!u) return;
  await db.update(users).set({ active: !u.active }).where(eq(users.id, id));
  await audit(me, "user", { recordId: id, label: u.email, meta: { active: !u.active } });
  revalidatePath("/admin/users");
}

export async function resetTwoStep(fd: FormData): Promise<void> {
  const me = await requireAdmin();
  const id = Number(fd.get("id"));
  await db.update(users).set({ totpSecret: null, totpEnabledAt: null, recoveryCodes: [] }).where(eq(users.id, id));
  if (id !== me.id) await revokeAccess(id); // signed in again → sets it up anew
  await audit(me, "user", { recordId: id, meta: { totpReset: true } });
  revalidatePath("/admin/users");
}

/** Without email set up, an admin can still give someone a new password. */
export async function setPassword(fd: FormData): Promise<{ ok: true } | { error: string }> {
  const me = await requireAdmin();
  const id = Number(fd.get("id"));
  const password = String(fd.get("password") ?? "");
  if (password.length < 10) return { error: "Use 10 or more characters" };
  await db.update(users).set({ passwordHash: await hashPassword(password) }).where(eq(users.id, id));
  if (id !== me.id) await revokeAccess(id);
  await audit(me, "user", { recordId: id, meta: { passwordReset: true } });
  return { ok: true };
}
