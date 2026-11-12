"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { fromIsraelInput } from "@/lib/israel-time";
import { getResource } from "./resources";
import { parseForm, duplicateRow, bulk, getRow, type FieldErrors } from "./engine";
import { saveWithWorkflow, getEditable, publish, unpublish, discardDraft, schedule, restoreRevision, hasWorkflow } from "./workflow";

export type SaveState = { errors?: FieldErrors; message?: string } | null;

function revalidate(paths: string[], extra?: string | null) {
  for (const p of paths) revalidatePath(p, "layout");
  if (extra) revalidatePath(extra);
  revalidatePath("/sitemap.xml");
}

const needAttention = (n: number) => `${n} field${n > 1 ? "s" : ""} need${n > 1 ? "" : "s"} attention`;

type Persisted = { user: Awaited<ReturnType<typeof requireUser>>; res: NonNullable<ReturnType<typeof getResource>>; data: Record<string, unknown>; result: { id: number; pending: boolean } };

/** Validate the form and save it through the workflow (never publishes). */
async function persist(fd: FormData): Promise<Persisted | { state: NonNullable<SaveState> }> {
  const user = await requireUser();
  const slug = String(fd.get("__resource"));
  const idRaw = fd.get("__id");
  const id = idRaw ? Number(idRaw) : null;
  const res = getResource(slug);
  if (!res) return { state: { message: "Unknown resource" } };
  if (res.alwaysLive && !id) return { state: { message: "These pages exist once; open them from Pages" } };

  const parsed = parseForm(res, fd);
  const { errors } = parsed;
  if (Object.keys(errors).length) return { state: { errors, message: needAttention(Object.keys(errors).length) } };
  // Fields edited on the page (ADR-007) are not in the form: keep what the page has now (pending draft over live).
  let data = parsed.data;
  if (id) {
    const current = await getEditable(res, id);
    if (current) for (const f of res.fields) if (f.onPage) data[f.name] = current.row[f.name];
  } else if (res.onCreate) data = res.onCreate(data);

  try {
    const result = await saveWithWorkflow(res, id, data, user);
    if (!result.pending) revalidate(res.revalidate, res.previewUrl?.(data) ?? null);
    return { user, res, data, result };
  } catch (e) {
    const msg = (e as Error).message;
    if (/unique/i.test(msg)) return { state: { message: "A record with this slug/region already exists." } };
    console.error("save failed", e);
    return { state: { message: "Could not save. Try again." } };
  }
}

/** Create draft / Save (resources without workflow) / Publish (`__intent=publish`: save, then publish). */
export async function saveResource(_prev: SaveState, fd: FormData): Promise<SaveState> {
  const p = await persist(fd);
  if ("state" in p) return p.state;
  const { user, res, result } = p;
  if (fd.get("__intent") === "publish" && hasWorkflow(res)) {
    await publish(res, result.id, user);
    const row = await getRow(res, result.id);
    revalidate(res.revalidate, row ? res.previewUrl?.(row) ?? null : null);
    redirect(`/admin/${res.slug}/${result.id}?published=1`);
  }
  redirect(`/admin/${res.slug}/${result.id}?${result.pending ? "pending=1" : "saved=1"}`);
}

export type AutosaveResult = { ok: true; at: string; pending: boolean } | { ok: false; message: string; errors?: FieldErrors };

/** Autosave of an existing record (docs/screens/admin-record-edit.md): saves, never publishes, never redirects. */
export async function autosaveResource(fd: FormData): Promise<AutosaveResult> {
  if (!fd.get("__id")) return { ok: false, message: "Create the draft first" };
  const p = await persist(fd);
  if ("state" in p) return { ok: false, message: p.state.message ?? "Not saved", errors: p.state.errors };
  return { ok: true, at: new Date().toISOString(), pending: p.result.pending };
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
  await publish(res, id, user);
  const row = await getRow(res, id);
  revalidate(res.revalidate, row ? res.previewUrl?.(row) ?? null : null);
  redirect(`/admin/${res.slug}/${id}?published=1`);
}

export async function unpublishResource(fd: FormData) {
  const { user, res, id } = await ctx(fd);
  if (res.alwaysLive) redirect(`/admin/${res.slug}/${id}?error=${encodeURIComponent("This page is always live")}`);
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

export async function scheduleAction(fd: FormData) {
  const { user, res, id } = await ctx(fd);
  const raw = String(fd.get("publishAt") ?? "");
  const at = raw ? fromIsraelInput(raw) : null; // typed as Israel time
  if (raw && !at) redirect(`/admin/${res.slug}/${id}?error=Invalid+date`);
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
  if (res.alwaysLive) redirect(`/admin/${res.slug}/${id}`);
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
  const ids = [...new Set(fd.getAll("ids").map(Number).filter((n) => Number.isInteger(n) && n > 0))];
  const res = getResource(slug);
  if (!res || !["publish", "unpublish", "delete"].includes(action)) return;
  if (res.alwaysLive && action !== "publish") return; // Home, About… cannot be unpublished or deleted
  if (action === "publish" && hasWorkflow(res)) {
    for (const id of ids) {
      if (await getEditable(res, id)) await publish(res, id, user); // a row gone meanwhile is skipped
    }
  } else if (action === "unpublish" && hasWorkflow(res)) {
    // the same as one by one: pending changes kept, approval reset, schedule cancelled
    for (const id of ids) await unpublish(res, id, user);
  } else {
    await bulk(res, ids, action);
    await audit(user, "bulk", { resource: res.slug, meta: { action, ids } });
  }
  revalidate(res.revalidate);
  redirect(`/admin/${res.slug}?bulk=${action}&n=${ids.length}`);
}
