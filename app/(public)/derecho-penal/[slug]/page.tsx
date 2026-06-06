import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { site, absoluteUrl } from '@/lib/site';
import { Section, SectionHeader, Container } from '@/components/marketing/section';
import { Card } from '@/components/ui/card';
import { CTAGroup, ContactStrip } from '@/components/marketing/cta-buttons';
import { hubPenal, type AreaBase } from '@/data/areas-juridicas';
import { areaSchemas, penalHubHref } from '@/lib/schemas/legal-page';
import { getIcon } from '@/lib/icon-map';

export function generateStaticParams() {
  return hubPenal.grupos.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const grupo = hubPenal.grupos.find((g) => g.slug === slug);
  if (!grupo) return {};
  return {
    title: `${grupo.titulo} | Derecho Penal`,
    description: `${grupo.descripcion.substring(0, 160)} Consulta confidencial en ${site.name}, Nacaome, Valle, Honduras.`,
    alternates: { canonical: `/derecho-penal/${slug}` },
  };
}

export default async function PenalGrupoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const grupo = hubPenal.grupos.find((g) => g.slug === slug);
  if (!grupo) notFound();

  const url = penalHubHref();
  const grupoUrl = absoluteUrl(`/derecho-penal/${slug}`);
  const Icon = getIcon(grupo.icono);

  const related = grupo.areasRelacionadas
    .map((rSlug) => hubPenal.grupos.find((g) => g.slug === rSlug))
    .filter((a): a is AreaBase => Boolean(a));

  const ldSchemas = areaSchemas({
    service: {
      slug,
      name: `${grupo.titulo} — ${site.name}`,
      description: grupo.descripcion,
      serviceType: 'LegalService',
      keywords: grupo.keywords,
      url: grupoUrl,
    },
    faqs: grupo.faqs,
    breadcrumbs: [
      { name: 'Inicio', url: absoluteUrl('/') },
      { name: 'Derecho Penal', url },
      { name: grupo.titulo, url: grupoUrl },
    ],
    url: grupoUrl,
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
              Derecho Penal
            </p>
            <h1 className="font-serif font-extrabold text-3xl md:text-4xl lg:text-5xl leading-tight">
              {grupo.titulo}
            </h1>
            <p className="mt-5 text-base md:text-lg text-text-inverse/85 leading-relaxed">
              {grupo.descripcion}
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
            Servicios de {grupo.titulo.toLowerCase()}
          </h2>
        </div>
      </Section>

      <Section background="muted" spacing="md">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {grupo.subservicios.map((s, i) => (
            <div key={i} className="flex items-start gap-4 bg-surface rounded-lg border border-border-light p-4 hover:border-accent/40 transition-colors">
              <span className="w-10 h-10 rounded-full border-2 border-accent flex items-center justify-center bg-white flex-shrink-0 mt-0.5">
                <Icon size={16} className="text-accent-dark" />
              </span>
              <div className="min-w-0 flex-1">
                <h4 className="font-bold text-[15px] md:text-base text-primary leading-snug">
                  {s.titulo}
                </h4>
                <p className="text-[14px] md:text-[15px] text-text-secondary leading-relaxed mt-1">
                  {s.descripcion}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section spacing="md" id="preguntas-frecuentes">
        <SectionHeader
          eyebrow="Preguntas frecuentes"
          title={`Dudas comunes sobre ${grupo.titulo.toLowerCase()}`}
          align="center"
        />
        <div className="max-w-3xl mx-auto space-y-3">
          {grupo.faqs.map((faq, i) => (
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

      <Section background="muted" spacing="md">
        <SectionHeader
          eyebrow="Áreas relacionadas"
          title="Otros servicios de derecho penal que pueden interesarle"
          subtitle="Estos grupos complementan o están vinculados con los servicios descritos."
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {related.map((r) => {
            const RIcon = getIcon(r.icono);
            return (
              <Link key={r.slug} href={`/derecho-penal/${r.slug}`} className="group block focus-visible:outline-none">
                <Card padding="md" className="h-full group-hover:border-accent group-hover:shadow-md transition-all">
                  <div className="w-11 h-11 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-3">
                    <RIcon size={20} aria-hidden="true" />
                  </div>
                  <h3 className="font-bold text-[15px] text-text leading-tight group-hover:text-primary transition-colors">
                    {r.titulo}
                  </h3>
                  <p className="text-[13px] text-text-secondary mt-1.5 leading-relaxed">
                    {r.resumen}
                  </p>
                  <span className="inline-flex items-center gap-1 mt-3 text-[12px] font-semibold text-accent-dark group-hover:text-primary transition-colors">
                    Conocer más <ArrowRight size={12} />
                  </span>
                </Card>
              </Link>
            );
          })}
          <Link href="/derecho-penal" className="group block focus-visible:outline-none">
            <Card padding="md" className="h-full group-hover:border-accent group-hover:shadow-md transition-all">
              <div className="w-11 h-11 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-3">
                <span className="font-extrabold text-lg">+</span>
              </div>
              <h3 className="font-bold text-[15px] text-text leading-tight group-hover:text-primary transition-colors">
                Ver todos los servicios penales
              </h3>
              <p className="text-[13px] text-text-secondary mt-1.5 leading-relaxed">
                Volver al hub de derecho penal para explorar todos los grupos especializados.
              </p>
              <span className="inline-flex items-center gap-1 mt-3 text-[12px] font-semibold text-accent-dark group-hover:text-primary transition-colors">
                Conocer más <ArrowRight size={12} />
              </span>
            </Card>
          </Link>
        </div>
      </Section>

      <Section spacing="sm">
        <div className="text-center max-w-2xl mx-auto">
          {grupo.destacado && (
            <Card padding="md" className="border-l-4 border-l-accent mb-6 text-left">
              <p className="text-[13px] font-bold uppercase tracking-widest text-accent-dark mb-1">
                Dato destacado
              </p>
              <p className="text-[14px] text-text-secondary leading-relaxed">
                {grupo.destacado}
              </p>
            </Card>
          )}
          <p className="text-text-secondary text-[14px] leading-relaxed mb-5">
            Si tiene una consulta específica sobre {grupo.titulo.toLowerCase()},
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
