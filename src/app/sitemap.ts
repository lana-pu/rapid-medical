import type { MetadataRoute } from "next";
import { getAllPublicPaths } from "@/lib/content";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.rapid-medical.com";
  const paths = await getAllPublicPaths();
  return paths.map((p) => ({ url: `${base}${p}`, changeFrequency: "monthly", priority: p === "/" ? 1 : 0.7 }));
}
