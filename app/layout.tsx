import type { Metadata } from "next";
import { Suspense } from "react";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from '@/components/providers/theme-context';
import { ToastProvider } from "@/components/ui/toast";
import { ConfirmProvider } from "@/components/ui/confirm";
import { PromptDialogProvider } from "@/components/ui/prompt-dialog";
import { GlobalErrorBoundary } from "./global-error-boundary";
import { RootShell } from "@/components/layout/root-shell";
import { ScrollToTop } from "@/components/layout/scroll-to-top";
import { site } from "@/lib/site";
import { SpeedInsights } from "@vercel/speed-insights/next";

/* Tipografía "Premium Corporate Luxury" — Cormorant Garamond (headings)
   + Manrope (body). Patrón del repo fuente. */
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-serif",
  weight: ["400", "600", "700"],
  style: ["normal", "italic"],
});

const manrope = Manrope({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
  weight: ["400", "500", "600", "700"],
});

const siteUrl = site.url;

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: `${site.name} — ${site.tagline}`,
  description: site.description,
  applicationName: site.name,
  authors: [{ name: site.name }],
  creator: site.name,
  publisher: site.name,
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: site.name,
    statusBarStyle: "black-translucent",
  },
  openGraph: {
    // OG title con guion simple (-) en vez de em-dash (—): algunos parsers OG
    // (Bing, Facebook) renderizan mal el em-dash como mojibake. ASCII limpio.
    title: `${site.name} - ${site.tagline}`,
    description: site.description,
    url: `${siteUrl}/`,
    siteName: site.name,
    locale: "es_HN",
    type: "website",
    images: [{ url: `${siteUrl}/og-image.webp`, width: 1200, height: 630, alt: `${site.name} - Bufete jurídico en Nacaome, Valle` }],
  },
  robots: site.noindex
    ? { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false, noimageindex: true } }
    : { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 } },
  alternates: {
    types: {
      'application/rss+xml': `${siteUrl}/blog/feed.xml`,
    },
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION ?? undefined,
    other: {
      // Verificación de Bing Webmaster Tools. Antes estaba hardcodeada; ahora
      // se lee de NEXT_PUBLIC_BING_VERIFICATION con el valor histórico como
      // fallback para no romper la verificación existente mientras se migra a env.
      'msvalidate.01': process.env.NEXT_PUBLIC_BING_VERIFICATION ?? '0D7F7E114D9C22D0332B7769EBE015D4',
    },
  },
};

export const viewport = {
  themeColor: "#0B1B3D",
  colorScheme: ["light", "dark"] as const,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-HN" dir="ltr" className={`h-full ${manrope.variable} ${cormorant.variable}`} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon-192.png" type="image/png" sizes="192x192" />
        <link rel="icon" href="/icon-512.png" type="image/png" sizes="512x512" />
        <link rel="llms-txt" href="/llms.txt" />
        {site.gaId && <link rel="preconnect" href="https://www.googletagmanager.com" />}
        {site.clarityId && <link rel="preconnect" href="https://www.clarity.ms" />}
        <meta name="application-name" content={site.name} />
        <meta name="author" content={site.name} />
        <meta name="language" content="es-HN" />
        {site.googleVerification && (
          <meta name="google-site-verification" content={site.googleVerification} />
        )}
        <script dangerouslySetInnerHTML={{
          __html: `
            (function() {
              try {
                var theme = localStorage.getItem('lex-theme');
                if (theme === 'dark') document.documentElement.classList.add('dark');
              } catch(e) { /* localStorage puede no estar disponible (ej. SSR, entornos restringidos) */ }
            })();
          `
        }} />
      </head>
      <body className="min-h-full flex flex-col">
        <a href="#main" className="skip-link">Saltar al contenido</a>
        <GlobalErrorBoundary>
          <ThemeProvider>
            <ToastProvider>
              <ConfirmProvider>
                <PromptDialogProvider>
                  <Suspense fallback={null}>
                    <ScrollToTop />
                  </Suspense>
                  <RootShell>{children}</RootShell>
                </PromptDialogProvider>
              </ConfirmProvider>
            </ToastProvider>
          </ThemeProvider>
        </GlobalErrorBoundary>
        {process.env.NODE_ENV === 'production' && <SpeedInsights />}
      </body>
    </html>
  );
}
