import "server-only";
import type { RegistryRow } from "./document-import";

/**
 * The study's registry record from ClinicalTrials.gov (API v2: open, free, no key; probe 2026-11-16). Only this host is
 * ever asked, with a number that matches NCT + 8 digits, so the address cannot be steered elsewhere.
 */
const NCT = /^NCT\d{8}$/;

export const registryUrl = (nct: string) => `https://clinicaltrials.gov/study/${nct}`;

type Json = Record<string, unknown>;
const get = (o: unknown, path: string): unknown => path.split(".").reduce<unknown>((x, k) => (x && typeof x === "object" ? (x as Json)[k] : undefined), o);
const str = (o: unknown, path: string) => {
  const v = get(o, path);
  return typeof v === "string" || typeof v === "number" ? String(v) : "";
};
const words = (s: string) => s.toLowerCase().replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
const month = (d: string) => {
  const m = /^(\d{4})-(\d{2})/.exec(d);
  return m ? new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, 1)).toLocaleDateString("en-US", { month: "short", year: "numeric", timeZone: "UTC" }) : d;
};

/** The passport rows a registry record gives (pure: tested on the SUCCESS and DISTALS records). */
export function registryRows(nct: string, study: unknown): RegistryRow[] {
  const p = get(study, "protocolSection");
  const rows: RegistryRow[] = [];
  const type = str(p, "designModule.studyType");
  const allocation = str(p, "designModule.designInfo.allocation");
  const masking = str(p, "designModule.designInfo.maskingInfo.masking");
  const design = [type && words(type), allocation && allocation !== "NA" && words(allocation), masking && masking !== "NONE" && `${words(masking)} masking`].filter(Boolean).join(", ");
  if (design) rows.push({ key: "design", label: "Design", value: design });
  const count = str(p, "designModule.enrollmentInfo.count");
  if (count) rows.push({ key: "patients", label: "Patients", value: `${count}${str(p, "designModule.enrollmentInfo.type") === "ESTIMATED" ? " (planned)" : ""}` });
  const locations = get(p, "contactsLocationsModule.locations");
  if (Array.isArray(locations) && locations.length) {
    const countries = [...new Set(locations.map((l) => str(l, "country")).filter(Boolean))];
    rows.push({ key: "centers", label: "Centers", value: `${locations.length}${countries.length ? ` · ${countries.slice(0, 3).join(", ")}${countries.length > 3 ? "…" : ""}` : ""}` });
  }
  const start = str(p, "statusModule.startDateStruct.date");
  const end = str(p, "statusModule.primaryCompletionDateStruct.date") || str(p, "statusModule.completionDateStruct.date");
  if (start) rows.push({ key: "period", label: "Enrollment period", value: end ? `${month(start)} – ${month(end)}` : `from ${month(start)}` });
  const status = str(p, "statusModule.overallStatus");
  if (status) rows.push({ key: "status", label: "Status", value: words(status) });
  rows.push({ key: "registry", label: "Registry", value: nct });
  return rows;
}

/** The record, or why it could not be read — the draft is built without it then. */
export async function fetchRegistry(nct: string): Promise<{ ok: true; rows: RegistryRow[] } | { ok: false; error: string }> {
  if (!NCT.test(nct)) return { ok: false, error: "Not an NCT number" };
  try {
    const res = await fetch(`https://clinicaltrials.gov/api/v2/studies/${nct}?format=json`, { signal: AbortSignal.timeout(8000), headers: { accept: "application/json" }, redirect: "error", cache: "no-store" });
    if (res.status === 404) return { ok: false, error: `${nct} is not in ClinicalTrials.gov` };
    if (!res.ok) return { ok: false, error: `ClinicalTrials.gov answered ${res.status}` };
    return { ok: true, rows: registryRows(nct, await res.json()) };
  } catch {
    return { ok: false, error: "ClinicalTrials.gov could not be reached" };
  }
}
