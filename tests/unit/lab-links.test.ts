import { describe, it, expect } from "vitest";
import { embedOf, safeHref } from "../../src/components/kit/render";

describe("blocks sandbox: links people type", () => {
  it("keeps site paths and http(s) addresses, drops anything that runs code or leaves the scheme open", () => {
    expect(safeHref("/us/therapies")).toBe("/us/therapies");
    expect(safeHref("https://example.com/a?b=1")).toBe("https://example.com/a?b=1");
    expect(safeHref("javascript:alert(1)")).toBeUndefined();
    expect(safeHref(" JavaScript:alert(1)")).toBeUndefined();
    expect(safeHref("data:text/html,<script>x</script>")).toBeUndefined();
    expect(safeHref("//evil.example/x")).toBeUndefined();
    expect(safeHref("")).toBeUndefined();
  });
  it("turns YouTube and Vimeo links into embed addresses, nothing else", () => {
    expect(embedOf("https://www.youtube.com/watch?v=dQw4w9WgXcQ", false)).toBe("https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?rel=0");
    expect(embedOf("https://youtu.be/dQw4w9WgXcQ", true)).toContain("mute=1");
    expect(embedOf("https://vimeo.com/76979871", false)).toBe("https://player.vimeo.com/video/76979871");
    expect(embedOf("https://example.com/video.mp4", false)).toBeNull();
  });
});
