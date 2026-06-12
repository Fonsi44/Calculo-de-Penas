import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { PublicHeader } from '@/components/marketing/public-header';
import { PublicFooter } from '@/components/marketing/public-footer';
import { site, legalServiceSchema, organizationSchema, websiteSchema } from '@/lib/site';

const isIndexable = !site.noindex;

export const metadata: Metadata = {
  title: {
    default: `${site.name} — ${site.tagline}`,
    template: `%s | ${site.name}`,
  },
  description: site.description,
  authors: [{ name: site.name }],
  creator: site.name,
  publisher: site.name,
  metadataBase: new URL(site.url),
  openGraph: {
    type: 'website',
    locale: 'es_HN',
    url: site.url,
    siteName: site.name,
    title: `${site.name} — ${site.tagline}`,
    description: site.description,
    images: [
      {
        url: `${site.url}/og-image.png`,
        width: 1200,
        height: 630,
        alt: `${site.name} — ${site.tagline}`,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    images: [`${site.url}/og-image.png`],
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
  verification: {
    // Pendiente: añadir tokens reales al lanzar
  },
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

export default function PublicLayout({ children }: { children: ReactNode }) {
  const legalLd = legalServiceSchema();
  const orgLd = organizationSchema();
  const webLd = websiteSchema();

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <PublicHeader />
      <main id="main" className="flex-1">
        {children}
      </main>
      <PublicFooter />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(legalLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webLd) }}
      />
    </div>
  );
}
