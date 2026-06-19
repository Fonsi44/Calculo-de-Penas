import type { Metadata } from 'next';
import { getLandingBySlug, landingMetadata } from '@/data/landings-locales';
import { LandingLocalView } from '@/components/marketing/landing-local';
import { BlogHighlights } from '@/components/marketing/blog-highlights';

const landing = getLandingBySlug('choluteca')!;

export const metadata: Metadata = landingMetadata(landing);

export default async function AbogadosEnCholutecaPage() {
  return (
    <>
      <LandingLocalView landing={landing} />
      <BlogHighlights
        slugs={[
          'divorcio-tipos-requisitos-tiempos-honduras',
          'calcular-prestaciones-laborales-honduras',
          'contratos-trabajo-tipos-clausulas-honduras',
          'compraventa-inmuebles-aspectos-legales-honduras',
          'constitucion-empresas-honduras-pasos-legales',
          'pension-alimenticia-honduras-guia-completa',
        ]}
        eyebrow="Guías para Choluteca"
        title="Recursos legales de interés para la zona de Choluteca"
        subtitle="Guías prácticas sobre derecho de familia, laboral, civil y mercantil para la zona de Choluteca."
        ctaLabel="Ver todas las guías del blog"
        ctaHref="/blog"
      />
    </>
  );
}
