import { notFound, permanentRedirect } from "next/navigation";
import { getTeamMember } from "@/lib/content";

/**
 * Leadership bios live on About (decision 2026-11-10, Emily's audit: one paragraph, 2 seconds per page).
 * Old profile URLs go to the person's card there.
 */
export default async function TeamMemberPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!(await getTeamMember(slug))) notFound();
  permanentRedirect(`/about-us#${slug}`);
}
