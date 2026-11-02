"use client";

import dynamic from "next/dynamic";

/** Loads the on-page editor bundle only when the server says we are in editor mode. */
const Overlay = dynamic(() => import("./EditorOverlay"), { ssr: false });

export function EditorLoader() {
  return <Overlay />;
}
