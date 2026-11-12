/**
 * Static demo build (GitHub Pages): the whole site is pre-rendered, the
 * on-page editor and the admin forms "save" into the visitor's browser only.
 * Enabled at build time with NEXT_PUBLIC_DEMO=1 (see scripts/export-demo.ts).
 * Safe to import from client and server code.
 */
export const DEMO = process.env.NEXT_PUBLIC_DEMO === "1";
/** basePath of the build, e.g. "/rapid-medical" on GitHub Pages. Prefix hand-written absolute URLs with it. */
export const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
export const withBase = (p: string) => (p.startsWith("/") ? `${BASE}${p}` : p);

/** Link that opens a public page in the page editor (in the static demo the editor is always on: the page itself). */
export const editorHref = (path: string) => (DEMO ? withBase(path) : `/api/editor?on=1&redirect=${encodeURIComponent(path)}`);
