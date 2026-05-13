import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import { EB_Garamond } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import { BackToTop } from "@/components/back-to-top";
import { BrandSplash } from "@/components/brand-splash";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
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
    appleWebApp: {
      capable: true,
      statusBarStyle: "black-translucent",
      title: "TECXWORK",
    },
    title: titleLine,
    description: `${branding.organizerShort} ${branding.displayYear} — ${branding.tagline}. ${branding.displayDate} at ${branding.hostedAt}.`,
    openGraph: {
      title: titleLine,
      description: `${branding.organizerShort} ${branding.displayYear} — ${branding.tagline}. Book your interview slot now.`,
      type: "website",
      locale: "en_US",
      siteName: "TECXWORK",
    },
    twitter: {
      card: "summary_large_image",
      title: titleLine,
      description: `Career fair for Vietnamese students in Taiwan. ${branding.displayDate} at ${branding.hostedAt}.`,
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
      <body className="flex min-h-[100dvh] flex-col bg-background">
        <ThemeProvider>
          <StudentLocaleProvider initialLocale={studentLocale}>
            <RouteLoadingSignal />
            <PwaFirstRunSplash />
            <BrandSplash />
            {children}
            <BackToTop />
            <Suspense fallback={null}>
              <MobileBottomNavServer sessionPromise={sessionPromise} />
            </Suspense>
          </StudentLocaleProvider>
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
