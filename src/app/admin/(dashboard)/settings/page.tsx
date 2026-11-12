import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { SETTINGS_GROUPS, getSettingsGroup, groupValue, mayEditGroup } from "@/admin/settings";
import { getLiveSetting, setSetting, getSettingDraft, deleteSettingDraft } from "@/lib/settings";
import { db, products } from "@/db";
import { PageHeader, Notice, Button } from "@/components/admin/ui";
import { SettingsFields } from "@/components/admin/SettingsFields";

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ group?: string; saved?: string }> }) {
  const sp = await searchParams;
  const me = await requireUser();
  const groups = SETTINGS_GROUPS.filter((g) => mayEditGroup(me, g));
  const asked = getSettingsGroup(sp.group ?? "contact");
  const group = asked && mayEditGroup(me, asked) ? asked : groups[0];
  const [live, draft, prods] = await Promise.all([getLiveSetting(group.key), getSettingDraft(group.key), db.select().from(products)]);
  const value = groupValue(group, live, draft?.value);

  async function save(fd: FormData) {
    "use server";
    const user = await requireUser();
    const g = getSettingsGroup(String(fd.get("__group")));
    if (!g || !mayEditGroup(user, g)) return;
    const out: Record<string, unknown> = {};
    for (const f of g.fields) {
      const raw = fd.get(f.name);
      const s = typeof raw === "string" ? raw.trim() : "";
      if (f.type === "repeater") {
        try {
          const arr = s ? (JSON.parse(s) as Record<string, unknown>[]) : [];
          out[f.name] = arr.map((it) => {
            const copy = { ...it };
            for (const k of ["lat", "lon"]) if (typeof copy[k] === "string" && copy[k] !== "") copy[k] = Number(copy[k]);
            return copy;
          });
        } catch { out[f.name] = []; }
      } else if (f.type === "link" || f.type === "json" || f.type === "table") {
        try { out[f.name] = s ? JSON.parse(s) : null; } catch { out[f.name] = null; }
      } else if (f.type === "boolean") out[f.name] = raw === "on";
      else if (f.type === "stringList") out[f.name] = s.split(/\r?\n/).map((x) => x.trim()).filter(Boolean);
      else out[f.name] = s;
    }
    // keep keys the form does not show (texts that moved to the page editor stay for rollback)
    await setSetting(g.key, { ...(await getLiveSetting(g.key)), ...out });
    await deleteSettingDraft(g.key);
    await audit(user, "settings", { label: g.title, meta: { key: g.key } });
    for (const p of g.revalidate) revalidatePath(p, "layout");
    redirect(`/admin/settings?group=${g.key}&saved=1`);
  }

  async function discard(fd: FormData) {
    "use server";
    const user = await requireUser();
    const key = String(fd.get("__group"));
    const g = getSettingsGroup(key);
    if (!g || !mayEditGroup(user, g)) return;
    await deleteSettingDraft(key);
    await audit(user, "settings", { label: key, meta: { key, discardedDraft: true } });
    redirect(`/admin/settings?group=${key}`);
  }

  return (
    <>
      <PageHeader title="Site settings" />
      <div className="mb-6 flex gap-1 border-b border-neutral-200">
        {groups.map((g) => (
          <Link key={g.key} href={`/admin/settings?group=${g.key}`} className={`-mb-px border-b-2 px-3 py-2 text-sm ${g.key === group.key ? "border-neutral-900 font-medium" : "border-transparent text-neutral-500 hover:text-neutral-800"}`}>
            {g.title}
          </Link>
        ))}
      </div>
      {sp.saved && <Notice kind="success">Saved.</Notice>}
      {draft && (
        <Notice kind="info">
          This group has changes made on the site by {draft.updatedByName || "an editor"} that are not live yet. The form shows them; <b>Save</b> publishes them,{" "}
          <form action={discard} className="inline"><input type="hidden" name="__group" value={group.key} /><button type="submit" className="underline">discard</button></form> drops them.
        </Notice>
      )}
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
