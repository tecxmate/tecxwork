import type { Metadata } from "next";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import { EB_Garamond } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { ThemeProvider } from "@/components/theme-provider";
import { getSession } from "@/lib/auth";
import { EVENT_CONFIG } from "@/lib/data";

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

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: "400",
  style: "italic",
});

export const metadata: Metadata = {
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "TECXWORK",
  },
  title: `V-GEN TRIDENT — ${EVENT_CONFIG.organizerShort} Career Fair ${EVENT_CONFIG.displayYear}`,
  description:
    `Ngày Hội Việc Làm ${EVENT_CONFIG.organizerShort} ${EVENT_CONFIG.displayYear} — ${EVENT_CONFIG.tagline}. ${EVENT_CONFIG.displayDate} at ${EVENT_CONFIG.hostedAt}.`,
  openGraph: {
    title: `V-GEN TRIDENT — ${EVENT_CONFIG.organizerShort} Career Fair ${EVENT_CONFIG.displayYear}`,
    description:
      `Ngày Hội Việc Làm ${EVENT_CONFIG.organizerShort} ${EVENT_CONFIG.displayYear} — ${EVENT_CONFIG.tagline}. Book your interview slot now.`,
    type: "website",
    locale: "en_US",
    siteName: "TECXWORK",
  },
  twitter: {
    card: "summary_large_image",
    title: `V-GEN TRIDENT — ${EVENT_CONFIG.organizerShort} Career Fair ${EVENT_CONFIG.displayYear}`,
    description:
      `Career fair for Vietnamese students in Taiwan. ${EVENT_CONFIG.displayDate} at ${EVENT_CONFIG.hostedAt}.`,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const sessionPromise = getSession();

  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${ebGaramond.variable} ${instrumentSerif.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider>
          {children}
          <Suspense fallback={null}>
            <MobileBottomNavServer sessionPromise={sessionPromise} />
          </Suspense>
        </ThemeProvider>
      </body>
    </html>
  );
}

async function MobileBottomNavServer({
  sessionPromise,
}: {
  sessionPromise: ReturnType<typeof getSession>;
}) {
  const session = await sessionPromise;
  return <MobileBottomNav role={session?.role ?? "guest"} />;
}
