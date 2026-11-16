import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { attention, lastPublished } from "@/admin/home";
import { unreadCount } from "@/admin/inbox";
import { Notice } from "@/components/admin/ui";

/** After sign-in: choose a project; its tools appear only inside it (docs/screens/admin-choose.md). */
export default async function Projects({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const sp = await searchParams;
  const user = await requireUser();
  const [todo, unread, last] = await Promise.all([attention(user), unreadCount(), lastPublished()]);
  const toPublish = todo.filter((t) => t.kind === "publish").length;
  const first = user.name.split(/\s+/)[0] || user.name;
  const status = [unread ? `${unread} unread message${unread > 1 ? "s" : ""}` : "", toPublish ? `${toPublish} change${toPublish > 1 ? "s" : ""} to publish` : ""].filter(Boolean).join(" · ");

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-2xl font-semibold">Hello, {first}</h1>
      <p className="mt-1 text-neutral-500">What do you want to work on?</p>
      {sp.error === "forbidden" && <div className="mt-4"><Notice kind="error">That area is for admins.</Notice></div>}

      <section aria-label="Projects" className="mt-8 grid gap-4 sm:grid-cols-2">
        <Link href="/admin/website" className="group flex flex-col rounded-xl border border-neutral-200 bg-white p-6 shadow-sm hover:border-neutral-900">
          <div className="flex items-center gap-3">
            <span aria-hidden className="flex h-11 w-11 items-center justify-center rounded-lg bg-neutral-900 text-xl text-white">🌐</span>
            <div>
              <div className="text-lg font-semibold">Website</div>
              <div className="text-xs text-neutral-500">rapid-medical.com · three regions</div>
            </div>
          </div>
          <p className="mt-5 text-sm font-medium text-neutral-800">{status || "Everything is live"}</p>
          {last && <p className="mt-1 text-xs text-neutral-500">Last published: {last.what}, {last.ago}</p>}
          <span className="mt-5 text-sm font-medium underline decoration-neutral-300 group-hover:decoration-neutral-900">Open the website →</span>
        </Link>
        <div aria-disabled className="flex flex-col rounded-xl border border-dashed border-neutral-300 bg-white/60 p-6 text-neutral-500">
          <div className="flex items-center gap-3">
            <span aria-hidden className="flex h-11 w-11 items-center justify-center rounded-lg bg-neutral-100 text-xl">🎓</span>
            <div>
              <div className="text-lg font-semibold text-neutral-700">Training tool</div>
              <div className="text-xs">TIGERTRIEVER courses, stages and videos</div>
            </div>
          </div>
          <p className="mt-5 text-sm">Not built yet.</p>
        </div>
      </section>
    </div>
  );
}
