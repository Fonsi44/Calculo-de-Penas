import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { site } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Contacto',
  description: `Comuníquese con ${site.name} en ${site.address.city}, ${site.address.department}. Teléfono, WhatsApp, correo electrónico y ubicación del bufete.`,
  alternates: { canonical: '/contacto' },
  openGraph: {
    title: `Contacto · ${site.name}`,
    description: `Visítenos en ${site.address.city}, ${site.address.department}, Honduras o contáctenos por teléfono o WhatsApp.`,
    url: `${site.url}/contacto`,
    siteName: site.name,
    locale: 'es_HN',
    type: 'website',
    images: [{ url: `${site.url}/og-image.png`, width: 1200, height: 630, alt: `Contacto · ${site.name}` }],
  },
};

export default function ContactoLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
