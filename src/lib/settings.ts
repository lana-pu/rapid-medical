import "server-only";
import { eq } from "drizzle-orm";
import { db, siteSettings } from "@/db";

export type SettingsMap = Record<string, Record<string, unknown>>;

export async function getSetting<T extends Record<string, unknown>>(key: string): Promise<T> {
  const row = await db.query.siteSettings.findFirst({ where: eq(siteSettings.key, key) });
  return ((row?.value ?? {}) as T);
}

export async function getAllSettings(): Promise<SettingsMap> {
  const rows = await db.select().from(siteSettings);
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}

export async function setSetting(key: string, value: Record<string, unknown>) {
  await db
    .insert(siteSettings)
    .values({ key, value, updatedAt: new Date() })
    .onConflictDoUpdate({ target: siteSettings.key, set: { value, updatedAt: new Date() } });
}
