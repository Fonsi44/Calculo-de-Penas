import type { Metadata } from 'next';
import Link from 'next/link';
import { site, absoluteUrl } from '@/lib/site';
import { buildMetadata } from '@/lib/seo';
import { Section, SectionHeader, Container } from '@/components/marketing/section';
import { CTAGroup } from '@/components/marketing/cta-buttons';
import { PageHero } from '@/components/marketing/page-hero';
import { TrustBar } from '@/components/marketing/trust-bar';
import { AnswerBlock } from '@/components/marketing/answer-block';
import { ServiceCard } from '@/components/marketing/service-card';
import { HubFaq } from '@/components/marketing/hub-faq';
import { hubMigrantes } from '@/data/areas-juridicas';
import { migrantesHubHref, areaSchemas } from '@/lib/schemas/legal-page';
import { getAreasUnified } from '@/lib/areas-unified';
import { Breadcrumbs } from '@/components/marketing/breadcrumbs';
import { getPageContent } from '@/lib/page-content-db';
import { BlogHighlights } from '@/components/marketing/blog-highlights';
import { RelatedServices } from '@/components/marketing/related-links';
import { SpainJurisdictionNotice } from '@/components/marketing/spain-jurisdiction-notice';
import { CtaSpain } from '@/components/marketing/cta-spain';
import { Card } from '@/components/ui/card';

export const metadata: Metadata = buildMetadata({
  // 54 chars.
  title: 'Abogados en Honduras para Hondureños en España',
  // 156 chars. Antes 172.
  description: 'Servicios legales en Honduras para hondureños residentes en España: poderes, divorcios, trámites familiares, herencias y representación legal.',
  canonicalPath: '/hondurenos-en-espana',
  keywords: ['hondureños en España', 'asistencia legal migrantes', 'poder notarial desde España', 'divorcio internacional Honduras', 'herencias transfronterizas', 'reagrupación familiar Honduras España', 'nacionalidad española hondureños'],
  ogImage: '/og/migracion.webp',
  ogImageAlt: `${site.name} - Hondureños en España`,
});

export default async function MigrantesPage() {
  const url = migrantesHubHref();
  const migrantesSubareas = await getAreasUnified('migrante');
  const contentMap = await getPageContent('hondurenos-en-espana');
  // No se pasa `faqs` a areaSchemas: el bloque <HubFaq> inferior renderiza
  // hubMigrantes.faqs Y emite su propio JSON-LD FAQPage con @id #faqpage.
  // Pasarlas aquí también duplicaba ese @id (validación JSON-LD).
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

      {/* BLOQUE EDITORIAL CANÓNICO — respuesta directa + trámites.
          Modelo unificado: AnswerBlock (mismo formato que /servicios-juridicos,
          /despacho, /derecho-penal) con la respuesta directa primero y la lista
          de trámites + cómo trabajamos a distancia como children. Un solo
          bloque, un solo formato tipográfico. */}
      <Section background="warm" spacing="md">
        <Container size="lg">
          <AnswerBlock
            eyebrow="Asistencia legal transfronteriza"
            question="¿Puedo tramitar asuntos legales en Honduras residiendo en España?"
            answer="Sí. Como hondureño residente en España puede gestionar poderes notariales, divorcios, custodias, sucesiones y otros trámites en Honduras sin desplazarse, siempre que cuente con la documentación adecuada y la asesoría de un abogado hondureño colegiado. Trabajamos coordinando con notaría hondureña y, cuando es necesario, con notaría española para poderes apostillados. El proceso se inicia por WhatsApp o videollamada y el seguimiento es remoto."
          >
            <div className="prose-editorial mt-6">
              <h3 className="font-serif font-bold text-base text-primary">Trámites más frecuentes</h3>
              <ul>
                <li>
                  <strong><Link href="/servicios-juridicos/derecho-civil-y-notarial" className="text-primary hover:underline">Poder notarial desde España</Link></strong> para trámites en Honduras: autorizar a un abogado en Honduras para que
                  le represente en juicios, compraventas, divorcios o gestiones registrales.
                </li>
                <li>
                  <strong><Link href="/servicios-juridicos/derecho-de-familia" className="text-primary hover:underline">Divorcio en Honduras residiendo en España</Link></strong> y homologación de sentencias españolas: divorcios, custodias y
                  resoluciones patrimoniales que requieren reconocimiento judicial para ser ejecutables.
                </li>
                <li>
                  <strong><Link href="/servicios-juridicos/derecho-civil-y-notarial" className="text-primary hover:underline">Herencias, propiedades y representación legal</Link></strong> con bienes en Honduras y España: declaración
                  de herederos, partición y liquidación de sociedad conyugal.
                </li>
                <li>
                  <strong>Trámites familiares para hondureños en el extranjero</strong>: inscripciones de nacimiento, matrimonio, y <Link href="/solicitar-consulta" className="text-primary hover:underline">consulta legal remota con abogados en Honduras</Link>.
                </li>
              </ul>
              <h3 className="font-serif font-bold text-base text-primary">Cómo trabajamos a distancia</h3>
              <p>
                La primera consulta puede realizarse por videollamada o WhatsApp. Una vez definida la
                estrategia, le indicamos los documentos necesarios y el procedimiento para otorgar poder
                desde el Consulado de Honduras en España o ante notario español con posterior apostilla.
                Mantendremos informado al cliente de cada paso, con presupuesto por escrito y plazos
                realistas según la carga judicial hondureña.
              </p>
              <p className="text-xs text-text-muted">
                Esta información es orientativa y no constituye asesoría legal específica. Cada caso requiere
                evaluación particular; los plazos y requisitos pueden variar según el tipo de trámite y la
                autoridad competente.
              </p>
            </div>
          </AnswerBlock>
        </Container>
      </Section>

      {/* FASE 4 (§10/§11) — Aviso jurisdiccional visible y delimitación clara
          del alcance: derecho hondureño sí; España requiere profesional
          habilitado. Sin inventar colaboraciones. */}
      <SpainJurisdictionNotice />

      {/* FASE 4 (§11) — Alcance por jurisdicción. Bloque autosuficiente (GEO). */}
      <Section background="default" spacing="md">
        <Container size="lg">
          <SectionHeader
            eyebrow="Qué se puede hacer y desde dónde"
            title="Alcance del servicio entre Honduras y España"
            subtitle="Una guía clara sobre qué gestionamos en Honduras, qué se coordina desde España y qué requiere actuación en ese país."
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <Card padding="md" className="h-full border-l-4 border-l-success/50">
              <h3 className="font-bold text-sm text-primary leading-snug">Desde Honduras (derecho hondureño)</h3>
              <ul className="mt-2 space-y-1.5 text-sm text-text-secondary leading-relaxed list-disc pl-5">
                <li>Divorcios, custodia y pensión alimentaria ante juzgados hondureños.</li>
                <li>Sucesiones, herencias y partición de bienes ubicados en Honduras.</li>
                <li>Representación judicial y trámites notariales y registrales en Honduras.</li>
                <li>Constitución y representación de sociedades hondureñas.</li>
              </ul>
            </Card>
            <Card padding="md" className="h-full border-l-4 border-l-accent/50">
              <h3 className="font-bold text-sm text-primary leading-snug">Coordinable desde España</h3>
              <ul className="mt-2 space-y-1.5 text-sm text-text-secondary leading-relaxed list-disc pl-5">
                <li>Otorgamiento de poderes ante consulado o notario español con apostilla.</li>
                <li>Envío seguro de copias documentales para evaluación previa.</li>
                <li>Seguimiento remoto del caso y videollamadas con el despacho.</li>
                <li>Revisión del contenido de documentos antes de firmarlos.</li>
              </ul>
            </Card>
            <Card padding="md" className="h-full border-l-4 border-l-warning/60">
              <h3 className="font-bold text-sm text-primary leading-snug">Requiere actuación en España</h3>
              <ul className="mt-2 space-y-1.5 text-sm text-text-secondary leading-relaxed list-disc pl-5">
                <li>Procedimientos reservados a profesionales habilitados en España.</li>
                <li>Comparecencias personales ante autoridades españolas.</li>
                <li>Trámites de extranjería y nacionalidad española propios del interesado.</li>
              </ul>
              <p className="mt-2 text-xs text-text-muted leading-relaxed">
                En estos casos le orientamos sobre el alcance y le indicamos cuándo conviene
                contar con un profesional habilitado en España.
              </p>
            </Card>
          </div>
        </Container>
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

      <HubFaq
        faqs={hubMigrantes.faqs}
        url={absoluteUrl('/hondurenos-en-espana')}
        eyebrow="Preguntas frecuentes"
        title="Dudas comunes sobre trámites entre Honduras y España"
        id="preguntas-frecuentes"
      />

      {/* ÁREAS RELACIONADAS (Fase 3.5) — reconecta este hub al grafo del
          sitio. Antes /hondurenos-en-espana parecía una web paralela: solo
          enlazaba hacia sus propias subáreas y al blog. Ahora enlaza a las
          áreas del catálogo principal que más se cruzan con trámites
          transnacionales (familia, civil y notarial, extranjería) usando el
          motor de enlazado interno a partir de 'extranjeria-en-honduras'. */}
      <Section background="muted" spacing="sm">
        <Container size="lg">
          <RelatedServices
            currentSlug="extranjeria-en-honduras"
            limit={4}
            eyebrow="Relacionado con"
          />
        </Container>
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

      {/* FASE 4 (§13) — Guía prudente de envío seguro de documentación.
          No promete cifrado o almacenamiento seguro no implementados; da
          recomendaciones de prudencia al usuario. */}
      <Section background="default" spacing="md">
        <Container size="lg">
          <SectionHeader
            eyebrow="Envío seguro de documentos"
            title="Cómo enviarnos documentación desde España"
            subtitle="Recomendaciones de prudencia para el primer contacto. No envíe información sensible innecesaria."
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <Card padding="md" className="h-full">
              <h3 className="font-bold text-sm text-primary leading-snug">Recomendado</h3>
              <ul className="mt-2 space-y-1.5 text-sm text-text-secondary leading-relaxed list-disc pl-5">
                <li>Use copias legibles, no originales, en el primer contacto.</li>
                <li>Indique el país y la autoridad emisora de cada documento.</li>
                <li>Confirme con nosotros el canal seguro antes de enviar.</li>
                <li>Avisenos si el documento ya está apostillado.</li>
                <li>Conserve siempre sus originales.</li>
              </ul>
            </Card>
            <Card padding="md" className="h-full">
              <h3 className="font-bold text-sm text-primary leading-snug">Evite enviar</h3>
              <ul className="mt-2 space-y-1.5 text-sm text-text-secondary leading-relaxed list-disc pl-5">
                <li>Documentos originales en el primer contacto.</li>
                <li>Contraseñas o claves de acceso.</li>
                <li>Números bancarios completos.</li>
                <li>Datos completos de menores cuando no sean imprescindibles.</li>
              </ul>
              <p className="mt-2 text-xs text-text-muted leading-relaxed">
                El alcance del servicio y el canal de comunicación se confirman tras la
                evaluación inicial del caso.
              </p>
            </Card>
          </div>
        </Container>
      </Section>

      {/* FASE 4 (§14) — CTA contextual España con motivo preseleccionado seguro. */}
      <CtaSpain />
    </>
  );
}
