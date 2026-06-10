import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, BookOpen } from 'lucide-react';
import { site, absoluteUrl } from '@/lib/site';
import { Section, SectionHeader } from '@/components/marketing/section';
import { getPostsByCategory, formatDate } from '@/lib/blog';
import { Card } from '@/components/ui/card';
import { CTAGroup, ContactStrip } from '@/components/marketing/cta-buttons';
import { PageHero } from '@/components/marketing/page-hero';
import { TrustBar } from '@/components/marketing/trust-bar';
import { ServiceCard } from '@/components/marketing/service-card';
import { hubPenal } from '@/data/areas-juridicas';
import { penalHubHref, areaSchemas } from '@/lib/schemas/legal-page';
import type { PlaceholderTone } from '@/components/marketing/placeholder-photo';
import { ConsultationCTA } from '@/components/marketing/consultation-cta';

export const metadata: Metadata = {
  title: `Abogados Penalistas en ${site.address.city}, ${site.address.department} | Defensa Penal`,
  description: `Defensa penal técnica y confidencial en Honduras. ${hubPenal.grupos.length} grupos especializados con presencia activa en Nacaome, Tegucigalpa, San Pedro Sula, Comayagua y Choluteca. ${site.name}.`,
  alternates: { canonical: '/derecho-penal' },
  openGraph: {
    title: `Abogados Penalistas — ${site.name}`,
    description: `Defensa penal técnica y confidencial en Honduras. ${hubPenal.grupos.length} grupos especializados con presencia activa en todo el país.`,
    url: `${site.url}/derecho-penal`,
    siteName: site.name,
    locale: 'es_HN',
    type: 'website',
    images: [{ url: `${site.url}/og-image.png`, width: 1200, height: 630, alt: `${site.name} — Derecho Penal` }],
  },
};

export default function DerechoPenalPage() {
  const url = penalHubHref();
  const ldSchemas = areaSchemas({
    service: {
      slug: 'derecho-penal',
      name: 'Derecho Penal — Pineda y Asociados',
      description: hubPenal.descripcion,
      serviceType: 'CriminalDefense',
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

  return (
    <>
      <PageHero
        eyebrow={hubPenal.heroEyebrow}
        badge="Especialidad destacada"
        title={hubPenal.heroTitle}
        subtitle={<>{hubPenal.heroSubtitle}</>}
        cta={<CTAGroup variant="inverse" />}
      />

      <TrustBar background="light" />

      <Section background="muted" spacing="md">
        <SectionHeader
          eyebrow="Grupos especializados"
          title={hubPenal.titulo}
          subtitle={hubPenal.resumen}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {hubPenal.grupos.map((grupo) => (
            <ServiceCard
              key={grupo.slug}
              href={`/derecho-penal/${grupo.slug}`}
              slug={grupo.slug}
              title={grupo.titulo}
              description={grupo.resumen}
              category="penal"
              tone={(grupo.color as PlaceholderTone) ?? 'primary'}
            />
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

      {(() => {
        const blogPosts = getPostsByCategory('derecho-penal').slice(0, 3);
        if (blogPosts.length === 0) return null;
        return (
          <Section spacing="md">
            <SectionHeader
              eyebrow="Artículos relacionados"
              title="Aprenda más sobre derecho penal"
              subtitle="Guías, consejos y análisis legales escritos por nuestro equipo."
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {blogPosts.map((post) => (
                <Link key={post.slug} href={`/blog/${post.slug}`} className="group block focus-visible:outline-none">
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
          </Section>
        );
      })()}

      {ldSchemas.map((schema, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      ))}
      <ConsultationCTA />
    </>
  );
}

