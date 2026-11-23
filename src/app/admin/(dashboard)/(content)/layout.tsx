import { siteTree } from "@/admin/site-tree";
import { SiteTree } from "@/components/admin/SiteTree";
import { AdminMain } from "@/components/admin/AdminMain";
import { SpaceColumn, SpaceColumns } from "@/components/admin/SpaceColumn";

/** Content: the site as a tree, then the page or collection (docs/admin-ia.md); the tree folds away below lg. */
export default async function ContentLayout({ children }: { children: React.ReactNode }) {
  return (
    <SpaceColumns>
      <SpaceColumn label="Site">
        <SiteTree tree={await siteTree()} />
      </SpaceColumn>
      <AdminMain>{children}</AdminMain>
    </SpaceColumns>
  );
}
