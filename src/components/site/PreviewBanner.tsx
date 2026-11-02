import Link from "next/link";

export function PreviewBanner() {
  return (
    <div className="bg-amber-400 px-4 py-1.5 text-center text-xs font-medium text-black">
      Preview mode — showing unpublished changes and draft pages.{" "}
      <Link href="/api/preview?exit=1" prefetch={false} className="underline">Exit preview</Link>
    </div>
  );
}
