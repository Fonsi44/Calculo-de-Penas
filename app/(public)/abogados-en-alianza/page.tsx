import type { Metadata } from 'next';
import { getLandingBySlug, landingMetadata } from '@/data/landings-locales';
import { LandingLocalView } from '@/components/marketing/landing-local';
import { BlogHighlights } from '@/components/marketing/blog-highlights';

const landing = getLandingBySlug('alianza')!;
export const metadata: Metadata = landingMetadata(landing);

export default async function AbogadosEnAlianzaPage() {
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
        eyebrow="Guías para Alianza y la zona fronteriza de Valle"
        title="Recursos legales para residentes de Alianza"
        subtitle="Guías prácticas sobre defensa penal, derecho de familia, laboral y civil para clientes de Alianza, Valle."
        ctaLabel="Ver todas las guías del blog"
        ctaHref="/blog"
      />
    </>
  );
}
