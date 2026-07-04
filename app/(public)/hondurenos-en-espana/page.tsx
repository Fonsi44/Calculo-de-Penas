import type { Metadata } from 'next';
import { site, absoluteUrl } from '@/lib/site';
import { buildMetadata } from '@/lib/seo';
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

export const metadata: Metadata = buildMetadata({
  // 54 chars.
  title: 'Hondureños en España · Asistencia Legal desde Honduras',
  // 156 chars. Antes 172.
  description: 'Asistencia legal para hondureños en España: gestión documental, actos notariales, divorcios, custodias y sucesiones entre Honduras y España.',
  canonicalPath: '/hondurenos-en-espana',
  keywords: ['hondureños en España', 'asistencia legal migrantes', 'poder notarial desde España', 'divorcio internacional Honduras', 'herencias transfronterizas', 'reagrupación familiar Honduras España', 'nacionalidad española hondureños'],
  ogImage: '/og/migracion.webp',
  ogImageAlt: `${site.name} - Hondureños en España`,
});

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

      {/* SECCIÓN EDITITORIAL — contenido textual para SEO/GEO.
          Cubre entidades clave (apostilla, poder notarial a distancia,
          homologación de sentencia, herencias transfronterizas) sin inventar
          datos legales. Mejora E-E-A-T y da contexto a usuarios que no conocen
          el despacho en persona. */}
      <Section spacing="md">
        <div className="prose prose-sm sm:prose-base max-w-3xl mx-auto text-text-secondary leading-relaxed">
          <h2 className="font-serif font-bold text-2xl text-text mb-4">
            Abogados en Honduras para hondureños residentes en España
          </h2>
          <p className="mb-4">
            Vivir en España no le impide resolver asuntos jurídicos en Honduras. Desde la constitución de
            un poder notarial a distancia hasta la gestión de una herencia con bienes en ambos países,
            la mayoría de trámites pueden iniciarse sin necesidad de viaje, siempre que se cuente con la
            documentación adecuada y la asesoría de un abogado hondureño colegiado.
          </p>
          <h3 className="font-serif font-semibold text-lg text-text mt-6 mb-2">Trámites más frecuentes</h3>
          <ul className="space-y-2 mb-4 list-disc pl-5">
            <li>
              <strong>Apostilla de La Haya</strong> para documentos emitidos en España que deban surtir
              efecto en Honduras (sentencias, actas de nacimiento, poderes).
            </li>
            <li>
              <strong>Poder notarial a distancia</strong>: autorizar a un abogado en Honduras para que
              le represente en juicios, compraventas, divorcios o gestiones registrales.
            </li>
            <li>
              <strong>Homologación de sentencias españolas</strong> en Honduras: divorcios, custodias y
              resoluciones patrimoniales que requieren reconocimiento judicial para ser ejecutables.
            </li>
            <li>
              <strong>Herencias transfronterizas</strong> con bienes en Honduras y España: declaración
              de herederos, partición y liquidación de sociedad conyugal.
            </li>
          </ul>
          <h3 className="font-serif font-semibold text-lg text-text mt-6 mb-2">Cómo trabajamos a distancia</h3>
          <p className="mb-4">
            La primera consulta puede realizarse por videollamada o WhatsApp. Una vez definida la
            estrategia, le indicamos los documentos necesarios y el procedimiento para otorgar poder
            desde el Consulado de Honduras en España o ante notario español con posterior apostilla.
            Mantendremos informado al cliente de cada paso, con presupuesto por escrito y plazos
            realistas según la carga judicial hondureña.
          </p>
          <p className="text-sm text-text-muted">
            Esta información es orientativa y no constituye asesoría legal específica. Cada caso requiere
            evaluación particular; los plazos y requisitos pueden variar según el tipo de trámite y la
            autoridad competente.
          </p>
        </div>
      </Section>

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
