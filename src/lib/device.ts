/**
 * A browser's user agent in words — «Chrome on Mac», «Safari on iPhone» (docs/screens/admin-account.md → «Where you are
 * signed in»). Only for showing a person their own sign-ins: never for deciding anything.
 */
export function deviceName(ua: string | null | undefined): string {
  if (!ua) return "Unknown browser";
  const browser =
    /Edg(A|iOS)?\//.test(ua) ? "Edge"
    : /OPR\/|Opera/.test(ua) ? "Opera"
    : /Firefox\/|FxiOS\//.test(ua) ? "Firefox"
    : /Chrome\/|CriOS\/|HeadlessChrome/.test(ua) ? "Chrome"
    : /Safari\//.test(ua) && /Version\//.test(ua) ? "Safari"
    : null;
  const os =
    /iPhone/.test(ua) ? "iPhone"
    : /iPad/.test(ua) ? "iPad"
    : /Android/.test(ua) ? "Android"
    : /CrOS/.test(ua) ? "Chromebook"
    : /Windows/.test(ua) ? "Windows"
    : /Macintosh|Mac OS X/.test(ua) ? "Mac"
    : /Linux/.test(ua) ? "Linux"
    : null;
  if (!browser && !os) return "Unknown browser";
  return [browser ?? "A browser", os].filter(Boolean).join(" on ");
}
