import type { Metadata } from 'next';
import Link from 'next/link';

import { site } from '@/lib/site';
import { Section, SectionHeader, Container } from '@/components/marketing/section';
import { CTAGroup } from '@/components/marketing/cta-buttons';
import { PageHero } from '@/components/marketing/page-hero';
import { TrustBar } from '@/components/marketing/trust-bar';
import { ServiceCard } from '@/components/marketing/service-card';
import { ConsultationCTA } from '@/components/marketing/consultation-cta';
import { BlogHighlights } from '@/components/marketing/blog-highlights';
import { getAreasFromDb } from '@/lib/areas-db';
import { webpageSchema } from '@/lib/seo-schema';
import { Breadcrumbs } from '@/components/marketing/breadcrumbs';
import { getPageContent } from '@/lib/page-content-db';
import { ServiceSearch } from '@/components/blog/service-search';

export const metadata: Metadata = {
  // Absolute para controlar la longitud total y evitar que el template del
  // layout añada "| Pineda y Asociados" (la marca ya va incluida). Antes el
  // title resuelto medía 77 caracteres (>65): se truncaba en SERP.
  title: { absolute: `Abogados en ${site.address.city} — Todas las Áreas del Derecho` },
  description: `Abogados en Nacaome, Valle para derecho penal, familia, laboral, civil, mercantil y tributario. Cobertura en San Lorenzo y Choluteca. Primera consulta por WhatsApp ${site.whatsappDisplay}.`,
  alternates: { canonical: '/servicios-juridicos' },
  keywords: ['abogados Nacaome', 'abogado Valle Honduras', 'áreas del derecho Nacaome', 'derecho familia Valle', 'derecho laboral Nacaome', 'derecho mercantil Valle', 'derecho civil Choluteca', 'bufete jurídico Nacaome'],
  twitter: {
    card: 'summary_large_image',
    title: `Abogados en ${site.address.city} — Todas las Áreas del Derecho`,
    description: `Abogados en Nacaome, Valle: penal, familia, laboral, civil, mercantil y tributario. Cobertura San Lorenzo y Choluteca.`,
    images: [`${site.url}/og-image.png`],
  },
  openGraph: {
    title: `Abogados en ${site.address.city}, ${site.address.department} — Todas las Áreas del Derecho`,
    description: `Abogados en Nacaome, Valle, Honduras. Penal, familia, laboral, civil, mercantil y tributario bajo un mismo bufete. Cobertura en la zona sur.`,
    url: `${site.url}/servicios-juridicos`,
    siteName: site.name,
    locale: 'es_HN',
    type: 'website',
    images: [{ url: `${site.url}/og/civil.webp`, width: 1200, height: 630, alt: `${site.name} — Servicios Jurídicos` }],
  },
};

export default async function AreasJuridicasPage() {
  const areas = await getAreasFromDb('servicio');
  const contentMap = await getPageContent('servicios-juridicos');

  return (
    <>
      <Breadcrumbs items={[
        { label: 'Inicio', href: '/' },
        { label: 'Servicios Jurídicos' },
      ]} />
      <PageHero
        eyebrow={contentMap['hero.eyebrow'] || 'Servicios Jurídicos'}
        badge={contentMap['hero.badge'] || 'Cobertura integral'}
        title={contentMap['hero.title'] || `Servicios Jurídicos en ${site.address.city}, ${site.address.department} — Ramas principales del derecho`}
        subtitle={contentMap['hero.subtitle'] || 'Desde Nacaome, Valle, ofrecemos cobertura legal integral en las principales ramas del derecho hondureño. La defensa penal es nuestra especialidad destacada y la acompañamos con servicios especializados en familia, laboral, civil, mercantil, tributario y más.'}
        cta={<CTAGroup variant="inverse" />}
      />

      <div className="bg-background py-6 md:py-8">
        <div className="mx-auto px-4 sm:px-6 max-w-7xl">
          <ServiceSearch
            items={areas.map((a) => ({
              href: `/servicios-juridicos/${a.slug}`,
              title: a.titulo,
              description: a.descripcionCorta || '',
            }))}
            placeholder='Buscar servicio jurídico: "divorcio", "despido", "contrato"...'
            domain="servicios-juridicos"
          />
        </div>
      </div>

      <TrustBar background="light" />

      <Section background="muted" spacing="md">
        <SectionHeader
          eyebrow="Servicios Jurídicos"
          title={contentMap['content.section_title'] || 'Cobertura legal completa en la zona sur de Honduras'}
          subtitle={contentMap['content.section_subtitle'] || 'Seleccione el área que necesita y acceda a información detallada sobre nuestros servicios, subservicios y preguntas frecuentes.'}
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
        <Container size="lg">
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

      {/* GUIAS DESTACADAS — enlazado interno servicios→blog.
          Cubre categorías no penales (laboral, civil, mercantil, familiar) para
          reforzar el crawl path hacia posts que no reciben enlaces desde /derecho-penal. */}
      <BlogHighlights
        slugs={[
          'jornada-laboral-horas-extra-descansos-honduras',
          'calcular-prestaciones-laborales-honduras',
          'testamentos-sucesiones-herencia-honduras',
          'compraventa-inmuebles-aspectos-legales-honduras',
          'contratos-mercantiles-esenciales-empresas-honduras',
          'poder-legal-honduras-cuando-se-necesita',
        ]}
        eyebrow="Artículos relacionados"
        title="Guías de nuestras áreas de práctica"
        subtitle="Recursos prácticos sobre derecho laboral, civil, mercantil y notarial escritos por nuestro equipo."
        ctaLabel="Explorar todas las guías del blog"
        ctaHref="/blog"
      />

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
