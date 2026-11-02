import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { SETTINGS_GROUPS, getSettingsGroup } from "@/admin/settings";
import { getSetting, setSetting } from "@/lib/settings";
import { db, products } from "@/db";
import { PageHeader, Notice, Button } from "@/components/admin/ui";
import { SettingsFields } from "@/components/admin/SettingsFields";

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ group?: string; saved?: string }> }) {
  const sp = await searchParams;
  const group = getSettingsGroup(sp.group ?? "contact") ?? SETTINGS_GROUPS[0];
  const [value, prods] = await Promise.all([getSetting(group.key), db.select().from(products)]);

  async function save(fd: FormData) {
    "use server";
    await requireUser();
    const g = getSettingsGroup(String(fd.get("__group")));
    if (!g) return;
    const out: Record<string, unknown> = {};
    for (const f of g.fields) {
      const raw = fd.get(f.name);
      const s = typeof raw === "string" ? raw.trim() : "";
      if (f.type === "repeater") {
        try {
          const arr = s ? (JSON.parse(s) as Record<string, unknown>[]) : [];
          out[f.name] = arr.map((it) => {
            const copy = { ...it };
            for (const k of ["links", "link"]) if (typeof copy[k] === "string") { try { copy[k] = copy[k] ? JSON.parse(copy[k] as string) : undefined; } catch { copy[k] = undefined; } }
            for (const k of ["lat", "lon"]) if (typeof copy[k] === "string" && copy[k] !== "") copy[k] = Number(copy[k]);
            return copy;
          });
        } catch { out[f.name] = []; }
      } else if (f.type === "boolean") out[f.name] = raw === "on";
      else if (f.type === "stringList") out[f.name] = s.split(/\r?\n/).map((x) => x.trim()).filter(Boolean);
      else out[f.name] = s;
    }
    await setSetting(g.key, out);
    for (const p of g.revalidate) revalidatePath(p, "layout");
    redirect(`/admin/settings?group=${g.key}&saved=1`);
  }

  return (
    <>
      <PageHeader title="Site settings" />
      <div className="mb-6 flex gap-1 border-b border-neutral-200">
        {SETTINGS_GROUPS.map((g) => (
          <Link key={g.key} href={`/admin/settings?group=${g.key}`} className={`-mb-px border-b-2 px-3 py-2 text-sm ${g.key === group.key ? "border-neutral-900 font-medium" : "border-transparent text-neutral-500 hover:text-neutral-800"}`}>
            {g.title}
          </Link>
        ))}
      </div>
      {sp.saved && <Notice kind="success">Saved.</Notice>}
      {group.description && <p className="mb-4 text-sm text-neutral-500">{group.description}</p>}
      <form action={save} className="space-y-6">
        <input type="hidden" name="__group" value={group.key} />
        <div className="rounded-lg border border-neutral-200 bg-white p-5">
          <SettingsFields fields={group.fields} value={value} products={prods} />
        </div>
        <Button type="submit">Save</Button>
      </form>
    </>
  );
}
