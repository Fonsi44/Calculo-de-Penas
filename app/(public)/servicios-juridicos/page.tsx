import type { Metadata } from 'next';
import { site, absoluteUrl } from '@/lib/site';
import { Section, SectionHeader } from '@/components/marketing/section';
import { PageHero } from '@/components/marketing/page-hero';
import { TrustBar } from '@/components/marketing/trust-bar';
import { ContactStrip, CTAGroup } from '@/components/marketing/cta-buttons';
import { PremiumServiceGrid } from '@/components/marketing/premium-service-grid';
import { breadcrumbsSchema, itemListSchema } from '@/lib/schemas/legal-page';
import { premiumServices } from '@/lib/data/service-catalog';

export const metadata: Metadata = {
  title: `Servicios Jurídicos | ${site.name}`,
  description: `Las 13 áreas del derecho que manejamos en ${site.name}: penal, familia, laboral, civil, mercantil, tributario, bancario, administrativo, aduanero, sanitario, propiedad intelectual, ambiental, conciliación y arbitraje en Nacaome, Valle, Honduras.`,
  alternates: { canonical: '/servicios-juridicos' },
};

export default function ServiciosJuridicosPage() {
  const url = absoluteUrl('/servicios-juridicos');
  const breadcrumbs = breadcrumbsSchema([
    { name: 'Inicio', url: absoluteUrl('/') },
    { name: 'Servicios Jurídicos', url },
  ]);
  const itemList = itemListSchema(
    'Servicios jurídicos',
    premiumServices.map((s) => ({
      name: s.titulo,
      url: absoluteUrl(`/servicios-juridicos/${s.slug}`),
    })),
  );

  return (
    <>
      <PageHero
        eyebrow="Servicios Jurídicos"
        badge="Cobertura integral"
        title="13 áreas del derecho para defender y asesorarle en cualquier frente"
        subtitle={
          <>
            Desde Nacaome, Valle, ofrecemos cobertura legal integral en {premiumServices.length}{' '}
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
          eyebrow="Áreas de práctica"
          title="Cobertura legal completa en Honduras"
          subtitle="Seleccione el área que necesita y acceda a información detallada sobre nuestros servicios, subservicios y preguntas frecuentes."
        />
        <PremiumServiceGrid />
      </Section>

      <Section spacing="sm">
        <ContactStrip />
      </Section>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemList) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }} />
    </>
  );
}
