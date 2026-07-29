import type { Metadata } from 'next';
import {
  Shield, HelpCircle, ChevronDown,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { site } from '@/lib/site';
import { Section, SectionHeader } from '@/components/marketing/section';
import { CTAGroup } from '@/components/marketing/cta-buttons';
import {
  getCorporateFaqsForPublicPage,
  type CorporateFaqCategoryPublic,
} from '@/lib/faq-db';
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
  'bufete-honorarios': {
    icon: Shield,
    iconColor: 'text-accent-dark',
    borderColor: 'border-l-accent/40',
    badgeBg: 'bg-accent/10',
    badgeText: 'text-accent-dark',
  },
};

const FAQ_CLUSTERS: FaqCluster[] = [
  {
    id: 'consultas',
    title: 'Consultas, honorarios y atención',
    quickAnswer:
      'Información corporativa para preparar el primer contacto, conocer cómo se protege su información y entender cuándo se informa el presupuesto.',
    categorySlugs: ['bufete-honorarios'],
  },
];

function SectionChip({ cat }: { cat: CorporateFaqCategoryPublic }) {
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
  const categoriasFaq = await getCorporateFaqsForPublicPage();
  const total = categoriasFaq.reduce((acc, c) => acc + c.preguntas.length, 0);
  return {
    title: 'Preguntas frecuentes sobre consultas y honorarios',
    description: `${total} respuestas sobre la primera consulta gratuita, confidencialidad, documentación, honorarios, presupuesto y atención de ${site.name}.`,
    alternates: { canonical: '/preguntas-frecuentes' },
    keywords: ['primera consulta gratuita', 'honorarios abogados Honduras', 'presupuesto legal', 'confidencialidad abogado', 'documentos primera consulta'],
    twitter: {
      card: 'summary_large_image',
      title: 'Preguntas frecuentes sobre consultas y honorarios',
      description: `${total} respuestas sobre consulta gratuita, confidencialidad, documentación, honorarios, presupuesto y atención.`,
      images: [`${site.url}/og/faq.webp`],
    },
    openGraph: {
      title: 'Preguntas frecuentes sobre consultas y honorarios',
      description: `${total} respuestas sobre consulta gratuita, confidencialidad, documentación, honorarios, presupuesto y atención de ${site.name}.`,
      url: `${site.url}/preguntas-frecuentes`,
      siteName: site.name,
      locale: 'es_HN',
      type: 'website',
      images: [{ url: `${site.url}/og/faq.webp`, width: 1200, height: 630, alt: `${site.name} - Preguntas Frecuentes` }],
    },
  };
}

export default async function FaqPage() {
  const categoriasFaq = await getCorporateFaqsForPublicPage();
  const totalPreguntas = categoriasFaq.reduce((acc, cat) => acc + cat.preguntas.length, 0);
  const categoriesBySlug = new Map(categoriasFaq.map((c) => [c.slug, c]));

  const clusters = FAQ_CLUSTERS.map((cluster) => ({
      ...cluster,
      categories: cluster.categorySlugs
        .map((slug) => categoriesBySlug.get(slug))
        .filter((cat): cat is CorporateFaqCategoryPublic => Boolean(cat)),
    }))
    .filter((cluster) => cluster.categories.length > 0);

  const flatFaqs = categoriasFaq.flatMap((c) =>
    c.preguntas.map((p) => ({
      pregunta: p.pregunta,
      respuesta: p.respuestaTexto,
    })),
  );
  const flatFaqsForSchema = flatFaqs;

  return (
    <>
      <Breadcrumbs items={[
        { label: 'Inicio', href: '/' },
        { label: 'Preguntas Frecuentes' },
      ]} />
      <PageHero
        eyebrow="Preguntas Frecuentes"
        badge="Información del bufete"
        title="Antes de su primera consulta"
        subtitle={
          <>
            {totalPreguntas} respuestas sobre la primera consulta gratuita,
            confidencialidad, documentación, honorarios, presupuesto y atención.
          </>
        }
        cta={<CTAGroup variant="inverse" />}
        bgImage="/images/corporate/courthouse.webp"
      />

      <TrustBar background="light" />

      <Section spacing="sm">
        <SectionHeader
          eyebrow="Índice temático"
          title="Información para preparar su consulta"
          subtitle="Encuentre respuestas útiles sobre la atención del bufete."
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

                    {cat.preguntas.map((p) => (
                      <details
                        key={p.id}
                        id={p.id}
                        data-faq-question={p.pregunta}
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

        </Section>
      ))}

      <Section spacing="md" background="muted">
        <SectionHeader
          eyebrow="Preguntas por materia"
          title="Consulte la respuesta en el área jurídica correspondiente"
          subtitle="Las preguntas jurídicas se mantienen en su contexto profesional, sin duplicar respuestas en la FAQ general."
        />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            ['Derecho penal', '/derecho-penal'],
            ['Derecho de familia', '/servicios-juridicos/derecho-de-familia'],
            ['Derecho laboral', '/servicios-juridicos/derecho-laboral'],
            ['Derecho civil y notarial', '/servicios-juridicos/derecho-civil-y-notarial'],
            ['Derecho mercantil', '/servicios-juridicos/derecho-mercantil-empresarial'],
            ['Derecho administrativo', '/servicios-juridicos/derecho-administrativo-y-servicio-civil'],
          ].map(([label, href]) => (
            <Link
              key={href}
              href={href}
              className="rounded-lg border border-border-light bg-surface p-4 text-sm font-semibold text-primary hover:border-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent transition-colors"
            >
              Preguntas sobre {label}
            </Link>
          ))}
        </div>
      </Section>

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

      {flatFaqsForSchema.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(
              faqPageSchema(flatFaqsForSchema, `${site.url}/preguntas-frecuentes`),
            ),
          }}
        />
      )}
      <ConsultationCTA />
    </>
  );
}
