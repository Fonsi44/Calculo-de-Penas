import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, BookOpen } from 'lucide-react';
import { site, absoluteUrl } from '@/lib/site';
import { Section, SectionHeader, Container } from '@/components/marketing/section';
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
  title: `Abogados Penalistas en ${site.address.city}, ${site.address.department} | Defensa Penal`,
  description: `Defensa penal técnica y confidencial en Nacaome, Valle, San Lorenzo y Choluteca. ${hubPenal.grupos.length} grupos especializados con sede en Nacaome y cobertura en la zona sur de Honduras. ${site.name}.`,
  alternates: { canonical: '/derecho-penal' },
  keywords: ['abogado penalista Nacaome', 'defensa penal Valle Honduras', 'abogado penal San Lorenzo', 'abogado penalista Choluteca', 'asistencia detenidos sur Honduras', 'audiencia inicial penal Nacaome', 'defensa penal sur Honduras', 'recursos penales casación'],
  twitter: {
    card: 'summary_large_image',
    title: `Abogados Penalistas en ${site.address.city}, ${site.address.department} — Defensa Penal Técnica`,
    description: `Defensa penal técnica y confidencial en la zona sur de Honduras. ${hubPenal.grupos.length} grupos especializados. Sede en Nacaome, cobertura en San Lorenzo y Choluteca.`,
    images: [`${site.url}/og-image.png`],
  },
  openGraph: {
    title: `Abogados Penalistas en ${site.address.city}, ${site.address.department} | Defensa Penal | ${site.name}`,
    description: `Defensa penal técnica y confidencial en Nacaome, Valle. ${hubPenal.grupos.length} grupos especializados con presencia activa en la zona sur de Honduras: San Lorenzo y Choluteca.`,
    url: `${site.url}/derecho-penal`,
    siteName: site.name,
    locale: 'es_HN',
    type: 'website',
    images: [{ url: `${site.url}/og/penal.webp`, width: 1200, height: 630, alt: `${site.name} — Derecho Penal` }],
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

  const blogPosts = (await getPostsByCategory('derecho-penal')).slice(0, 3);

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
      />

      <Section spacing="sm">
        <Container size="lg">
          <ServiceSearch
            items={penalGroups.map((g) => ({
              href: `/derecho-penal/${g.slug}`,
              title: g.titulo,
              description: g.descripcionCorta || '',
            }))}
            placeholder='Buscar en derecho penal: "defensa", "detención", "audiencia"...'
            domain="derecho-penal"
          />
        </Container>
      </Section>

      <TrustBar background="light" />

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

