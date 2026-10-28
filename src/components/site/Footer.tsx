import Link from "next/link";
import type { Region } from "@/db/schema";

export function Footer({
  contact,
  social,
  region,
  regionalNotice,
}: {
  contact: { phoneHq?: string; phoneUs?: string; email?: string };
  social: { x?: string; linkedin?: string; instagram?: string; youtube?: string };
  region: Region | null;
  regionalNotice?: string;
}) {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-16 border-t border-border bg-surface text-sm">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 md:grid-cols-3">
        <div>
          <div className="font-semibold">Get in touch</div>
          <ul className="mt-2 space-y-1 text-muted">
            {contact.phoneHq && <li>HQ: <a href={`tel:${contact.phoneHq}`}>{contact.phoneHq}</a></li>}
            {contact.phoneUs && <li>US: <a href={`tel:${contact.phoneUs}`}>{contact.phoneUs}</a></li>}
            {contact.email && <li><a href={`mailto:${contact.email}`}>{contact.email}</a></li>}
          </ul>
        </div>
        <div>
          <div className="font-semibold">Follow</div>
          <ul className="mt-2 space-y-1 text-muted">
            {social.x && <li><a href={social.x} rel="noopener" target="_blank">X</a></li>}
            {social.linkedin && <li><a href={social.linkedin} rel="noopener" target="_blank">LinkedIn</a></li>}
            {social.instagram && <li><a href={social.instagram} rel="noopener" target="_blank">Instagram</a></li>}
            {social.youtube && <li><a href={social.youtube} rel="noopener" target="_blank">YouTube</a></li>}
          </ul>
        </div>
        <div>
          <div className="font-semibold">Legal</div>
          <ul className="mt-2 space-y-1 text-muted">
            <li><Link href="/privacy-statement">Privacy Statement</Link></li>
            <li><Link href="/terms">Terms of Use</Link></li>
            <li><Link href="/compliance-statement">Compliance Statement</Link></li>
            <li><Link href="/patents">Patents</Link></li>
          </ul>
        </div>
      </div>
      {region && regionalNotice && (
        <div className="mx-auto max-w-6xl px-4 pb-4 text-xs text-muted">{regionalNotice}</div>
      )}
      <div className="border-t border-border">
        <div className="mx-auto max-w-6xl px-4 py-4 text-xs text-muted">© {year} Rapid Medical™. All rights reserved.</div>
      </div>
    </footer>
  );
}
