import type { Metadata } from "next";
import "./globals.css";
import { DEMO } from "@/lib/demo";
import { DemoShell } from "@/components/editor/DemoShell";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.rapid-medical.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "Rapid Medical™ | Neurovascular Therapy Solutions", template: "%s | Rapid Medical™" },
  description: "Purpose-built devices for stroke intervention. Personalized tools for patient anatomy.",
  openGraph: { type: "website", siteName: "Rapid Medical™", images: ["/og-image.jpg"] },
  twitter: { card: "summary", images: ["/og-image.jpg"] },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        {children}
        {DEMO && <DemoShell />}
      </body>
    </html>
  );
}
