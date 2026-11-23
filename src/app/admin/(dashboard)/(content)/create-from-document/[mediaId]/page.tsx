import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { db, media, products } from "@/db";
import { requireUser } from "@/lib/auth";
import { findNct, suggestKind } from "@/lib/document-import";
import { PageHeader, Notice } from "@/components/admin/ui";
import { BackButton } from "@/components/admin/BackLink";
import { DocumentImportForm } from "@/components/admin/DocumentImportForm";

/** Create from a document, step 2: what it is, where it appears, the summary from your own AI. */
export default async function CreateFromDocumentStep2({ params }: { params: Promise<{ mediaId: string }> }) {
  await requireUser();
  const { mediaId } = await params;
  const id = /^\d{1,9}$/.test(mediaId) ? Number(mediaId) : 0;
  const pdf = id ? await db.query.media.findFirst({ where: eq(media.id, id) }) : null;
  if (!pdf) notFound();
  const prods = await db.select({ id: products.id, name: products.name }).from(products).orderBy(asc(products.sortOrder));
  const text = pdf.text ?? "";
  return (
    <>
      <PageHeader crumbs={[{ label: "Publications & news", href: "/admin/materials" }, { label: "Create from a document", href: "/admin/create-from-document" }]} title="Create from a document" subtitle="Step 2 of 2 · what it is and its summary" actions={<BackButton fallback="/admin/create-from-document" />} />
      {pdf.mime !== "application/pdf" ? (
        <Notice kind="error">This file is not a PDF. Choose a PDF in step 1.</Notice>
      ) : (
        <DocumentImportForm
          pdf={{ id: pdf.id, filename: pdf.filename, url: pdf.url, pageCount: pdf.pageCount ?? null, hasText: text.trim().length > 200 }}
          suggestion={suggestKind(text)}
          nct={findNct(text)}
          products={prods}
          today={new Date().toISOString().slice(0, 10)}
        />
      )}
    </>
  );
}
