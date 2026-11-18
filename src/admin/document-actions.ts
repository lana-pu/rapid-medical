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
import { checkQuoted, documentBlocks, mergePassport, parseAnswer, type CheckItem, type FullTextMode } from "@/lib/document-import";
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
      showInEvidence: fd.get("showInEvidence") === "on", showInNews: fd.get("showInNews") === "on", featured: fd.get("featured") === "on",
      blocks, documentCheck, status: "draft",
    },
    user,
  );
  await audit(user, "save", { resource: "materials", recordId: saved.id, label: title, meta: { fromDocument: pdf.filename, checks: items.length, toCheck: items.filter((x) => x.status === "check").length } });
  redirect(`/admin/materials/${saved.id}?created=document`);
}

/** «Looks right»: a person looked at the quote in the PDF. Stored on the record (not a content change), with who and when. */
export async function confirmCheck(fd: FormData) {
  const user = await requireUser();
  const id = Number(fd.get("id"));
  const item = String(fd.get("item") ?? "");
  const row = Number.isInteger(id) ? await db.query.materials.findFirst({ where: eq(materials.id, id) }) : null;
  const dc = row?.documentCheck;
  if (!row || !dc || !dc.items.some((x) => x.id === item)) redirect(`/admin/materials/${id}?error=${encodeURIComponent("Nothing to confirm")}`);
  const items = dc.items.map((x) => (x.id === item && x.status === "check" ? { ...x, status: "confirmed" as const, confirmedBy: user.name || user.email, confirmedAt: new Date().toISOString() } : x));
  await db.update(materials).set({ documentCheck: { ...dc, items } }).where(eq(materials.id, id));
  const it = items.find((x) => x.id === item)!;
  await audit(user, "save", { resource: "materials", recordId: id, label: row.title, meta: { confirmed: `${it.label}: ${it.value}` } });
  redirect(`/admin/materials/${id}?checked=1#checks`);
}
