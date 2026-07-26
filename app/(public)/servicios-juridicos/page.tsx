import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, BookOpen } from 'lucide-react';

import { site, absoluteUrl } from '@/lib/site';
import { buildMetadata } from '@/lib/seo';
import { Section, SectionHeader, Container } from '@/components/marketing/section';
import { CTAGroup } from '@/components/marketing/cta-buttons';
import { PageHero } from '@/components/marketing/page-hero';
import { TrustBar } from '@/components/marketing/trust-bar';
import { AnswerBlock } from '@/components/marketing/answer-block';
import { ServiceCard } from '@/components/marketing/service-card';
import { Reveal } from '@/components/marketing/reveal';
import { ConsultationCTA } from '@/components/marketing/consultation-cta';
import { BlogHighlights } from '@/components/marketing/blog-highlights';
import { getAreasUnified } from '@/lib/areas-unified';
import { webpageSchema } from '@/lib/seo-schema';
import { Breadcrumbs } from '@/components/marketing/breadcrumbs';
import { getPageContent } from '@/lib/page-content-db';
import { ServiceSearch } from '@/components/blog/service-search';
import { TOP_ORGANIC_GUIDE_SLUGS } from '@/data/seo/high-intent-guides';
import { RelatedCities } from '@/components/marketing/related-links';
import { HubFaq } from '@/components/marketing/hub-faq';
import { FAQ_SERVICIOS_JURIDICOS } from '@/data/faqs-hubs';
import { hubPenal } from '@/data/areas-juridicas';

export const metadata: Metadata = buildMetadata({
  // 48 chars. Antes 69 (se truncaba en SERP). Mantiene intención local.
  title: `Servicios Jurídicos en ${site.address.city} | 14 Áreas`,
  // 153 chars.
  description: `Servicios legales en ${site.address.city} y sur de Honduras: penal, familia, laboral, civil, mercantil y tributario. Presupuesto por escrito. WhatsApp ${site.whatsappDisplay}.`,
  canonicalPath: '/servicios-juridicos',
  keywords: ['abogados Nacaome', 'abogado Valle Honduras', 'áreas del derecho Nacaome', 'derecho familia Valle', 'derecho laboral Nacaome', 'derecho mercantil Valle', 'derecho civil Choluteca', 'bufete jurídico Nacaome'],
  ogImage: '/og/civil.webp',
  ogImageAlt: `${site.name} - Servicios Jurídicos`,
});

export default async function AreasJuridicasPage() {
  const generalAreas = await getAreasUnified('servicio');
  const areas = [
    {
      slug: hubPenal.slug,
      titulo: hubPenal.titulo,
      descripcionCorta: hubPenal.resumen,
      descripcionLarga: hubPenal.descripcion,
      icono: 'gavel',
      categoria: 'servicio' as const,
      fuente: 'ts' as const,
    },
    ...generalAreas,
  ];
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
        bgImage="/images/servicios/servicios-bg.webp"
      />

      <div className="bg-background py-6 md:py-8">
        <div className="mx-auto px-4 sm:px-6 max-w-7xl">
          <ServiceSearch
            items={areas.map((a) => ({
              href: a.slug === 'derecho-penal' ? '/derecho-penal' : `/servicios-juridicos/${a.slug}`,
              title: a.titulo,
              description: a.descripcionCorta || '',
            }))}
            placeholder='Buscar servicio jurídico: "divorcio", "despido", "contrato"...'
            domain="servicios-juridicos"
          />
        </div>
      </div>

      <TrustBar background="light" />

      {/* BLOQUE EDITORIAL CANÓNICO — respuesta directa + intro unificada.
          Un solo bloque, un solo formato. Antes había dos secciones
          consecutivas (AnswerBlock en muted + prose-editorial en warm) que
          decían lo mismo con tipografías distintas. Ahora es un único
          AnswerBlock con la respuesta directa y un enlace contextual. */}
      <Section background="warm" spacing="md">
        <Container size="lg">
          <AnswerBlock
            eyebrow="Catálogo de servicios"
            question="¿Qué áreas del derecho atiende Pineda y Asociados?"
            answer={`${site.name} atiende 14 áreas del derecho en Nacaome y la zona sur de Honduras: defensa penal (pilar histórico del bufete), familia, laboral, civil y notarial, mercantil y empresarial, administrativo, bancario, aduanero, tributario, migratorio, propiedad intelectual, ambiental y conciliación. Cada caso lo dirige el abogado especialista de la rama correspondiente; el cliente tiene un único punto de contacto y, cuando un asunto cruza varias ramas, el equipo coordina internamente.`}
          >
            <p className="text-sm text-text-secondary leading-relaxed text-pretty">
              Seleccione debajo el área que corresponde a su situación. Si su caso combina varias
              ramas, el equipo coordina internamente para que usted no tenga que gestionar varios
              despachos.
            </p>
          </AnswerBlock>
        </Container>
      </Section>

      <Section background="muted" spacing="md">
        <SectionHeader
          eyebrow="Servicios Jurídicos"
          title={contentMap['content.section_title'] || 'Cobertura legal completa en la zona sur de Honduras'}
          subtitle={contentMap['content.section_subtitle'] || 'Seleccione el área que necesita y acceda a información detallada sobre nuestros servicios, subservicios y preguntas frecuentes.'}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {areas.map((area, index) => {
            const isPriority = ['derecho-penal', 'derecho-de-familia', 'derecho-laboral', 'derecho-civil-y-notarial'].includes(area.slug);
            return (
              <Reveal key={area.slug} delay={([1, 2, 3, 4] as const)[index % 4]} className="h-full">
                <ServiceCard
                  href={area.slug === 'derecho-penal' ? '/derecho-penal' : `/servicios-juridicos/${area.slug}`}
                  slug={area.slug}
                  title={area.titulo}
                  description={area.descripcionCorta}
                  category="services"
                  tone={isPriority ? 'primary' : 'administrativo'}
                  className="h-full"
                />
              </Reveal>
            );
          })}
        </div>
      </Section>

      {/* CLUSTER GEOGRÁFICO (Jul 2026): el hub de servicios conecta con las
          10 ciudades prioritarias (R18). Distribuye autoridad hacia las
          landings locales desde el segundo nivel de la arquitectura. */}
      <Section spacing="sm">
        <Container size="lg">
          <div className="max-w-4xl">
            <RelatedCities limit={6} eyebrow="Atendemos en el sur de Honduras" />
          </div>
        </Container>
      </Section>

      {/* GUIAS DESTACADAS + GUÍA LEGAL — enlazado interno servicios→blog.
          layout='list' (Fase 2.2) para diferenciarse de los grids de
          ServiceCard anteriores y dar respiración. La guía pilar se integra
          como enlace contextual tras la lista. */}
      <BlogHighlights
        layout="list"
        slugs={[
          TOP_ORGANIC_GUIDE_SLUGS[2],
          TOP_ORGANIC_GUIDE_SLUGS[3],
          'jornada-laboral-horas-extra-descansos-honduras',
          'pension-alimenticia-honduras-guia-completa',
          'prescripcion-deudas-plazos-honduras',
        ]}
        eyebrow="Artículos relacionados"
        title="Guías de nuestras áreas de práctica"
        subtitle="Recursos con demanda orgánica real sobre familia, notarial, mercantil y conflictos civiles que suelen preceder una consulta jurídica."
        ctaLabel="Explorar todas las guías del blog"
        ctaHref="/blog"
      />

      {/* ConsultationCTA con enlace contextual a la guía pilar (Fase 5).
          Antes la guía "Cómo contratar abogado" era una tarjeta suelta en un
          grid de 3 columnas (con 2 huecos vacíos), colgada entre
          BlogHighlights y este CTA. Estéticamente rompía el ritmo. Ahora vive
          como enlace contextual en el pie del CTA, donde encaja temáticamente:
          un usuario evaluando contratar necesita "cómo contratar abogado". */}
      <ConsultationCTA
        variant="closing"
        subtitle={`Evaluamos su situación con rigor técnico y le explicamos con claridad las opciones legales disponibles. Atendemos en Nacaome, San Lorenzo, Amapala, Langue, Goascorán, Choluteca, Pespiré, San Marcos de Colón, Marcovia y El Triunfo. Presupuesto por escrito antes de cualquier actuación. ¿Primera vez contratando abogado? Consulte nuestra guía sobre cómo contratar abogado en Honduras.`}
      />

      <div className="text-center pb-2 -mt-4">
        <Link
          href="/guia-legal-abogados-honduras"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent-dark hover:text-primary transition-colors"
        >
          <BookOpen size={14} aria-hidden="true" />
          Guía: cómo contratar abogado en Honduras <ArrowRight size={14} />
        </Link>
      </div>

      <HubFaq
        faqs={FAQ_SERVICIOS_JURIDICOS}
        url={absoluteUrl('/servicios-juridicos')}
        eyebrow="Resolvemos sus dudas"
        title="Preguntas frecuentes sobre nuestros servicios jurídicos"
      />

      <script type="application/ld+json" dangerouslySetInnerHTML={{
        __html: JSON.stringify(
          webpageSchema(
            'Servicios Jurídicos en Nacaome, Valle | Ramas principales del derecho',
            'Cobertura legal integral en las principales ramas del derecho en Nacaome, Valle, Honduras.',
            '/servicios-juridicos'
          ),
        ),
      }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          name: 'Áreas del derecho en Nacaome, Valle',
          url: absoluteUrl('/servicios-juridicos'),
          itemListElement: areas.map((area, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            name: area.titulo,
            url: absoluteUrl(area.slug === 'derecho-penal' ? '/derecho-penal' : `/servicios-juridicos/${area.slug}`),
          })),
        }),
      }} />
    </>
  );
}
