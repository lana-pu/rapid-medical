import ResourceList from "../../(content)/[resource]/page";
import { OldLinksTabs } from "@/components/admin/OldLinksTabs";

/** Redirects live in Settings (docs/admin-ia.md): the generic list, without the site tree. */
export default async function Redirects({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  // one of the two tabs of Old links (docs/screens/admin-settings.md)
  return (
    <>
      <OldLinksTabs active="redirects" />
      {await ResourceList({ params: Promise.resolve({ resource: "redirects" }), searchParams })}
    </>
  );
}
