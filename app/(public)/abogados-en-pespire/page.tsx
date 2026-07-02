import type { Metadata } from 'next';
import { getLandingBySlug, landingMetadata } from '@/data/landings-locales';
import { LandingLocalView } from '@/components/marketing/landing-local';
import { BlogHighlights } from '@/components/marketing/blog-highlights';

const landing = getLandingBySlug('pespire')!;
export const metadata: Metadata = landingMetadata(landing);

export default async function AbogadosEnPespirePage() {
  return (
    <>
      <LandingLocalView landing={landing} />
      <BlogHighlights
        slugs={[
          'abogados-en-pespire-choluteca',
          'abogados-en-choluteca',
          'abogado-penalista-choluteca',
          'demanda-laboral-choluteca',
          'divorcio-choluteca',
          'pension-alimenticia-choluteca',
        ]}
        eyebrow="Guías para Pespire y Choluteca"
        title="Recursos legales de interés para Pespire y el sur de Honduras"
        subtitle="Guías prácticas sobre defensa penal, derecho de familia, laboral y civil para residentes de Pespire, Choluteca."
        ctaLabel="Ver todas las guías del blog"
        ctaHref="/blog"
      />
    </>
  );
}
