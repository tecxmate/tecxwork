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
    return new URL(configured ?? "https://work.tecxmate.com");
  } catch {
    return new URL("https://work.tecxmate.com");
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const branding = await getEventBranding();
  const base = getMetadataBase();
  const title = `tecxwork — ${branding.name} | Vietnamese Jobs in Taiwan · 越南人才台灣工作 · Việc làm tại Đài Loan`;
  const description = `tecxwork: ${branding.organizerShort} ${branding.displayYear} — ${branding.tagline}. Vietnamese engineers, workers & students hiring in Taiwan. 越南招募・越南工程師・越南工人・台灣工作. Việc làm Đài Loan cho người Việt. ${branding.displayDate} @ ${branding.hostedAt}.`;
  return {
    metadataBase: base,
    manifest: "/manifest.json",
    applicationName: "tecxwork",
    keywords: [
      "tecxwork",
      "tecxmate",
      "Vietnamese jobs Taiwan",
      "Vietnamese engineers Taiwan",
      "Vietnamese workers Taiwan",
      "越南招募",
      "越南工程師",
      "越南工人",
      "台灣工作",
      "越南人才",
      "外籍工程師",
      "外籍移工",
      "việc làm Đài Loan",
      "tuyển dụng Đài Loan",
      "kỹ sư Việt Nam Đài Loan",
      "job fair Taiwan Vietnam",
      "VSATW",
    ],
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
    title: {
      default: title,
      template: "%s | tecxwork",
    },
    description,
    alternates: {
      canonical: "/",
      languages: {
        en: "/",
        vi: "/",
        "zh-TW": "/",
        "x-default": "/",
      },
    },
    openGraph: {
      title,
      description,
      url: "/",
      type: "website",
      locale: "en_US",
      alternateLocale: ["vi_VN", "zh_TW"],
      siteName: "tecxwork",
      images: [
        {
          url: "/opengraph-image",
          width: 1200,
          height: 630,
          alt: "tecxwork — Vietnamese Jobs in Taiwan",
          type: "image/png",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/opengraph-image"],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
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
  const siteUrl = getMetadataBase().toString().replace(/\/$/, "");
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${siteUrl}/#organization`,
        name: "tecxwork",
        alternateName: ["tecxmate work", "TECXWORK", "tecx work"],
        url: siteUrl,
        logo: `${siteUrl}/icon-512.png`,
        description:
          "tecxwork connects Vietnamese engineers, workers, and students with employers hiring in Taiwan. 越南人才台灣工作平台.",
        parentOrganization: {
          "@type": "Organization",
          name: "tecxmate",
          url: "https://tecxmate.com",
        },
        sameAs: ["https://tecxmate.com"],
      },
      {
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
        url: siteUrl,
        name: "tecxwork",
        inLanguage: ["en", "vi", "zh-TW"],
        publisher: { "@id": `${siteUrl}/#organization` },
        potentialAction: {
          "@type": "SearchAction",
          target: `${siteUrl}/jobs?q={search_term_string}`,
          "query-input": "required name=search_term_string",
        },
      },
    ],
  };

  return (
    <html
      lang={studentLocale}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${ebGaramond.variable} ${instrumentSerif.variable} h-full antialiased`}
    >
      <body className="flex min-h-[100dvh] flex-col overflow-x-clip bg-background">
        <script
          type="application/ld+json"
          // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD payload is server-built, no user input.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
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
