import type { Metadata } from 'next';
import { getLandingBySlug, landingMetadata } from '@/data/landings-locales';
import { LandingLocalView } from '@/components/marketing/landing-local';
import { BlogHighlights } from '@/components/marketing/blog-highlights';

const landing = getLandingBySlug('aramecina')!;

export const metadata: Metadata = landingMetadata(landing);

export default async function AbogadosEnAramecinaPage() {
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
        eyebrow="Guías para Aramecina y Valle"
        title="Recursos legales de interés para la zona oriental de Valle"
        subtitle="Guías prácticas sobre defensa penal, derecho de familia, laboral y civil para residentes de Aramecina y el departamento de Valle."
        ctaLabel="Ver todas las guías del blog"
        ctaHref="/blog"
      />
    </>
  );
}
