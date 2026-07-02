import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, BookOpen, MessageCircle } from 'lucide-react';
import { site, absoluteUrl, whatsappHref } from '@/lib/site';
import { Section, SectionHeader } from '@/components/marketing/section';
import { getPostsByCategory, formatDate } from '@/lib/blog';
import { Card } from '@/components/ui/card';
import { CTAGroup } from '@/components/marketing/cta-buttons';
import { PageHero } from '@/components/marketing/page-hero';
import { TrustBar } from '@/components/marketing/trust-bar';
import { ServiceCard } from '@/components/marketing/service-card';
import { hubPenal } from '@/data/areas-juridicas';
import { penalHubHref, areaSchemas } from '@/lib/schemas/legal-page';
import { ConsultationCTA } from '@/components/marketing/consultation-cta';
import { LeadMagnetCTA } from '@/components/marketing/lead-magnet-cta';
import { getLeadMagnetByArea } from '@/lib/lead-magnets';
import { getAreasFromDb } from '@/lib/areas-db';
import { Breadcrumbs } from '@/components/marketing/breadcrumbs';
import { getPageContent } from '@/lib/page-content-db';
import { ServiceSearch } from '@/components/blog/service-search';

export const metadata: Metadata = {
  title: { absolute: `Abogado Penalista en ${site.address.city} - Defensa Penal` },
  description: `Abogado penalista en Nacaome, Valle. Defensa técnica y confidencial en detenciones, audiencias y recursos. Consulta urgente por WhatsApp ${site.whatsappDisplay}. Cubrimos San Lorenzo, Choluteca y zona sur de Honduras.`,
  alternates: { canonical: '/derecho-penal' },
  keywords: [
    'abogado penalista Nacaome',
    'defensa penal Valle Honduras',
    'abogado penalista San Lorenzo',
    'abogado penalista Choluteca',
    'defensa penal sur Honduras',
    'abogado detención Honduras',
    'audiencia inicial penal Nacaome',
    'proceso penal Honduras',
    'abogado urgente penalista Valle',
    'asistencia a detenidos Honduras',
    'bufete penal Nacaome',
    'defensa criminal Honduras',
  ],
  twitter: {
    card: 'summary_large_image',
    title: `Abogado Penalista en ${site.address.city}, ${site.address.department} - Defensa Penal`,
    description: `Defensa penal técnica y confidencial en Nacaome, San Lorenzo y Choluteca. Atendemos detenciones y audiencias. Consulta urgente.`,
    images: [`${site.url}/og-image.png`],
  },
  openGraph: {
    title: `Abogado Penalista en ${site.address.city}, ${site.address.department} - Defensa Penal`,
    description: `Abogado penalista en Nacaome, Valle. Defensa técnica y confidencial. Atendemos detenciones, audiencias y recursos en la zona sur de Honduras.`,
    url: `${site.url}/derecho-penal`,
    siteName: site.name,
    locale: 'es_HN',
    type: 'website',
    images: [{ url: `${site.url}/og/penal.webp`, width: 1200, height: 630, alt: `${site.name} - Derecho Penal en Nacaome, Valle y Honduras` }],
  },
};

export default async function DerechoPenalPage() {
  const url = penalHubHref();
  const penalGroups = await getAreasFromDb('penal');
  const contentMap = await getPageContent('derecho-penal');
  const ldSchemas = areaSchemas({
    service: {
      slug: 'derecho-penal',
      name: 'Derecho Penal — Pineda y Asociados',
      description: hubPenal.descripcion,
      // serviceType = categoría textual del servicio. Antes 'CriminalDefense'
      // (inglés, inconsistente con un sitio es-HN); ahora en español y alineado
      // con los títulos reales de las páginas.
      serviceType: 'Defensa Penal',
      keywords: hubPenal.keywords,
      url,
    },
    faqs: hubPenal.faqs,
    breadcrumbs: [
      { name: 'Inicio', url: absoluteUrl('/') },
      { name: 'Derecho Penal', url },
    ],
    url,
  });

  // Posts penales priorizados por tráfico real (GSC 28d, audit 2026-06-25):
// estos 3 slugs generaron clicks reales en Google. Se muestran primero el
// bloque "Artículos relacionados" más abajo. Si algún slug no existe o no
// está publicado, queda fuera (graceful degradation). Si cambian los top,
// reordenar/actualizar aquí.
const PRIORITY_PENAL_SLUGS = [
    'estafas-fraudes-tipos-penales-honduras',
    'cuando-prescribe-delito-en-honduras',
    'fianza-medidas-cautelares-proceso-penal-honduras',
    'que-hacer-si-me-detienen-en-honduras',
    'defensa-penal-honduras',
    'delitos-mas-comunes-honduras',
  ];
  const allPenalPosts = await getPostsByCategory('derecho-penal');
  const penalStages = [
    {
      etapa: 'Detencion o citacion',
      riesgo: 'Declaraciones precipitadas, perdida de evidencia util.',
      plazo: 'Horas iniciales',
      accion: 'Contactar abogado penalista y documentar hechos antes de declarar.',
    },
    {
      etapa: 'Audiencia inicial',
      riesgo: 'Medidas cautelares desfavorables por preparacion incompleta.',
      plazo: '24-48 horas segun el caso',
      accion: 'Presentar estrategia de defensa, arraigo y control de legalidad.',
    },
    {
      etapa: 'Etapa intermedia',
      riesgo: 'Admisiones probatorias que debilitan la defensa.',
      plazo: 'Semanas a meses',
      accion: 'Depurar prueba, objetar irregularidades y fortalecer teoria del caso.',
    },
    {
      etapa: 'Juicio oral',
      riesgo: 'Inconsistencias de testigos y contradicciones no explotadas.',
      plazo: 'Calendario judicial',
      accion: 'Litigacion tecnica, interrogatorio estrategico y control de narrativa probatoria.',
    },
    {
      etapa: 'Recursos',
      riesgo: 'Perder oportunidad de impugnar por extemporaneidad.',
      plazo: 'Plazos perentorios',
      accion: 'Evaluar agravios y presentar recurso dentro del termino legal aplicable.',
    },
  ];

  const urgentFaq = [
    {
      q: 'Que hacer si me detienen',
      a: 'Mantenga la calma, identifiquese y evite declarar sin defensa tecnica. Solicite contacto inmediato con su abogado y registre hora, lugar y autoridad interviniente. Esta informacion es clave para revisar legalidad de la detencion y medidas cautelares posteriores.',
    },
    {
      q: 'Cuando llamar a un abogado penalista',
      a: 'Debe llamar en cuanto reciba citacion, aviso de investigacion o noticia de detencion. Esperar suele reducir margen de defensa temprana. La primera intervencion legal permite proteger derechos, ordenar evidencia y definir estrategia antes de decisiones procesales criticas.',
    },
    {
      q: 'Que documentos preparar',
      a: 'Reuna citaciones, resoluciones, mensajes, videos, constancias medicas y datos de testigos disponibles. Si no tiene todo, aporte lo que exista y reconstruya una linea de tiempo de hechos. La organizacion inicial acelera evaluacion de riesgos y respuesta procesal.',
    },
    {
      q: 'Que errores evitar',
      a: 'Evite firmar documentos sin lectura tecnica, declarar por presion o eliminar informacion de su telefono. Tambien conviene no discutir el caso en redes sociales. Estos errores suelen complicar la defensa y pueden generar interpretaciones adversas en audiencia.',
    },
    {
      q: 'Como actuar ante una citacion judicial',
      a: 'No ignore la citacion ni improvise respuesta. Confirme fecha, autoridad y motivo, y consulte de inmediato para preparar comparecencia. Una respuesta ordenada permite llegar con estrategia, documentos pertinentes y control del relato de hechos desde el inicio.',
    },
  ];
  const blogPosts = PRIORITY_PENAL_SLUGS
    .map((s) => allPenalPosts.find((p) => p.slug === s))
    .filter((p): p is NonNullable<typeof p> => Boolean(p))
    .slice(0, 6);

  return (
    <>
      <Breadcrumbs items={[
        { label: 'Inicio', href: '/' },
        { label: 'Derecho Penal' },
      ]} />
      <PageHero
        eyebrow={contentMap['hero.eyebrow'] || hubPenal.heroEyebrow}
        badge={contentMap['hero.badge'] || 'Especialidad destacada'}
        title={contentMap['hero.title'] || hubPenal.heroTitle}
        subtitle={contentMap['hero.subtitle'] || hubPenal.heroSubtitle}
        cta={<CTAGroup variant="inverse" />}
        bgImage="/images/derecho-penal/pexels-ekaterina-bolovtsova-6077861.webp"
      />

      <div className="bg-background py-6 md:py-8">
        <div className="mx-auto px-4 sm:px-6 max-w-7xl">
          <ServiceSearch
            items={penalGroups.map((g) => ({
              href: `/derecho-penal/${g.slug}`,
              title: g.titulo,
              description: g.descripcionCorta || '',
            }))}
            placeholder='Buscar en derecho penal: "defensa", "detención", "audiencia"...'
            domain="derecho-penal"
          />
        </div>
      </div>

      <TrustBar background="light" />

      <Section spacing="sm">
        <div className="max-w-4xl mx-auto bg-accent/5 rounded-2xl p-5 border border-accent/10 text-center">
          <p className="text-sm text-text-secondary">
            <strong className="text-text">¿Quiere entender el proceso penal paso a paso?</strong>{' '}
            Consulte nuestra{' '}
            <Link href="/proceso-penal" className="text-accent-dark hover:text-primary underline font-semibold">
              guía completa del proceso penal en Honduras
            </Link>
            , desde la investigación hasta la ejecución penal.
          </p>
        </div>
      </Section>

      {/* SU ABOGADO PENALISTA —Danilo Pineda Maradiaga. La página de mayor
          intención comercial penal promete «Abogado Penalista en Nacaome» en
          el title; este bloque hace visible la entidad y cierra title↔H1↔autor
          (E-E-A-T). Retrato Foto2 (alternativo), tamaño contenido para no
          dominar visualmente la página. */}
      <Section spacing="md">
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-center lg:items-start">
          <div className="flex-shrink-0 w-40 sm:w-44 lg:w-48">
            <div className="relative mx-auto max-w-[12rem]">
              <div className="absolute -inset-4 rounded-2xl bg-accent/10 blur-3xl" aria-hidden="true" />
              <div className="relative rounded-lg border border-accent/30 overflow-hidden bg-surface-alt aspect-[3/4]">
                <Image
                  src="/images/equipo/danilo-pineda-maradiaga-alt.webp"
                  alt="Danilo Pineda Maradiaga, abogado penalista en Nacaome, Valle (Honduras)"
                  width={400}
                  height={500}
                  className="w-full h-full object-cover"
                  sizes="(max-width: 1024px) 70vw, 192px"
                />
              </div>
            </div>
          </div>
          <div className="hidden sm:block flex-shrink-0 w-28 lg:w-36 self-center">
            <div className="relative mx-auto max-w-[8rem]">
              <div className="absolute -inset-3 rounded-2xl bg-primary/5 blur-2xl" aria-hidden="true" />
              <div className="relative rounded-lg border border-primary/20 overflow-hidden bg-surface-alt aspect-[3/4]">
                <Image
                  src="/images/equipo/danilo-pineda-maradiaga-penal.webp"
                  alt="Danilo Pineda Maradiaga, abogado penalista en Nacaome, Valle, Honduras — defensa penal"
                  width={300}
                  height={375}
                  className="w-full h-full object-cover"
                  sizes="(max-width: 1024px) 30vw, 112px"
                  priority={false}
                />
              </div>
            </div>
          </div>
          <div className="flex-1 text-center lg:text-left">
            <p className="eyebrow-rule text-accent-dark mb-3">Su abogado penalista</p>
            <h2 className="font-serif font-extrabold text-2xl md:text-3xl text-primary leading-tight text-balance">
              Danilo Pineda Maradiaga
            </h2>
            <p className="mt-2 text-sm font-bold uppercase tracking-eyebrow text-text-muted">
              Abogado penalista · Sur de Honduras
            </p>
            <p className="mt-4 text-sm md:text-base text-text-secondary leading-relaxed text-pretty max-w-xl">
              Más de 15 años de ejercicio profesional. Colegiado en Honduras. Le atiendo
              personalmente en audiencias iniciales, preliminares, de sobreseimiento,
              juicio oral y recursos de casación en el departamento de Valle y la zona sur.
            </p>
            <div className="mt-6 flex flex-wrap gap-3 justify-center lg:justify-start">
              <a
                href={whatsappHref('Hola, necesito consultar con el abogado penalista sobre mi caso.')}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 h-11 px-5 rounded-lg bg-success text-white text-sm font-bold hover:opacity-90 transition-opacity"
              >
                <MessageCircle size={16} /> Hablar con él por WhatsApp
              </a>
              <Link
                href="/despacho"
                className="inline-flex items-center gap-2 h-11 px-5 rounded-lg border border-border-light bg-surface text-text text-sm font-bold hover:border-accent/40 transition-colors"
              >
                Conozca el despacho <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </Section>

      <Section background="muted" spacing="md">
        <SectionHeader
          eyebrow="Grupos especializados"
          title={contentMap['content.section_title'] || hubPenal.titulo}
          subtitle={contentMap['content.section_subtitle'] || hubPenal.resumen}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {penalGroups.map((grupo) => (
            <ServiceCard
              key={grupo.slug}
              href={`/derecho-penal/${grupo.slug}`}
              slug={grupo.slug}
              title={grupo.titulo}
              description={grupo.descripcionCorta}
              category="penal"
              tone="primary"
            />
          ))}
        </div>
      </Section>

      <Section spacing="md" id="etapas-y-riesgos">
        <SectionHeader
          eyebrow="Ruta procesal"
          title="Etapas, riesgos y accion recomendada en un caso penal"
          subtitle="Resumen orientativo para decidir con rapidez y responsabilidad en cada fase del proceso penal hondureno."
        />
        <div className="overflow-x-auto rounded-lg border border-border/50 bg-background">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="bg-surface-alt border-b border-border/50">
              <tr>
                <th className="text-left p-3 font-bold text-text">Etapa</th>
                <th className="text-left p-3 font-bold text-text">Riesgo principal</th>
                <th className="text-left p-3 font-bold text-text">Plazo orientativo</th>
                <th className="text-left p-3 font-bold text-text">Accion recomendada</th>
              </tr>
            </thead>
            <tbody>
              {penalStages.map((stage) => (
                <tr key={stage.etapa} className="border-b border-border/30 last:border-0">
                  <td className="p-3 text-text font-semibold">{stage.etapa}</td>
                  <td className="p-3 text-text-secondary">{stage.riesgo}</td>
                  <td className="p-3 text-text-secondary">{stage.plazo}</td>
                  <td className="p-3 text-text-secondary">{stage.accion}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-xs text-text-tertiary leading-relaxed">
          Esta tabla tiene caracter informativo y no sustituye analisis legal individual. La estrategia final depende de hechos, prueba disponible y resoluciones de autoridad competente.
        </p>
      </Section>

      <Section background="muted" spacing="md" id="urgencias-penales">
        <SectionHeader
          eyebrow="Urgencias penales"
          title="Respuestas inmediatas para situaciones de alto riesgo"
          subtitle="Preguntas frecuentes para actuar con criterio tecnico en detenciones, citaciones y primeras audiencias."
        />
        <div className="grid gap-3 max-w-4xl mx-auto">
          {urgentFaq.map((item) => (
            <Card key={item.q} padding="md" className="border-l-4 border-l-accent">
              <h3 className="font-bold text-sm text-text leading-tight">{item.q}</h3>
              <p className="mt-1.5 text-sm text-text-secondary leading-relaxed">{item.a}</p>
            </Card>
          ))}
        </div>
      </Section>

      <Section spacing="md" id="preguntas-frecuentes">
        <SectionHeader
          eyebrow="Preguntas frecuentes"
          title="Resolvemos sus dudas sobre defensa penal"
          align="center"
        />
        <div className="max-w-3xl mx-auto space-y-3">
          {hubPenal.faqs.map((faq, i) => (
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

      {blogPosts.length > 0 && (
        <Section spacing="md">
          <SectionHeader
            eyebrow="Artículos relacionados"
            title="Aprenda más sobre derecho penal"
            subtitle="Guías, consejos y análisis legales escritos por nuestro equipo."
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {blogPosts.map((post) => (
              <Link key={post.slug} href={`/blog/${post.category}/${post.slug}`} className="group block focus-visible:outline-none">
                <Card padding="md" className="h-full group-hover:border-accent group-hover:shadow-md transition-all">
                  <div className="w-11 h-11 rounded-lg bg-accent/10 text-accent-dark flex items-center justify-center mb-3">
                    <BookOpen size={20} aria-hidden="true" />
                  </div>
                  <p className="text-xxs font-medium uppercase tracking-wider text-text-tertiary mb-1.5">
                    {formatDate(post.publishedAt)}
                  </p>
                  <h3 className="font-bold text-sm text-text leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                    {post.title}
                  </h3>
                  <p className="text-xs text-text-secondary mt-1.5 leading-relaxed line-clamp-2">
                    {post.description}
                  </p>
                  <span className="inline-flex items-center gap-1 mt-3 text-xs font-semibold text-accent-dark group-hover:text-primary transition-colors">
                    Leer artículo <ArrowRight size={12} />
                  </span>
                </Card>
              </Link>
            ))}
          </div>
          <div className="text-center mt-6">
            <Link
              href="/blog/derecho-penal"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent-dark hover:text-primary transition-colors"
            >
              Ver todos los artículos de derecho penal <ArrowRight size={16} />
            </Link>
        </div>
        <div className="max-w-3xl mx-auto mt-6 text-center">
          <Link
            href="/preguntas-frecuentes#derecho-penal-general"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent-dark hover:text-primary transition-colors"
          >
            Ver todas las preguntas frecuentes sobre derecho penal <ArrowRight size={16} />
          </Link>
        </div>
        <div className="max-w-3xl mx-auto mt-4 text-center">
          <Link
            href="/servicios-juridicos"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent-dark hover:text-primary transition-colors"
          >
              Explore las ramas principales del derecho <ArrowRight size={16} />
          </Link>
        </div>
      </Section>
      )}

      {ldSchemas.map((schema, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      ))}

      <Section spacing="sm">
        {(() => {
          const magnet = getLeadMagnetByArea('derecho-penal');
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

