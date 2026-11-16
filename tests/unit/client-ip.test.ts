import { describe, expect, it } from "vitest";
import { clientIp } from "../../src/lib/client-ip";

const h = (o: Record<string, string>) => new Headers(o);

describe("clientIp: the address the host wrote, not the one the visitor sent", () => {
  it("on Vercel takes Vercel's header first", () => {
    expect(clientIp(h({ "x-vercel-forwarded-for": "203.0.113.7", "x-forwarded-for": "1.1.1.1, 203.0.113.7" }), true)).toBe("203.0.113.7");
  });
  it("elsewhere ignores a Vercel header the visitor sent", () => {
    expect(clientIp(h({ "x-vercel-forwarded-for": "6.6.6.6", "x-forwarded-for": "198.51.100.2" }), false)).toBe("198.51.100.2");
  });
  it("takes the right-most x-forwarded-for entry: a forged left one does not change it; empty entries are skipped", () => {
    expect(clientIp(h({ "x-forwarded-for": "6.6.6.6, 198.51.100.2" }), false)).toBe("198.51.100.2");
    expect(clientIp(h({ "x-forwarded-for": "198.51.100.2, " }), false)).toBe("198.51.100.2");
    expect(clientIp(h({ "x-forwarded-for": "2001:db8::1" }), false)).toBe("2001:db8::1");
  });
  it("null without an address, or with something that is not one", () => {
    expect(clientIp(h({}), false)).toBeNull();
    expect(clientIp(h({ "x-forwarded-for": " " }), false)).toBeNull();
    expect(clientIp(h({ "x-forwarded-for": "evil<script>" }), false)).toBeNull();
    expect(clientIp(h({ "x-forwarded-for": "999.1.1.1" }), false)).toBeNull();
    expect(clientIp(h({ "x-forwarded-for": "::::" }), false)).toBeNull();
  });
  it("takes off a port, brackets and an IPv6 zone", () => {
    expect(clientIp(h({ "x-forwarded-for": "203.0.113.7:443" }), false)).toBe("203.0.113.7");
    expect(clientIp(h({ "x-forwarded-for": "[2001:db8::1]:443" }), false)).toBe("2001:db8::1");
    expect(clientIp(h({ "x-forwarded-for": "fe80::1%eth0" }), false)).toBe("fe80::1");
  });
});
