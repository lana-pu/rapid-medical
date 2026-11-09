import type { Metadata } from "next";
import { getSetting } from "@/lib/settings";
import { absoluteTitle } from "@/lib/seo";
import { BlockList } from "@/blocks/render";
import { contactToBlocks } from "@/blocks/from-pages";

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
  return <BlockList blocks={contactToBlocks(await searchParams)} />;
}
