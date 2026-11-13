import "server-only";
import { cache } from "react";
import { cookies, draftMode } from "next/headers";
import { getSession, isReady, type SessionUser } from "./auth";
import { safeLocalPath } from "./safe-path";
import { DEMO } from "./demo";

export const EDIT_COOKIE = "rm_edit";

/**
 * On-page editor mode ("Edit site"). Active when:
 *  - Next draft mode is on (so pending drafts are rendered), and
 *  - the rm_edit cookie is set, and
 *  - the request carries a valid, 2FA-verified admin session.
 * Cached per request so every <E> wrapper on a page shares one lookup.
 */
export const editingUser = cache(async (): Promise<SessionUser | null> => {
  if (DEMO) return { id: 0, email: "demo", name: "Demo editor", role: "admin" }; // static demo: editor always on, saves stay in the browser
  try {
    const [dm, jar] = await Promise.all([draftMode(), cookies()]);
    if (!dm.isEnabled || jar.get(EDIT_COOKIE)?.value !== "1") return null;
    const user = await getSession();
    if (!isReady(user)) return null;
    return user;
  } catch {
    return null; // outside a request scope
  }
});

export async function isEditing(): Promise<boolean> {
  return (await editingUser()) !== null;
}

/** Turn the on-page editor on/off for this browser (draft mode + rm_edit cookie). Usable from route handlers and server actions. */
export async function setEditorMode(on: boolean) {
  const [dm, jar] = await Promise.all([draftMode(), cookies()]);
  if (on) {
    dm.enable();
    jar.set(EDIT_COOKIE, "1", { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/" });
  } else {
    dm.disable();
    jar.delete(EDIT_COOKIE);
  }
}

/** If `next` is an editor entry link (/api/editor?on=1&redirect=/path), enable the editor and return the public path to go to. */
export async function resolveEditorNext(next: string): Promise<string | null> {
  if (!next.startsWith("/api/editor")) return null;
  const u = new URL(next, "http://x");
  if (u.searchParams.get("on") !== "1") return null;
  const to = u.searchParams.get("redirect") ?? "/";
  await setEditorMode(true);
  return safeLocalPath(to, "/");
}
