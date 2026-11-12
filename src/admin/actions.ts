"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { getResource } from "./resources";
import { parseForm, duplicateRow, bulk, getRow, type FieldErrors } from "./engine";
import { saveWithWorkflow, getEditable, publish, unpublish, discardDraft, setReview, schedule, restoreRevision, canPublish, getDraft, hasWorkflow } from "./workflow";
import type { ReviewStatus } from "@/db";

export type SaveState = { errors?: FieldErrors; message?: string } | null;

function revalidate(paths: string[], extra?: string | null) {
  for (const p of paths) revalidatePath(p, "layout");
  if (extra) revalidatePath(extra);
  revalidatePath("/sitemap.xml");
}

export async function saveResource(_prev: SaveState, fd: FormData): Promise<SaveState> {
  const user = await requireUser();
  const slug = String(fd.get("__resource"));
  const idRaw = fd.get("__id");
  const id = idRaw ? Number(idRaw) : null;
  const res = getResource(slug);
  if (!res) return { message: "Unknown resource" };

  const parsed = parseForm(res, fd);
  const { errors } = parsed;
  if (Object.keys(errors).length) return { errors, message: "Please fix the highlighted fields." };
  // Fields edited on the page (ADR-007) are not in the form: keep what the page has now (pending draft over live).
  let data = parsed.data;
  if (id) {
    const current = await getEditable(res, id);
    if (current) for (const f of res.fields) if (f.onPage) data[f.name] = current.row[f.name];
  } else if (res.onCreate) data = res.onCreate(data);

  let result: { id: number; pending: boolean };
  try {
    result = await saveWithWorkflow(res, id, data, user);
  } catch (e) {
    const msg = (e as Error).message;
    if (/unique/i.test(msg)) return { message: "A record with this slug/region already exists." };
    return { message: msg };
  }
  if (!result.pending) revalidate(res.revalidate, res.previewUrl?.(data) ?? null);
  redirect(`/admin/${res.slug}/${result.id}?${result.pending ? "pending=1" : "saved=1"}`);
}

async function ctx(fd: FormData) {
  const user = await requireUser();
  const slug = String(fd.get("__resource"));
  const id = Number(fd.get("__id"));
  const res = getResource(slug);
  if (!res || !id) throw new Error("Bad request");
  return { user, res, id };
}

export async function publishResource(fd: FormData) {
  const { user, res, id } = await ctx(fd);
  const draft = await getDraft(res, id);
  const allowed = await canPublish(user, draft);
  if (!allowed.ok) redirect(`/admin/${res.slug}/${id}?error=${encodeURIComponent(allowed.reason ?? "Not allowed")}`);
  await publish(res, id, user);
  const row = await getRow(res, id);
  revalidate(res.revalidate, row ? res.previewUrl?.(row) ?? null : null);
  redirect(`/admin/${res.slug}/${id}?published=1`);
}

export async function unpublishResource(fd: FormData) {
  const { user, res, id } = await ctx(fd);
  const row = await getRow(res, id);
  await unpublish(res, id, user);
  revalidate(res.revalidate, row ? res.previewUrl?.(row) ?? null : null);
  redirect(`/admin/${res.slug}/${id}?unpublished=1`);
}

export async function discardDraftAction(fd: FormData) {
  const { user, res, id } = await ctx(fd);
  await discardDraft(res, id, user);
  redirect(`/admin/${res.slug}/${id}?discarded=1`);
}

export async function reviewAction(fd: FormData) {
  const { user, res, id } = await ctx(fd);
  const status = String(fd.get("status")) as ReviewStatus;
  const note = String(fd.get("note") ?? "").slice(0, 2000);
  if (!["editing", "in_review", "changes_requested", "approved"].includes(status)) return;
  if ((status === "approved" || status === "changes_requested") && user.role === "editor") redirect(`/admin/${res.slug}/${id}?error=Only+approvers+can+approve`);
  await setReview(res, id, status, note, user);
  redirect(`/admin/${res.slug}/${id}?review=${status}`);
}

export async function scheduleAction(fd: FormData) {
  const { user, res, id } = await ctx(fd);
  const raw = String(fd.get("publishAt") ?? "");
  const at = raw ? new Date(raw) : null;
  if (at && Number.isNaN(at.getTime())) redirect(`/admin/${res.slug}/${id}?error=Invalid+date`);
  await schedule(res, id, at, user);
  redirect(`/admin/${res.slug}/${id}?scheduled=1`);
}

export async function restoreAction(fd: FormData) {
  const { user, res, id } = await ctx(fd);
  const revId = Number(fd.get("revision"));
  await restoreRevision(res, revId, user);
  redirect(`/admin/${res.slug}/${id}?restored=1`);
}

export async function duplicateResource(fd: FormData) {
  const { user, res, id } = await ctx(fd);
  const overrides: Record<string, unknown> = {};
  const region = fd.get("region");
  if (region) overrides.region = region;
  const newId = await duplicateRow(res, id, overrides);
  await audit(user, "save", { resource: res.slug, recordId: newId, meta: { duplicatedFrom: id, ...overrides } });
  redirect(`/admin/${res.slug}/${newId}`);
}

export async function bulkResource(fd: FormData) {
  const user = await requireUser();
  const slug = String(fd.get("__resource"));
  const action = String(fd.get("__action")) as "publish" | "unpublish" | "delete";
  const ids = fd.getAll("ids").map(Number).filter(Boolean);
  const res = getResource(slug);
  if (!res || !["publish", "unpublish", "delete"].includes(action)) return;
  if (action === "publish" && hasWorkflow(res)) {
    for (const id of ids) {
      const allowed = await canPublish(user, await getDraft(res, id));
      if (allowed.ok) await publish(res, id, user);
    }
  } else {
    await bulk(res, ids, action);
    await audit(user, "bulk", { resource: res.slug, meta: { action, ids } });
  }
  revalidate(res.revalidate);
  redirect(`/admin/${res.slug}?bulk=${action}&n=${ids.length}`);
}
