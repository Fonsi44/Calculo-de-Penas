import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Scale } from 'lucide-react';
import { site, absoluteUrl } from '@/lib/site';
import { Section, SectionHeader } from '@/components/marketing/section';
import { CTAGroup, ContactStrip } from '@/components/marketing/cta-buttons';
import { PageHero } from '@/components/marketing/page-hero';
import { TrustBar } from '@/components/marketing/trust-bar';
import { ServiceCard } from '@/components/marketing/service-card';
import { areasGenerales } from '@/data/areas-juridicas';
import { areaHref, breadcrumbsSchema, itemListSchema, serviceSchema } from '@/lib/schemas/legal-page';
import type { PlaceholderTone } from '@/components/marketing/placeholder-photo';
import { ConsultationCTA } from '@/components/marketing/consultation-cta';

export const metadata: Metadata = {
  title: 'Servicios Jurídicos',
  description: `Conozca las 13 especialidades de ${site.name}: derecho penal, de familia, laboral, civil, mercantil, bancario, administrativo, aduanero, sanitario, extranjería, propiedad intelectual, tributario, ambiental, conciliación y arbitraje en Nacaome, Valle, Honduras.`,
  alternates: { canonical: '/servicios-juridicos' },
  openGraph: {
    title: `Servicios Jurídicos — ${site.name}`,
    description: `Conozca las 13 especialidades de ${site.name}: cobertura legal integral en Nacaome, Valle, Honduras.`,
    url: `${site.url}/servicios-juridicos`,
    siteName: site.name,
    locale: 'es_HN',
    type: 'website',
    images: [{ url: `${site.url}/og-image.png`, width: 1200, height: 630, alt: `${site.name} — Servicios Jurídicos` }],
  },
};

export default function AreasJuridicasPage() {
  const url = absoluteUrl('/servicios-juridicos');
  const breadcrumbs = breadcrumbsSchema([{ name: 'Inicio', url: absoluteUrl('/') }, { name: 'Servicios Jurídicos', url }]);
  const itemList = itemListSchema('Servicios Jurídicos', areasGenerales.map((a) => ({ name: a.titulo, url: areaHref(a.slug) })));
  const servSchema = serviceSchema({
    slug: 'servicios-juridicos',
    name: 'Servicios Jurídicos — Pineda y Asociados',
    description: 'Bufete multidisciplinario con 13 especialidades en Nacaome, Valle, Honduras.',
    serviceType: 'LegalService',
    keywords: site.keywords,
    url,
  });

  return (
    <>
      <PageHero
        eyebrow="Servicios Jurídicos"
        badge="Cobertura integral"
        title="Todos los servicios jurídicos que su caso necesita, bajo una misma dirección letrada"
        subtitle={
          <>
            Desde Nacaome, Valle, ofrecemos cobertura legal integral en {areasGenerales.length}{' '}
            disciplinas del derecho hondureño. La defensa penal es nuestra especialidad destacada
            y la acompañamos con servicios especializados en familia, laboral, civil, mercantil,
            tributario y más.
          </>
        }
        cta={<CTAGroup variant="inverse" />}
      />

      <TrustBar background="light" />

      <Section background="muted" spacing="md">
        <SectionHeader
          eyebrow="Servicios Jurídicos"
          title="Cobertura legal completa en Honduras"
          subtitle="Seleccione el área que necesita y acceda a información detallada sobre nuestros servicios, subservicios y preguntas frecuentes."
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {areasGenerales.map((area) => (
            <ServiceCard
              key={area.slug}
              href={areaHref(area.slug)}
              slug={area.slug}
              title={area.titulo}
              description={area.resumen}
              category="services"
              tone={area.color as PlaceholderTone}
            />
          ))}
        </div>
      </Section>

      <ConsultationCTA />
    </>
  );
}
