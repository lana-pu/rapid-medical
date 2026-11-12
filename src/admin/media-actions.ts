"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db, media, type Media } from "@/db";
import { audit } from "@/lib/audit";
import { getLiveSetting, getSettingDraft, setSetting, setSettingDraft, deleteSettingDraft } from "@/lib/settings";
import { findMediaUsage, swapUrl, urlPattern, type MediaUsage } from "@/lib/media-usage";
import { getSettingsGroup } from "./settings";
import { getResource } from "./resources";
import { canPublish, getDraft, getEditable, publish, saveWithWorkflow, workflowSettings } from "./workflow";
import { requireEditor } from "./page-core";

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Media library actions (docs/screens/admin-media.md): replace a file everywhere it is used — as unpublished changes
 * (owner's decision 2026-11-11) or published at once when the user may publish; edit a file's description.
 */

type Fail = { error: string };

const kind = (m: Pick<Media, "mime">) => (m.mime.startsWith("image/") ? "picture" : m.mime.startsWith("video/") ? "video" : m.mime === "application/pdf" ? "PDF" : "file");

export type ReplaceResult = { places: { label: string; href: string; pagePath: string | null; live: boolean }[]; notPublished: string[] };

export async function replaceEverywhere(oldId: number, newId: number, mode: "draft" | "publish"): Promise<ReplaceResult | Fail> {
  try {
    const user = await requireEditor();
    const [from, to] = await Promise.all([db.query.media.findFirst({ where: eq(media.id, Number(oldId)) }), db.query.media.findFirst({ where: eq(media.id, Number(newId)) })]);
    if (!from || !to) return { error: "File not found" };
    if (from.id === to.id) return { error: "Choose a different file" };
    if (kind(from) !== kind(to)) return { error: `Replace a ${kind(from)} with a ${kind(from)}` };
    const wf = await workflowSettings();
    if (mode === "publish" && wf.requireApproval && user.role === "editor") return { error: "Needs approval: publish each page after review" };

    const usage = await findMediaUsage(from.url);
    if (!usage.length) return { error: "This file is not used anywhere" };
    const re = urlPattern(from.url);
    const result: ReplaceResult = { places: [], notPublished: [] };

    for (const u of usage) {
      if (u.r.startsWith("settings:")) {
        const key = u.r.slice(9);
        const [live, draft] = await Promise.all([getLiveSetting(key), getSettingDraft(key)]);
        const next = swapUrl({ ...live, ...(draft?.value ?? {}) }, re, to.url) as Record<string, unknown>;
        if (mode === "publish") {
          await setSetting(key, next);
          await deleteSettingDraft(key);
          for (const p of getSettingsGroup(key)?.revalidate ?? ["/"]) revalidatePath(p, "layout");
        } else await setSettingDraft(key, next, user);
        result.places.push({ label: u.label, href: u.adminHref, pagePath: null, live: mode === "publish" });
        continue;
      }
      const res = getResource(u.r);
      if (!res) continue;
      const e = await getEditable(res, u.id);
      if (!e) continue;
      const next = swapUrl(e.row, re, to.url) as Record<string, any>;
      const { id: _id, ...data } = next;
      void _id;
      const saved = await saveWithWorkflow(res, u.id, { ...data, status: e.live.status }, user);
      let live = !saved.pending && e.live.status === "published";
      if (mode === "publish" && saved.pending) {
        const checked = await getDraft(res, u.id);
        if ((await canPublish(user, checked)).ok && (await publish(res, u.id, user, checked).then(() => true, () => false))) live = true;
        else result.notPublished.push(u.label);
      }
      if (live) {
        for (const p of res.revalidate) revalidatePath(p, "layout");
        if (u.pagePath) revalidatePath(u.pagePath);
      }
      result.places.push({ label: u.label, href: u.adminHref, pagePath: u.pagePath, live });
    }
    // the description stays with the picture
    if (!to.alt && from.alt) await db.update(media).set({ alt: from.alt }).where(eq(media.id, to.id));
    await audit(user, "media", { recordId: from.id, label: from.filename, meta: { replaced: true, by: to.filename, places: result.places.length, mode } });
    return result;
  } catch (err) {
    return { error: (err as Error).message || "Something went wrong" };
  }
}

/** Where a file is used (for the replace dialog). */
export async function mediaUsage(id: number): Promise<{ usage: MediaUsage[] } | Fail> {
  try {
    await requireEditor();
    const m = await db.query.media.findFirst({ where: eq(media.id, Number(id)) });
    if (!m) return { error: "File not found" };
    return { usage: await findMediaUsage(m.url) };
  } catch (err) {
    return { error: (err as Error).message };
  }
}

/** A file's description (alt). */
export async function setMediaAlt(id: number, alt: string): Promise<{ ok: true } | Fail> {
  try {
    const user = await requireEditor();
    const text = String(alt ?? "").replace(/\s+/g, " ").trim().slice(0, 300);
    const m = await db.query.media.findFirst({ where: eq(media.id, Number(id)) });
    if (!m) return { error: "File not found" };
    if (m.alt === text) return { ok: true };
    await db.update(media).set({ alt: text }).where(eq(media.id, m.id));
    await audit(user, "media", { recordId: m.id, label: m.filename, meta: { alt: true } });
    revalidatePath("/", "layout"); // the description is the picture's alt on every page
    return { ok: true };
  } catch (err) {
    return { error: (err as Error).message };
  }
}
