import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { site, absoluteUrl } from '@/lib/site';
import { Section, SectionHeader, Container } from '@/components/marketing/section';
import { ServiceCardPhoto } from '@/components/marketing/service-card-photo';
import { CTAGroup, ContactStrip } from '@/components/marketing/cta-buttons';
import { Card } from '@/components/ui/card';
import { hubMigrantes } from '@/data/areas-juridicas';
import { migrantesHubHref, areaSchemas } from '@/lib/schemas/legal-page';
import { getAreaTone } from '@/lib/icon-map';

export const metadata: Metadata = {
  title: 'Migrantes Hondureños en España',
  description: `Asistencia legal para hondureños en España: gestión documental, actos notariales internacionales, divorcios, custodias y sucesiones entre Honduras y España. ${site.name}.`,
  alternates: { canonical: '/migrantes-hondurenos-en-espana' },
};

export default function MigrantesPage() {
  const url = migrantesHubHref();
  const ldSchemas = areaSchemas({
    service: {
      slug: 'migrantes-hondurenos-en-espana',
      name: 'Migrantes Hondureños en España — Pineda y Asociados',
      description: hubMigrantes.descripcion,
      serviceType: 'LegalService',
      keywords: hubMigrantes.keywords,
      url,
    },
    faqs: hubMigrantes.faqs,
    breadcrumbs: [
      { name: 'Inicio', url: absoluteUrl('/') },
      { name: 'Migrantes Hondureños en España', url },
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
            <p className="text-[11px] font-bold uppercase tracking-widest text-accent mb-3">
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {hubMigrantes.subareas.map((sub) => (
            <ServiceCardPhoto
              key={sub.slug}
              href={`/migrantes-hondurenos-en-espana/${sub.slug}`}
              title={sub.titulo}
              description={sub.resumen}
              tone={getAreaTone(sub.slug)}
              aspect="16/9"
              label={sub.titulo}
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
              <h3 className="font-bold text-[15px] text-text leading-tight mb-1.5">
                {faq.pregunta}
              </h3>
              <p className="text-[14px] text-text-secondary leading-relaxed">
                {faq.respuesta}
              </p>
            </Card>
          ))}
        </div>
      </Section>

      <Section background="muted" spacing="sm">
        <div className="text-center max-w-2xl mx-auto">
          <p className="text-text-secondary text-[14px] leading-relaxed mb-5">
            Si reside en España y necesita gestionar trámites legales en Honduras,
            podemos ayudarle. Consúltenos sin compromiso y le explicaremos el
            procedimiento paso a paso.
          </p>
          <Link
            href="/solicitar-consulta"
            className="inline-flex items-center gap-2 h-12 px-6 rounded-md bg-aggravation text-white text-base font-bold hover:opacity-90 transition-opacity"
          >
            Solicitar consulta confidencial <ArrowRight size={18} />
          </Link>
        </div>
      </Section>

      <Section spacing="sm">
        <ContactStrip />
      </Section>

      {ldSchemas.map((schema, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      ))}
    </>
  );
}
