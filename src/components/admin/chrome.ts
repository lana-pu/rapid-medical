/**
 * Admin chrome sizes (docs/admin-ia.md → «Адаптив»). The project header is h-12; the spaces rail is a column on the
 * left from sm (640) and a bar of h-14 at the bottom of a phone screen.
 */

/** Columns under the project header stay in view: they stick below it and fill the rest of the window. */
export const UNDER_HEADER = "sticky top-12 h-[calc(100vh-3rem)]";

/** The working area's padding: 16 px on a phone, 24 from sm, 32 from lg. */
export const MAIN_PAD = "px-4 py-5 sm:p-6 lg:p-8";

/** A screen that fills the working area edge to edge cancels its padding (the Inbox message). */
export const MAIN_BLEED = "-mx-4 -my-5 sm:-m-6 lg:-m-8";
