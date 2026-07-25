import type { Metadata } from 'next';
import { getLandingBySlug, landingMetadata } from '@/data/landings-locales';
import { LandingLocalView } from '@/components/marketing/landing-local';
import {
  LocalAtencionBlock,
  LocalInstitutionsBlock,
  LocalDocumentLogistics,
} from '@/components/marketing/local-context-blocks';
import { BlogHighlights } from '@/components/marketing/blog-highlights';

const landing = getLandingBySlug('amapala')!;
export const metadata: Metadata = landingMetadata(landing);

export default async function AbogadosEnAmapalaPage() {
  return (
    <>
      <LandingLocalView landing={landing} />
      {/* FASE 4 (§7): secciones únicas reales para Amapala (Isla del Tigre,
          Golfo de Fonseca); acceso combinado terrestre y marítimo. */}
      <LocalAtencionBlock landing={landing} />
      <LocalInstitutionsBlock landing={landing} />
      <LocalDocumentLogistics landing={landing} />
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
