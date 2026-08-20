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

const landing = getLandingBySlug('san-marcos-de-colon')!;
export const metadata: Metadata = landingMetadata(landing);

export default async function AbogadosEnSanMarcosDeColonPage() {
  return (
    <>
      <LandingLocalView landing={landing} />
      <LocalAtencionBlock landing={landing} />
      <LocalInstitutionsBlock landing={landing} />
      <LocalDocumentLogistics landing={landing} />
      <Section spacing="sm">
        <Container size="lg">
          <p className="text-xxs font-bold uppercase tracking-widest text-accent-dark mb-3">
            Defensa penal en el departamento de Choluteca
          </p>
          <Link
            href="/abogado-penalista-choluteca"
            className="focus-ring chip-specialty inline-flex items-center"
          >
            <Scale size={10} className="text-accent-dark" aria-hidden="true" />
            Cobertura penal en Choluteca
          </Link>
        </Container>
      </Section>
      <BlogHighlights
        slugs={[
          'cuando-necesito-abogado-penalista-honduras',
          'cobro-deudas-choluteca',
          'defensa-sar-choluteca',
          'abogado-empresas-san-lorenzo',
          'como-elegir-abogado-honduras',
          'abogado-penalista-sur-honduras',
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
