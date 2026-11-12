"use server";

import { eq } from "drizzle-orm";
import { db, users } from "@/db";
import { getSession, makeRecoveryCodes, markSessionVerified, totpCheck } from "@/lib/auth";
import { audit } from "@/lib/audit";

/**
 * First sign-in: turn on two-step sign-in (mandatory, docs/screens/admin-people.md). The recovery codes come back to the
 * page once — never in an address.
 */
export async function enableTwoStep(secret: string, code: string): Promise<{ codes: string[] } | { error: string }> {
  const s = await getSession();
  if (!s || s.totpPending) return { error: "Sign in again" };
  if (!s.needsSetup) return { error: "Two-step sign-in is already on" };
  if (!/^[A-Z2-7]{16,64}$/.test(secret)) return { error: "Reload the page to get a new key" };
  if (!(await totpCheck(secret, code))) return { error: "That code didn't match — enter the newest one from the app" };
  const { plain, hashed } = makeRecoveryCodes();
  await db.update(users).set({ totpSecret: secret, totpEnabledAt: new Date(), recoveryCodes: hashed }).where(eq(users.id, s.id));
  await markSessionVerified();
  await audit(s, "user", { recordId: s.id, meta: { totpEnabled: true } });
  return { codes: plain };
}
