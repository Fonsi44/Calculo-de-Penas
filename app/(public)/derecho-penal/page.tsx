import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { site, absoluteUrl } from '@/lib/site';
import { Section, SectionHeader, Container } from '@/components/marketing/section';
import { Card } from '@/components/ui/card';
import { CTAGroup, ContactStrip } from '@/components/marketing/cta-buttons';
import { hubPenal } from '@/data/areas-juridicas';
import { penalHubHref, areaSchemas } from '@/lib/schemas/legal-page';
import { getIcon } from '@/lib/icon-map';

export const metadata: Metadata = {
  title: 'Derecho Penal',
  description: `Defensa penal técnica y confidencial en Honduras. ${hubPenal.grupos.length} grupos especializados con presencia activa en Nacaome, Tegucigalpa, San Pedro Sula, Comayagua y Choluteca. ${site.name}.`,
  alternates: { canonical: '/derecho-penal' },
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
      <section className="relative bg-primary text-text-inverse overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none" aria-hidden="true">
          <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-accent blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full bg-accent-dark blur-3xl" />
        </div>
        <Container size="lg" className="relative py-14 md:py-20">
          <div className="max-w-3xl">
            <p className="text-[11px] font-bold uppercase tracking-widest text-accent mb-3">
              {hubPenal.heroEyebrow}
            </p>
            <h1 className="font-serif font-extrabold text-3xl md:text-4xl lg:text-5xl leading-tight">
              {hubPenal.heroTitle}
            </h1>
            <p className="mt-5 text-base md:text-lg text-text-inverse/85 leading-relaxed">
              {hubPenal.heroSubtitle}
            </p>
            <div className="mt-7">
              <CTAGroup variant="inverse" />
            </div>
          </div>
        </Container>
      </section>

      <Section background="muted" spacing="md">
        <SectionHeader
          eyebrow="Grupos especializados"
          title={hubPenal.titulo}
          subtitle={hubPenal.resumen}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {hubPenal.grupos.map((grupo) => {
            const Icon = getIcon(grupo.icono);
            return (
              <Link
                key={grupo.slug}
                href={`/derecho-penal/${grupo.slug}`}
                className="group block focus-visible:outline-none"
              >
                <Card padding="md" className="h-full group-hover:border-accent group-hover:shadow-md transition-all flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                    <Icon size={22} aria-hidden="true" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-[15px] text-text leading-tight group-hover:text-primary transition-colors">
                      {grupo.titulo}
                    </h3>
                    <p className="text-[13px] text-text-secondary mt-1.5 leading-relaxed">
                      {grupo.resumen}
                    </p>
                    <span className="inline-flex items-center gap-1 mt-2 text-[12px] font-semibold text-accent-dark group-hover:text-primary transition-colors">
                      Conocer más <ArrowRight size={12} />
                    </span>
                  </div>
                </Card>
              </Link>
            );
          })}
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
            Cada caso penal es distinto. Si no encuentra la información que busca
            o necesita una valoración concreta de su situación, solicite una
            consulta confidencial y le atenderemos personalmente.
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
