import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Scale } from 'lucide-react';
import { site, absoluteUrl } from '@/lib/site';
import { Section, SectionHeader, Container } from '@/components/marketing/section';
import { Card } from '@/components/ui/card';
import { CTAGroup, ContactStrip } from '@/components/marketing/cta-buttons';
import { areasGenerales } from '@/data/areas-juridicas';
import { areaHref, breadcrumbsSchema, itemListSchema, serviceSchema } from '@/lib/schemas/legal-page';
import { getIcon } from '@/lib/icon-map';

export const metadata: Metadata = {
  title: 'Áreas Jurídicas',
  description: `Conozca las 13 áreas de práctica de ${site.name}: derecho penal, de familia, laboral, civil, mercantil, bancario, administrativo, aduanero, sanitario, extranjería, propiedad intelectual, tributario, ambiental, conciliación y arbitraje en Nacaome, Valle, Honduras.`,
  alternates: { canonical: '/areas-juridicas' },
};

export default function AreasJuridicasPage() {
  const url = absoluteUrl('/areas-juridicas');
  const breadcrumbs = breadcrumbsSchema([{ name: 'Inicio', url: absoluteUrl('/') }, { name: 'Áreas Jurídicas', url }]);
  const itemList = itemListSchema('Áreas de práctica', areasGenerales.map((a) => ({ name: a.titulo, url: areaHref(a.slug) })));
  const servSchema = serviceSchema({
    slug: 'areas-juridicas',
    name: 'Áreas Jurídicas — Pineda y Asociados',
    description: 'Bufete multidisciplinario con 13 áreas de práctica en Nacaome, Valle, Honduras.',
    serviceType: 'LegalService',
    keywords: site.keywords,
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
              Áreas Jurídicas
            </p>
            <h1 className="font-serif font-extrabold text-3xl md:text-4xl lg:text-5xl leading-tight">
              13 áreas de práctica para defender sus derechos
            </h1>
            <p className="mt-5 text-base md:text-lg text-text-inverse/85 leading-relaxed">
              Desde Nacaome, Valle, ofrecemos cobertura legal integral en{' '}
              {areasGenerales.length} disciplinas del derecho hondureño. Cada área
              está atendida con técnica, experiencia y compromiso.
            </p>
            <div className="mt-7">
              <CTAGroup variant="inverse" />
            </div>
          </div>
        </Container>
      </section>

      <Section background="muted" spacing="md">
        <SectionHeader
          eyebrow="Áreas de práctica"
          title="Cobertura legal completa en Honduras"
          subtitle="Seleccione el área que necesita y acceda a información detallada sobre nuestros servicios, subservicios y preguntas frecuentes."
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {areasGenerales.map((area) => {
            const Icon = getIcon(area.icono);
            return (
              <Link key={area.slug} href={areaHref(area.slug)} className="group block focus-visible:outline-none">
                <Card padding="md" className="h-full group-hover:border-accent group-hover:shadow-md transition-all flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                    <Icon size={22} aria-hidden="true" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-[15px] text-text leading-tight group-hover:text-primary transition-colors">
                      {area.titulo}
                    </h3>
                    <p className="text-[13px] text-text-secondary mt-1.5 leading-relaxed">
                      {area.resumen}
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

      <Section spacing="sm">
        <div className="text-center max-w-2xl mx-auto">
          <div className="w-14 h-14 mx-auto rounded-full bg-accent/15 flex items-center justify-center mb-4">
            <Scale size={24} className="text-accent-dark" />
          </div>
          <p className="text-[13px] font-bold uppercase tracking-widest text-accent-dark mb-2">
            ¿No encuentra lo que busca?
          </p>
          <p className="text-text-secondary text-[14px] leading-relaxed mb-5">
            Cada caso es único. Si su situación no encaja exactamente en una de las
            áreas descritas, consúltenos sin compromiso. Analizaremos su caso y le
            orientaremos sobre la vía legal más adecuada.
          </p>
          <Link
            href="/solicitar-consulta"
            className="inline-flex items-center gap-2 h-12 px-6 rounded-md bg-aggravation text-white text-base font-bold hover:opacity-90 transition-opacity"
          >
            Solicitar consulta confidencial <ArrowRight size={18} />
          </Link>
        </div>
      </Section>

      <Section background="muted" spacing="sm">
        <ContactStrip />
      </Section>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemList) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(servSchema) }} />
    </>
  );
}
