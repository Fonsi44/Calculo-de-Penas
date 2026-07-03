import type { Metadata } from 'next';
import { getLandingBySlug, landingMetadata } from '@/data/landings-locales';
import { LandingLocalView } from '@/components/marketing/landing-local';
import { BlogHighlights } from '@/components/marketing/blog-highlights';

const landing = getLandingBySlug('namasigue')!;

export const metadata: Metadata = landingMetadata(landing);

export default async function AbogadosEnNamasiguePage() {
  return (
    <>
      <LandingLocalView landing={landing} />
      <BlogHighlights
        slugs={[
          'abogado-penalista-choluteca',
          'cuando-necesito-abogado-penalista-honduras',
          'despido-laboral-honduras-guia-completa',
          'divorcio-honduras-guia-completa',
          'pension-alimenticia-honduras-guia-completa',
          'testamentos-sucesiones-herencia-honduras',
        ]}
        eyebrow="Guías para Namasigüe y Choluteca"
        title="Recursos legales de interés para Namasigüe"
        subtitle="Guías prácticas sobre defensa penal, derecho de familia, laboral y civil para residentes de Namasigüe y el departamento de Choluteca."
        ctaLabel="Ver todas las guías del blog"
        ctaHref="/blog"
      />
    </>
  );
}
