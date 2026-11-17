import { describe, expect, it } from "vitest";
import { clientIp } from "../../src/lib/client-ip";

const h = (o: Record<string, string>) => new Headers(o);

describe("clientIp: the address the host wrote, not the one the visitor sent", () => {
  it("on Vercel: only Vercel's header, never x-forwarded-for", () => {
    expect(clientIp(h({ "x-vercel-forwarded-for": "203.0.113.7", "x-forwarded-for": "1.1.1.1" }), true)).toBe("203.0.113.7");
    expect(clientIp(h({ "x-forwarded-for": "1.1.1.1" }), true)).toBeNull();
  });
  it("elsewhere without TRUSTED_PROXY_HOPS: no header is trusted, Vercel's included", () => {
    expect(clientIp(h({ "x-vercel-forwarded-for": "6.6.6.6", "x-forwarded-for": "198.51.100.2" }), false, 0)).toBeNull();
  });
  it("behind one proxy: the right-most entry; a forged left one does not change it", () => {
    expect(clientIp(h({ "x-forwarded-for": "6.6.6.6, 198.51.100.2" }), false, 1)).toBe("198.51.100.2");
    expect(clientIp(h({ "x-forwarded-for": "198.51.100.2, " }), false, 1)).toBe("198.51.100.2");
  });
  it("behind two proxies: the second from the right; too few entries — none", () => {
    expect(clientIp(h({ "x-forwarded-for": "6.6.6.6, 198.51.100.2, 10.0.0.5" }), false, 2)).toBe("198.51.100.2");
    expect(clientIp(h({ "x-forwarded-for": "198.51.100.2" }), false, 2)).toBeNull();
  });
  it("only a real address; a port, brackets and an IPv6 zone are taken off", () => {
    expect(clientIp(h({ "x-forwarded-for": "evil<script>" }), false, 1)).toBeNull();
    expect(clientIp(h({ "x-forwarded-for": "999.1.1.1" }), false, 1)).toBeNull();
    expect(clientIp(h({ "x-forwarded-for": "203.0.113.7:443" }), false, 1)).toBe("203.0.113.7");
    expect(clientIp(h({ "x-forwarded-for": "[2001:db8::1]:443" }), false, 1)).toBe("2001:db8::1");
    expect(clientIp(h({ "x-forwarded-for": "fe80::1%eth0" }), false, 1)).toBe("fe80::1");
  });
});
