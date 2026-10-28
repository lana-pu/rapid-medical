import { desc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db, media } from "@/db";
import { requireUser } from "@/lib/auth";
import { storeFile } from "@/lib/storage";
import { PageHeader, Button, formatDate } from "@/components/admin/ui";

export default async function MediaPage() {
  const rows = await db.select().from(media).orderBy(desc(media.createdAt)).limit(300);

  async function upload(fd: FormData) {
    "use server";
    await requireUser();
    const files = fd.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
    for (const f of files) {
      const stored = await storeFile(f);
      await db.insert(media).values({ url: stored.url, filename: stored.filename, mime: stored.mime, size: stored.size });
    }
    redirect("/admin/media");
  }

  async function remove(fd: FormData) {
    "use server";
    await requireUser();
    await db.delete(media).where(eq(media.id, Number(fd.get("id"))));
    redirect("/admin/media");
  }

  async function updateAlt(fd: FormData) {
    "use server";
    await requireUser();
    await db.update(media).set({ alt: String(fd.get("alt") ?? "") }).where(eq(media.id, Number(fd.get("id"))));
    redirect("/admin/media");
  }

  return (
    <>
      <PageHeader title="Media library" subtitle={`${rows.length} files`} />
      <form action={upload} className="mb-6 flex items-center gap-3 rounded-lg border border-dashed border-neutral-300 bg-white p-4">
        <input type="file" name="files" multiple accept="image/*,.pdf" className="text-sm" />
        <Button type="submit">Upload</Button>
        <span className="text-xs text-neutral-500">Images and PDFs, up to 25 MB each.</span>
      </form>
      <div className="grid grid-cols-4 gap-4">
        {rows.map((m) => (
          <div key={m.id} className="rounded-lg border border-neutral-200 bg-white p-3 text-xs">
            {m.mime.startsWith("image/") ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={m.url} alt={m.alt} className="mb-2 h-32 w-full rounded object-contain bg-neutral-100" />
            ) : (
              <div className="mb-2 flex h-32 items-center justify-center rounded bg-neutral-100 text-neutral-500">{m.mime}</div>
            )}
            <div className="truncate font-medium" title={m.filename}>{m.filename}</div>
            <div className="text-neutral-500">{(m.size / 1024).toFixed(0)} KB · {formatDate(m.createdAt, { dateStyle: "medium" })}</div>
            <input readOnly value={m.url} className="mt-1 w-full rounded border border-neutral-200 px-1 py-0.5 font-mono text-[10px]" onFocus={undefined} />
            <form action={updateAlt} className="mt-1 flex gap-1">
              <input type="hidden" name="id" value={m.id} />
              <input name="alt" defaultValue={m.alt} placeholder="Alt text" className="w-full rounded border border-neutral-200 px-1 py-0.5" />
              <button className="rounded border border-neutral-300 px-2">Save</button>
            </form>
            <form action={remove} className="mt-1 text-right">
              <input type="hidden" name="id" value={m.id} />
              <button className="text-red-600 hover:underline">delete</button>
            </form>
          </div>
        ))}
      </div>
    </>
  );
}
