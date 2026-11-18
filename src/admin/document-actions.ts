"use server";
/**
 * «Create from a document» (docs/screens/admin-create-from-document.md): a PDF of the media library + the answer of the
 * team's own AI → a draft material whose every quoted value was looked for in the PDF; a person confirms what the site
 * could not. The site calls no AI; the only outside request is ClinicalTrials.gov for an NCT number.
 */
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, media, materials, products, MATERIAL_KINDS, type DocumentCheck, type MaterialKind, type Region } from "@/db";
import { requireUser } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { isRegion } from "@/lib/regions";
import { checkGroups, checkQuoted, documentBlocks, mergePassport, parseAnswer, type CheckItem, type FullTextMode } from "@/lib/document-import";
import { fetchRegistry, registryUrl } from "@/lib/clinicaltrials";
import { getResource } from "./resources";
import { saveWithWorkflow } from "./workflow";

export type CreateState = { error: string } | null;

const MODES: FullTextMode[] = ["copy", "embed", "link"];
const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();

export async function createFromDocument(_prev: CreateState, fd: FormData): Promise<CreateState> {
  const user = await requireUser();
  const res = getResource("materials")!;

  const pdf = await db.query.media.findFirst({ where: eq(media.id, Number(str(fd, "mediaId")) || 0) });
  if (!pdf || pdf.mime !== "application/pdf") return { error: "Choose a PDF from the media library." };
  const kind = str(fd, "kind") as MaterialKind;
  if (!MATERIAL_KINDS.includes(kind)) return { error: "Choose what kind of material this is." };
  const mode = (MODES.includes(str(fd, "mode") as FullTextMode) ? str(fd, "mode") : "embed") as FullTextMode;
  const regions = fd.getAll("regions").map(String).filter(isRegion) as Region[];
  const productId = Number(str(fd, "productId")) || null;
  const product = productId ? await db.query.products.findFirst({ where: eq(products.id, productId) }) : null;
  if (productId && !product) return { error: "That product is not in the list." };
  const original = str(fd, "url");
  if (original && !/^https:\/\/[^\s/]+\.[^\s]+$/.test(original)) return { error: "The link to the original must start with https://" };
  const nct = str(fd, "nct").toUpperCase();
  if (nct && !/^NCT\d{8}$/.test(nct)) return { error: "An NCT number is NCT and 8 digits, e.g. NCT04518670." };
  const day = str(fd, "publishedOn");
  const publishedOn = /^\d{4}-\d{2}-\d{2}$/.test(day) ? new Date(day) : new Date();

  // the summary: from the team's own AI, checked here; a document (IFU) has none — it is the PDF itself
  const parsed = kind === "document" ? null : parseAnswer(str(fd, "answer"));
  if (parsed && !parsed.ok) return { error: parsed.error };
  const answer = parsed?.ok ? parsed.answer : null;
  const title = answer?.title ?? str(fd, "title");
  if (!title) return { error: "Give the document a title." };

  const text = pdf.text ?? "";
  const items: CheckItem[] = [
    ...(answer?.figures ?? []).map((f, i) => checkQuoted(text, "figures", i, f)),
    ...(answer?.passport ?? []).map((p, i) => checkQuoted(text, "passport", i, p)),
  ];
  // the registry fills what the document does not say; where they differ the document's value stays, a person checks
  const registry = nct && kind === "study" ? await fetchRegistry(nct) : null;
  const merged = mergePassport(answer?.passport ?? [], registry?.ok ? registry.rows : []);
  for (const c of merged.conflicts) {
    const it = items.find((x) => x.id === `passport-${c.index}`);
    if (it) Object.assign(it, { status: "check", reason: `ClinicalTrials.gov says ${c.registry}` });
  }
  const passportSource = merged.rows.length
    ? { label: registry?.ok ? `${title} and ClinicalTrials.gov ${nct}` : title, href: registry?.ok ? registryUrl(nct) : null }
    : null;

  const blocks = documentBlocks({ kind, title, product: product?.name ?? null, answer, passport: merged.rows, passportSource, pdf: { url: pdf.url, text }, original: original || null, mode });
  if (answer) items.push(...checkGroups(text, answer, blocks));
  const documentCheck: DocumentCheck = {
    mediaId: pdf.id,
    file: pdf.filename,
    nct: nct || null,
    registry: registry ? (registry.ok ? { ok: true } : { ok: false, error: registry.error }) : null,
    items,
  };
  const saved = await saveWithWorkflow(
    res,
    null,
    {
      kind, title, publishedOn, productId, regions, url: original || null, pdfUrl: pdf.url, excerpt: answer?.conclusion ?? "",
      showInEvidence: fd.get("showInEvidence") === "on", showInNews: fd.get("showInNews") === "on",
      // a highlight: on top of News, and featured on Evidence in every region it is shown in
      featured: fd.get("featured") === "on" && fd.get("showInNews") === "on",
      featuredRegions: fd.get("featured") === "on" && fd.get("showInEvidence") === "on" ? (regions.length ? regions : (["us", "ous", "apac"] as Region[])) : [],
      blocks, documentCheck, status: "draft",
    },
    user,
  );
  await audit(user, "save", { resource: "materials", recordId: saved.id, label: title, meta: { fromDocument: pdf.filename, checks: items.length, toCheck: items.filter((x) => x.status === "check").length } });
  redirect(`/admin/materials/${saved.id}?created=document`);
}

/** «Looks right» on one value: stored on the record (not a content change), with who and when; audited. */
async function confirmItem(id: number, item: string, user: { name: string; email: string }): Promise<DocumentCheck | null> {
  const row = Number.isInteger(id) ? await db.query.materials.findFirst({ where: eq(materials.id, id) }) : null;
  const dc = row?.documentCheck;
  if (!row || !dc || !dc.items.some((x) => x.id === item)) return null;
  const items = dc.items.map((x) => (x.id === item && x.status === "check" ? { ...x, status: "confirmed" as const, confirmedBy: user.name || user.email, confirmedAt: new Date().toISOString() } : x));
  await db.update(materials).set({ documentCheck: { ...dc, items } }).where(eq(materials.id, id));
  const it = items.find((x) => x.id === item)!;
  await audit(user as Parameters<typeof audit>[0], "save", { resource: "materials", recordId: id, label: row.title, meta: { confirmed: `${it.label}: ${it.value}` } });
  return { ...dc, items };
}

/** «Looks right» from the record's card (a form). */
export async function confirmCheck(fd: FormData) {
  const user = await requireUser();
  const id = Number(fd.get("id"));
  const done = await confirmItem(id, String(fd.get("item") ?? ""), user);
  if (!done) redirect(`/admin/materials/${id}?error=${encodeURIComponent("Nothing to confirm")}`);
  redirect(`/admin/materials/${id}?checked=1#checks`);
}

/** The checks of a page in the editor (docs/screens/on-page-editor.md → Проверка по PDF); null when it has none. */
export async function pageChecks(ref: { r: string; id: number }): Promise<DocumentCheck | null> {
  await requireUser();
  if (ref.r !== "materials" || !Number.isInteger(ref.id)) return null;
  const row = await db.query.materials.findFirst({ columns: { documentCheck: true }, where: eq(materials.id, ref.id) });
  return row?.documentCheck ?? null;
}

/** «Looks right» from the editor: the updated checks back, no navigation. */
export async function confirmCheckInline(id: number, item: string): Promise<DocumentCheck | { error: string }> {
  const user = await requireUser();
  return (await confirmItem(id, String(item), user)) ?? { error: "Nothing to confirm" };
}
