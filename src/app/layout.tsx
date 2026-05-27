import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import { EB_Garamond } from "next/font/google";
import { Suspense } from "react";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { BrandSplash } from "@/components/brand-splash";
import { MobileBottomNavClient } from "@/components/mobile-bottom-nav-client";
import { PwaFirstRunSplash } from "@/components/pwa-first-run-splash";
import { RouteLoadingSignal } from "@/components/route-loading-signal";
import { StudentLocaleProvider } from "@/components/student-locale-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { getSession } from "@/lib/auth";
import { getEventBranding } from "@/lib/event-branding";
import { getStudentLocale } from "@/lib/student-locale.server";

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

function getMetadataBase(): URL {
  const configured =
    process.env.NEXT_PUBLIC_SITE_URL ?? process.env.NEXT_PUBLIC_BASE_URL;

  try {
    return new URL(configured ?? "https://tecxwork.com");
  } catch {
    return new URL("https://tecxwork.com");
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const branding = await getEventBranding();
  const titleLine = branding.name;
  return {
    metadataBase: getMetadataBase(),
    manifest: "/manifest.json",
    icons: {
      icon: [
        { url: "/icon.svg", type: "image/svg+xml" },
        { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
        { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
      ],
      apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
    },
    appleWebApp: {
      capable: true,
      statusBarStyle: "black-translucent",
      title: "tecxwork",
    },
    title: titleLine,
    description: `${branding.organizerShort} ${branding.displayYear} — ${branding.tagline}. ${branding.displayDate} at ${branding.hostedAt}.`,
    openGraph: {
      title: titleLine,
      description: `${branding.organizerShort} ${branding.displayYear} — ${branding.tagline}. Book your interview slot now.`,
      type: "website",
      locale: "en_US",
      siteName: "TECXWORK",
      images: [
        {
          url: "/opengraph-image",
          width: 1200,
          height: 630,
          alt: "tecxwork",
          type: "image/png",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: titleLine,
      description: `Career fair for Vietnamese students in Taiwan. ${branding.displayDate} at ${branding.hostedAt}.`,
      images: ["/opengraph-image"],
    },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  colorScheme: "light",
  themeColor: "#FAFAFA",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const sessionPromise = getSession();
  const studentLocale = await getStudentLocale();

  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${ebGaramond.variable} ${instrumentSerif.variable} h-full antialiased`}
    >
      <body className="flex min-h-[100dvh] flex-col overflow-x-clip bg-background">
        <ThemeProvider>
          <StudentLocaleProvider initialLocale={studentLocale}>
            <RouteLoadingSignal />
            <PwaFirstRunSplash />
            <BrandSplash />
            {children}
            <Suspense fallback={null}>
              <MobileBottomNavServer sessionPromise={sessionPromise} />
            </Suspense>
          </StudentLocaleProvider>
        </ThemeProvider>
        <Analytics />
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
  return <MobileBottomNavClient role={session?.role ?? "guest"} />;
}
