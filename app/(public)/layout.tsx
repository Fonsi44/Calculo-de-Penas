import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { PublicHeader } from '@/components/marketing/public-header';
import { PublicFooter } from '@/components/marketing/public-footer';
import { FloatingContactRail } from '@/components/marketing/live-widgets';
import { PWARegistration } from '@/components/pwa/pwa-registration';
import { site, legalServiceSchema, organizationSchema, websiteSchema, founderSchema, thaniaSchema, emilSchema } from '@/lib/site';
import { getSeoOverrides } from '@/lib/site-config-db';

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
      // og:url con slash final para coincidir con el canonical de la home
      // y evitar que Bing marque "this page is a redirect".
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

export default function PublicLayout({ children }: { children: ReactNode }) {
  const legalLd = legalServiceSchema();
  const orgLd = organizationSchema();
  const webLd = websiteSchema();
  const founderLd = founderSchema();
  const thaniaLd = thaniaSchema();
  const emilLd = emilSchema();

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <PublicHeader />
      <main id="main" className="flex-1 pb-20 sm:pb-24">
        {children}
      </main>
      <PublicFooter />
      <FloatingContactRail />
      <PWARegistration />
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(founderLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(thaniaLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(emilLd) }}
      />
    </div>
  );
}
