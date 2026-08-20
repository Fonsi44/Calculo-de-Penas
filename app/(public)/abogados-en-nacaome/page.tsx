import type { Metadata } from 'next';
import Link from 'next/link';
import { Scale } from 'lucide-react';
import { getLandingBySlug, landingMetadata } from '@/data/landings-locales';
import { LandingLocalView } from '@/components/marketing/landing-local';
import { BlogHighlights } from '@/components/marketing/blog-highlights';
import { Section, Container } from '@/components/marketing/section';

const landing = getLandingBySlug('nacaome')!;

export const metadata: Metadata = landingMetadata(landing);

const CARGO_LANDINGS = [
  { href: '/abogado-penalista-nacaome', label: 'Abogado Penalista en Nacaome' },
  { href: '/abogado-de-familia-nacaome', label: 'Abogado de Familia en Nacaome' },
  { href: '/abogado-laboralista-nacaome', label: 'Abogado Laboralista en Nacaome' },
  { href: '/abogado-civil-nacaome', label: 'Abogado Civil en Nacaome' },
];

export default async function AbogadosEnNacaomePage() {
  return (
    <>
      <LandingLocalView landing={landing} />

      <Section spacing="sm">
        <Container size="lg">
          <p className="text-xxs font-bold uppercase tracking-widest text-accent-dark mb-3">
            Especialistas por área en Nacaome
          </p>
          <div className="flex flex-wrap gap-2">
            {CARGO_LANDINGS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="focus-ring chip-specialty inline-flex items-center"
              >
                <Scale size={10} className="text-accent-dark" aria-hidden="true" />
                {l.label}
              </Link>
            ))}
          </div>
        </Container>
      </Section>

      <BlogHighlights
        slugs={[
          'que-hacer-si-me-detienen-en-honduras',
          'cuando-necesito-abogado-penalista-honduras',
          'delitos-mas-comunes-honduras',
          'despido-laboral-honduras-guia-completa',
          'poder-legal-honduras-cuando-se-necesita',
          'derechos-laborales-basicos-honduras',
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
