import type { Metadata } from 'next';
import { getLandingBySlug, landingMetadata } from '@/data/landings-locales';
import { LandingLocalView } from '@/components/marketing/landing-local';
import { BlogHighlights } from '@/components/marketing/blog-highlights';

const landing = getLandingBySlug('san-marcos-de-colon')!;
export const metadata: Metadata = landingMetadata(landing);

export default async function AbogadosEnSanMarcosDeColonPage() {
  return (
    <>
      <LandingLocalView landing={landing} />
      <BlogHighlights
        slugs={[
          'abogados-en-san-marcos-de-colon-choluteca',
          'abogados-en-choluteca',
          'cobro-deudas-choluteca',
          'defensa-sar-choluteca',
          'abogado-empresas-san-lorenzo',
          'como-elegir-abogado-honduras',
        ]}
        eyebrow="Guías para San Marcos de Colón"
        title="Recursos legales para la zona fronteriza sur"
        subtitle="Guías prácticas sobre defensa penal, derecho mercantil, aduanero, civil y laboral para San Marcos de Colón y la frontera con Nicaragua."
        ctaLabel="Ver todas las guías del blog"
        ctaHref="/blog"
      />
    </>
  );
}
