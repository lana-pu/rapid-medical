"use server";

import { eq } from "drizzle-orm";
import { db, users } from "@/db";
import { getSession, makeRecoveryCodes, markSessionVerified, totpCheck, verifyPassword } from "@/lib/auth";
import { audit } from "@/lib/audit";

/**
 * First sign-in: turn on two-step sign-in (mandatory, docs/screens/admin-people.md). The key is the one the server issued
 * for this person (pendingTotpKey); the password is asked again, so a borrowed session cannot tie its own phone.
 * The recovery codes come back to the page once — never in an address.
 */
export async function enableTwoStep(password: string, code: string): Promise<{ codes: string[] } | { error: string }> {
  const s = await getSession();
  if (!s || s.totpPending) return { error: "Sign in again" };
  if (!s.needsSetup) return { error: "Two-step sign-in is already on" };
  const u = await db.query.users.findFirst({ where: eq(users.id, s.id) });
  if (!u?.totpSecret) return { error: "Reload the page to get a new key" };
  if (!(await verifyPassword(String(password ?? ""), u.passwordHash))) return { error: "Password is wrong" };
  if (!(await totpCheck(u.totpSecret, code))) return { error: "That code didn't match — enter the newest one from the app" };
  const { plain, hashed } = makeRecoveryCodes();
  await db.update(users).set({ totpEnabledAt: new Date(), recoveryCodes: hashed }).where(eq(users.id, s.id));
  await markSessionVerified();
  await audit(s, "user", { recordId: s.id, meta: { totpEnabled: true } });
  return { codes: plain };
}
