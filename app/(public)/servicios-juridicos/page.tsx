import type { Metadata } from 'next';

import { site } from '@/lib/site';
import { Section, SectionHeader } from '@/components/marketing/section';
import { CTAGroup } from '@/components/marketing/cta-buttons';
import { PageHero } from '@/components/marketing/page-hero';
import { TrustBar } from '@/components/marketing/trust-bar';
import { ServiceCard } from '@/components/marketing/service-card';
import { areaHref } from '@/lib/schemas/legal-page';
import { ConsultationCTA } from '@/components/marketing/consultation-cta';
import { getAreasFromDb } from '@/lib/areas-db';

export const metadata: Metadata = {
  title: `Servicios Jurídicos en ${site.address.city}, ${site.address.department} | 13 Especialidades`,
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

export default async function AreasJuridicasPage() {
  const areas = await getAreasFromDb('servicio');

  return (
    <>
      <PageHero
        eyebrow="Servicios Jurídicos"
        badge="Cobertura integral"
        title="Todos los servicios jurídicos que su caso necesita, bajo una misma dirección letrada"
        subtitle={
          <>
            Desde Nacaome, Valle, ofrecemos cobertura legal integral en {areas.length}{' '}
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
          {areas.map((area) => (
            <ServiceCard
              key={area.slug}
              href={areaHref(area.slug)}
              slug={area.slug}
              title={area.titulo}
              description={area.descripcionCorta}
              category="services"
              tone="primary"
            />
          ))}
        </div>
      </Section>

      <ConsultationCTA />
    </>
  );
}
