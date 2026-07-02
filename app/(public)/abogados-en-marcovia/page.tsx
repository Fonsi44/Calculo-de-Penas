import type { Metadata } from 'next';
import { getLandingBySlug, landingMetadata } from '@/data/landings-locales';
import { LandingLocalView } from '@/components/marketing/landing-local';
import { BlogHighlights } from '@/components/marketing/blog-highlights';

const landing = getLandingBySlug('marcovia')!;
export const metadata: Metadata = landingMetadata(landing);

export default async function AbogadosEnMarcoviaPage() {
  return (
    <>
      <LandingLocalView landing={landing} />
      <BlogHighlights
        slugs={[
          'abogados-en-marcovia-choluteca',
          'abogados-en-choluteca',
          'abogado-laboral-choluteca',
          'abogado-civil-choluteca',
          'despido-laboral-honduras-guia-completa',
          'divorcio-choluteca',
        ]}
        eyebrow="Guías para Marcovia y Choluteca"
        title="Recursos legales para Marcovia y la zona sur"
        subtitle="Guías prácticas sobre derecho laboral, familia, civil y defensa penal para residentes de Marcovia, Choluteca."
        ctaLabel="Ver todas las guías del blog"
        ctaHref="/blog"
      />
    </>
  );
}
