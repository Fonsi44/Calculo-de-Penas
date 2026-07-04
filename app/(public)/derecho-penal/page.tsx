import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, BookOpen, MessageCircle, ShieldAlert, Gavel, FileSearch, Scale, FolderOpen, type LucideIcon } from 'lucide-react';
import { site, absoluteUrl, whatsappHref } from '@/lib/site';
import { buildMetadata } from '@/lib/seo';
import { Section, SectionHeader, Container } from '@/components/marketing/section';
import { AnswerBlock } from '@/components/marketing/answer-block';
import { getPostsByCategory, formatDate } from '@/lib/blog';
import { Card } from '@/components/ui/card';
import { CTAGroup, UrgencyCallout } from '@/components/marketing/cta-buttons';
import { PageHero } from '@/components/marketing/page-hero';
import { TrustBar } from '@/components/marketing/trust-bar';
import { ServiceCard } from '@/components/marketing/service-card';
import { HubFaq } from '@/components/marketing/hub-faq';
import { hubPenal } from '@/data/areas-juridicas';
import { penalHubHref, areaSchemas } from '@/lib/schemas/legal-page';
import { ConsultationCTA } from '@/components/marketing/consultation-cta';
import { getAreasFromDb } from '@/lib/areas-db';
import { Breadcrumbs } from '@/components/marketing/breadcrumbs';
import { getPageContent } from '@/lib/page-content-db';

export const metadata: Metadata = buildMetadata({
  // 45 chars. Antes 63 (se truncaba).
  title: `Abogado Penalista en ${site.address.city} | Defensa Penal`,
  // 154 chars. Antes 181.
  description: `Abogado penalista en ${site.address.city}, Valle. Defensa urgente en detenciones, audiencias, medidas cautelares y recursos. Consulta confidencial. WhatsApp ${site.whatsappDisplay}.`,
  canonicalPath: '/derecho-penal',
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
  ogImage: '/og/penal.webp',
  ogImageAlt: `${site.name} - Derecho Penal en Nacaome, Valle y Honduras`,
});

export default async function DerechoPenalPage() {
  const url = penalHubHref();
  const penalGroups = await getAreasFromDb('penal');
  const contentMap = await getPageContent('derecho-penal');

  // FAQs urgentes (acciones inmediatas ante detención/citación). Se renderizan
  // como contenido visible Y se incluyen en el FAQPage schema (antes quedaban
  // fuera del JSON-LD). Texto con tildes correctas para LLMs y algoritmos.
  const urgentFaq = [
    {
      q: 'Qué hacer si me detienen',
      a: 'Mantenga la calma, identifíquese y evite declarar sin defensa técnica. Solicite contacto inmediato con su abogado y registre hora, lugar y autoridad interviniente. Esta información es clave para revisar la legalidad de la detención y las medidas cautelares posteriores.',
    },
    {
      q: 'Cuándo llamar a un abogado penalista',
      a: 'Debe llamar en cuanto reciba citación, aviso de investigación o noticia de detención. Esperar suele reducir el margen de defensa temprana. La primera intervención legal permite proteger derechos, ordenar evidencia y definir estrategia antes de decisiones procesales críticas.',
    },
    {
      q: 'Qué documentos preparar',
      a: 'Reúna citaciones, resoluciones, mensajes, videos, constancias médicas y datos de testigos disponibles. Si no tiene todo, aporte lo que exista y reconstruya una línea de tiempo de los hechos. La organización inicial acelera la evaluación de riesgos y la respuesta procesal.',
    },
    {
      q: 'Qué errores evitar',
      a: 'Evite firmar documentos sin lectura técnica, declarar por presión o eliminar información de su teléfono. También conviene no discutir el caso en redes sociales. Estos errores suelen complicar la defensa y pueden generar interpretaciones adversas en la audiencia.',
    },
    {
      q: 'Cómo actuar ante una citación judicial',
      a: 'No ignore la citación ni improvise una respuesta. Confirme fecha, autoridad y motivo, y consulte de inmediato para preparar la comparecencia. Una respuesta ordenada permite llegar con estrategia, documentos pertinentes y control del relato de hechos desde el inicio.',
    },
  ];

  // FAQ schema: solo las preguntas generales (hubPenal.faqs).
  // Las "Urgencias penales" son pasos de acción, no preguntas FAQ,
  // y el HubFaq emite su propio JSON-LD FAQPage con las generales.
  const allPenalFaqs = hubPenal.faqs;

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
    faqs: allPenalFaqs,
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
  const penalStages: { etapa: string; riesgo: string; plazo: string; accion: string; icon: LucideIcon; num: number }[] = [
    {
      etapa: 'Detención o citación',
      riesgo: 'Declaraciones precipitadas, pérdida de evidencia útil.',
      plazo: 'Horas iniciales',
      accion: 'Contactar abogado penalista y documentar hechos antes de declarar.',
      icon: ShieldAlert,
      num: 1,
    },
    {
      etapa: 'Audiencia inicial',
      riesgo: 'Medidas cautelares desfavorables por preparación incompleta.',
      plazo: '24-48 horas según el caso',
      accion: 'Presentar estrategia de defensa, arraigo y control de legalidad.',
      icon: Gavel,
      num: 2,
    },
    {
      etapa: 'Etapa intermedia',
      riesgo: 'Admisiones probatorias que debilitan la defensa.',
      plazo: 'Semanas a meses',
      accion: 'Depurar prueba, objetar irregularidades y fortalecer teoría del caso.',
      icon: FileSearch,
      num: 3,
    },
    {
      etapa: 'Juicio oral',
      riesgo: 'Inconsistencias de testigos y contradicciones no explotadas.',
      plazo: 'Calendario judicial',
      accion: 'Litigación técnica, interrogatorio estratégico y control de narrativa probatoria.',
      icon: Scale,
      num: 4,
    },
    {
      etapa: 'Recursos',
      riesgo: 'Perder oportunidad de impugnar por extemporaneidad.',
      plazo: 'Plazos perentorios',
      accion: 'Evaluar agravios y presentar recurso dentro del término legal aplicable.',
      icon: FolderOpen,
      num: 5,
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

      <TrustBar background="light" />

      {/* Bloque declarativo GEO (audit P6 Jul 2026): párrafo factual y citable
          para que motores generativos (ChatGPT, Perplexity, Copilot) puedan
          resumir correctamente identidad, especialidad, zona y contacto. */}
      <Section spacing="sm">
        <div className="max-w-3xl mx-auto geo-snippet">
          <p>
            <strong>Pineda y Asociados</strong> es un bufete
            jurídico en <strong>Nacaome, Valle (Honduras)</strong>,
            especializado en <strong>defensa penal</strong> en el
            departamento de Valle, Choluteca y el sur de Honduras. Atiende detenciones,
            audiencias iniciales, medidas cautelares, juicio oral y recursos conforme al
            Código Penal Decreto 130-2017 y reformas vigentes. Atención de lunes a sábado
            de 7:00 a 20:00. Contacto: WhatsApp +504 9536-3724.
          </p>
        </div>
      </Section>

      {/* BLOQUE GEO/LLMO — respuesta directa sobre cuándo contactar. */}
      <Section background="warm" spacing="sm">
        <Container size="lg">
          <AnswerBlock
            eyebrow="Cuándo contactar"
            question="¿Cuándo debo contactar a un abogado penalista?"
            answer="Contacte a un abogado penalista de inmediato si usted o un familiar están detenidos, han recibido citación judicial, enfrentan una investigación o han sido imputados. La Constitución de Honduras garantiza el derecho a defensa técnica desde el primer momento y a ser presentado ante un juez en 24 horas. No espere a la audiencia inicial: la asistencia letrada temprana puede condicionar las medidas cautelares y el curso del proceso."
          />
        </Container>
      </Section>

      <Section spacing="sm">
        <div className="max-w-4xl mx-auto geo-snippet text-center">
          <p>
            <strong>¿Quiere entender el proceso penal paso a paso?</strong>{' '}
            Consulte nuestra{' '}
            <Link href="/blog/proceso-penal" className="text-accent-dark hover:text-primary underline font-semibold">
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
          <div className="hidden sm:block flex-shrink-0 w-40 sm:w-44 lg:w-48 self-center">
            <div className="relative mx-auto max-w-[12rem]">
              <div className="absolute -inset-4 rounded-2xl bg-primary/5 blur-3xl" aria-hidden="true" />
              <div className="relative rounded-lg border border-primary/20 overflow-hidden bg-surface-alt aspect-[3/4]">
                <Image
                  src="/images/equipo/danilo-pineda-maradiaga-penal.webp"
                  alt="Danilo Pineda Maradiaga, abogado penalista en Nacaome, Valle, Honduras — defensa penal"
                  width={400}
                  height={500}
                  className="w-full h-full object-cover"
                  sizes="(max-width: 1024px) 70vw, 192px"
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
          title="Etapas, riesgos y acción recomendada en un caso penal"
          subtitle="Resumen orientativo para decidir con rapidez y responsabilidad en cada fase del proceso penal hondureño."
          align="center"
        />

        {/* ── ESCRITORIO: tabla elegante con filas tipo card ── */}
        <div className="hidden lg:block rounded-lg border border-border/40 bg-background overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-surface-alt border-b border-border/40">
              <tr>
                <th className="text-left p-4 font-bold text-text">Etapa</th>
                <th className="text-left p-4 font-bold text-text">Riesgo principal</th>
                <th className="text-left p-4 font-bold text-text">Plazo orientativo</th>
                <th className="text-left p-4 font-bold text-text">Acción recomendada</th>
              </tr>
            </thead>
            <tbody>
              {penalStages.map((stage) => {
                const Icon = stage.icon;
                return (
                  <tr key={stage.etapa} className="border-b border-border/20 last:border-0 hover:bg-surface-alt/50 transition-colors group">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-lg bg-accent/10 border border-accent/15 flex items-center justify-center flex-shrink-0">
                          <Icon className="text-accent-dark" size={20} aria-hidden="true" />
                        </div>
                        <span className="text-text font-medium leading-snug">{stage.etapa}</span>
                      </div>
                    </td>
                    <td className="p-4 text-text-secondary leading-relaxed">{stage.riesgo}</td>
                    <td className="p-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-surface-alt border border-border/40 text-text-secondary whitespace-nowrap">
                        {stage.plazo}
                      </span>
                    </td>
                    <td className="p-4 text-text-secondary leading-relaxed">{stage.accion}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* ── MÓVIL/TABLET: tarjetas verticales ── */}
        <div className="lg:hidden space-y-4">
          {penalStages.map((stage) => {
            const Icon = stage.icon;
            return (
              <Card key={stage.etapa} padding="md" className="h-full">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-11 h-11 rounded-lg bg-accent/10 border border-accent/15 flex items-center justify-center flex-shrink-0">
                    <Icon className="text-accent-dark" size={20} aria-hidden="true" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-text font-medium text-sm leading-snug">{stage.etapa}</p>
                    <span className="inline-flex items-center mt-1.5 px-2 py-0.5 rounded-md text-xxs font-bold border bg-accent/10 border-accent/20 text-accent-dark">
                      Etapa {stage.num}
                    </span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-xxs font-bold uppercase tracking-wider text-danger mb-0.5">Riesgo principal</p>
                    <p className="text-sm text-text-secondary leading-relaxed">{stage.riesgo}</p>
                  </div>
                  <div>
                    <p className="text-xxs font-bold uppercase tracking-wider text-text-muted mb-0.5">Plazo orientativo</p>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-surface-alt border border-border/40 text-text-secondary">
                      {stage.plazo}
                    </span>
                  </div>
                  <div>
                    <p className="text-xxs font-bold uppercase tracking-wider text-success mb-0.5">Acción recomendada</p>
                    <p className="text-sm text-text-secondary leading-relaxed">{stage.accion}</p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        <p className="mt-6 text-xs text-text-tertiary leading-relaxed text-center max-w-2xl mx-auto">
          Esta tabla tiene carácter informativo y no sustituye análisis legal individual. La estrategia final depende de hechos, prueba disponible y resoluciones de autoridad competente.
        </p>
      </Section>

      {/* URGENCIAS PENALES — acciones inmediatas ante situaciones críticas.
          Tratamiento visual diferenciado: callout rojo de urgencia + grid de
          pasos concretos. No es un FAQ genérico; es una guía de actuación
          urgente. Se diferencia claramente del bloque FAQ que viene después. */}
      <Section background="muted" spacing="md" id="urgencias-penales">
        <SectionHeader
          eyebrow="Urgencias penales"
          title="Actúe con criterio técnico desde el primer minuto"
          subtitle="Pasos concretos para detenciones, citaciones y primeras audiencias. La defensa temprana protege sus derechos y condiciona el resultado del proceso."
        />
        <div className="max-w-4xl mx-auto mb-6">
          <UrgencyCallout />
        </div>
        <div className="grid gap-4 max-w-4xl mx-auto sm:grid-cols-2 lg:grid-cols-3">
          {urgentFaq.map((item) => (
            <Card key={item.q} padding="md" className="border-l-4 border-l-accent h-full">
              <h3 className="font-bold text-sm text-text leading-tight">{item.q}</h3>
              <p className="mt-2 text-sm text-text-secondary leading-relaxed">{item.a}</p>
            </Card>
          ))}
        </div>
      </Section>

      {/* FAQ PENAL — consultas generales sobre proceso, plazos y estrategia.
          Se usa HubFaq (acordeón) para mantener limpieza visual y no saturar
          con todas las preguntas expandidas. Se diferencia del bloque de
          urgencias anterior: aquí son consultas informativas, no pasos de
          acción inmediata. */}
      <HubFaq
        faqs={hubPenal.faqs}
        url={absoluteUrl('/derecho-penal')}
        eyebrow="Preguntas frecuentes"
        title="Resolvemos sus dudas sobre defensa penal"
        id="preguntas-frecuentes"
      />

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
        <div className="max-w-3xl mx-auto mt-4 text-center">
          <Link
            href="/guia-legal-abogados-honduras"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent-dark hover:text-primary transition-colors"
          >
            Guía para contratar abogado en Honduras <ArrowRight size={16} />
          </Link>
        </div>
      </Section>
      )}

      {/* CLUSTER GEOGRÁFICO PENAL (Jul 2026, depurado): las 2 landings
          especializadas + 3 ciudades clave. Antes: 12 chips (sobreopt);
          ahora: 5 enlaces de alto valor comercial. */}
      <Section background="muted" spacing="md" ariaLabel="Defensa penal por ciudad">
        <SectionHeader
          eyebrow="Cobertura penal"
          title="Defensa penal en el sur de Honduras"
          subtitle="Atendemos casos penales en Nacaome, Choluteca y la zona sur. Coordinamos presencia en juzgados y asistencia urgente."
          align="center"
        />
        <div className="max-w-4xl mx-auto flex flex-wrap gap-2 justify-center">
          <Link
            href="/abogado-penalista-nacaome"
            className="focus-ring chip-specialty inline-flex items-center bg-accent/10 border-accent/30 text-accent-dark font-semibold"
          >
            Penalista en Nacaome
          </Link>
          <Link
            href="/abogado-penalista-choluteca"
            className="focus-ring chip-specialty inline-flex items-center bg-accent/10 border-accent/30 text-accent-dark font-semibold"
          >
            Penalista en Choluteca
          </Link>
          <Link href="/abogados-en-choluteca" className="focus-ring chip-specialty">Choluteca</Link>
          <Link href="/abogados-en-san-lorenzo" className="focus-ring chip-specialty">San Lorenzo</Link>
          <Link href="/abogados-en-goascoran" className="focus-ring chip-specialty">Goascorán</Link>
        </div>
      </Section>

      {ldSchemas.map((schema, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      ))}

      <ConsultationCTA />
    </>
  );
}

