import "server-only";
import { and, eq, sql } from "drizzle-orm";
import { draftMode } from "next/headers";
import { db, siteSettings, settingDrafts } from "@/db";

export type SettingsMap = Record<string, Record<string, unknown>>;

async function isPreview(): Promise<boolean> {
  try {
    return (await draftMode()).isEnabled;
  } catch {
    return false;
  }
}

/** Live value; in preview / editor mode a pending setting draft is layered on top. */
export async function getSetting<T extends Record<string, unknown>>(key: string): Promise<T> {
  const row = await db.query.siteSettings.findFirst({ where: eq(siteSettings.key, key) });
  const live = (row?.value ?? {}) as T;
  if (await isPreview()) {
    const d = await db.query.settingDrafts.findFirst({ where: eq(settingDrafts.key, key) });
    if (d) return { ...live, ...(d.value as Partial<T>) };
  }
  return live;
}

export async function getAllSettings(): Promise<SettingsMap> {
  const rows = await db.select().from(siteSettings);
  const out: SettingsMap = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  if (await isPreview()) {
    for (const d of await db.select().from(settingDrafts)) out[d.key] = { ...(out[d.key] ?? {}), ...d.value };
  }
  return out;
}

/** Live value only (admin forms, publishing). */
export async function getLiveSetting<T extends Record<string, unknown>>(key: string): Promise<T> {
  const row = await db.query.siteSettings.findFirst({ where: eq(siteSettings.key, key) });
  return (row?.value ?? {}) as T;
}

/** Every writer of a settings group takes this lock first: one write at a time per key, even before its row exists. */
const lockKey = (tx: { execute: typeof db.execute }, key: string) => tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${`settings:${key}`}))`);

export async function setSetting(key: string, value: Record<string, unknown>) {
  await db.transaction(async (tx) => {
    await lockKey(tx, key);
    await tx.insert(siteSettings).values({ key, value, updatedAt: new Date() }).onConflictDoUpdate({ target: siteSettings.key, set: { value, updatedAt: new Date() } });
  });
}

export async function getSettingDraft(key: string) {
  return (await db.query.settingDrafts.findFirst({ where: eq(settingDrafts.key, key) })) ?? null;
}

export async function listSettingDrafts() {
  return db.select().from(settingDrafts);
}

export async function setSettingDraft(key: string, value: Record<string, unknown>, by: { id: number; name: string }) {
  await db
    .insert(settingDrafts)
    .values({ key, value, updatedById: by.id > 0 ? by.id : null, updatedByName: by.name, updatedAt: new Date() })
    .onConflictDoUpdate({ target: settingDrafts.key, set: { value, updatedById: by.id > 0 ? by.id : null, updatedByName: by.name, updatedAt: new Date() } });
}

export async function deleteSettingDraft(key: string) {
  await db.delete(settingDrafts).where(eq(settingDrafts.key, key));
}

/**
 * Make the group's draft live. `accept(live, draft)` checks the very values of the write, read in one transaction with
 * both rows locked, so neither can change between the check and the write; a draft saved meanwhile waits for the lock
 * and stays as the next pending change.
 */
export async function publishSettingDraft(key: string, accept?: (live: Record<string, unknown>, draft: Record<string, unknown>) => boolean): Promise<boolean> {
  return db.transaction(async (tx) => {
    await lockKey(tx, key);
    const [d] = await tx.select().from(settingDrafts).where(eq(settingDrafts.key, key)).for("update");
    if (!d) return false;
    const [row] = await tx.select().from(siteSettings).where(eq(siteSettings.key, key));
    const live = (row?.value ?? {}) as Record<string, unknown>;
    const value = { ...live, ...(d.value as Record<string, unknown>) }; // what is checked is what is written
    if (accept && !accept(live, value)) return false;
    await tx.insert(siteSettings).values({ key, value, updatedAt: new Date() }).onConflictDoUpdate({ target: siteSettings.key, set: { value, updatedAt: new Date() } });
    await tx.delete(settingDrafts).where(and(eq(settingDrafts.key, key), eq(settingDrafts.updatedAt, d.updatedAt)));
    return true;
  });
}
