"use client";

/**
 * Browser-only stand-in for src/admin/inline.ts, used by the static demo.
 * Edits live in localStorage; "publishing" just flips a flag. Nothing leaves
 * the visitor's browser.
 */
import type { PendingItem, InlineKind } from "@/admin/inline";
import { withBase } from "@/lib/demo";

const KEY = "rm-demo:v1";
const OFF = "rm-demo:editor-off";

type Entry = { value: string; kind: InlineKind; published: boolean; review?: string; at: string };
type Store = Record<string, Entry>; // "r#id.f" → entry

function load(): Store {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "{}") as Store;
  } catch {
    return {};
  }
}
function save(s: Store) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* private mode */
  }
}
const k = (t: { r: string; id: number; f: string }) => `${t.r}#${t.id}.${t.f}`;

export const demoEditorOff = () => {
  try {
    return localStorage.getItem(OFF) === "1";
  } catch {
    return false;
  }
};
export const setDemoEditorOff = (off: boolean) => {
  try {
    if (off) localStorage.setItem(OFF, "1");
    else localStorage.removeItem(OFF);
  } catch {
    /* ignore */
  }
};

/** Push stored values into the DOM (text, rich HTML, links, media). Call after hydration and after each save. */
export function applyDemoState() {
  const s = load();
  const entries = Object.entries(s);
  if (!entries.length) return;
  document.querySelectorAll<HTMLElement>("[data-e]").forEach((el) => {
    let tag: { r: string; id: number; f: string; k: string; fh?: string; fv?: string };
    try {
      tag = JSON.parse(el.getAttribute("data-e") || "");
    } catch {
      return;
    }
    const main = s[k(tag)];
    if (tag.k === "text" && main && !el.isContentEditable) el.innerText = main.value;
    else if (tag.k === "rich" && main) {
      const prose = el.querySelector<HTMLElement>(".prose-rm") ?? el;
      prose.innerHTML = main.value;
    } else if (tag.k === "link") {
      if (main) el.innerText = main.value;
      const href = tag.fh ? s[k({ ...tag, f: tag.fh })] : null;
      const a = el.closest("a");
      if (href && a) a.setAttribute("href", withBase(href.value));
    } else if (tag.k === "media") {
      const vid = tag.fv ? s[k({ ...tag, f: tag.fv })] : null;
      const img = main;
      const v = el.querySelector("video");
      const i = el.querySelector("img");
      if (vid && vid.value) {
        if (v) v.src = withBase(vid.value);
        else el.innerHTML = `<video class="w-full rounded" src="${withBase(vid.value)}" autoplay muted loop playsinline controls></video>`;
      } else if (vid && !vid.value && v && img?.value) {
        el.innerHTML = `<img class="w-full rounded" src="${withBase(img.value)}" alt="">`;
      } else if (img) {
        if (i) {
          i.removeAttribute("srcset");
          i.style.backgroundImage = "";
          i.src = img.value ? withBase(img.value) : "";
        } else if (!v && img.value) el.innerHTML = `<img class="w-full rounded" src="${withBase(img.value)}" alt="">`;
      }
    }
  });
}

export const demoApi = {
  async readField(t: { r: string; id: number; f: string }): Promise<{ value: unknown; label: string }> {
    const e = load()[k(t)];
    if (e) return { value: e.value, label: t.f };
    // fall back to what is on the page
    const el = Array.from(document.querySelectorAll<HTMLElement>("[data-e]")).find((x) => {
      try {
        const tag = JSON.parse(x.getAttribute("data-e") || "");
        return tag.r === t.r && tag.id === t.id && (tag.f === t.f || tag.fh === t.f);
      } catch {
        return false;
      }
    });
    if (!el) return { value: "", label: t.f };
    const tag = JSON.parse(el.getAttribute("data-e") || "{}");
    if (tag.fh === t.f) return { value: el.closest("a")?.getAttribute("href") ?? "", label: t.f };
    if (tag.k === "rich") return { value: (el.querySelector(".prose-rm") ?? el).innerHTML, label: t.f };
    return { value: el.innerText, label: t.f };
  },
  async saveField(t: { r: string; id: number; f: string }, kind: InlineKind, raw: unknown): Promise<{ pending: boolean }> {
    const s = load();
    s[k(t)] = { value: raw == null ? "" : String(raw), kind, published: false, at: new Date().toISOString() };
    save(s);
    applyDemoState();
    return { pending: true };
  },
  async pendingFor(targets: { r: string; id: number }[]) {
    const s = load();
    const items: PendingItem[] = [];
    const seen = new Set<string>();
    for (const t of targets) {
      const key = `${t.r}#${t.id}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const mine = Object.entries(s).filter(([kk, e]) => kk.startsWith(key + ".") && !e.published);
      if (!mine.length) continue;
      const latest = mine.map(([, e]) => e).sort((a, b) => (a.at < b.at ? 1 : -1))[0];
      items.push({ r: t.r, id: t.id, label: `${t.r.replace("settings:", "page settings: ")}${t.id ? ` #${t.id}` : ""} — ${mine.length} field${mine.length > 1 ? "s" : ""}`, href: withBase(t.r.startsWith("settings:") ? `/admin/settings?group=${t.r.slice(9)}` : `/admin/${t.r}/${t.id}`), by: "you (demo)", at: latest.at, reviewStatus: latest.review ?? "editing", publishAt: null });
    }
    return { items, canPublishAll: true, requireApproval: false, user: { name: "Demo editor", role: "admin" } };
  },
  async publishTargets(targets: { r: string; id: number }[]) {
    const s = load();
    let n = 0;
    for (const t of targets) for (const [kk, e] of Object.entries(s)) if (kk.startsWith(`${t.r}#${t.id}.`) && !e.published) { e.published = true; n++; }
    save(s);
    return { published: n, blocked: [] as string[] };
  },
  async discardTargets(targets: { r: string; id: number }[]) {
    const s = load();
    let n = 0;
    for (const t of targets) for (const kk of Object.keys(s)) if (kk.startsWith(`${t.r}#${t.id}.`) && !s[kk].published) { delete s[kk]; n++; }
    save(s);
    if (n) setTimeout(() => location.reload(), 300); // originals come back from the static page
    return n;
  },
  async submitTargetsForReview(targets: { r: string; id: number }[]) {
    const s = load();
    let n = 0;
    for (const t of targets) for (const [kk, e] of Object.entries(s)) if (kk.startsWith(`${t.r}#${t.id}.`) && !e.published) { e.review = "in_review"; n++; }
    save(s);
    return n;
  },
};
