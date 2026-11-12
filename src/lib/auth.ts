import "server-only";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { and, eq, gt, isNull, lt, sql } from "drizzle-orm";
import { generateSecret, verify as verifyTotp, generateURI } from "otplib";
import { db, users, sessions, passwordResets, loginAttempts, type User } from "@/db";

/**
 * Authentication.
 * - Server-side sessions (revocable; "sign out everywhere").
 * - Login throttling per email and per IP.
 * - Optional TOTP two-factor with recovery codes.
 * - Password reset by emailed token.
 */

export const SESSION_COOKIE = "rm_admin";
const TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days
const MAX_ATTEMPTS = 8; // per 15 minutes
const WINDOW_MS = 15 * 60 * 1000;

export type SessionUser = {
  id: number;
  email: string;
  name: string;
  role: User["role"];
  sessionId?: string;
  /** password ok, the code from the phone not yet entered */
  totpPending?: boolean;
  /** two-step sign-in not set up yet: only the setup screen opens (mandatory, docs/screens/admin-people.md) */
  needsSetup?: boolean;
};

/** Signed in all the way: password, two-step sign-in set up and passed. */
export const isReady = (s: SessionUser | null): s is SessionUser => !!s && !s.totpPending && !s.needsSetup;

/* ------------------------------------------------------------------ */
/*  Passwords                                                          */
/* ------------------------------------------------------------------ */

export async function hashPassword(plain: string) {
  return bcrypt.hash(plain, 12);
}
export async function verifyPassword(plain: string, hash: string) {
  return bcrypt.compare(plain, hash);
}

/* ------------------------------------------------------------------ */
/*  Sessions                                                           */
/* ------------------------------------------------------------------ */

async function clientInfo() {
  try {
    const h = await headers();
    return { ip: (h.get("x-forwarded-for") ?? "").split(",")[0].trim() || null, userAgent: h.get("user-agent")?.slice(0, 300) ?? null };
  } catch {
    return { ip: null, userAgent: null };
  }
}

export async function createSession(user: Pick<User, "id" | "totpEnabledAt">): Promise<{ needsTotp: boolean }> {
  const id = crypto.randomBytes(32).toString("hex");
  const needsTotp = Boolean(user.totpEnabledAt);
  const { ip, userAgent } = await clientInfo();
  await db.insert(sessions).values({ id, userId: user.id, verified: !needsTotp, ip, userAgent, expiresAt: new Date(Date.now() + TTL_SECONDS * 1000) });
  const jar = await cookies();
  jar.set(SESSION_COOKIE, id, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: TTL_SECONDS });
  return { needsTotp };
}

export async function destroySession() {
  const jar = await cookies();
  const id = jar.get(SESSION_COOKIE)?.value;
  if (id) await db.delete(sessions).where(eq(sessions.id, id)).catch(() => {});
  jar.delete(SESSION_COOKIE);
}

export async function destroyAllSessions(userId: number, exceptCurrent = true) {
  const jar = await cookies();
  const current = jar.get(SESSION_COOKIE)?.value;
  const rows = await db.select({ id: sessions.id }).from(sessions).where(eq(sessions.userId, userId));
  for (const r of rows) if (!exceptCurrent || r.id !== current) await db.delete(sessions).where(eq(sessions.id, r.id));
}

export async function listSessions(userId: number) {
  const jar = await cookies();
  const current = jar.get(SESSION_COOKIE)?.value;
  const rows = await db.select().from(sessions).where(and(eq(sessions.userId, userId), gt(sessions.expiresAt, new Date()))).orderBy(sessions.lastSeenAt);
  return rows.map((r) => ({ ...r, current: r.id === current }));
}

/** Full session lookup (DB). `totpPending` = password ok but 2FA not yet passed. */
export async function getSession(): Promise<SessionUser | null> {
  const jar = await cookies();
  const id = jar.get(SESSION_COOKIE)?.value;
  if (!id || !/^[a-f0-9]{64}$/.test(id)) return null;
  const row = await db
    .select({ s: sessions, u: users })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(and(eq(sessions.id, id), gt(sessions.expiresAt, new Date())))
    .limit(1);
  const hit = row[0];
  if (!hit || !hit.u.active) return null;
  // touch at most once a minute
  if (Date.now() - hit.s.lastSeenAt.getTime() > 60_000) db.update(sessions).set({ lastSeenAt: new Date() }).where(eq(sessions.id, id)).catch(() => {});
  return { id: hit.u.id, email: hit.u.email, name: hit.u.name, role: hit.u.role, sessionId: id, totpPending: !hit.s.verified, needsSetup: !hit.u.totpEnabledAt };
}

/** Use at the top of every admin page / server action. */
export async function requireUser(): Promise<SessionUser> {
  const s = await requireSignedIn();
  if (s.needsSetup) redirect("/admin/login/setup");
  return s;
}

/** Password (and the code, if set up) passed; two-step sign-in may still need setting up — for the setup screen only. */
export async function requireSignedIn(): Promise<SessionUser> {
  const s = await getSession();
  if (!s) redirect("/admin/login");
  if (s.totpPending) redirect("/admin/login/2fa");
  return s;
}

/** Roles (ADR-006): editor — content; designer — also how sections look and Branding; admin — also people and Integrations. */
export const canDesign = (u: { role: string }) => u.role === "designer" || u.role === "admin";

export async function requireAdmin(): Promise<SessionUser> {
  const s = await requireUser();
  if (s.role !== "admin") redirect("/admin?error=forbidden");
  return s;
}

/* ------------------------------------------------------------------ */
/*  Login + throttling                                                 */
/* ------------------------------------------------------------------ */

async function tooManyAttempts(keys: string[]): Promise<boolean> {
  const since = new Date(Date.now() - WINDOW_MS);
  for (const key of keys) {
    const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(loginAttempts).where(and(eq(loginAttempts.key, key), gt(loginAttempts.at, since)));
    if (n >= MAX_ATTEMPTS) return true;
  }
  return false;
}

async function recordAttempt(keys: string[]) {
  await db.insert(loginAttempts).values(keys.map((key) => ({ key })));
  // opportunistic cleanup
  if (Math.random() < 0.05) await db.delete(loginAttempts).where(lt(loginAttempts.at, new Date(Date.now() - WINDOW_MS * 4)));
}

export type AuthResult = { ok: true; user: User } | { ok: false; reason: "invalid" | "throttled" };

export async function authenticate(email: string, password: string): Promise<AuthResult> {
  const e = email.toLowerCase().trim();
  const { ip } = await clientInfo();
  const keys = [`email:${e}`, ...(ip ? [`ip:${ip}`] : [])];
  if (await tooManyAttempts(keys)) return { ok: false, reason: "throttled" };

  const user = await db.query.users.findFirst({ where: eq(users.email, e) });
  const ok = user && user.active && (await verifyPassword(password, user.passwordHash));
  if (!ok) {
    await recordAttempt(keys);
    return { ok: false, reason: "invalid" };
  }
  await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, user.id));
  return { ok: true, user };
}

/* ------------------------------------------------------------------ */
/*  Two-factor (TOTP)                                                  */
/* ------------------------------------------------------------------ */

export function totpSetup(email: string) {
  const secret = generateSecret();
  const uri = generateURI({ secret, issuer: "Rapid Medical Admin", label: email });
  return { secret, uri };
}

export async function totpCheck(secret: string, token: string): Promise<boolean> {
  const t = token.replace(/\s+/g, "");
  if (!/^\d{6,8}$/.test(t)) return false;
  try {
    return (await verifyTotp({ secret, token: t })).valid;
  } catch {
    return false;
  }
}

export function makeRecoveryCodes(n = 8): { plain: string[]; hashed: string[] } {
  const plain = Array.from({ length: n }, () => crypto.randomBytes(5).toString("hex").replace(/(.{5})/, "$1-"));
  const hashed = plain.map((p) => crypto.createHash("sha256").update(p).digest("hex"));
  return { plain, hashed };
}

export async function consumeRecoveryCode(userId: number, code: string): Promise<boolean> {
  const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
  if (!user) return false;
  const h = crypto.createHash("sha256").update(code.trim().toLowerCase()).digest("hex");
  if (!user.recoveryCodes.includes(h)) return false;
  await db.update(users).set({ recoveryCodes: user.recoveryCodes.filter((x) => x !== h) }).where(eq(users.id, userId));
  return true;
}

export async function markSessionVerified() {
  const jar = await cookies();
  const id = jar.get(SESSION_COOKIE)?.value;
  if (id) await db.update(sessions).set({ verified: true }).where(eq(sessions.id, id));
}

/* ------------------------------------------------------------------ */
/*  Password reset                                                     */
/* ------------------------------------------------------------------ */

export async function createPasswordReset(email: string): Promise<{ token: string; user: User } | null> {
  const user = await db.query.users.findFirst({ where: eq(users.email, email.toLowerCase().trim()) });
  if (!user || !user.active) return null;
  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  await db.insert(passwordResets).values({ userId: user.id, tokenHash, purpose: "reset", expiresAt: new Date(Date.now() + 60 * 60 * 1000) });
  return { token, user };
}

/** Invite link for a person who has not signed in yet (7 days); earlier invite links of that person stop working. */
export async function createInvite(userId: number): Promise<string> {
  await db.delete(passwordResets).where(and(eq(passwordResets.userId, userId), eq(passwordResets.purpose, "invite")));
  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  await db.insert(passwordResets).values({ userId, tokenHash, purpose: "invite", expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000) });
  return token;
}

/** The invited person behind a live invite link, or null. */
export async function inviteFor(token: string): Promise<User | null> {
  if (!/^[a-f0-9]{64}$/.test(token)) return null;
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const row = await db.query.passwordResets.findFirst({ where: and(eq(passwordResets.tokenHash, tokenHash), eq(passwordResets.purpose, "invite")) });
  if (!row || row.usedAt || row.expiresAt < new Date()) return null;
  const user = await db.query.users.findFirst({ where: eq(users.id, row.userId) });
  // an invite is for the first sign-in only
  return user && user.active && !user.lastLoginAt && !user.totpEnabledAt ? user : null;
}

/** Someone else changed this person's password or two-step sign-in: every session and every open link goes. */
export async function revokeAccess(userId: number) {
  await db.delete(sessions).where(eq(sessions.userId, userId));
  await db.delete(passwordResets).where(eq(passwordResets.userId, userId));
}

/** The key the setup screen shows: issued and kept by the server until it is confirmed (never taken from the browser). */
export async function pendingTotpKey(userId: number, email: string): Promise<{ secret: string; uri: string }> {
  const uri = (secret: string) => generateURI({ secret, issuer: "Rapid Medical Admin", label: email });
  const u = await db.query.users.findFirst({ where: eq(users.id, userId) });
  if (u?.totpEnabledAt) throw new Error("Two-step sign-in is already on");
  if (u?.totpSecret) return { secret: u.totpSecret, uri: uri(u.totpSecret) };
  const s = totpSetup(email);
  // only into an empty slot: a confirmed key, or one issued meanwhile in another tab, is never overwritten
  const set = await db.update(users).set({ totpSecret: s.secret }).where(and(eq(users.id, userId), isNull(users.totpEnabledAt), isNull(users.totpSecret))).returning({ id: users.id });
  if (set.length) return s;
  const again = await db.query.users.findFirst({ where: eq(users.id, userId) });
  if (!again?.totpSecret || again.totpEnabledAt) throw new Error("Two-step sign-in is already on");
  return { secret: again.totpSecret, uri: uri(again.totpSecret) };
}

/** Accept an invite: set the password, use up the link, sign in (two-step sign-in is set up next). */
export async function acceptInvite(token: string, password: string): Promise<User | null> {
  const user = await inviteFor(token);
  if (!user) return null;
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const used = await db.update(passwordResets).set({ usedAt: new Date() }).where(and(eq(passwordResets.tokenHash, tokenHash), isNull(passwordResets.usedAt))).returning({ id: passwordResets.id });
  if (!used.length) return null; // used meanwhile
  await db.update(users).set({ passwordHash: await hashPassword(password), lastLoginAt: new Date() }).where(eq(users.id, user.id));
  await createSession(user);
  return user;
}

export async function consumePasswordReset(token: string, newPassword: string): Promise<User | null> {
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const row = await db.query.passwordResets.findFirst({ where: and(eq(passwordResets.tokenHash, tokenHash), eq(passwordResets.purpose, "reset")) });
  if (!row || row.usedAt || row.expiresAt < new Date()) return null;
  await db.update(users).set({ passwordHash: await hashPassword(newPassword) }).where(eq(users.id, row.userId));
  await db.update(passwordResets).set({ usedAt: new Date() }).where(eq(passwordResets.id, row.id));
  await db.delete(sessions).where(eq(sessions.userId, row.userId)); // sign out everywhere
  await db.delete(passwordResets).where(and(eq(passwordResets.userId, row.userId), eq(passwordResets.purpose, "invite")));
  return (await db.query.users.findFirst({ where: eq(users.id, row.userId) })) ?? null;
}
