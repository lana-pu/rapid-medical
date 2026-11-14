import { siteTree } from "@/admin/site-tree";
import { SiteTree } from "@/components/admin/SiteTree";
import { AdminMain } from "@/components/admin/AdminMain";

/** Content: the site as a tree, then the page or collection (docs/admin-ia.md). */
export default async function ContentLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteTree tree={await siteTree()} />
      <AdminMain>{children}</AdminMain>
    </>
  );
}
