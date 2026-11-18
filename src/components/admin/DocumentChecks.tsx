import type { DocumentCheck } from "@/db/schema";
import { confirmCheck } from "@/admin/document-actions";
import { sourceName } from "@/lib/document-import";

/**
 * «Checked against the PDF» on a material built from a document (docs/screens/admin-create-from-document.md): every
 * quoted value with what the site found; a person confirms each «Check». Publish stays closed until none is left.
 */
export function DocumentChecks({ id, check, demo }: { id: number; check: DocumentCheck; demo?: boolean }) {
  const done = check.items.filter((x) => x.status !== "check").length;
  const open = check.items.length - done;
  const doc = sourceName(check);
  return (
    <section id="checks" aria-label={`Checked against ${doc}`} className="rounded-lg border border-neutral-200 bg-white p-5 text-sm">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-semibold">Checked against {doc}</h2>
        <span className={open ? "font-medium text-amber-800" : "text-green-800"}>{done} of {check.items.length} checked</span>
      </div>
      <p className="mt-1 text-xs text-neutral-500">
        Built from {check.file}.{" "}
        {check.registry?.ok ? `ClinicalTrials.gov ${check.nct} added to the passport where ${doc} says nothing.` : check.registry ? `ClinicalTrials.gov not used: ${check.registry.error}.` : ""}
      </p>
      {open > 0 && <p role="status" className="mt-3 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-amber-900">Publish is closed: check {open} value{open > 1 ? "s" : ""} below against {doc}.</p>}
      {check.items.length === 0 && <p className="mt-3 text-neutral-600">{check.mediaId == null ? "No quoted values." : "No quoted values: the page shows the PDF."}</p>}
      <ul className="mt-3 divide-y divide-neutral-100">
        {check.items.map((x) => (
          <li key={x.id} className="py-3">
            <div className="flex flex-wrap items-baseline gap-x-3">
              <b>{x.value}</b>
              <span className="text-neutral-700">{x.label}</span>
              <span className="text-xs text-neutral-400">{{ figures: "Key figure", passport: "Passport", comparison: "Comparison", matrix: "Dot matrix" }[x.part]}</span>
            </div>
            {x.status === "ok" && <p className="mt-1 text-xs text-green-800">✓ Found in {doc}</p>}
            {x.status === "confirmed" && <p className="mt-1 text-xs text-green-800">✓ Confirmed by {x.confirmedBy}{x.confirmedAt ? `, ${new Date(x.confirmedAt).toLocaleString("en-GB", { timeZone: "Asia/Jerusalem", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}` : ""}{x.reason ? ` · was: ${x.reason}` : ""}</p>}
            {x.status === "check" && (
              <div className="mt-1">
                <p className="text-xs font-medium text-amber-800">Check: {x.reason}</p>
                <blockquote className="mt-1 border-l-2 border-neutral-200 pl-3 text-xs text-neutral-600">«{x.quote}»</blockquote>
                {!demo && (
                  <form action={confirmCheck} className="mt-2">
                    <input type="hidden" name="id" value={id} />
                    <input type="hidden" name="item" value={x.id} />
                    <button type="submit" className="rounded border border-neutral-300 px-3 py-1 text-xs font-medium hover:border-neutral-900">Looks right</button>
                  </form>
                )}
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
