import { Suspense } from "react";
import { canDesign, requireUser } from "@/lib/auth";
import { SpaceNav } from "@/components/admin/SpaceNav";
import { AdminMain } from "@/components/admin/AdminMain";

/** Settings: the site and the team, rarely changed (docs/admin-ia.md). Menu and footer is in Content. */
export default async function SettingsLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const admin = user.role === "admin";
  return (
    <>
      <Suspense>
        <SpaceNav
          title="Settings"
          items={[
            { heading: "Site", href: "/admin/settings?group=contact", label: "Contact details" },
            { href: "/admin/settings?group=social", label: "Social links" },
            { href: "/admin/settings?group=regional", label: "Regional notices" },
            { href: "/admin/settings?group=seo", label: "Google defaults" },
            ...(canDesign(user) ? [{ href: "/admin/settings?group=branding", label: "Branding" }] : []),
            ...(admin ? [{ href: "/admin/settings?group=integrations", label: "Integrations" }] : []),
            { href: "/admin/redirects", label: "Redirects" },
            { href: "/admin/not-found-log", label: "Broken links" },
            ...(admin ? [{ heading: "Team", href: "/admin/users", label: "People and roles" }] : []),
            { ...(admin ? {} : { heading: "Team" }), href: "/admin/activity", label: "Activity log" },
            { heading: "You", href: "/admin/account", label: "My account & security" },
          ]}
        />
      </Suspense>
      <AdminMain>{children}</AdminMain>
    </>
  );
}
