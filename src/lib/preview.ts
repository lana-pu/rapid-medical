import "server-only";
import { SignJWT, jwtVerify } from "jose";

function secret() {
  const s = process.env.AUTH_SECRET;
  // no silent signing with «undefined»: a missing or short secret is a configuration error
  if (!s || s.length < 32) throw new Error("AUTH_SECRET must be set (32+ characters)");
  return new TextEncoder().encode(s);
}

/** Shareable preview token: anyone with the link sees pending drafts for 7 days. */
export async function makePreviewToken(path: string): Promise<string> {
  return new SignJWT({ path }).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("7d").sign(secret());
}

export async function verifyPreviewToken(token: string): Promise<{ path: string } | null> {
  try {
    const { payload } = await jwtVerify(token, secret());
    return { path: String(payload.path ?? "/") };
  } catch {
    return null;
  }
}
