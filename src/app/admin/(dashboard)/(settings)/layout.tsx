import { Suspense } from "react";
import { canDesign, requireUser } from "@/lib/auth";
import { SpaceNav } from "@/components/admin/SpaceNav";
import { AdminMain } from "@/components/admin/AdminMain";
import { SpaceColumn, SpaceColumns } from "@/components/admin/SpaceColumn";

/**
 * Settings: the site and the team, rarely changed (docs/screens/admin-settings.md → «Обзор Settings»): an overview and
 * the groups with headings — the same structure as the overview's blocks. Menu and footer is in Content.
 */
export default async function SettingsLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const admin = user.role === "admin";
  return (
    <SpaceColumns>
      <SpaceColumn label="Settings">
      <Suspense>
        <SpaceNav
          title="Settings"
          items={[
            { href: "/admin/settings", label: "Overview" },
            { heading: "On the site", href: "/admin/settings?group=contact", label: "Contact details" },
            { href: "/admin/settings?group=social", label: "Social links" },
            { href: "/admin/settings?group=regional", label: "Regional notices" },
            { heading: "Requests", href: "/admin/settings?group=requests", label: "Where requests go" },
            { heading: "Search & sharing", href: "/admin/seo", label: "Google & sharing" },
            ...(admin ? [{ href: "/admin/not-found-log", label: "Old links", also: ["/admin/redirects"] }] : []), // admin only (ADR-006 → «Права»)
            // the same blocks as the overview (docs/screens/admin-settings.md → «Иерархия»): a heading on the first item shown
            ...[
              ...(canDesign(user) ? [{ href: "/admin/settings?group=branding", label: "Branding" }] : []),
              ...(admin ? [{ href: "/admin/settings?group=integrations", label: "Integrations" }] : []),
            ].map((it, i) => (i === 0 ? { heading: "Look & connections", ...it } : it)),
            ...(admin ? [{ heading: "Team & you", href: "/admin/users", label: "People and roles" }] : []),
            { ...(admin ? {} : { heading: "Team & you" }), href: "/admin/activity", label: "Activity log" },
            { href: "/admin/account", label: "My account & security" },
          ]}
        />
      </Suspense>
      </SpaceColumn>
      <AdminMain>{children}</AdminMain>
    </SpaceColumns>
  );
}
