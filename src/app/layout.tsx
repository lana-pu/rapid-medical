import type { Metadata } from "next";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.rapid-medical.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "Rapid Medical™ | Neurovascular Therapy Solutions", template: "%s | Rapid Medical™" },
  description: "Purpose-built devices for stroke intervention. Personalized tools for patient anatomy.",
  openGraph: { type: "website", siteName: "Rapid Medical™" },
  twitter: { card: "summary" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
