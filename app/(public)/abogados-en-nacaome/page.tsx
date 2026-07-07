import type { Metadata } from 'next';
import Link from 'next/link';
import { Scale, MapPin } from 'lucide-react';
import { getLandingBySlug, landingMetadata } from '@/data/landings-locales';
import { LandingLocalView } from '@/components/marketing/landing-local';
import { BlogHighlights } from '@/components/marketing/blog-highlights';
import { Section, Container } from '@/components/marketing/section';

const landing = getLandingBySlug('nacaome')!;

export const metadata: Metadata = landingMetadata(landing);

// Landings de cargo (especialistas por área en Nacaome) — enlazadas desde la
// sede para darles inlinks HTML reales (CSV orphan-page de Ahrefs: 0 inlinks).
const CARGO_LANDINGS = [
  { href: '/abogado-penalista-nacaome', label: 'Abogado Penalista en Nacaome' },
  { href: '/abogado-de-familia-nacaome', label: 'Abogado de Familia en Nacaome' },
  { href: '/abogado-laboralista-nacaome', label: 'Abogado Laboralista en Nacaome' },
  { href: '/abogado-civil-nacaome', label: 'Abogado Civil en Nacaome' },
];

// Ciudades secundarias del sur (no en footer por R18) — enlazadas desde la
// sede para darles inlinks HTML reales (CSV orphan-page de Ahrefs: 0 inlinks).
const SECONDARY_CITIES = [
  { href: '/abogados-en-langue', label: 'Abogados en Langue' },
  { href: '/abogados-en-caridad', label: 'Abogados en Caridad' },
  { href: '/abogados-en-alianza', label: 'Abogados en Alianza' },
  { href: '/abogados-en-concepcion-de-maria', label: 'Abogados en Concepción de María' },
  { href: '/abogados-en-san-antonio-de-flores', label: 'Abogados en San Antonio de Flores' },
];

export default async function AbogadosEnNacaomePage() {
  return (
    <>
      <LandingLocalView landing={landing} />

      {/* Especialistas por área en Nacaome — inlinks a cargo landings.
          Estas páginas tenían 0 href inlinks (CSV orphan-page de Ahrefs). */}
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

      {/* Cobertura legal en el sur — inlinks a ciudades secundarias.
          No están en el footer (R18: solo 10 prioritarias), así que se
          enlazan contextualmente desde la sede para que Google las descubra. */}
      <Section spacing="sm">
        <Container size="lg">
          <p className="text-xxs font-bold uppercase tracking-widest text-accent-dark mb-3">
            Cobertura legal en el sur de Honduras
          </p>
          <div className="flex flex-wrap gap-2">
            {SECONDARY_CITIES.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="focus-ring chip-specialty inline-flex items-center"
              >
                <MapPin size={10} className="text-accent-dark" aria-hidden="true" />
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
