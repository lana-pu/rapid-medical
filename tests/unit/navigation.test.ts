import { describe, it, expect } from "vitest";
import { DEFAULT_NAVIGATION, menuHref, navigationFrom } from "../../src/lib/navigation";

describe("menu and footer", () => {
  it("never saved: the defaults, editable at their positions", () => {
    const n = navigationFrom(undefined);
    expect(n.menu.map((m) => m.label)).toEqual(DEFAULT_NAVIGATION.menu.map((m) => m.label));
    expect(n.menu[5].path).toBe("menu.5");
    expect(n.legal[0].path).toBe("legal.0");
  });
  it("unsafe or empty items are left out, the rest keep their stored position", () => {
    const n = navigationFrom({ menu: [{ label: "Evil", kind: "page", href: "javascript:alert(1)" }, { label: "", kind: "page", href: "/x" }, { label: "Careers", kind: "page", href: "/careers" }], legal: [{ label: "Terms", href: "//evil.example" }] });
    expect(n.menu).toEqual([{ label: "Careers", kind: "page", href: "/careers", path: "menu.2" }]);
    expect(n.legal).toEqual([]);
  });
  it("saved but unusable menu: the defaults are shown, not editable on the page", () => {
    const n = navigationFrom({ menu: [{ label: "", kind: "page", href: "" }] });
    expect(n.menu).toHaveLength(DEFAULT_NAVIGATION.menu.length);
    expect(n.menu.every((m) => m.path === null)).toBe(true);
  });
  it("where items go", () => {
    expect(menuHref({ label: "T", kind: "therapies" }, "us")).toBe("/us/therapies");
    expect(menuHref({ label: "T", kind: "therapies" }, null)).toBe("/choose-your-location");
    expect(menuHref({ label: "E", kind: "evidence" }, "apac")).toBe("/apac/evidence");
  });
});
