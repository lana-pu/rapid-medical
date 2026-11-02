import { Section, H1 } from "@/components/site/primitives";
import { ContactForm } from "@/components/site/ContactForm";

export const metadata = { title: "Contact Us", description: "Connect with Rapid Medical™ for neurovascular therapy." };

const TOPICS = ["Request a demo", "Product question / Support", "Customer Service / Orders", "Meetings & Events", "Investor relations", "Other"];
const REGION_MAP: Record<string, string> = { us: "Americas", ous: "Europe", apac: "Asia Pacific" };
const TOPIC_MAP: Record<string, string> = { demo: "Request a demo", support: "Product question / Support", orders: "Customer Service / Orders" };

export default async function ContactPage({ searchParams }: { searchParams: Promise<{ region?: string; topic?: string }> }) {
  const sp = await searchParams;
  return (
    <Section>
      <H1>Let’s connect</H1>
      <p className="mt-3 text-muted">Please provide a few contact details below.</p>
      <div className="mt-10 max-w-2xl">
        <ContactForm topics={TOPICS} defaultTopic={sp.topic ? TOPIC_MAP[sp.topic] : undefined} defaultRegion={sp.region ? REGION_MAP[sp.region] : undefined} />
      </div>
    </Section>
  );
}
