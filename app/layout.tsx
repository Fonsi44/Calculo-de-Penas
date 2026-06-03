import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "./auth-context";
import { ThemeProvider } from "./theme-context";
import { ToastProvider } from "@/components/ui/toast";
import { ConfirmProvider } from "@/components/ui/confirm";
import { GlobalShortcuts } from "@/components/layout/global-shortcuts";
import { GlobalErrorBoundary } from "./global-error-boundary";

const siteUrl = "https://calculo-de-penas-nextjs.vercel.app";

export const metadata: Metadata = {
  title: "LEX HONDURAS — Motor de Cálculo de Penas",
  description: "Código Penal de Honduras (Decreto 130-2017). Determine la pena con precisión técnica. Herramienta profesional para abogados y juristas.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "LEX HONDURAS",
    statusBarStyle: "black-translucent",
  },
  openGraph: {
    title: "LEX HONDURAS — Motor de Cálculo de Penas",
    description: "Código Penal de Honduras (Decreto 130-2017). Calcule penas con precisión técnica: concurso real, ideal, continuado, agravantes, atenuantes, eximentes.",
    url: siteUrl,
    siteName: "LEX HONDURAS",
    locale: "es_HN",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport = { themeColor: "#1A2B4A" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" dir="ltr" className="h-full" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/icon-192.svg" />
        <link rel="canonical" href={siteUrl} />
        <meta name="application-name" content="LEX HONDURAS" />
        <meta name="author" content="LEX HONDURAS" />
        <meta name="language" content="es" />
        <meta name="robots" content="index, follow" />
        <script dangerouslySetInnerHTML={{
          __html: `
            (function() {
              try {
                var theme = localStorage.getItem('lex-theme');
                if (theme === 'dark') document.documentElement.classList.add('dark');
              } catch(e) {}
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
                  <div id="main" className="flex flex-col flex-1">
                    {children}
                  </div>
                </AuthProvider>
              </ConfirmProvider>
            </ToastProvider>
          </ThemeProvider>
        </GlobalErrorBoundary>
      </body>
    </html>
  );
}
