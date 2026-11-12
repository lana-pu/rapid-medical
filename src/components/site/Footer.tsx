import Link from "next/link";
import type { Region } from "@/db/schema";
import { E } from "./editable";
import type { Navigation } from "@/lib/navigation";

const NAV = "settings:navigation";

export async function Footer({
  contact,
  social,
  region,
  regionalNotice,
  nav,
}: {
  nav: Navigation;
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
          <div className="font-semibold"><E r={NAV} f="contactTitle">{nav.contactTitle}</E></div>
          <ul className="mt-2 space-y-1 text-muted">
            {contact.phoneHq && <li>HQ: <a href={`tel:${contact.phoneHq}`}>{contact.phoneHq}</a></li>}
            {contact.phoneUs && <li>US: <a href={`tel:${contact.phoneUs}`}>{contact.phoneUs}</a></li>}
            {contact.email && <li><a href={`mailto:${contact.email}`}>{contact.email}</a></li>}
          </ul>
        </div>
        <div>
          <div className="font-semibold"><E r={NAV} f="followTitle">{nav.followTitle}</E></div>
          <ul className="mt-2 space-y-1 text-muted">
            {social.x && <li><a href={social.x} rel="noopener" target="_blank">X</a></li>}
            {social.linkedin && <li><a href={social.linkedin} rel="noopener" target="_blank">LinkedIn</a></li>}
            {social.instagram && <li><a href={social.instagram} rel="noopener" target="_blank">Instagram</a></li>}
            {social.youtube && <li><a href={social.youtube} rel="noopener" target="_blank">YouTube</a></li>}
          </ul>
        </div>
        <div>
          <div className="font-semibold"><E r={NAV} f="legalTitle">{nav.legalTitle}</E></div>
          <ul className="mt-2 space-y-1 text-muted">
            {nav.legal.map((l, i) => (
              <li key={i}><Link href={l.href}>{l.path ? <E r={NAV} f={`${l.path}.label`}>{l.label}</E> : l.label}</Link></li>
            ))}
          </ul>
        </div>
      </div>
      {region && regionalNotice && (
        <div className="mx-auto max-w-6xl px-4 pb-4 text-xs text-muted">{regionalNotice}</div>
      )}
      <div className="border-t border-border">
        <div className="mx-auto max-w-6xl px-4 py-4 text-xs text-muted">© {year} <E r={NAV} f="copyright">{nav.copyright}</E></div>
      </div>
    </footer>
  );
}
