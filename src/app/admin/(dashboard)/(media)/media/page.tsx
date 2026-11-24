import { desc, eq, sql } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db, media } from "@/db";
import { findMediaUsage, mediaIndex, usageIn } from "@/lib/media-usage";
import { mediaLibrary, pageSections, type Group, type LibraryItem } from "@/admin/media-library";
import { PageHeader, formatDate, inputCls } from "@/components/admin/ui";
import { MediaDrop, MediaGrid, SortSelect, UploadButton, type GridItem } from "@/components/admin/MediaGrid";
import { BackButton } from "@/components/admin/BackLink";
import { AltField, DeleteFile, DescribeQueue, ReplaceButton } from "@/components/admin/MediaTools";
import { editorHref } from "@/lib/demo";
import { SpaceColumn } from "@/components/admin/SpaceColumn";
import { MAIN_BLEED, MAIN_PAD } from "@/components/admin/chrome";

/**
 * The media library in order (docs/screens/admin-media.md → «Порядок в медиатеке»): groups on the left built from where
 * files are used (pages by section, lists, site settings, not used), the grid on the right. Admin chrome palette.
 */
type SP = { q?: string; show?: string; in?: string; sort?: string; page?: string; id?: string; describe?: string };

const noAlt = sql`${media.mime} like 'image/%' and ${media.alt} = ''`;
const SHOW: Record<string, { label: string; test: (m: LibraryItem) => boolean }> = {
  unused: { label: "Not used", test: (m) => m.usedCount === 0 },
  noalt: { label: "No description", test: (m) => m.mime.startsWith("image/") && !m.alt },
  image: { label: "Pictures", test: (m) => m.mime.startsWith("image/") },
  video: { label: "Videos", test: (m) => m.mime.startsWith("video/") },
  pdf: { label: "PDFs", test: (m) => m.mime === "application/pdf" },
};
const SORTS = { new: "Newest", name: "Name", size: "Size" } as const;
const PER = 60;

const toGrid = (m: LibraryItem): GridItem => ({ id: m.id, url: m.url, filename: m.filename, mime: m.mime, size: m.size, alt: m.alt, thumb: m.mime.startsWith("image/") ? m.url : null, poster: m.posterUrl ?? null, used: m.used });
const fileSize = (b: number) => (b >= 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);

export default async function MediaPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  if (sp.id) return <MediaDetail id={Number(sp.id)} />;
  if (sp.describe) return <Describe />;

  const lib = await mediaLibrary();
  const show = sp.show && SHOW[sp.show] ? sp.show : "";
  const group = sp.in ? lib.groups.find((g) => g.key === sp.in) : undefined;
  const sort = (sp.sort && sp.sort in SORTS ? sp.sort : "new") as keyof typeof SORTS;
  const needle = sp.q?.trim().toLowerCase() ?? "";
  const inGroup = group ? lib.idsOf(group.key) : null;
  const shown = lib.items
    .filter((m) => (!show || SHOW[show].test(m)) && (!inGroup || inGroup.has(m.id)) && (!needle || m.filename.toLowerCase().includes(needle) || m.alt.toLowerCase().includes(needle)))
    .sort((a, b) => (sort === "name" ? a.filename.localeCompare(b.filename) : sort === "size" ? b.size - a.size : b.createdAt.getTime() - a.createdAt.getTime()));
  const missing = lib.items.filter(SHOW.noalt.test).length;
  const title = group?.label ?? (show ? SHOW[show].label : "All files");

  // A page of the site: its files by the section of the page; everything else: one grid, 60 per page.
  const sections = group?.section === "site" ? await pageSections(group.key.slice(5), shown) : null;
  const pages = Math.max(1, Math.ceil(shown.length / PER));
  const page = Math.min(pages, Math.max(1, Number(sp.page ?? 1)));
  const href = (over: Partial<SP>) => {
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries({ q: sp.q, show, in: group?.key, sort: sort === "new" ? "" : sort, ...over })) if (v) q.set(k, String(v));
    const s = q.toString();
    return s ? `/admin/media?${s}` : "/admin/media";
  };
  const byId = new Map(shown.map((m) => [m.id, m]));
  const uploads = !show && !group; // «All files»: Upload in the header, files dropped anywhere on the library

  const content = (
    <>
        <PageHeader
          title={title}
          subtitle={`${shown.length} file${shown.length === 1 ? "" : "s"}${group?.section === "site" ? " · every region of the page" : ""}`}
          note={uploads ? <span className="hidden text-neutral-500 sm:inline">Drop files anywhere here to upload.</span> : undefined}
          actions={uploads || missing > 0 ? <>{uploads && <UploadButton />}{missing > 0 && <Link href="/admin/media?describe=1" className="rounded bg-neutral-900 px-3 py-2 text-sm font-medium text-white hover:bg-neutral-700">Describe pictures ({missing})</Link>}</> : undefined}
        />
        <form className="mb-4 flex flex-wrap items-center gap-2" role="search">
          {show && <input type="hidden" name="show" value={show} />}
          {group && <input type="hidden" name="in" value={group.key} />}
          <input name="q" type="search" defaultValue={sp.q ?? ""} placeholder="Search name or description…" aria-label="Search files" className={`${inputCls} max-w-xs`} />
          <SortSelect value={sort} options={Object.entries(SORTS)} />
          {needle && <Link href={href({ q: "" })} className="text-sm underline">Clear search</Link>}
        </form>
        {sections ? (
          <div className="space-y-8">
            {sections.map((s) => (
              <section key={s.section} aria-label={s.section}>
                <h2 className="mb-3 text-[13px] font-semibold text-neutral-800">{s.section} <span className="font-normal text-neutral-400">· {s.ids.length}</span></h2>
                <MediaGrid items={s.ids.map((id) => byId.get(id)).filter((m): m is LibraryItem => !!m).map(toGrid)} />
              </section>
            ))}
          </div>
        ) : (
          <>
            <MediaGrid emptyUpload={uploads && !needle} selectable={show === "unused"} items={shown.slice((page - 1) * PER, page * PER).map(toGrid)} />
            {!shown.length && <p className="py-10 text-center text-sm text-neutral-500">{show === "unused" ? "Every file is used somewhere." : show === "noalt" ? "Every picture has a description." : "Nothing matches."}</p>}
          </>
        )}
        {!sections && pages > 1 && (
          <div className="mt-4 flex justify-center gap-3 text-sm">
            {page > 1 && <Link href={href({ page: String(page - 1) })} className="underline">‹ Prev</Link>}
            <span className="text-neutral-500">Page {page} of {pages}</span>
            {page < pages && <Link href={href({ page: String(page + 1) })} className="underline">Next ›</Link>}
          </div>
        )}
    </>
  );

  return (
    <div className={`${MAIN_BLEED} flex min-h-[calc(100vh-3rem)] flex-col lg:flex-row`}>
      <SpaceColumn label="Groups">
        <Groups lib={lib} current={group?.key ?? show} missing={missing} />
      </SpaceColumn>
      <div className={`@container min-w-0 flex-1 ${MAIN_PAD}`}>
        {uploads ? <MediaDrop>{content}</MediaDrop> : content}
      </div>
    </div>
  );
}

/** The left column: the whole library, what needs doing, types, and where files are used. */
function Groups({ lib, current, missing }: { lib: Awaited<ReturnType<typeof mediaLibrary>>; current: string; missing: number }) {
  const n = (t: (m: LibraryItem) => boolean) => lib.items.filter(t).length;
  const row = (href: string, key: string, label: string, count: number, indent = false) => (
    <li key={key}>
      <Link href={href} aria-current={current === key ? "page" : undefined} className={`flex items-center gap-2 px-3 py-1.5 text-sm ${indent ? "pl-6" : ""} ${current === key ? "bg-neutral-100 font-medium text-neutral-900" : "text-neutral-700 hover:bg-neutral-50"}`}>
        <span className="min-w-0 flex-1 truncate">{label}</span>
        <span className="shrink-0 text-xs text-neutral-400">{count}</span>
      </Link>
    </li>
  );
  const heading = (t: string) => <div className="px-3 pb-1 pt-3 text-xs font-semibold text-neutral-500">{t}</div>;
  const of = (section: Group["section"]) => lib.groups.filter((g) => g.section === section);
  return (
    <nav aria-label="Media groups" className="w-64 max-w-[calc(100vw-3rem)] shrink-0 overflow-y-auto border-r border-neutral-200 bg-white py-2">
      <ul>
        {row("/admin/media", "", "All files", lib.items.length)}
        {row("/admin/media?show=unused", "unused", "Not used", n(SHOW.unused.test))}
        {row("/admin/media?show=noalt", "noalt", "No description", missing)}
      </ul>
      {heading("Type")}
      <ul>{(["image", "video", "pdf"] as const).map((k) => row(`/admin/media?show=${k}`, k, SHOW[k].label, n(SHOW[k].test)))}</ul>
      {of("site").some((g) => !g.other) && <>{heading("On the site")}<ul>{of("site").filter((g) => !g.other).map((g) => row(`/admin/media?in=${encodeURIComponent(g.key)}`, g.key, g.label, g.count, g.child))}</ul></>}
      {of("site").some((g) => g.other) && <>{heading("Other pages")}<ul>{of("site").filter((g) => g.other).map((g) => row(`/admin/media?in=${encodeURIComponent(g.key)}`, g.key, g.label, g.count))}</ul></>}
      {of("lists").length > 0 && <>{heading("Lists")}<ul>{of("lists").map((g) => row(`/admin/media?in=${encodeURIComponent(g.key)}`, g.key, g.label, g.count))}</ul></>}
      {of("settings").length > 0 && <ul className="mt-2 border-t border-neutral-100 pt-2">{of("settings").map((g) => row(`/admin/media?in=${encodeURIComponent(g.key)}`, g.key, g.label, g.count))}</ul>}
    </nav>
  );
}

/**
 * A file (docs/screens/admin-media.md → «Иерархия»): the preview large on the left; on the right one card — the
 * description first, where it is used, Replace everywhere, the file's details folded, Delete when unused.
 */
async function MediaDetail({ id }: { id: number }) {
  const m = await db.query.media.findFirst({ where: eq(media.id, id) });
  if (!m) notFound();
  const usage = await findMediaUsage(m.url);
  const kind = m.mime.startsWith("image/") ? "Picture" : m.mime.startsWith("video/") ? "Video" : m.mime === "application/pdf" ? "PDF" : "File";
  const ext = m.filename.split(".").pop()?.toUpperCase();
  const rule = "border-t border-neutral-100 pt-4";
  return (
    <>
      <div className="mb-5 min-w-0">
        <BackButton fallback="/admin/media" small>← Media</BackButton>
        <div className="mt-2"><span className="rounded bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-600">{kind}{ext && kind !== "PDF" ? ` · ${ext}` : ""}</span></div>
        <h1 className="mt-1.5 break-all text-xl font-semibold leading-snug text-neutral-900">{m.filename}</h1>
        <p className="mt-1 text-sm text-neutral-500">{fileSize(m.size)}{m.width && m.height ? ` · ${m.width} × ${m.height}` : ""} · {formatDate(m.createdAt, { dateStyle: "medium" })}</p>
      </div>
      <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-6 @4xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="grid min-h-64 place-items-center rounded-xl border border-neutral-200 bg-white p-4">
          {m.mime.startsWith("image/") ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={m.url} alt={m.alt} className="max-h-[32rem] w-full object-contain" />
          ) : m.mime.startsWith("video/") ? (
            <video src={m.url} poster={m.posterUrl ?? undefined} controls className="max-h-[32rem] w-full" />
          ) : (
            <a href={m.url} target="_blank" rel="noreferrer" className="text-sm underline">Open the file ↗</a>
          )}
        </div>
        <aside aria-label="About the file" className="grid gap-4 rounded-xl border border-neutral-200 bg-white p-4 text-sm">
          {m.mime.startsWith("image/") && <AltField id={m.id} alt={m.alt} label="Description" hint="It becomes the picture’s alt text on every page. Saved when you press Enter or leave the field." />}
          <section aria-label="Where it is used" className={m.mime.startsWith("image/") ? rule : ""}>
            <h2 className="mb-1.5 text-[13px] font-semibold text-neutral-800">{usage.length ? `Used in ${usage.length} place${usage.length === 1 ? "" : "s"}` : "Not used anywhere"}</h2>
            {usage.length === 0 ? (
              <p className="text-neutral-500">Nothing on the site shows it — it can be deleted.</p>
            ) : (
              <ul className="space-y-1">
                {usage.map((u, i) => (
                  <li key={i} className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    <Link href={u.adminHref} className="underline decoration-neutral-300 underline-offset-[3px] hover:decoration-neutral-900">{u.label}</Link>
                    {u.draftOnly && <span className="rounded bg-amber-100 px-1.5 text-xs text-amber-900">in unpublished changes</span>}
                    {u.pagePath && <a href={editorHref(u.pagePath)} className="text-xs text-neutral-600 underline decoration-neutral-300 underline-offset-[3px]">Open on page ↗</a>}
                  </li>
                ))}
              </ul>
            )}
          </section>
          {usage.length > 0 && <div className={rule}><ReplaceButton file={{ id: m.id, url: m.url, filename: m.filename, mime: m.mime }} places={usage.length} compact /></div>}
          <details className={`group ${rule}`}>
            <summary className="cursor-pointer text-[13px] font-semibold text-neutral-800">File details</summary>
            <dl className="mt-2 space-y-2 text-xs">
              <div><dt className="text-neutral-500">Address</dt><dd><input readOnly value={m.url} aria-label="Address of the file" className={`${inputCls} mt-0.5 font-mono text-xs`} /></dd></div>
              <div><dt className="text-neutral-500">Type</dt><dd>{m.mime}</dd></div>
              {m.sourceUrl && <div><dt className="text-neutral-500">Migrated from</dt><dd className="break-all">{m.sourceUrl}</dd></div>}
            </dl>
          </details>
          {usage.length === 0 && <div className={rule}><DeleteFile id={m.id} filename={m.filename} /></div>}
        </aside>
      </div>
    </>
  );
}

/** Pictures without a description: used ones first, each with where it is used (docs/screens/admin-media.md). */
async function Describe() {
  const [rows, index] = await Promise.all([db.select().from(media).where(noAlt).orderBy(desc(media.createdAt)), mediaIndex()]);
  const items = rows
    .map((m) => ({ ...m, createdAt: m.createdAt.toISOString(), places: usageIn(index, m.url).map((u) => ({ label: u.label, pagePath: u.pagePath })) }))
    .sort((a, b) => Number(b.places.length > 0) - Number(a.places.length > 0));
  return (
    <>
      <PageHeader back={<BackButton fallback="/admin/media" small>← Media</BackButton>} title="Describe pictures" subtitle="A short description for people who cannot see the picture; it becomes the picture’s alt text on every page" />
      <DescribeQueue items={items} />
    </>
  );
}
