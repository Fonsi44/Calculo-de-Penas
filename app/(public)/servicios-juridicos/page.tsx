import type { Metadata } from 'next';
import Link from 'next/link';

import { site } from '@/lib/site';
import { Section, SectionHeader, Container } from '@/components/marketing/section';
import { CTAGroup } from '@/components/marketing/cta-buttons';
import { PageHero } from '@/components/marketing/page-hero';
import { TrustBar } from '@/components/marketing/trust-bar';
import { ServiceCard } from '@/components/marketing/service-card';
import { ConsultationCTA } from '@/components/marketing/consultation-cta';
import { getAreasFromDb } from '@/lib/areas-db';
import { webpageSchema } from '@/lib/seo-schema';
import { Breadcrumbs } from '@/components/marketing/breadcrumbs';

export const metadata: Metadata = {
  title: `Servicios Jurídicos en ${site.address.city}, ${site.address.department} | Ramas principales del derecho`,
  description: `Cobertura legal integral en Nacaome, Valle, Honduras: derecho penal, de familia, laboral, civil, mercantil, tributario, bancario, administrativo y más. ${site.name}, bufete multidisciplinar.`,
  alternates: { canonical: '/servicios-juridicos' },
  keywords: ['servicios jurídicos Honduras', 'áreas legales Nacaome', 'ramas del derecho Honduras', 'derecho familia Honduras', 'derecho laboral Valle', 'derecho mercantil Honduras', 'derecho civil Nacaome', 'cobertura legal integral'],
  twitter: {
    card: 'summary_large_image',
    title: `Servicios Jurídicos en ${site.address.city}, Valle — Ramas principales del derecho`,
    description: `Cobertura legal integral en Nacaome, Valle: penal, familia, laboral, civil, mercantil, tributario, bancario y más. ${site.name}.`,
    images: [`${site.url}/og-image.png`],
  },
  openGraph: {
    title: `Servicios Jurídicos en ${site.address.city}, Valle — Ramas principales del derecho | ${site.name}`,
    description: `Cobertura legal integral en Nacaome, Valle, Honduras: las ramas principales del derecho bajo un mismo bufete.`,
    url: `${site.url}/servicios-juridicos`,
    siteName: site.name,
    locale: 'es_HN',
    type: 'website',
    images: [{ url: `${site.url}/og/civil.webp`, width: 1200, height: 630, alt: `${site.name} — Servicios Jurídicos` }],
  },
};

export default async function AreasJuridicasPage() {
  const areas = await getAreasFromDb('servicio');

  return (
    <>
      <Breadcrumbs items={[
        { label: 'Inicio', href: '/' },
        { label: 'Servicios Jurídicos' },
      ]} />
      <PageHero
        eyebrow="Servicios Jurídicos"
        badge="Cobertura integral"
        title={`Servicios Jurídicos en ${site.address.city}, ${site.address.department} — Ramas principales del derecho`}
        subtitle={
          <>
            Desde Nacaome, Valle, ofrecemos cobertura legal integral en las principales ramas
            del derecho hondureño. La defensa penal es nuestra especialidad destacada y la
            acompañamos con servicios especializados en familia, laboral, civil, mercantil,
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
              href={`/servicios-juridicos/${area.slug}`}
              slug={area.slug}
              title={area.titulo}
              description={area.descripcionCorta}
              category="services"
              tone="primary"
            />
          ))}
        </div>
      </Section>

      <Section spacing="sm">
        <Container size="md">
          <div className="text-center">
            <p className="text-sm text-text-secondary leading-relaxed">
              Defensa penal técnica y confidencial en{' '}
              <Link href="/derecho-penal" className="font-semibold text-primary hover:text-accent-dark transition-colors">derecho penal</Link>
              {' · '}Conozca{' '}
              <Link href="/despacho" className="font-semibold text-primary hover:text-accent-dark transition-colors">nuestro despacho</Link>
              {' · '}Resuelva dudas en{' '}
              <Link href="/preguntas-frecuentes" className="font-semibold text-primary hover:text-accent-dark transition-colors">preguntas frecuentes</Link>
              {' · '}
              <Link href="/blog" className="font-semibold text-primary hover:text-accent-dark transition-colors">blog jurídico</Link>
            </p>
          </div>
        </Container>
      </Section>

      <ConsultationCTA />

      <script type="application/ld+json" dangerouslySetInnerHTML={{
        __html: JSON.stringify(
          webpageSchema(
            'Servicios Jurídicos en Nacaome, Valle | Ramas principales del derecho',
            'Cobertura legal integral en las principales ramas del derecho en Nacaome, Valle, Honduras.',
            '/servicios-juridicos'
          ),
        ),
      }} />
    </>
  );
}
