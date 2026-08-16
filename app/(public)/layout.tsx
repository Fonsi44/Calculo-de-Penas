import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { PublicHeader } from '@/components/marketing/public-header';
import { PublicFooter } from '@/components/marketing/public-footer';
import { FloatingContactRail, MobileContactBar } from '@/components/marketing/live-widgets';
import { ChatWidget } from '@/components/chat/chat-widget';
import { PWARegistration } from '@/components/pwa/pwa-registration';
import { site, legalServiceSchema, organizationSchema, websiteSchema, founderSchema, thaniaSchema, emilSchema, supplementalTeamSchemas } from '@/lib/site';
import { getSeoOverrides } from '@/lib/site-config-db';
import { AnalyticsScripts } from '@/components/analytics-scripts';
import { AnalyticsListeners } from '@/components/marketing/analytics-listeners';
import { CookieConsent } from '@/components/cookie-consent';

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getSeoOverrides();
  const isIndexable = seo.noindex !== undefined ? !seo.noindex : !site.noindex;

  // OG title con guion simple (-) para evitar mojibake del em-dash en parsers OG.
  const title = seo.title ?? `${site.name} - ${site.tagline}`;
  const description = seo.description && seo.description.length <= 160
    ? seo.description
    : site.description;
  const ogImage = seo.ogImage ?? `${site.url}/og-image.webp`;
  const verification: Record<string, string> = {};
  if (seo.googleVerification || site.googleVerification) {
    verification.google = seo.googleVerification ?? site.googleVerification ?? '';
  }

  return {
    title: {
      default: title,
      template: `%s | ${site.name}`,
    },
    description,
    authors: [{ name: site.name }],
    creator: site.name,
    publisher: site.name,
    metadataBase: new URL(site.url),
    openGraph: {
      type: 'website',
      locale: 'es_HN',
      // og:url de la home. Next.js normaliza el trailing slash (ver nota en
      // app/(public)/page.tsx). El valor renderizado final es coherente con
      // el canonical y la URL servida. Auditoría 2026-07-06 (A-02).
      url: `${site.url}/`,
      siteName: site.name,
      title,
      description,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: `${site.name} - ${site.tagline}`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: 'Abogados en Nacaome, Valle. Defensa penal, familia, laboral y asesoría jurídica integral con presupuesto por escrito.',
      images: [ogImage],
      creator: '@Danilo_Pineda_M',
      site: '@Danilo_Pineda_M',
    },
    robots: isIndexable
      ? {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            'max-image-preview': 'large',
            'max-snippet': -1,
            'max-video-preview': -1,
          },
        }
      : {
          index: false,
          follow: false,
          nocache: true,
          googleBot: {
            index: false,
            follow: false,
            noimageindex: true,
          },
        },
    verification,
    other: {
      'geo.region': 'HN-VA',
      'geo.placename': `${site.address.city}, ${site.address.department}`,
      ...(site.geo.latitude !== null && site.geo.longitude !== null
        ? {
            'geo.position': `${site.geo.latitude};${site.geo.longitude}`,
            ICBM: `${site.geo.latitude}, ${site.geo.longitude}`,
          }
        : {}),
    },
  };
}

export const viewport: Viewport = {
  themeColor: '#0F1D3A',
  colorScheme: 'light',
};

export default function PublicLayout({ children }: { children: ReactNode }) {
  // JSON-LD unificado en un único `@graph` central. Antes se emitían 6 scripts
  // separados lo cual es válido pero fragmenta el grafo para Knowledge Graph.
  // Un único @graph con @id estables facilita la deduplicación de entidades.
  const graphLd = {
    '@context': 'https://schema.org',
    '@graph': [
      legalServiceSchema(),
      organizationSchema(),
      websiteSchema(),
      founderSchema(),
      thaniaSchema(),
      emilSchema(),
      ...supplementalTeamSchemas(),
    ],
  };

  return (
    <div className="flex flex-col min-h-screen bg-background pb-16 md:pb-0">
      <PublicHeader />
      <main id="main" className="flex-1">
        {children}
      </main>
      <PublicFooter />
      <FloatingContactRail />
      <MobileContactBar />
      <ChatWidget />
      <PWARegistration />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(graphLd) }}
      />
      <AnalyticsScripts
        gaId={site.gaId}
        gtmId={site.gtmId}
        fbPixelId={site.fbPixelId}
        clarityId={site.clarityId}
        analyticsEnabled={
          (process.env.NODE_ENV === 'production' && process.env.VERCEL_ENV !== 'preview')
        }
      />
      <AnalyticsListeners />
      <CookieConsent />
    </div>
  );
}
