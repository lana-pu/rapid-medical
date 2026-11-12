import { redirect } from "next/navigation";
import QRCode from "qrcode";
import { requireSignedIn, totpSetup } from "@/lib/auth";
import { TwoStepSetup } from "./TwoStepSetup";

export const metadata = { title: "Two-step sign-in · Rapid Medical admin" };

/** Mandatory two-step sign-in, set up on the first visit (docs/screens/admin-people.md). */
export default async function SetupPage() {
  const me = await requireSignedIn();
  if (!me.needsSetup) redirect("/admin/start");
  const s = totpSetup(me.email);
  const qr = await QRCode.toDataURL(s.uri, { margin: 1, width: 180 });
  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-100 p-6">
      <div className="w-full max-w-sm space-y-4 rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
        <h1 className="text-lg font-semibold">Set up two-step sign-in</h1>
        <p className="text-sm text-neutral-600">Everyone who edits the website signs in with a password and a code from their phone.</p>
        <TwoStepSetup secret={s.secret} qr={qr} />
      </div>
    </main>
  );
}
