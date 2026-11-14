import { Suspense } from "react";
import { requireUser } from "@/lib/auth";
import { attention } from "@/admin/home";
import { SpaceNav } from "@/components/admin/SpaceNav";
import { AdminMain } from "@/components/admin/AdminMain";

/** Inbox: what is waiting, by kind (docs/admin-ia.md). */
export default async function InboxLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const todo = await attention(user);
  const n = (k: string) => todo.filter((t) => t.kind === k).length;
  const requests = todo.find((t) => t.kind === "request");
  return (
    <>
      <Suspense>
        <SpaceNav
          title="Inbox"
          items={[
            { href: "/admin", label: "Everything waiting", count: todo.length },
            { href: "/admin/submissions", label: "Requests", count: requests ? Number(/\d+/.exec(requests.text)?.[0] ?? 0) : 0 },
            { href: "/admin?kind=comment", label: "Comments", count: n("comment") },
            { href: "/admin?kind=publish", label: "To publish", count: n("publish") },
            { href: "/admin?kind=media", label: "Pictures without description", count: n("media") },
            { href: "/admin/not-found-log", label: "Broken links", count: n("links") },
          ]}
        />
      </Suspense>
      <AdminMain>{children}</AdminMain>
    </>
  );
}
