"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { getLiveSetting, setSetting } from "@/lib/settings";
import { getResource } from "./resources";
import { getEditable, saveWithWorkflow } from "./workflow";
import { getSettingsGroup } from "./settings";
import { SEO_SETTING_KEYS } from "./seo";

/**
 * Save a page's Google title and description from Search & sharing (docs/screens/admin-seo.md) into the one place the
 * page keeps them: its record (as pending changes, like any edit of the page) or Settings → seo (live at once, like
 * every site setting).
 */

export type SeoSaved = { ok: true; pending: boolean } | { ok: false; error: string } | null;
const PAGE_RESOURCES = ["solutions", "pages", "site-pages"];
const clean = (v: FormDataEntryValue | null) => String(v ?? "").replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, 300);

export async function saveSeo(_prev: SeoSaved, fd: FormData): Promise<SeoSaved> {
  const user = await requireUser();
  const title = clean(fd.get("title"));
  const description = clean(fd.get("description"));
  try {
    if (fd.get("kind") === "record") {
      const res = getResource(String(fd.get("r")));
      const id = Number(fd.get("id"));
      if (!res || !PAGE_RESOURCES.includes(res.slug) || !Number.isInteger(id)) return { ok: false, error: "Unknown page" };
      const e = await getEditable(res, id);
      if (!e) return { ok: false, error: "The page is gone" };
      const { id: _id, ...row } = e.row;
      void _id;
      const result = await saveWithWorkflow(res, id, { ...row, metaTitle: title, metaDescription: description }, user);
      revalidatePath("/admin/seo");
      if (!result.pending) for (const p of res.revalidate) revalidatePath(p, "layout");
      return { ok: true, pending: result.pending };
    }
    const tk = String(fd.get("titleKey"));
    const dk = String(fd.get("descriptionKey"));
    if (!SEO_SETTING_KEYS.has(tk) || !SEO_SETTING_KEYS.has(dk)) return { ok: false, error: "Unknown field" };
    await setSetting("seo", { ...(await getLiveSetting("seo")), [tk]: title, [dk]: description });
    await audit(user, "settings", { label: "Search & sharing", meta: { key: "seo", fields: [tk, dk] } });
    for (const p of getSettingsGroup("seo")?.revalidate ?? []) revalidatePath(p);
    revalidatePath("/admin/seo");
    return { ok: true, pending: false };
  } catch (err) {
    console.error("saveSeo failed", err); // the reason stays in the server log, not in the admin
    return { ok: false, error: "Not saved. Try again." };
  }
}
