import Link from "next/link";
import { Section, H1 } from "@/components/site/primitives";

export default function NotFound() {
  return (
    <Section>
      <H1>Page not found</H1>
      <p className="mt-4 text-muted">The page you’re looking for doesn’t exist or has moved.</p>
      <Link href="/" className="mt-6 inline-block underline">Back to home</Link>
    </Section>
  );
}
