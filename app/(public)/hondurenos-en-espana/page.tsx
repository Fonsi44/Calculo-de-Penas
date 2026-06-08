import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { site, absoluteUrl } from '@/lib/site';
import { Section, SectionHeader, Container } from '@/components/marketing/section';
import { Card } from '@/components/ui/card';
import { CTAGroup, ContactStrip } from '@/components/marketing/cta-buttons';
import { hubMigrantes } from '@/data/areas-juridicas';
import { migrantesHubHref, areaSchemas } from '@/lib/schemas/legal-page';
import { getIcon } from '@/lib/icon-map';
import { ConsultationCTA } from '@/components/marketing/consultation-cta';

export const metadata: Metadata = {
  title: 'Hondureños en España',
  description: `Asistencia legal para hondureños en España: gestión documental, actos notariales internacionales, divorcios, custodias y sucesiones entre Honduras y España. ${site.name}.`,
  alternates: { canonical: '/hondurenos-en-espana' },
  openGraph: {
    title: `Hondureños en España — ${site.name}`,
    description: `Asistencia legal para hondureños en España: gestión documental, actos notariales internacionales, divorcios, custodias y sucesiones entre Honduras y España.`,
    url: `${site.url}/hondurenos-en-espana`,
    siteName: site.name,
    locale: 'es_HN',
    type: 'website',
    images: [{ url: `${site.url}/og-image.png`, width: 1200, height: 630, alt: `${site.name} — Hondureños en España` }],
  },
};

export default function MigrantesPage() {
  const url = migrantesHubHref();
  const ldSchemas = areaSchemas({
    service: {
      slug: 'hondurenos-en-espana',
      name: 'Hondureños en España — Pineda y Asociados',
      description: hubMigrantes.descripcion,
      serviceType: 'LegalService',
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
      <section className="relative bg-primary text-text-inverse overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none" aria-hidden="true">
          <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-accent blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full bg-accent-dark blur-3xl" />
        </div>
        <Container size="lg" className="relative py-14 md:py-20">
          <div className="max-w-3xl">
            <p className="text-xxs font-bold uppercase tracking-widest text-accent mb-3">
              {hubMigrantes.heroEyebrow}
            </p>
            <h1 className="font-serif font-extrabold text-3xl md:text-4xl lg:text-5xl leading-tight">
              {hubMigrantes.heroTitle}
            </h1>
            <p className="mt-5 text-base md:text-lg text-text-inverse/85 leading-relaxed">
              {hubMigrantes.heroSubtitle}
            </p>
            <div className="mt-7">
              <CTAGroup variant="inverse" />
            </div>
          </div>
        </Container>
      </section>

      <Section background="muted" spacing="md">
        <SectionHeader
          eyebrow="Asistencia transnacional"
          title={hubMigrantes.titulo}
          subtitle={hubMigrantes.resumen}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {hubMigrantes.subareas.map((sub) => {
            const Icon = getIcon(sub.icono);
            return (
              <Link
                key={sub.slug}
                href={`/hondurenos-en-espana/${sub.slug}`}
                className="group block focus-visible:outline-none"
              >
                <Card padding="md" className="h-full group-hover:border-accent group-hover:shadow-md transition-all">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-3">
                    <Icon size={22} aria-hidden="true" />
                  </div>
                  <h3 className="font-bold text-sm text-text leading-tight group-hover:text-primary transition-colors">
                    {sub.titulo}
                  </h3>
                  <p className="text-sm text-text-secondary mt-1.5 leading-relaxed">
                    {sub.resumen}
                  </p>
                  <span className="inline-flex items-center gap-1 mt-3 text-xs font-semibold text-accent-dark group-hover:text-primary transition-colors">
                    Conocer más <ArrowRight size={12} />
                  </span>
                </Card>
              </Link>
            );
          })}
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

      <Section spacing="sm">
        <ContactStrip />
      </Section>

      {ldSchemas.map((schema, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      ))}
      <ConsultationCTA />
    </>
  );
}

