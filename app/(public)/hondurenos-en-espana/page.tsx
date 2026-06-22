import type { Metadata } from 'next';
import { site, absoluteUrl } from '@/lib/site';
import { Section, SectionHeader } from '@/components/marketing/section';
import { Card } from '@/components/ui/card';
import { CTAGroup } from '@/components/marketing/cta-buttons';
import { PageHero } from '@/components/marketing/page-hero';
import { TrustBar } from '@/components/marketing/trust-bar';
import { ServiceCard } from '@/components/marketing/service-card';
import { hubMigrantes } from '@/data/areas-juridicas';
import { migrantesHubHref, areaSchemas } from '@/lib/schemas/legal-page';
import { ConsultationCTA } from '@/components/marketing/consultation-cta';
import { LeadMagnetCTA } from '@/components/marketing/lead-magnet-cta';
import { getLeadMagnetByArea } from '@/lib/lead-magnets';
import { getAreasFromDb } from '@/lib/areas-db';
import { Breadcrumbs } from '@/components/marketing/breadcrumbs';
import { getPageContent } from '@/lib/page-content-db';
import { BlogHighlights } from '@/components/marketing/blog-highlights';

export const metadata: Metadata = {
  // Absolute para evitar que el template añada la marca dos veces
  title: { absolute: 'Hondureños en España — Asistencia Legal desde Honduras' },
  description: 'Asistencia legal para hondureños en España: gestión documental, actos notariales, divorcios, custodias y sucesiones entre Honduras y España. Pineda y Asociados.',
  alternates: { canonical: '/hondurenos-en-espana' },
  keywords: ['hondureños en España', 'asistencia legal migrantes', 'poder notarial desde España', 'divorcio internacional Honduras', 'herencias transfronterizas', 'reagrupación familiar Honduras España', 'nacionalidad española hondureños'],
    twitter: {
      card: 'summary_large_image',
      title: 'Hondureños en España — Asistencia Legal Internacional',
      description: 'Gestión documental, actos notariales, divorcios, custodias y sucesiones entre Honduras y España. Asistencia legal para hondureños en el extranjero.',
    images: [`${site.url}/og/migracion.webp`],
  },
    openGraph: {
      title: 'Hondureños en España — Asistencia Legal Internacional',
      description: 'Asistencia legal para hondureños en España: gestión documental, actos notariales, divorcios, custodias y sucesiones entre Honduras y España.',
    url: `${site.url}/hondurenos-en-espana`,
    siteName: site.name,
    locale: 'es_HN',
    type: 'website',
    images: [{ url: `${site.url}/og/migracion.webp`, width: 1200, height: 630, alt: `${site.name} — Hondureños en España` }],
  },
};

export default async function MigrantesPage() {
  const url = migrantesHubHref();
  const migrantesSubareas = await getAreasFromDb('migrante');
  const contentMap = await getPageContent('hondurenos-en-espana');
  const ldSchemas = areaSchemas({
    service: {
      slug: 'hondurenos-en-espana',
      name: 'Hondureños en España — Pineda y Asociados',
      description: hubMigrantes.descripcion,
      // serviceType = categoría textual del servicio (antes 'LegalService',
      // que es el @type del provider, no del servicio).
      serviceType: 'Asistencia Legal a Hondureños en España',
      keywords: hubMigrantes.keywords,
      url,
    },
    faqs: hubMigrantes.faqs,
    breadcrumbs: [
      { name: 'Inicio', url: absoluteUrl('/') },
      { name: 'Hondureños en España', url },
    ],
    url,
  });

  return (
    <>
      <Breadcrumbs items={[
        { label: 'Inicio', href: '/' },
        { label: 'Hondureños en España' },
      ]} />
      <PageHero
        eyebrow={contentMap['hero.eyebrow'] || hubMigrantes.heroEyebrow}
        badge={contentMap['hero.badge'] || 'Asistencia transnacional'}
        title={contentMap['hero.title'] || hubMigrantes.heroTitle}
        subtitle={contentMap['hero.subtitle'] || hubMigrantes.heroSubtitle}
        cta={<CTAGroup variant="inverse" />}
        bgImage="/images/hondurenos-en-espana/jorono-international-2693200.webp"
      />

      <TrustBar background="light" />

      <Section background="muted" spacing="md">
        <SectionHeader
          eyebrow="Asistencia transnacional"
          title={contentMap['content.section_title'] || hubMigrantes.titulo}
          subtitle={contentMap['content.section_subtitle'] || hubMigrantes.resumen}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {migrantesSubareas.map((sub) => (
            <ServiceCard
              key={sub.slug}
              href={`/hondurenos-en-espana/${sub.slug}`}
              slug={sub.slug}
              title={sub.titulo}
              description={sub.descripcionCorta}
              category="services"
              tone="primary"
            />
          ))}
        </div>
      </Section>

      <Section spacing="md" id="preguntas-frecuentes">
        <SectionHeader
          eyebrow="Preguntas frecuentes"
          title="Dudas comunes sobre trámites entre Honduras y España"
          align="center"
        />
        <div className="max-w-3xl mx-auto space-y-3">
          {hubMigrantes.faqs.map((faq, i) => (
            <Card key={i} padding="md" className="border-l-4 border-l-accent">
              <h3 className="font-bold text-sm text-text leading-tight mb-1.5">
                {faq.pregunta}
              </h3>
              <p className="text-sm text-text-secondary leading-relaxed">
                {faq.respuesta}
              </p>
            </Card>
          ))}
        </div>
      </Section>

      {/* GUÍAS PARA HONDUREÑOS EN ESPAÑA — sección editorial única.
          Hub de guías del blog de la categoría hondurenos-en-espana.
          Unifica los antiguos bloques "Artículos relacionados" y "Guías
          destacadas" que duplicaban función. Slugs verificados contra DB. */}
      <BlogHighlights
        slugs={[
          'poder-desde-espana-para-tramites-honduras',
          'nacionalidad-espanola-para-hondurenos-residencia-plazos',
          'reagrupacion-familiar-hondurenos-espana',
          'arraigo-social-laboral-hondurenos-espana',
          'herencias-transfronterizas-bienes',
          'tributar-espana-bienes-guia',
        ]}
        eyebrow="Guías para hondureños en España"
        title="Guías para hondureños en España"
        subtitle="Recursos prácticos para hondureños que viven en España y necesitan resolver trámites migratorios, familiares, notariales o legales vinculados con Honduras."
        ctaLabel="Explorar todas las guías para hondureños en España"
        ctaHref="/blog/hondurenos-en-espana"
        spacing="sm"
      />

      {ldSchemas.map((schema, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      ))}

      <Section spacing="sm">
        {(() => {
          const magnet = getLeadMagnetByArea('hondurenos-en-espana');
          if (magnet) {
            return (
              <LeadMagnetCTA
                area={magnet.area}
                titulo={magnet.titulo}
                descripcion={magnet.descripcion}
              />
            );
          }
          return null;
        })()}
      </Section>

      <ConsultationCTA />
    </>
  );
}
