import Link from "next/link";
import { and, desc, eq, ilike } from "drizzle-orm";
import { db, media } from "@/db";
import { requireUser } from "@/lib/auth";
import { PageHeader, inputCls } from "@/components/admin/ui";
import { BackButton } from "@/components/admin/BackLink";
import { PdfUpload } from "@/components/admin/PdfUpload";

/** Create from a document, step 1: the PDF (docs/screens/admin-create-from-document.md). */
export default async function CreateFromDocument({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  await requireUser();
  const { q = "" } = await searchParams;
  const term = q.trim().slice(0, 80);
  const pdfs = await db
    .select({ id: media.id, filename: media.filename, pageCount: media.pageCount, createdAt: media.createdAt })
    .from(media)
    .where(and(eq(media.mime, "application/pdf"), term ? ilike(media.filename, `%${term.replace(/[%_\\]/g, "\\$&")}%`) : undefined))
    .orderBy(desc(media.createdAt), desc(media.id))
    .limit(40);
  return (
    <>
      <PageHeader crumbs={[{ label: "Publications & news", href: "/admin/materials" }]} title="Create from a document" subtitle="Step 1 of 2 · the PDF" actions={<BackButton fallback="/admin/materials" />} />
      <div className="max-w-3xl space-y-8">
        <section className="rounded-lg border border-neutral-200 bg-white p-5">
          <h2 className="text-sm font-semibold">Upload a PDF</h2>
          <p className="mt-1 text-sm text-neutral-600">A study, a poster, a press release, an article or an IFU. The site draws its pages and reads its text; the summary on top comes later, from your own AI.</p>
          <div className="mt-4"><PdfUpload /></div>
        </section>
        <section aria-label="PDFs in the media library">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 className="text-sm font-semibold">Or use a PDF from the media library</h2>
            <form className="flex gap-2" role="search">
              <input name="q" defaultValue={term} placeholder="Find by file name" aria-label="Find by file name" className={`${inputCls} w-56`} />
            </form>
          </div>
          <ul className="mt-3 divide-y divide-neutral-100 rounded-lg border border-neutral-200 bg-white">
            {pdfs.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center gap-3 px-4 py-3 text-sm">
                <span className="min-w-0 flex-1 truncate">{p.filename}</span>
                <span className="text-xs text-neutral-500">{p.pageCount ? `${p.pageCount} pages` : "PDF"}</span>
                <Link href={`/admin/create-from-document/${p.id}`} className="underline">Use this PDF</Link>
              </li>
            ))}
            {!pdfs.length && <li className="px-4 py-3 text-sm text-neutral-500">{term ? "No PDF with that name." : "No PDFs yet — upload one above."}</li>}
          </ul>
        </section>
      </div>
    </>
  );
}
