import type { Metadata } from 'next';
import { getLandingBySlug, landingMetadata } from '@/data/landings-locales';
import { LandingLocalView } from '@/components/marketing/landing-local';
import { BlogHighlights } from '@/components/marketing/blog-highlights';

const landing = getLandingBySlug('nacaome')!;

export const metadata: Metadata = landingMetadata(landing);

export default async function AbogadosEnNacaomePage() {
  return (
    <>
      <LandingLocalView landing={landing} />
      <BlogHighlights
        slugs={[
          'que-hacer-si-me-detienen-en-honduras',
          'cuando-necesito-abogado-penalista-honduras',
          'delitos-mas-comunes-honduras',
          'jornada-laboral-horas-extra-descansos-honduras',
          'poder-legal-honduras-cuando-se-necesita',
          'testamentos-sucesiones-herencia-honduras',
        ]}
        eyebrow="Artículos útiles para Nacaome"
        title="Guías legales de interés para la zona sur"
        subtitle="Recursos prácticos para resolver dudas legales frecuentes en Nacaome, Valle y la zona sur de Honduras."
        ctaLabel="Ver todas las guías del blog"
        ctaHref="/blog"
      />
    </>
  );
}
