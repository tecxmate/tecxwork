import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { EB_Garamond } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const ebGaramond = EB_Garamond({
  variable: "--font-eb-garamond",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "V-GEN",
  },
  title: "V-GEN TRIDENT — VSATW Career Fair 2026",
  description:
    "Ngày Hội Việc Làm VSATW 2026 — The Vietnamese Generation: Versatile in Talent, Value in Action. June 6, 2026 at NTUT (Taipei Tech).",
  openGraph: {
    title: "V-GEN TRIDENT — VSATW Career Fair 2026",
    description:
      "Ngày Hội Việc Làm VSATW 2026 — The Vietnamese Generation: Versatile in Talent, Value in Action. Book your interview slot now.",
    type: "website",
    locale: "en_US",
    siteName: "V-GEN TRIDENT",
  },
  twitter: {
    card: "summary_large_image",
    title: "V-GEN TRIDENT — VSATW Career Fair 2026",
    description:
      "Career fair for Vietnamese students in Taiwan. June 6, 2026 at NTUT (Taipei Tech).",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${ebGaramond.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
