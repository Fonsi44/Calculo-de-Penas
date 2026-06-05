import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { site, absoluteUrl } from '@/lib/site';
import { Section, SectionHeader, Container } from '@/components/marketing/section';
import { PlaceholderPhoto } from '@/components/marketing/placeholder-photo';
import { ServiceCardPhoto } from '@/components/marketing/service-card-photo';
import { CTAGroup, ContactStrip } from '@/components/marketing/cta-buttons';
import { Card } from '@/components/ui/card';
import { areasGenerales, getAreaBySlug, type AreaStandalone } from '@/data/areas-juridicas';
import { areaHref, areaSchemas } from '@/lib/schemas/legal-page';
import { getIcon, getAreaTone } from '@/lib/icon-map';

export function generateStaticParams() {
  return areasGenerales.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const area = getAreaBySlug(slug);
  if (!area) return {};
  return {
    title: area.titulo,
    description: `${area.descripcion.substring(0, 160)} Consulta confidencial en ${site.name}, Nacaome, Valle, Honduras.`,
    alternates: { canonical: `/servicios-juridicos/${slug}` },
  };
}

export default async function AreaStandalonePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const area = getAreaBySlug(slug);
  if (!area) notFound();

  const url = areaHref(slug);
  const Icon = getIcon(area.icono);
  const tone = getAreaTone(slug);

  const related = area.areasRelacionadas
    .map((rSlug) => areasGenerales.find((a) => a.slug === rSlug))
    .filter((a): a is AreaStandalone => Boolean(a));

  const ldSchemas = areaSchemas({
    service: {
      slug,
      name: `${area.titulo} — ${site.name}`,
      description: area.descripcion,
      serviceType: 'LegalService',
      keywords: area.keywords,
      url,
    },
    faqs: area.faqs,
    breadcrumbs: [
      { name: 'Inicio', url: absoluteUrl('/') },
      { name: 'Servicios Jurídicos', url: absoluteUrl('/servicios-juridicos') },
      { name: area.titulo, url },
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
              {area.heroEyebrow}
            </p>
            <h1 className="font-serif font-extrabold text-3xl md:text-4xl lg:text-5xl leading-tight">
              {area.heroTitle}
            </h1>
            <p className="mt-5 text-base md:text-lg text-text-inverse/85 leading-relaxed">
              {area.heroSubtitle}
            </p>
            <div className="mt-7">
              <CTAGroup variant="inverse" />
            </div>
          </div>
        </Container>
      </section>

      <Section background="default" spacing="md">
        <div className="max-w-3xl">
          <p className="text-[11px] font-bold uppercase tracking-widest text-accent-dark mb-3">
            Qué hacemos
          </p>
          <h2 className="font-serif font-extrabold text-2xl md:text-3xl lg:text-4xl text-primary leading-tight">
            Servicios de {area.titulo.toLowerCase()}
          </h2>
          <p className="mt-4 text-[15px] md:text-base text-text-secondary leading-relaxed">
            {area.descripcion}
          </p>
        </div>
      </Section>

      <Section background="muted" spacing="md">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          <div>
            <PlaceholderPhoto tone={tone} aspect="4/3" label={area.titulo} rounded="xl" />
          </div>
          <div>
            <ul className="space-y-4">
              {area.subservicios.map((s, i) => (
                <li key={i} className="flex items-start gap-4">
                  <span className="w-10 h-10 rounded-full border-2 border-accent flex items-center justify-center bg-white flex-shrink-0 mt-0.5">
                    <Icon size={16} className="text-accent-dark" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-bold text-[15px] md:text-base text-primary leading-snug">
                      {s.titulo}
                    </h4>
                    <p className="text-[14px] md:text-[15px] text-text leading-relaxed mt-1">
                      {s.descripcion}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      <Section spacing="md" id="preguntas-frecuentes">
        <SectionHeader
          eyebrow="Preguntas frecuentes"
          title={`Dudas comunes sobre ${area.titulo.toLowerCase()}`}
          align="center"
        />
        <div className="max-w-3xl mx-auto space-y-3">
          {area.faqs.map((faq, i) => (
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

      {related.length > 0 && (
        <Section background="muted" spacing="md">
          <SectionHeader
            eyebrow="Áreas relacionadas"
            title="Otros servicios que pueden interesarle"
            subtitle="Estas áreas complementan o están vinculadas con los servicios descritos."
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {related.map((r) => (
              <ServiceCardPhoto
                key={r.slug}
                href={`/servicios-juridicos/${r.slug}`}
                title={r.titulo}
                description={r.resumen}
                tone={getAreaTone(r.slug)}
                aspect="16/9"
                label={r.titulo}
              />
            ))}
          </div>
        </Section>
      )}

      <Section spacing="sm">
        <div className="text-center max-w-2xl mx-auto">
          {area.destacado && (
            <Card padding="md" className="border-l-4 border-l-accent mb-6 text-left">
              <p className="text-[13px] font-bold uppercase tracking-widest text-accent-dark mb-1">
                Dato destacado
              </p>
              <p className="text-[14px] text-text-secondary leading-relaxed">
                {area.destacado}
              </p>
            </Card>
          )}
          <p className="text-text-secondary text-[14px] leading-relaxed mb-5">
            Si tiene una consulta específica sobre {area.titulo.toLowerCase()},
            estaremos encantados de atenderle. Solicite una cita y le
            orientaremos sin compromiso.
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
