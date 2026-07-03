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
          'abogado-penalista-sur-honduras',
          'defensa-penal-honduras',
          'despido-laboral-honduras-guia-completa',
          'divorcio-honduras-guia-completa',
          'como-elegir-abogado-honduras',
        ]}
        eyebrow="Guías para San Antonio de Flores y Choluteca"
        title="Recursos legales para residentes de San Antonio de Flores"
        subtitle="Guías prácticas sobre defensa penal, derecho de familia, laboral y civil para clientes de San Antonio de Flores, Choluteca."
        ctaLabel="Ver todas las guías del blog"
        ctaHref="/blog"
      />
    </>
  );
}
