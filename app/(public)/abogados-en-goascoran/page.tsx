import type { Metadata } from 'next';
import { getLandingBySlug, landingMetadata } from '@/data/landings-locales';
import { LandingLocalView } from '@/components/marketing/landing-local';
import {
  LocalAtencionBlock,
  LocalInstitutionsBlock,
  LocalDocumentLogistics,
} from '@/components/marketing/local-context-blocks';
import { BlogHighlights } from '@/components/marketing/blog-highlights';

const landing = getLandingBySlug('goascoran')!;
export const metadata: Metadata = landingMetadata(landing);

export default async function AbogadosEnGoascoranPage() {
  return (
    <>
      <LandingLocalView landing={landing} />
      {/* FASE 4 (§7): secciones únicas reales para Goascorán, basadas en su
          carácter de zona fronteriza con El Salvador. */}
      <LocalAtencionBlock landing={landing} />
      <LocalInstitutionsBlock landing={landing} />
      <LocalDocumentLogistics landing={landing} />
      <BlogHighlights
        slugs={[
          'abogado-penalista-choluteca',
          'cuando-necesito-abogado-penalista-honduras',
          'despido-laboral-honduras-guia-completa',
          'divorcio-honduras-guia-completa',
          'pension-alimenticia-honduras-guia-completa',
          'testamentos-sucesiones-herencia-honduras',
        ]}
        eyebrow="Guías para Goascorán y Valle"
        title="Recursos legales de interés para la zona fronteriza"
        subtitle="Guías prácticas sobre defensa penal, derecho de familia, laboral y civil para residentes de Goascorán y el departamento de Valle."
        ctaLabel="Ver todas las guías del blog"
        ctaHref="/blog"
      />
    </>
  );
}
