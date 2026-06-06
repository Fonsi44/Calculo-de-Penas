import type { Metadata } from "next";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "./auth-context";
import { ThemeProvider } from "./theme-context";
import { ToastProvider } from "@/components/ui/toast";
import { ConfirmProvider } from "@/components/ui/confirm";
import { GlobalShortcuts } from "@/components/layout/global-shortcuts";
import { GlobalErrorBoundary } from "./global-error-boundary";
import { RootShell } from "@/components/layout/root-shell";
import { site } from "@/lib/site";
import { SpeedInsights } from "@vercel/speed-insights/next";

/* Tipografía "Premium Corporate Luxury" — Cormorant Garamond (headings)
   + Manrope (body). Patrón del repo fuente. */
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-serif",
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});

const manrope = Manrope({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
  weight: ["300", "400", "500", "600", "700", "800"],
});

const siteUrl = site.url;

export const metadata: Metadata = {
  title: {
    default: `${site.name} — ${site.tagline}`,
    template: `%s · ${site.name}`,
  },
  description: site.description,
  applicationName: site.name,
  authors: [{ name: site.name }],
  keywords: site.keywords,
  creator: site.name,
  publisher: site.name,
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: site.name,
    statusBarStyle: "black-translucent",
  },
  openGraph: {
    title: `${site.name} — ${site.tagline}`,
    description: site.description,
    url: siteUrl,
    siteName: site.name,
    locale: "es_HN",
    type: "website",
  },
  robots: site.noindex
    ? { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false, noimageindex: true } }
    : { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 } },
  alternates: {
    canonical: siteUrl,
  },
};

export const viewport = { themeColor: "#0B1B3D" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" dir="ltr"       className={`h-full ${manrope.variable} ${cormorant.variable}`} suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/icon-192.svg" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon-192.svg" type="image/svg+xml" />
        <meta name="application-name" content={site.name} />
        <meta name="author" content={site.name} />
        <meta name="language" content="es" />
        {site.noindex ? (
          <>
            <meta name="robots" content="noindex, nofollow, nocache" />
            <meta name="googlebot" content="noindex, nofollow, noimageindex" />
          </>
        ) : (
          <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />
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
                <AuthProvider>
                  <GlobalShortcuts />
                  <RootShell>{children}</RootShell>
                </AuthProvider>
              </ConfirmProvider>
            </ToastProvider>
          </ThemeProvider>
        </GlobalErrorBoundary>
        <SpeedInsights />
      </body>
    </html>
  );
}
