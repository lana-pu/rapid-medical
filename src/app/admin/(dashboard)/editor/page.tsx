import { requireUser } from "@/lib/auth";
import { listEditorPages } from "@/admin/pages-index";
import { TEMPLATES } from "@/blocks/templates";
import { REGION_CHOICES } from "@/lib/regions";
import { DEMO } from "@/lib/demo";
import { PagesBrowser } from "@/components/admin/PagesBrowser";

export const metadata = { title: "Pages · Rapid Medical admin" };

/** Pages: find a page and open it in the page editor; New page from a template (docs/screens/admin-editor-pages.md). */
export default async function EditorPages() {
  await requireUser();
  const cards = await listEditorPages();
  return (
    <PagesBrowser
      cards={cards}
      templates={TEMPLATES.map(({ id, label, description }) => ({ id, label, description }))}
      regions={REGION_CHOICES}
      demo={DEMO}
      lists={[
        { label: "News & Events", href: "/admin/news" },
        { label: "Events", href: "/admin/events" },
        { label: "Webinars", href: "/admin/webinars" },
        { label: "Open positions", href: "/admin/jobs" },
        { label: "Publications (Evidence)", href: "/admin/publications" },
        { label: "Team (About)", href: "/admin/team" },
        { label: "Contact details", href: "/admin/settings?group=contact" },
      ]}
    />
  );
}
