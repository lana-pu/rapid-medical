import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { attention, recentActivity, summary } from "@/admin/home";
import { LinkButton, Notice, PageHeader, formatDate } from "@/components/admin/ui";

/** Website — what needs you (docs/screens/admin-home.md). */
export default async function Home({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const sp = await searchParams;
  const user = await requireUser();
  const [todo, activity, sum] = await Promise.all([attention(user), recentActivity(), summary()]);
  const first = user.name.split(/\s+/)[0] || user.name;

  return (
    <>
      <PageHeader title={`Hello, ${first}`} actions={<LinkButton href="/admin/editor?new=1" variant="primary">New page</LinkButton>} />
      {sp.error === "forbidden" && <Notice kind="error">That area is for admins.</Notice>}

      <section aria-labelledby="todo" className="mb-10">
        <h2 id="todo" className="mb-3 text-lg font-semibold">Needs your attention</h2>
        {todo.length === 0 ? (
          <p className="rounded-lg border border-neutral-200 bg-white p-6 text-sm text-neutral-600">Nothing waiting. Everything is live.</p>
        ) : (
          <ul className="divide-y divide-neutral-100 rounded-lg border border-neutral-200 bg-white">
            {todo.map((t) => (
              <li key={t.key} className="flex flex-wrap items-center gap-3 px-4 py-3 text-sm">
                <span className="min-w-0 flex-1">
                  <span className="font-medium">{t.text}</span>
                  {(t.by || t.at) && (
                    <span className="block text-xs text-neutral-500">
                      {t.by ? `by ${t.by}` : ""}
                      {t.by && t.at ? " · " : ""}
                      {t.at ? formatDate(t.at, { dateStyle: "medium", timeStyle: "short" }) : ""}
                    </span>
                  )}
                </span>
                <a href={t.href} className="rounded border border-neutral-300 px-3 py-1.5 text-xs font-medium hover:bg-neutral-50">{t.action}</a>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="grid gap-10 lg:grid-cols-[1fr_320px]">
        <section aria-labelledby="activity">
          <div className="mb-3 flex items-baseline justify-between">
            <h2 id="activity" className="text-lg font-semibold">Recent activity</h2>
            <Link href="/admin/activity" className="text-sm underline">All activity</Link>
          </div>
          {activity.length === 0 ? (
            <p className="text-sm text-neutral-500">No activity yet.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {activity.map((a) => (
                <li key={a.id}>
                  <b>{a.who}</b> {a.href ? <Link href={a.href} className="underline decoration-neutral-300 hover:decoration-neutral-900">{a.text}</Link> : a.text}
                  <span className="text-neutral-500"> · {a.ago}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-label="Summary" className="space-y-3">
          <Card href="/admin/publications" title="Evidence" text={`${sum.studies} studies${sum.lastStudy ? ` · last added ${sum.lastStudy}` : ""}`} />
          <Card href="/admin/media" title="Media library" text={`${sum.files} files · ${sum.filesNoAlt} without description`} />
          {user.role === "admin" && (
            <Card
              href="/admin/users"
              title="People and roles"
              text={`${sum.people} people · ${sum.peopleWithout2fa ? `${sum.peopleWithout2fa} without two-step sign-in` : "two-step sign-in on for everyone"}`}
            />
          )}
        </section>
      </div>
    </>
  );
}

function Card({ href, title, text }: { href: string; title: string; text: string }) {
  return (
    <Link href={href} className="block rounded-lg border border-neutral-200 bg-white p-4 hover:border-neutral-400">
      <div className="font-semibold">{title}</div>
      <div className="text-sm text-neutral-600">{text}</div>
    </Link>
  );
}
