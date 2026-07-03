import type { Metadata } from 'next';
import { getLandingBySlug, landingMetadata } from '@/data/landings-locales';
import { LandingLocalView } from '@/components/marketing/landing-local';
import { BlogHighlights } from '@/components/marketing/blog-highlights';

const landing = getLandingBySlug('amapala')!;
export const metadata: Metadata = landingMetadata(landing);

export default async function AbogadosEnAmapalaPage() {
  return (
    <>
      <LandingLocalView landing={landing} />
      <BlogHighlights
        slugs={[
          'abogados-en-amapala-valle',
          'abogado-penalista-sur-honduras',
          'defensa-penal-honduras',
          'despido-laboral-honduras-guia-completa',
          'divorcio-honduras-guia-completa',
          'como-elegir-abogado-honduras',
        ]}
        eyebrow="Guías para Amapala y la zona costera"
        title="Recursos legales para la Isla del Tigre y el Golfo de Fonseca"
        subtitle="Guías prácticas sobre defensa penal, derecho de familia, laboral y mercantil para residentes y comerciantes de Amapala."
        ctaLabel="Ver todas las guías del blog"
        ctaHref="/blog"
      />
    </>
  );
}
