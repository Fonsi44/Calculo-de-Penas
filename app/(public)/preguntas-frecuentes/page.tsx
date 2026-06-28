import type { Metadata } from 'next';
import {
  Scale, ShieldAlert, Gavel, Users, Briefcase, FileText,
  Building2, Globe, DollarSign, Shield, HelpCircle,
  ChevronDown,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { site } from '@/lib/site';
import { Section, SectionHeader } from '@/components/marketing/section';
import { Card } from '@/components/ui/card';
import { CTAGroup } from '@/components/marketing/cta-buttons';
import { getFaqsForPublicPage, type FaqCategoryPublic } from '@/lib/faq-db';
import { faqPageSchema } from '@/lib/schemas/legal-page';
import { PageHero } from '@/components/marketing/page-hero';
import { TrustBar } from '@/components/marketing/trust-bar';
import Link from 'next/link';
import { ConsultationCTA } from '@/components/marketing/consultation-cta';
import { Breadcrumbs } from '@/components/marketing/breadcrumbs';
import { BlogHighlights } from '@/components/marketing/blog-highlights';

export const revalidate = 3600;

type CatMeta = {
  icon: LucideIcon;
  iconColor: string;
  borderColor: string;
  badgeBg: string;
  badgeText: string;
};

type FaqCluster = {
  id: string;
  title: string;
  quickAnswer: string;
  categorySlugs: string[];
};

const CAT_META: Record<string, CatMeta> = {
  'derecho-penal-general': {
    icon: Scale,
    iconColor: 'text-primary',
    borderColor: 'border-l-primary/40',
    badgeBg: 'bg-primary/8',
    badgeText: 'text-primary',
  },
  'asistencia-detenidos': {
    icon: ShieldAlert,
    iconColor: 'text-aggravation',
    borderColor: 'border-l-aggravation/40',
    badgeBg: 'bg-aggravation/8',
    badgeText: 'text-aggravation',
  },
  'proceso-penal': {
    icon: Gavel,
    iconColor: 'text-accent-dark',
    borderColor: 'border-l-accent/40',
    badgeBg: 'bg-accent/10',
    badgeText: 'text-accent-dark',
  },
  'derecho-de-familia': {
    icon: Users,
    iconColor: 'text-primary',
    borderColor: 'border-l-primary/40',
    badgeBg: 'bg-primary/8',
    badgeText: 'text-primary',
  },
  'derecho-laboral': {
    icon: Briefcase,
    iconColor: 'text-warning',
    borderColor: 'border-l-warning/40',
    badgeBg: 'bg-warning/8',
    badgeText: 'text-warning',
  },
  'derecho-civil': {
    icon: FileText,
    iconColor: 'text-text-muted',
    borderColor: 'border-l-border',
    badgeBg: 'bg-surface-alt',
    badgeText: 'text-text-secondary',
  },
  'derecho-mercantil': {
    icon: Building2,
    iconColor: 'text-text-muted',
    borderColor: 'border-l-border',
    badgeBg: 'bg-surface-alt',
    badgeText: 'text-text-secondary',
  },
  'extranjeria-migracion': {
    icon: Globe,
    iconColor: 'text-primary',
    borderColor: 'border-l-primary/40',
    badgeBg: 'bg-primary/8',
    badgeText: 'text-primary',
  },
  'tributario-sar': {
    icon: DollarSign,
    iconColor: 'text-warning',
    borderColor: 'border-l-warning/40',
    badgeBg: 'bg-warning/8',
    badgeText: 'text-warning',
  },
  'bufete-honorarios': {
    icon: Shield,
    iconColor: 'text-accent-dark',
    borderColor: 'border-l-accent/40',
    badgeBg: 'bg-accent/10',
    badgeText: 'text-accent-dark',
  },
  'otras-areas': {
    icon: HelpCircle,
    iconColor: 'text-text-muted',
    borderColor: 'border-l-border',
    badgeBg: 'bg-surface-alt',
    badgeText: 'text-text-secondary',
  },
};

const FAQ_CLUSTERS: FaqCluster[] = [
  {
    id: 'derecho-penal',
    title: 'Derecho penal',
    quickAnswer:
      'Si enfrenta una detención, citación o investigación penal en Honduras, lo prioritario es activar defensa técnica desde el primer contacto con la autoridad. Las primeras horas definen medidas cautelares, acceso al expediente y estrategia de protección de derechos. Actuar tarde incrementa riesgos procesales y probatorios.',
    categorySlugs: ['derecho-penal-general', 'asistencia-detenidos', 'proceso-penal'],
  },
  {
    id: 'derecho-laboral',
    title: 'Derecho laboral',
    quickAnswer:
      'En conflictos laborales, los plazos legales suelen ser cortos y la documentación inicial es determinante. Contrato, constancias de pago, comunicaciones y pruebas de jornada ayudan a sustentar reclamos o defensas. Una evaluación temprana permite definir si conviene conciliación, inspección administrativa o demanda judicial.',
    categorySlugs: ['derecho-laboral'],
  },
  {
    id: 'derecho-familiar',
    title: 'Derecho familiar',
    quickAnswer:
      'Divorcio, custodia, pensión alimenticia y medidas de protección exigen enfoque estratégico y trato humano. Cada caso se analiza con prioridad en seguridad, estabilidad familiar y cumplimiento judicial. La orientación temprana evita errores de trámite y facilita acuerdos sostenibles cuando son jurídicamente viables.',
    categorySlugs: ['derecho-de-familia'],
  },
  {
    id: 'derecho-civil',
    title: 'Derecho civil y notarial',
    quickAnswer:
      'Contratos, cobros, sucesiones, inmuebles y actos notariales requieren revisión técnica antes de firmar o demandar. Un análisis preventivo reduce litigios costosos y protege su posición jurídica. Cuando ya existe conflicto, se traza una ruta clara de reclamación, negociación o defensa según evidencia y plazos.',
    categorySlugs: ['derecho-civil'],
  },
  {
    id: 'servicios-juridicos',
    title: 'Servicios jurídicos especializados',
    quickAnswer:
      'Si su asunto involucra empresa, migración, tributos, banca, aduanas, regulación sanitaria o áreas administrativas, conviene definir desde el inicio la rama principal y las ramas de apoyo. Esto evita gestiones duplicadas y acelera la toma de decisiones con una estrategia jurídica integral y trazable.',
    categorySlugs: ['derecho-mercantil', 'extranjeria-migracion', 'tributario-sar', 'otras-areas'],
  },
  {
    id: 'consultas',
    title: 'Consultas iniciales',
    quickAnswer:
      'La consulta inicial se enfoca en entender hechos, identificar riesgos inmediatos y proponer pasos legales realistas. Mientras más claro sea el contexto y la documentación disponible, más precisa será la orientación. El objetivo es que usted decida informado, con tiempos, costos y alcance definidos por escrito.',
    categorySlugs: ['bufete-honorarios'],
  },
  {
    id: 'honorarios',
    title: 'Honorarios',
    quickAnswer:
      'Los honorarios se determinan según complejidad, urgencia, etapas procesales y carga documental del caso. Antes de iniciar actuación profesional se presenta presupuesto por escrito para transparencia y control. Este enfoque evita ambiguedades y permite planificar la estrategia legal con criterios financieros claros.',
    categorySlugs: [],
  },
  {
    id: 'atencion-local-y-tramites',
    title: 'Atencion local y tramites frecuentes',
    quickAnswer:
      'La atencion local en Nacaome, Choluteca y San Lorenzo facilita diligencias urgentes, coordinacion con juzgados y seguimiento documental oportuno. En tramites frecuentes, preparar requisitos desde el inicio reduce retrasos y rechazos. La prioridad siempre es ejecutar pasos concretos, verificables y adecuados al tipo de asunto.',
    categorySlugs: [],
  },
];

function SectionChip({ cat }: { cat: FaqCategoryPublic }) {
  const m = CAT_META[cat.slug];
  const Icon = m?.icon ?? HelpCircle;
  const colorCls = m?.iconColor ?? 'text-text-muted';
  return (
    <span className={`inline-flex items-center gap-1.5 ${colorCls} text-xxs font-semibold`}>
      <Icon size={14} />
      {cat.titulo}
    </span>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  const categoriasFaq = await getFaqsForPublicPage();
  const total = categoriasFaq.reduce((acc, c) => acc + c.preguntas.length, 0);
  return {
    title: `Preguntas Frecuentes en Honduras`,
    description: `${total} respuestas a preguntas frecuentes sobre defensa penal, familia, laboral, civil, mercantil y más en Honduras. Resuelva sus dudas con ${site.name}.`,
    alternates: { canonical: '/preguntas-frecuentes' },
    keywords: ['preguntas frecuentes legales Honduras', 'dudas derecho penal', 'FAQ abogados Honduras', 'consultas legales frecuentes', 'derecho familia preguntas', 'proceso penal dudas', 'honorarios abogados Honduras'],
    twitter: {
      card: 'summary_large_image',
      title: `Preguntas Frecuentes en Honduras`,
      description: `${total} respuestas sobre defensa penal, familia, laboral, civil, mercantil y más. Resuelva sus dudas con ${site.name}.`,
      images: [`${site.url}/og/faq.webp`],
    },
    openGraph: {
      title: `Preguntas Frecuentes en Honduras`,
      description: `${total} respuestas a preguntas frecuentes sobre defensa penal, familia, laboral, civil, mercantil y más en Honduras. Resuelva sus dudas con ${site.name}.`,
      url: `${site.url}/preguntas-frecuentes`,
      siteName: site.name,
      locale: 'es_HN',
      type: 'website',
      images: [{ url: `${site.url}/og/faq.webp`, width: 1200, height: 630, alt: `${site.name} - Preguntas Frecuentes` }],
    },
  };
}

export default async function FaqPage() {
  const categoriasFaq = await getFaqsForPublicPage();
  const totalPreguntas = categoriasFaq.reduce((acc, cat) => acc + cat.preguntas.length, 0);
  const categoriesBySlug = new Map(categoriasFaq.map((c) => [c.slug, c]));

  const clusters = FAQ_CLUSTERS.map((cluster) => ({
    ...cluster,
    categories: cluster.categorySlugs
      .map((slug) => categoriesBySlug.get(slug))
      .filter((cat): cat is FaqCategoryPublic => Boolean(cat)),
  }));

  const flatFaqs = categoriasFaq.flatMap((c) =>
    c.preguntas.map((p) => ({
      pregunta: p.pregunta,
      respuesta: p.respuesta.replace(/<[^>]*>/g, ''),
    })),
  );
  const flatFaqsForSchema = flatFaqs.slice(0, 40);

  return (
    <>
      <Breadcrumbs items={[
        { label: 'Inicio', href: '/' },
        { label: 'Preguntas Frecuentes' },
      ]} />
      <PageHero
        eyebrow="Preguntas Frecuentes"
        badge="Todas las ramas legales"
        title="Resuelva sus dudas legales"
        subtitle={
          <>
            {totalPreguntas} preguntas organizadas en {categoriasFaq.length} categorías.
            Respuestas claras y prácticas sobre el sistema legal hondureño para
            <strong className="font-bold text-accent"> defensa penal</strong>,
            familia, laboral, civil, mercantil, tributario, bancario, administrativo,
            aduanero, sanitario, extranjería, propiedad intelectual, ambiental y
            conciliación/arbitraje.
          </>
        }
        cta={<CTAGroup variant="inverse" />}
      />

      <TrustBar background="light" />

      <Section spacing="sm">
        <SectionHeader
          eyebrow="Indice tematico"
          title="Navegue por tipo de consulta"
          subtitle="Organizamos las preguntas en clusters para que encuentre respuestas utiles mas rapido."
          align="center"
        />
        <div className="flex flex-wrap gap-2 justify-center">
          {clusters.map((cluster) => {
            const count = cluster.categories.reduce((acc, cat) => acc + cat.preguntas.length, 0);
            return (
              <Link
                key={cluster.id}
                href={`#${cluster.id}`}
                className="inline-flex items-center gap-1.5 h-9 px-4 rounded-full bg-surface-alt text-sm font-medium text-text-secondary hover:shadow-md transition-all"
              >
                {cluster.title}
                {count > 0 && <span className="text-xxs opacity-60 ml-1">({count})</span>}
              </Link>
            );
          })}
        </div>
      </Section>

      {clusters.map((cluster, clusterIdx) => (
        <Section
          key={cluster.id}
          id={cluster.id}
          background={clusterIdx % 2 === 0 ? 'default' : 'muted'}
          spacing="md"
        >
          <SectionHeader
            eyebrow={cluster.title}
            title={cluster.title}
            subtitle={cluster.quickAnswer}
          />

          {cluster.categories.length > 0 && (
            <div className="space-y-8">
              {cluster.categories.map((cat) => {
                const m = CAT_META[cat.slug];
                const Icon = m?.icon ?? HelpCircle;
                const borderCls = m?.borderColor ?? 'border-l-border';
                const colorCls = m?.iconColor ?? 'text-text-muted';

                return (
                  <div key={cat.slug} id={cat.slug} className="space-y-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className={`inline-flex items-center gap-2 text-sm font-semibold ${colorCls}`}>
                        <Icon size={16} />
                        {cat.titulo}
                      </span>
                      <span className="text-xs text-text-tertiary">{cat.descripcion}</span>
                    </div>

                    {cat.preguntas.map((p, i) => (
                      <details
                        key={i}
                        className={`faq-anim group bg-background rounded-lg border border-border/70 hover:border-accent/40 hover:shadow-md transition-all open:shadow-md open:border-accent/30 card-premium ${borderCls} border-l-[3px]`}
                      >
                        <summary className="flex items-center justify-between gap-3 cursor-pointer list-none px-5 py-4 text-sm font-semibold text-text leading-snug hover:text-primary transition-colors">
                          <span className="flex-1 flex items-start gap-3">
                            <span className={`mt-0.5 hidden sm:inline-flex ${colorCls} opacity-50 group-hover:opacity-100 transition-opacity`}>
                              <Icon size={16} />
                            </span>
                            <span className="text-pretty">{p.pregunta}</span>
                          </span>
                          <ChevronDown
                            size={18}
                            className={`flex-shrink-0 transition-transform duration-200 group-open:rotate-180 ${colorCls}`}
                          />
                        </summary>
                        <div className="faq-body">
                          <div className="faq-body-inner">
                            <div className="border-t border-border/40 pt-4 px-5 pb-5">
                              <SectionChip cat={cat} />
                              <div
                                className="text-sm text-text leading-relaxed max-w-prose mt-3 text-pretty faq-answer"
                                dangerouslySetInnerHTML={{ __html: p.respuesta }}
                              />
                            </div>
                          </div>
                        </div>
                      </details>
                    ))}
                  </div>
                );
              })}
            </div>
          )}

          {cluster.id === 'honorarios' && (
            <div className="grid gap-3 max-w-4xl">
              <Card padding="md" className="border-l-4 border-l-accent">
                <h3 className="font-bold text-sm text-text">Cuando se define el costo de un caso</h3>
                <p className="mt-1.5 text-sm text-text-secondary leading-relaxed">
                  El costo se define despues de revisar hechos, urgencia, volumen documental y etapas previstas. No se recomienda fijar cifras sin analisis tecnico previo. El despacho entrega presupuesto por escrito antes de cualquier actuacion para que usted pueda decidir con transparencia y sin sorpresas.
                </p>
              </Card>
            </div>
          )}

          {cluster.id === 'atencion-local-y-tramites' && (
            <div className="grid gap-3 max-w-4xl">
              <Card padding="md" className="border-l-4 border-l-primary/40">
                <h3 className="font-bold text-sm text-text">Que documentos llevar en la primera consulta</h3>
                <p className="mt-1.5 text-sm text-text-secondary leading-relaxed">
                  Lleve identificacion, resoluciones, citaciones, contratos y cualquier evidencia relacionada con su asunto. Si no tiene todo, se prioriza lo urgente y se define una lista de documentos faltantes por etapas. Esto acelera la estrategia y evita retrasos en tramites judiciales o administrativos.
                </p>
              </Card>
            </div>
          )}
        </Section>
      ))}

      <BlogHighlights
        slugs={[
          'custodia-hijos-honduras-juez',
          'pension-alimenticia-honduras-guia-completa',
          'estafas-fraudes-tipos-penales-honduras',
          'poder-legal-honduras-cuando-se-necesita',
        ]}
        eyebrow="Guías que amplían estas respuestas"
        title="Lecturas con demanda real que suelen preceder una consulta"
        subtitle="Refuerzan dudas frecuentes sobre familia, penal y notarial con contexto más amplio y siguiente paso claro."
        ctaLabel="Explorar todas las guías del blog"
        ctaHref="/blog"
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            faqPageSchema(flatFaqsForSchema, `${site.url}/preguntas-frecuentes`),
          ),
        }}
      />
      <ConsultationCTA />
    </>
  );
}
