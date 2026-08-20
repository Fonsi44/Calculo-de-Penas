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

const landing = getLandingBySlug('san-lorenzo')!;

export const metadata: Metadata = landingMetadata(landing);

export default async function AbogadosEnSanLorenzoPage() {
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
            Defensa penal desde Nacaome
          </Link>
        </Container>
      </Section>
      <BlogHighlights
        slugs={[
          'abogado-aduanero-san-lorenzo',
          'codigo-aduanero-centroamericano',
          'contratos-mercantiles-esenciales-empresas-honduras',
          'derechos-laborales-basicos-honduras',
          'proteccion-marcas-competencia-desleal',
          'abogado-empresas-san-lorenzo',
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
