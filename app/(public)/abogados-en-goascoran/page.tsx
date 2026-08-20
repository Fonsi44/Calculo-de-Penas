import type { Metadata } from 'next';
import Link from 'next/link';
import { Scale } from 'lucide-react';
import { getLandingBySlug, landingMetadata } from '@/data/landings-locales';
import { LandingLocalView } from '@/components/marketing/landing-local';
import {
  LocalAtencionBlock,
  LocalInstitutionsBlock,
  LocalDocumentLogistics,
} from '@/components/marketing/local-context-blocks';
import { BlogHighlights } from '@/components/marketing/blog-highlights';
import { Section, Container } from '@/components/marketing/section';

const landing = getLandingBySlug('goascoran')!;
export const metadata: Metadata = landingMetadata(landing);

export default async function AbogadosEnGoascoranPage() {
  return (
    <>
      <LandingLocalView landing={landing} />
      <LocalAtencionBlock landing={landing} />
      <LocalInstitutionsBlock landing={landing} />
      <LocalDocumentLogistics landing={landing} />
      <Section spacing="sm">
        <Container size="lg">
          <p className="text-xxs font-bold uppercase tracking-widest text-accent-dark mb-3">
            Defensa penal desde Nacaome
          </p>
          <Link
            href="/abogado-penalista-nacaome"
            className="focus-ring chip-specialty inline-flex items-center"
          >
            <Scale size={10} className="text-accent-dark" aria-hidden="true" />
            Penalista en Nacaome
          </Link>
        </Container>
      </Section>
      <BlogHighlights
        slugs={[
          'cuando-necesito-abogado-penalista-honduras',
          'que-hacer-si-me-detienen-en-honduras',
          'despido-laboral-honduras-guia-completa',
          'divorcio-honduras-guia-completa',
          'pension-alimenticia-honduras-guia-completa',
          'poder-legal-honduras-cuando-se-necesita',
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
