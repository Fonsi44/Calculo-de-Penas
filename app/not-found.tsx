import type { Metadata } from 'next';
import Link from 'next/link';
import { site } from '@/lib/site';
import { ArrowLeft, Scale } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Página no encontrada',
  description: `La página que busca no está disponible. ${site.name} — Bufete jurídico en ${site.address.city}, ${site.address.department}.`,
  robots: { index: false, follow: true },
  alternates: { canonical: '/_not-found' },
};

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
      <Scale className="w-16 h-16 text-primary/30 mb-6" aria-hidden="true" />
      <h1 className="font-serif font-extrabold text-5xl md:text-7xl text-primary mb-4">404</h1>
      <p className="text-xl text-text-secondary mb-2">Página no encontrada</p>
      <p className="text-text-muted max-w-md mb-8">
        La página que busca no existe o ha sido movida. Puede explorar nuestras
        Servicios Jurídicos o volver al inicio.
      </p>
      <div className="flex flex-wrap gap-4 justify-center">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-white font-semibold hover:bg-primary-dark transition-colors"
        >
          <ArrowLeft size={18} /> Ir al inicio
        </Link>
        <Link
          href="/servicios-juridicos"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-border text-text-secondary font-semibold hover:bg-surface-alt transition-colors"
        >
          Servicios Jurídicos
        </Link>
        <Link
          href="/solicitar-consulta"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-border text-text-secondary font-semibold hover:bg-surface-alt transition-colors"
        >
          Contacto
        </Link>
      </div>
    </div>
  );
}
