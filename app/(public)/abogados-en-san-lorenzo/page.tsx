import type { Metadata } from 'next';
import { getLandingBySlug, landingMetadata } from '@/data/landings-locales';
import { LandingLocalView } from '@/components/marketing/landing-local';
import {
  LocalAtencionBlock,
  LocalInstitutionsBlock,
  LocalDocumentLogistics,
} from '@/components/marketing/local-context-blocks';
import { BlogHighlights } from '@/components/marketing/blog-highlights';

const landing = getLandingBySlug('san-lorenzo')!;

export const metadata: Metadata = landingMetadata(landing);

export default async function AbogadosEnSanLorenzoPage() {
  return (
    <>
      <LandingLocalView landing={landing} />
      {/* FASE 4 (§7): secciones únicas reales para San Lorenzo, basadas en
          su carácter de puerto y zona comercial. Sin contenido folclórico. */}
      <LocalAtencionBlock landing={landing} />
      <LocalInstitutionsBlock landing={landing} />
      <LocalDocumentLogistics landing={landing} />
      <BlogHighlights
        slugs={[
          'importar-desde-china-guia-legal-aduanera-honduras',
          'codigo-aduanero-centroamericano-basico-honduras',
          'contratos-mercantiles-esenciales-empresas-honduras',
          'derechos-laborales-basicos-honduras',
          'registrar-marca-paso-a-paso-honduras',
          'creditos-reestructuracion-deudas-bancarias-honduras',
        ]}
        eyebrow="Guías para San Lorenzo"
        title="Recursos legales de interés para la zona de San Lorenzo"
        subtitle="Guías prácticas sobre derecho aduanero, mercantil, laboral y bancario para la zona portuaria de San Lorenzo."
        ctaLabel="Ver todas las guías del blog"
        ctaHref="/blog"
      />
    </>
  );
}
