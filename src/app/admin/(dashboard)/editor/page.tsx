import { requireUser } from "@/lib/auth";
import { listEditorPages } from "@/admin/pages-index";
import { TEMPLATES } from "@/blocks/templates";
import { REGION_CHOICES } from "@/lib/regions";
import { DEMO } from "@/lib/demo";
import { PagesBrowser } from "@/components/admin/PagesBrowser";

export const metadata = { title: "Pages · Rapid Medical admin" };

/** Pages: find a page and open it in the page editor; New page from a template (docs/screens/admin-editor-pages.md). */
export default async function EditorPages({ searchParams }: { searchParams: Promise<{ new?: string }> }) {
  await requireUser();
  const sp = await searchParams;
  const cards = await listEditorPages();
  return (
    <PagesBrowser
      cards={cards}
      templates={TEMPLATES.map(({ id, label, description }) => ({ id, label, description }))}
      regions={REGION_CHOICES}
      demo={DEMO}
      startCreating={sp.new === "1" && !DEMO}
      lists={[
        { label: "News", href: "/admin/news" },
        { label: "Events", href: "/admin/events" },
        { label: "Webinars", href: "/admin/webinars" },
        { label: "Jobs", href: "/admin/jobs" },
        { label: "Evidence", href: "/admin/publications" },
        { label: "Team", href: "/admin/team" },
        { label: "Contact details", href: "/admin/settings?group=contact" },
      ]}
    />
  );
}
