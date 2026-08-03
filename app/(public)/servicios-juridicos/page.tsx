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
import { webpageSchema } from '@/lib/seo-schema';
import { Breadcrumbs } from '@/components/marketing/breadcrumbs';
import { getPageContent } from '@/lib/page-content-db';
import { ServiceSearch } from '@/components/blog/service-search';
import { TOP_ORGANIC_GUIDE_SLUGS } from '@/data/seo/high-intent-guides';
import { RelatedCities } from '@/components/marketing/related-links';
import { HubFaq } from '@/components/marketing/hub-faq';
import { FAQ_SERVICIOS_JURIDICOS } from '@/data/faqs-hubs';
import { PUBLIC_SERVICE_CATALOG } from '@/lib/public-service-catalog';

const CTA_BY_AREA: Record<string, string> = {
  'derecho-penal': 'Ver servicios de defensa penal',
  'derecho-de-familia': 'Consultar asuntos de familia',
  'derecho-laboral': 'Revisar un conflicto laboral',
  'derecho-civil-y-notarial': 'Revisar contrato, propiedad o herencia',
  'derecho-mercantil-empresarial': 'Solicitar revisión mercantil',
  'derecho-administrativo-y-servicio-civil': 'Consultar un procedimiento administrativo',
};

function cardSummary(value: string): string {
  const plain = value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  const words = plain.split(' ');
  if (words.length >= 35) return `${words.slice(0, 42).join(' ')}${words.length > 42 ? '…' : ''}`;
  return `${plain} Le orientamos sobre actuaciones, documentación y siguientes pasos desde nuestra sede en Nacaome, con alcance y presupuesto por escrito.`;
}

export const metadata: Metadata = buildMetadata({
  // 47 chars. Plan maestro §7.1: "Servicios Jurídicos en Nacaome | Áreas de Práctica"
  title: `Servicios Jurídicos en ${site.address.city} | Áreas de Práctica`,
  // 157 chars. Plan §7.1
  description: `Defensa penal y asesoría en familia, laboral, civil, notarial, mercantil y administrativo. Identifique el área adecuada y consulte con un abogado colegiado.`,
  canonicalPath: '/servicios-juridicos',
  keywords: ['abogados Nacaome', 'abogado Valle Honduras', 'áreas del derecho Nacaome', 'derecho familia Valle', 'derecho laboral Nacaome', 'derecho mercantil Valle', 'derecho civil Choluteca', 'bufete jurídico Nacaome'],
  ogImage: '/og/civil.webp',
  ogImageAlt: `${site.name} - Servicios Jurídicos`,
});

export default async function AreasJuridicasPage() {
  const areas = PUBLIC_SERVICE_CATALOG;
  const contentMap = await getPageContent('servicios-juridicos');

  return (
    <>
      <Breadcrumbs items={[
        { label: 'Inicio', href: '/' },
        { label: 'Servicios Jurídicos' },
      ]} />
      <PageHero
        eyebrow={contentMap['hero.eyebrow'] || 'Servicios Jurídicos'}
        badge={contentMap['hero.badge'] || 'Catálogo de áreas'}
        title={contentMap['hero.title'] || `Servicios jurídicos para personas, familias y empresas`}
        subtitle={contentMap['hero.subtitle'] || 'Desde Nacaome, Valle, prestamos atención en las áreas publicadas en este catálogo. La defensa penal es el pilar histórico del bufete y cada consulta se asigna según su materia y circunstancias.'}
        cta={<CTAGroup variant="inverse" />}
        bgImage="/images/servicios/servicios-bg.webp"
      />

      <div className="bg-background py-6 md:py-8">
        <div className="mx-auto px-4 sm:px-6 max-w-7xl">
          <ServiceSearch
            items={areas.map((a) => ({
              href: a.href,
              title: a.name,
              description: a.shortDescription,
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
            answer={`${site.name} presenta actualmente ${areas.length} áreas de práctica del bufete. Cada consulta se revisa inicialmente para identificar el área aplicable y la asignación profesional adecuada. Cuando un asunto combina varias materias, el equipo puede coordinar su análisis internamente.`}
          >
            <p className="text-sm text-text-secondary leading-relaxed text-pretty">
              El bufete publica información y presta atención en las áreas jurídicas incluidas
              en este catálogo. La asignación depende de la materia y de las características
              concretas del asunto.
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
                  href={area.href}
                  slug={area.slug}
                  title={area.name}
                  description={cardSummary(area.shortDescription)}
                  category="services"
                  tone={isPriority ? 'primary' : 'administrativo'}
                  responsible={area.individualResponsible}
                  ctaLabel={CTA_BY_AREA[area.slug] ?? `Consultar servicios de ${area.name.toLowerCase()}`}
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
            name: area.name,
            url: absoluteUrl(area.href),
          })),
        }),
      }} />
    </>
  );
}
