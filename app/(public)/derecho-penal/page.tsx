import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { site, absoluteUrl } from '@/lib/site';
import { Section, SectionHeader } from '@/components/marketing/section';
import { Card } from '@/components/ui/card';
import { CTAGroup, ContactStrip } from '@/components/marketing/cta-buttons';
import { PageHero } from '@/components/marketing/page-hero';
import { TrustBar } from '@/components/marketing/trust-bar';
import { FeatureGrid, type FeatureItem } from '@/components/marketing/feature-grid';
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
        <FeatureGrid
          bento
          items={hubPenal.grupos.map<FeatureItem>((grupo) => {
            const Icon = getIcon(grupo.icono);
            return {
              title: grupo.titulo,
              description: grupo.resumen,
              icon: Icon,
              href: `/derecho-penal/${grupo.slug}`,
              tone: 'primary',
            };
          })}
        />
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
