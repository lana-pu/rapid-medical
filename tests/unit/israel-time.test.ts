import { describe, it, expect } from "vitest";
import { fromIsraelInput, toIsraelInput, israelZoneLabel } from "../../src/lib/israel-time";

describe("Israel time in the admin", () => {
  it("winter is UTC+2, summer UTC+3", () => {
    expect(fromIsraelInput("2026-11-12T10:00")!.toISOString()).toBe("2026-11-12T08:00:00.000Z");
    expect(fromIsraelInput("2026-07-01T10:00")!.toISOString()).toBe("2026-07-01T07:00:00.000Z");
    expect(israelZoneLabel(new Date("2026-11-12T08:00:00Z"))).toBe("Israel (UTC+2)");
    expect(israelZoneLabel(new Date("2026-07-01T07:00:00Z"))).toBe("Israel (UTC+3)");
  });
  it("round trip for the input", () => {
    expect(toIsraelInput(fromIsraelInput("2026-03-29T09:30"))).toBe("2026-03-29T09:30");
    expect(toIsraelInput(null)).toBe("");
    expect(fromIsraelInput("12/11/2026 10:00")).toBeNull();
  });
});
