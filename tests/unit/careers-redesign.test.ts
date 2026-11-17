import { describe, it, expect } from "vitest";
import { groupRoles, limitRoles, ROLES_LIMIT } from "../../src/components/site/OpenRoles";
import { careersCta, jobRow } from "../../src/blocks/from-settings";
import { firstSentence } from "../../src/blocks/form";
import type { JobRow } from "../../src/blocks/jobs";

/** Careers redesign (DESIGN.md → Careers, docs/screens/careers.md). */

const role = (title: string, department: string, location = "Yokneam"): JobRow => ({ title, href: `/open-positions/${title}`, department, location });
const roles = [role("A", "Clinical"), role("B", "R&D"), role("C", ""), role("D", "Clinical"), role("E", "Sales"), role("F", "R&D"), role("G", "Clinical"), role("H", "Sales")];

describe("open positions", () => {
  it("grouped by department in the order they appear; roles without one go last, under Other", () => {
    expect(groupRoles(roles).map((g) => [g.department, g.roles.map((r) => r.title).join("")])).toEqual([
      ["Clinical", "ADG"], ["R&D", "BF"], ["Sales", "EH"], ["Other", "C"],
    ]);
  });
  it("the first six roles are shown, the groups kept", () => {
    expect(ROLES_LIMIT).toBe(6);
    const shown = limitRoles(groupRoles(roles), ROLES_LIMIT);
    expect(shown.map((g) => [g.department, g.roles.length])).toEqual([["Clinical", 3], ["R&D", 2], ["Sales", 1]]);
  });
  it("a row applies through the link, else by email, else only its page", () => {
    const j = { title: "QA Lead", slug: "qa", department: "Ops", location: "Yokneam" };
    expect(jobRow({ ...j, applyUrl: "https://app.sparkhire.com/x", applyEmail: null }).applyHref).toBe("https://app.sparkhire.com/x");
    expect(jobRow({ ...j, applyUrl: null, applyEmail: "hr@x.com" }).applyHref).toBe("mailto:hr@x.com?subject=QA%20Lead");
    expect(jobRow({ ...j, applyUrl: null, applyEmail: null })).toEqual({ title: "QA Lead", href: "/open-positions/qa", department: "Ops", location: "Yokneam", applyHref: null });
  });
});

describe("the hero button goes down the page", () => {
  it("to the roles, or with none open to the general application", () => {
    expect(careersCta(3)).toEqual({ label: "See open positions ↓", href: "#open-positions" });
    expect(careersCta(0)).toEqual({ label: "Send us your details ↓", href: "#general-interest" });
  });
});

describe("the EEO note is one line, the full text folded", () => {
  it("first sentence", () => {
    expect(firstSentence("Rapid Medical is an equal opportunity employer and prohibits discrimination. We are committed to it.")).toBe("Rapid Medical is an equal opportunity employer and prohibits discrimination.");
    expect(firstSentence("Short note.")).toBe("Short note.");
    expect(firstSentence(null)).toBe("");
  });
});
