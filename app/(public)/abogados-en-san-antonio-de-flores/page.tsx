import type { Metadata } from 'next';
import { getLandingBySlug, landingMetadata } from '@/data/landings-locales';
import { LandingLocalView } from '@/components/marketing/landing-local';
import { BlogHighlights } from '@/components/marketing/blog-highlights';

const landing = getLandingBySlug('san-antonio-de-flores')!;

export const metadata: Metadata = landingMetadata(landing);

export default async function AbogadosEnSanAntonioDeFloresPage() {
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
        eyebrow="Guías para San Antonio de Flores y Choluteca"
        title="Recursos legales de interés para San Antonio de Flores"
        subtitle="Guías prácticas sobre defensa penal, derecho de familia, laboral y civil para residentes de San Antonio de Flores y el departamento de Choluteca."
        ctaLabel="Ver todas las guías del blog"
        ctaHref="/blog"
      />
    </>
  );
}
