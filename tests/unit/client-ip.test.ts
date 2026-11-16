import { describe, expect, it } from "vitest";
import { clientIp } from "../../src/lib/client-ip";

const h = (o: Record<string, string>) => new Headers(o);

describe("clientIp: the address the host wrote, not the one the visitor sent", () => {
  it("takes Vercel's header first", () => {
    expect(clientIp(h({ "x-vercel-forwarded-for": "203.0.113.7", "x-forwarded-for": "1.1.1.1, 203.0.113.7" }))).toBe("203.0.113.7");
  });
  it("else the right-most x-forwarded-for entry: a forged left one does not change it", () => {
    expect(clientIp(h({ "x-forwarded-for": "6.6.6.6, 198.51.100.2" }))).toBe("198.51.100.2");
    expect(clientIp(h({ "x-forwarded-for": "198.51.100.2" }))).toBe("198.51.100.2");
  });
  it("null without either", () => {
    expect(clientIp(h({}))).toBeNull();
    expect(clientIp(h({ "x-forwarded-for": " " }))).toBeNull();
  });
});
