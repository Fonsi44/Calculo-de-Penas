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

const landing = getLandingBySlug('amapala')!;
export const metadata: Metadata = landingMetadata(landing);

export default async function AbogadosEnAmapalaPage() {
  return (
    <>
      <LandingLocalView landing={landing} />
      <LocalAtencionBlock landing={landing} />
      <LocalInstitutionsBlock landing={landing} />
      <LocalDocumentLogistics landing={landing} />
      <Section spacing="sm">
        <Container size="lg">
          <p className="text-xxs font-bold uppercase tracking-widest text-accent-dark mb-3">
            Defensa penal en Valle
          </p>
          <Link
            href="/abogado-penalista-nacaome"
            className="focus-ring chip-specialty inline-flex items-center"
          >
            <Scale size={10} className="text-accent-dark" aria-hidden="true" />
            Asistencia penal en Valle
          </Link>
        </Container>
      </Section>
      <BlogHighlights
        slugs={[
          'abogado-penalista-sur-honduras',
          'defensa-penal-honduras',
          'despido-laboral-honduras-guia-completa',
          'divorcio-honduras-guia-completa',
          'como-elegir-abogado-honduras',
          'poder-legal-honduras-cuando-se-necesita',
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
