import { requireUser } from "@/lib/auth";

/** Inbox with no message open (docs/admin-ia.md → «Уточнения 2026-11-15»). */
export default async function InboxHome() {
  await requireUser();
  return (
    <div className="flex h-[60vh] flex-col items-center justify-center text-center text-neutral-500">
      <div aria-hidden className="text-4xl">✉</div>
      <h1 className="mt-3 text-lg font-semibold text-neutral-800">Choose a message</h1>
      <p className="mt-1 max-w-sm text-sm">Requests from the site&apos;s forms and the team&apos;s notes on pages arrive here. Open one on the left.</p>
    </div>
  );
}
