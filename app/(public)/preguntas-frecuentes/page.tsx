import type { Metadata } from 'next';
import {
  Scale, ShieldAlert, Gavel, Users, Briefcase, FileText,
  Building2, Globe, DollarSign, Shield, HelpCircle,
  ChevronDown,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { site } from '@/lib/site';
import { Section, SectionHeader } from '@/components/marketing/section';
import { CTAGroup } from '@/components/marketing/cta-buttons';
import { getFaqsForPublicPage, type FaqCategoryPublic } from '@/lib/faq-db';
import { faqPageSchema } from '@/lib/schemas/legal-page';
import { PageHero } from '@/components/marketing/page-hero';
import { TrustBar } from '@/components/marketing/trust-bar';
import Link from 'next/link';
import { ConsultationCTA } from '@/components/marketing/consultation-cta';
import { Breadcrumbs } from '@/components/marketing/breadcrumbs';

export const revalidate = 3600;

type CatMeta = {
  icon: LucideIcon;
  iconColor: string;
  borderColor: string;
  badgeBg: string;
  badgeText: string;
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
    title: `Preguntas Frecuentes — Abogados en ${site.address.city}, ${site.address.department}`,
    description: `${total} respuestas a las preguntas más frecuentes sobre defensa penal, derecho de familia, laboral, civil, mercantil y más en Honduras. Resuelva sus dudas legales con ${site.name}.`,
    alternates: { canonical: '/preguntas-frecuentes' },
    openGraph: {
      title: `${site.name} — Preguntas Frecuentes`,
      description: `${total} respuestas a las preguntas más frecuentes sobre defensa penal, derecho de familia, laboral, civil, mercantil y más en Honduras. Resuelva sus dudas legales con ${site.name}.`,
      url: `${site.url}/preguntas-frecuentes`,
      siteName: site.name,
      locale: 'es_HN',
      type: 'website',
      images: [{ url: `${site.url}/og-image.png`, width: 1200, height: 630, alt: `${site.name} — Preguntas Frecuentes` }],
    },
  };
}

export default async function FaqPage() {
  const categoriasFaq = await getFaqsForPublicPage();
  const totalPreguntas = categoriasFaq.reduce((acc, cat) => acc + cat.preguntas.length, 0);

  const flatFaqs = categoriasFaq.flatMap((c) =>
    c.preguntas.map((p) => ({
      pregunta: p.pregunta,
      respuesta: p.respuesta.replace(/<[^>]*>/g, ''),
    })),
  );

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
        <div className="flex flex-wrap gap-2 justify-center">
          {categoriasFaq.map((cat) => {
            const m = CAT_META[cat.slug];
            const Icon = m?.icon ?? HelpCircle;
            return (
              <Link
                key={cat.slug}
                href={`#${cat.slug}`}
                className={`inline-flex items-center gap-1.5 h-9 px-4 rounded-full ${m?.badgeBg ?? 'bg-surface-alt'} text-sm font-medium ${m?.badgeText ?? 'text-text-secondary'} hover:shadow-md transition-all`}
              >
                <Icon size={14} />
                {cat.titulo}
                <span className="text-xxs opacity-60 ml-1">({cat.preguntas.length})</span>
              </Link>
            );
          })}
        </div>
      </Section>

      {categoriasFaq.map((cat) => {
        const m = CAT_META[cat.slug];
        const Icon = m?.icon ?? HelpCircle;
        const borderCls = m?.borderColor ?? 'border-l-border';
        const colorCls = m?.iconColor ?? 'text-text-muted';

        return (
          <Section
            key={cat.slug}
            id={cat.slug}
            background={categoriasFaq.indexOf(cat) % 2 === 0 ? 'default' : 'muted'}
            spacing="md"
          >
            <SectionHeader
              eyebrow={
                <span className={`inline-flex items-center gap-2 ${colorCls}`}>
                  <Icon size={18} />
                  {cat.titulo}
                </span>
              }
              title={cat.descripcion}
            />
            <div className="space-y-4">
              {cat.preguntas.map((p, i) => (
                <details
                  key={i}
                  className={`faq-anim group bg-background rounded-xl border border-border/70 hover:border-accent/40 hover:shadow-md transition-all open:shadow-md open:border-accent/30 card-premium ${borderCls} border-l-[3px]`}
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
          </Section>
        );
      })}

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            faqPageSchema(flatFaqs, `${site.url}/preguntas-frecuentes`),
          ),
        }}
      />
      <ConsultationCTA />
    </>
  );
}
