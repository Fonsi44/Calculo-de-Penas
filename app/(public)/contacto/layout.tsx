import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { site } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Contacto',
  description: `Comuníquese con ${site.name} en ${site.address.city}, ${site.address.department}. Teléfono, WhatsApp, correo electrónico y ubicación del bufete.`,
  alternates: { canonical: '/contacto' },
  openGraph: {
    title: `Contacto · ${site.name}`,
    description: `Visítenos en ${site.address.full} o contáctenos por teléfono o WhatsApp.`,
    url: `${site.url}/contacto`,
  },
};

export default function ContactoLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
