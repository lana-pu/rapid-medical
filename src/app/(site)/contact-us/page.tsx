import type { Metadata } from "next";
import { getSetting } from "@/lib/settings";
import { absoluteTitle } from "@/lib/seo";
import { BlockList } from "@/blocks/render";
import { contactToBlocks } from "@/blocks/from-pages";
import type { Office } from "@/blocks/offices-map";
import { headers } from "next/headers";

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ region?: string }> }): Promise<Metadata> {
  const { region } = await searchParams;
  const seo = await getSetting<Record<string, string>>("seo");
  const key = region === "us" ? "Us" : region === "ous" ? "Ous" : region === "apac" ? "Apac" : "";
  return {
    title: absoluteTitle(seo[`contactTitle${key}`] || seo.contactTitle, "Contact Us"),
    description: seo[`contactDescription${key}`] || seo.contactDescription || "Connect with Rapid Medical™.",
  };
}

export default async function ContactPage({ searchParams }: { searchParams: Promise<{ region?: string; topic?: string }> }) {
  const [params, contact, h] = await Promise.all([searchParams, getSetting<{ offices?: Office[] }>("contact"), headers()]);
  // the visitor's country preselects the Country field (same headers the region detection reads, src/proxy.ts)
  const country = (h.get("x-vercel-ip-country") ?? h.get("cf-ipcountry") ?? h.get("x-country-code") ?? "").toUpperCase() || undefined;
  return <BlockList blocks={contactToBlocks({ ...params, country, offices: contact.offices ?? [] })} />;
}
