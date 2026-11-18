import { asc } from "drizzle-orm";
import { db, products } from "@/db";
import { requireUser } from "@/lib/auth";
import { suggestFromUrl } from "@/lib/document-import";
import { PageHeader } from "@/components/admin/ui";
import { BackButton } from "@/components/admin/BackLink";
import { DocumentImportForm } from "@/components/admin/DocumentImportForm";

/** Create from a document, step 2 for a web page: its link and pasted text — the site does not fetch it. */
export default async function CreateFromLink() {
  await requireUser();
  const prods = await db.select({ id: products.id, name: products.name }).from(products).orderBy(asc(products.sortOrder));
  return (
    <>
      <PageHeader crumbs={[{ label: "Publications & news", href: "/admin/materials" }, { label: "Create from a document", href: "/admin/create-from-document" }]} title="Create from a page" subtitle="Step 2 of 2 · the page, what it is and its summary" actions={<BackButton fallback="/admin/create-from-document" />} />
      <DocumentImportForm pdf={null} suggestion={suggestFromUrl("")} nct={null} products={prods} today={new Date().toISOString().slice(0, 10)} />
    </>
  );
}
