import { safeLocalPath } from "@/lib/safe-path";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { SETTINGS_GROUPS, getSettingsGroup, groupValue, mayEditGroup } from "@/admin/settings";
import { getLiveSetting, setSetting, getSettingDraft, deleteSettingDraft } from "@/lib/settings";
import { db, products } from "@/db";
import { PageHeader, Notice } from "@/components/admin/ui";
import { SettingsForm } from "@/components/admin/SettingsForm";
import { isEmailList } from "@/lib/contact-topics";
import { SettingsOverview } from "./Overview";
import { SettingsFields } from "@/components/admin/SettingsFields";

/** The overview's block each group sits in, for the crumb (docs/screens/admin-settings.md → «Иерархия»). */
const AREA: Record<string, string> = { contact: "On the site", social: "On the site", regional: "On the site", requests: "Requests", branding: "Look & connections", integrations: "Look & connections" };

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ group?: string; saved?: string; error?: string; f?: string }> }) {
  const sp = await searchParams;
  const me = await requireUser();
  // no group asked: the overview of everything in Settings (docs/screens/admin-settings.md → «Обзор Settings»)
  if (!sp.group) return <SettingsOverview user={me} />;
  const groups = SETTINGS_GROUPS.filter((g) => mayEditGroup(me, g));
  const asked = getSettingsGroup(sp.group ?? "contact");
  const group = asked && mayEditGroup(me, asked) ? asked : groups[0];
  const [own, inherited, draft, prods] = await Promise.all([
    getLiveSetting(group.key),
    group.inherit ? getLiveSetting(group.inherit.from) : Promise.resolve({} as Record<string, unknown>),
    getSettingDraft(group.key),
    db.select().from(products),
  ]);
  // Where requests go reads the old Contact details addresses until it is saved once (docs/screens/admin-settings.md)
  const live = { ...Object.fromEntries((group.inherit?.keys ?? []).filter((k) => k in inherited).map((k) => [k, inherited[k]])), ...own };
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
        } catch {
          redirect(`/admin/settings?group=${g.key}&error=list&f=${encodeURIComponent(f.name)}`);
        }
      } else if (f.type === "link" || f.type === "json" || f.type === "table") {
        try { out[f.name] = s ? JSON.parse(s) : null; } catch { out[f.name] = null; }
      } else if (f.emails && s && !isEmailList(s)) {
        redirect(`/admin/settings?group=${g.key}&error=emails&f=${encodeURIComponent(f.name)}`);
      } else if (f.type === "boolean") out[f.name] = raw === "on";
      else if (f.type === "stringList") out[f.name] = s.split(/\r?\n/).map((x) => x.trim()).filter(Boolean);
      else if (f.type === "url" && s && safeLocalPath(s, "") === "" && !/^(https?:\/\/|mailto:|tel:)\S+$/i.test(s)) {
        redirect(`/admin/settings?group=${g.key}&error=address&f=${encodeURIComponent(f.name)}`);
      } else out[f.name] = s;
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
      {/* the groups are listed in the Settings column (docs/admin-ia.md); the page shows one, its line right under the title */}
      <PageHeader crumbs={[{ label: "Settings", href: "/admin/settings" }, ...(AREA[group.key] ? [{ label: AREA[group.key] }] : [])]} title={group.title} subtitle={group.description} />
      {sp.saved && <Notice kind="success">Saved.</Notice>}
      {sp.error && (
        <Notice kind="error">
          {group.fields.find((x) => x.name === sp.f)?.label ?? "A field"}:{" "}
          {sp.error === "list" ? "the list could not be read, nothing was saved." : sp.error === "emails" ? "use email addresses, separated by commas. Nothing was saved." : "use a page address (/…) or a full link (https://…). Nothing was saved."}
        </Notice>
      )}
      {draft && (
        <Notice kind="info">
          This group has changes made on the site by {draft.updatedByName || "an editor"} that are not live yet. The form shows them; <b>Save</b> publishes them,{" "}
          <form action={discard} className="inline"><input type="hidden" name="__group" value={group.key} /><button type="submit" className="underline">discard</button></form> drops them.
        </Notice>
      )}
      <SettingsForm action={save} discardHref={`/admin/settings?group=${group.key}`}>
        <input type="hidden" name="__group" value={group.key} />
        {/* the form in blocks, each with a line on what it is for (docs/screens/admin-settings.md) */}
        {[...new Set(group.fields.map((f) => f.section ?? ""))].map((name) => (
          <section key={name || "_"} aria-label={name || group.title} className="rounded-lg border border-neutral-200 bg-white p-5">
            {name && (
              <div className="mb-4">
                <h2 className="text-sm font-semibold text-neutral-900">{name}</h2>
                {group.sections?.[name] && <p className="mt-0.5 text-sm text-neutral-500">{group.sections[name]}</p>}
              </div>
            )}
            <SettingsFields fields={group.fields.filter((f) => (f.section ?? "") === name)} value={value} products={prods} />
          </section>
        ))}
      </SettingsForm>
    </>
  );
}
