"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getResource } from "./resources";
import { parseForm, saveRow, deleteRow, duplicateRow, bulk, type FieldErrors } from "./engine";

export type SaveState = { errors?: FieldErrors; message?: string } | null;

function revalidate(paths: string[], extra?: string | null) {
  for (const p of paths) revalidatePath(p, "layout");
  if (extra) revalidatePath(extra);
  revalidatePath("/sitemap.xml");
}

export async function saveResource(_prev: SaveState, fd: FormData): Promise<SaveState> {
  await requireUser();
  const slug = String(fd.get("__resource"));
  const idRaw = fd.get("__id");
  const id = idRaw ? Number(idRaw) : null;
  const res = getResource(slug);
  if (!res) return { message: "Unknown resource" };

  const { data, errors } = parseForm(res, fd);
  if (Object.keys(errors).length) return { errors, message: "Please fix the highlighted fields." };

  let savedId: number;
  try {
    savedId = await saveRow(res, id, data);
  } catch (e) {
    const msg = (e as Error).message;
    if (/unique/i.test(msg)) return { message: "A record with this slug/region already exists." };
    return { message: msg };
  }
  revalidate(res.revalidate, res.previewUrl?.(data) ?? null);
  redirect(`/admin/${res.slug}/${savedId}?saved=1`);
}

export async function deleteResource(fd: FormData) {
  await requireUser();
  const slug = String(fd.get("__resource"));
  const id = Number(fd.get("__id"));
  const res = getResource(slug);
  if (!res || !id) return;
  await deleteRow(res, id);
  revalidate(res.revalidate);
  redirect(`/admin/${res.slug}?deleted=1`);
}

export async function duplicateResource(fd: FormData) {
  await requireUser();
  const slug = String(fd.get("__resource"));
  const id = Number(fd.get("__id"));
  const res = getResource(slug);
  if (!res || !id) return;
  const overrides: Record<string, unknown> = {};
  // Therapy pages: "Copy to other region"
  const region = fd.get("region");
  if (region) overrides.region = region;
  const newId = await duplicateRow(res, id, overrides);
  redirect(`/admin/${res.slug}/${newId}`);
}

export async function bulkResource(fd: FormData) {
  await requireUser();
  const slug = String(fd.get("__resource"));
  const action = String(fd.get("__action")) as "publish" | "unpublish" | "delete";
  const ids = fd.getAll("ids").map(Number).filter(Boolean);
  const res = getResource(slug);
  if (!res || !["publish", "unpublish", "delete"].includes(action)) return;
  await bulk(res, ids, action);
  revalidate(res.revalidate);
  redirect(`/admin/${res.slug}?bulk=${action}&n=${ids.length}`);
}
