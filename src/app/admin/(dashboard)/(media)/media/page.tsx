import { desc, eq, sql } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db, media } from "@/db";
import { findMediaUsage, mediaIndex, usageIn } from "@/lib/media-usage";
import { mediaLibrary, pageSections, type Group, type LibraryItem } from "@/admin/media-library";
import { PageHeader, formatDate, inputCls, Notice } from "@/components/admin/ui";
import { MediaGrid, type GridItem } from "@/components/admin/MediaGrid";
import { AltField, DeleteFile, DescribeQueue, ReplaceButton } from "@/components/admin/MediaTools";
import { editorHref } from "@/lib/demo";

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

const toGrid = (m: LibraryItem): GridItem => ({ id: m.id, url: m.url, filename: m.filename, mime: m.mime, size: m.size, alt: m.alt, thumb: m.mime.startsWith("image/") ? m.url : null, used: m.used });

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

  return (
    <div className="-m-8 flex min-h-[calc(100vh-3rem)]">
      <Groups lib={lib} current={group?.key ?? show} missing={missing} />
      <div className="min-w-0 flex-1 p-8">
        <PageHeader
          title={title}
          subtitle={`${shown.length} file${shown.length === 1 ? "" : "s"}${group?.section === "site" ? " · every region of the page" : ""}`}
          actions={missing > 0 ? <Link href="/admin/media?describe=1" className="rounded bg-neutral-900 px-3 py-2 text-sm font-medium text-white hover:bg-neutral-700">Describe pictures ({missing})</Link> : undefined}
        />
        <form className="mb-4 flex flex-wrap items-center gap-2" role="search">
          {show && <input type="hidden" name="show" value={show} />}
          {group && <input type="hidden" name="in" value={group.key} />}
          <input name="q" defaultValue={sp.q ?? ""} placeholder="Search name or description…" aria-label="Search files" className={`${inputCls} max-w-xs`} />
          <select name="sort" defaultValue={sort} aria-label="Sort" className="rounded border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900">
            {Object.entries(SORTS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
          <button className="rounded border border-neutral-300 bg-white px-3 py-2 text-sm">Apply</button>
          {needle && <Link href={href({ q: "" })} className="text-sm underline">Clear search</Link>}
        </form>
        {sections ? (
          <div className="space-y-8">
            {sections.map((s) => (
              <section key={s.section} aria-label={s.section}>
                <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-neutral-500">{s.section} <span className="font-normal normal-case text-neutral-400">· {s.ids.length}</span></h2>
                <MediaGrid upload={false} items={s.ids.map((id) => byId.get(id)).filter((m): m is LibraryItem => !!m).map(toGrid)} />
              </section>
            ))}
          </div>
        ) : (
          <>
            <MediaGrid upload={!show && !group} selectable={show === "unused"} items={shown.slice((page - 1) * PER, page * PER).map(toGrid)} />
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
  const heading = (t: string) => <div className="px-3 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wide text-neutral-400">{t}</div>;
  const of = (section: Group["section"]) => lib.groups.filter((g) => g.section === section);
  return (
    <nav aria-label="Media groups" className="w-64 shrink-0 overflow-y-auto border-r border-neutral-200 bg-white py-2">
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

async function MediaDetail({ id }: { id: number }) {
  const m = await db.query.media.findFirst({ where: eq(media.id, id) });
  if (!m) notFound();
  const usage = await findMediaUsage(m.url);
  return (
    <>
      <PageHeader
        title={m.filename}
        subtitle={`${m.mime} · ${(m.size / 1024).toFixed(0)} KB · ${formatDate(m.createdAt, { dateStyle: "medium" })}`}
        actions={
          <>
            {usage.length > 0 && <ReplaceButton file={{ id: m.id, url: m.url, filename: m.filename, mime: m.mime }} places={usage.length} />}
            {usage.length === 0 && <DeleteFile id={m.id} filename={m.filename} />}
            <Link href="/admin/media" className="self-center text-sm underline">← Library</Link>
          </>
        }
      />
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded border border-neutral-200 bg-white p-4">
          {m.mime.startsWith("image/") ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={m.url} alt={m.alt} className="max-h-96 w-full object-contain" />
          ) : m.mime.startsWith("video/") ? (
            <video src={m.url} controls className="w-full" />
          ) : (
            <a href={m.url} target="_blank" className="underline">Open file</a>
          )}
          <input readOnly value={m.url} className={`${inputCls} mt-3 font-mono text-xs`} />
          {m.sourceUrl && <p className="mt-1 text-xs text-neutral-500">Migrated from: {m.sourceUrl}</p>}
          {m.mime.startsWith("image/") && <div className="mt-4"><AltField id={m.id} alt={m.alt} /></div>}
        </div>
        <div className="rounded border border-neutral-200 bg-white p-4 text-sm">
          <h2 className="font-semibold">Used in {usage.length} place(s)</h2>
          {usage.length === 0 ? (
            <Notice kind="info">Not referenced anywhere — safe to delete.</Notice>
          ) : (
            <ul className="mt-2 space-y-1">
              {usage.map((u, i) => (
                <li key={i} className="flex flex-wrap items-center gap-2">
                  <Link href={u.adminHref} className="underline">{u.label}</Link>
                  {u.draftOnly && <span className="rounded bg-amber-100 px-1.5 text-xs text-amber-900">in unpublished changes</span>}
                  {u.pagePath && <a href={editorHref(u.pagePath)} className="text-xs underline">Open on page</a>}
                </li>
              ))}
            </ul>
          )}
        </div>
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
      <PageHeader title="Describe pictures" subtitle="A short description for people who cannot see the picture; it becomes the picture’s alt text on every page" actions={<Link href="/admin/media" className="text-sm underline">← Library</Link>} />
      <DescribeQueue items={items} />
    </>
  );
}
