"use client";
// One unit of the wireframe snapshot page that fails to render shows its error instead of breaking the page
// (render.cjs reports it; the pack shows the node as «failed to render»). Copied next to render-page.tsx.
import { Component, type ReactNode } from "react";

export class Boundary extends Component<{ children: ReactNode }, { error: string | null }> {
  state = { error: null as string | null };
  static getDerivedStateFromError(e: unknown) {
    return { error: e instanceof Error ? e.message : String(e) };
  }
  render() {
    return this.state.error ? <div data-wf-error={this.state.error} /> : this.props.children;
  }
}
