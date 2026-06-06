import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { site, absoluteUrl } from '@/lib/site';
import { Section, SectionHeader, Container } from '@/components/marketing/section';
import { Card } from '@/components/ui/card';
import { CTAGroup, ContactStrip } from '@/components/marketing/cta-buttons';
import { hubMigrantes } from '@/data/areas-juridicas';
import { areaSchemas } from '@/lib/schemas/legal-page';
import { getIcon } from '@/lib/icon-map';

export function generateStaticParams() {
  return hubMigrantes.subareas.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const sub = hubMigrantes.subareas.find((s) => s.slug === slug);
  if (!sub) return {};
  return {
    title: `${sub.titulo} | Hondureños en España`,
    description: `${sub.descripcion.substring(0, 160)} Asistencia legal transnacional Honduras-España en ${site.name}.`,
    alternates: { canonical: `/hondurenos-en-espana/${slug}` },
  };
}

export default async function HondurenoSubareaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const sub = hubMigrantes.subareas.find((s) => s.slug === slug);
  if (!sub) notFound();

  const hubUrl = absoluteUrl('/hondurenos-en-espana');
  const subUrl = absoluteUrl(`/hondurenos-en-espana/${slug}`);
  const Icon = getIcon(sub.icono);

  const related = hubMigrantes.subareas
    .filter((s) => s.slug !== slug)
    .slice(0, 3);

  const ldSchemas = areaSchemas({
    service: {
      slug,
      name: `${sub.titulo} — ${site.name}`,
      description: sub.descripcion,
      serviceType: 'LegalService',
      keywords: sub.keywords,
      url: subUrl,
    },
    faqs: sub.faqs,
    breadcrumbs: [
      { name: 'Inicio', url: absoluteUrl('/') },
      { name: 'Hondureños en España', url: hubUrl },
      { name: sub.titulo, url: subUrl },
    ],
    url: subUrl,
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
              Hondureños en España
            </p>
            <h1 className="font-serif font-extrabold text-3xl md:text-4xl lg:text-5xl leading-tight">
              {sub.titulo}
            </h1>
            <p className="mt-5 text-base md:text-lg text-text-inverse/85 leading-relaxed">
              {sub.descripcion}
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
            Servicios de {sub.titulo.toLowerCase()}
          </h2>
        </div>
      </Section>

      <Section background="muted" spacing="md">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {sub.subservicios.map((s, i) => (
            <div
              key={i}
              className="flex items-start gap-4 bg-white rounded-lg border border-slate-100 p-4 hover:border-accent/40 transition-colors"
            >
              <span className="w-10 h-10 rounded-full border-2 border-accent flex items-center justify-center bg-white flex-shrink-0 mt-0.5">
                <Icon size={16} className="text-accent-dark" />
              </span>
              <div className="min-w-0 flex-1">
                <h4 className="font-bold text-[15px] md:text-base text-text leading-snug">
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

      {sub.faqs.length > 0 && (
        <Section spacing="md" id="preguntas-frecuentes">
          <SectionHeader
            eyebrow="Preguntas frecuentes"
            title={`Dudas comunes sobre ${sub.titulo.toLowerCase()}`}
            align="center"
          />
          <div className="max-w-3xl mx-auto space-y-3">
            {sub.faqs.map((faq, i) => (
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
      )}

      {related.length > 0 && (
        <Section background="muted" spacing="md">
          <SectionHeader
            eyebrow="Servicios relacionados"
            title="Otros servicios para hondureños en España"
            subtitle="Estos servicios complementan o están vinculados con el área que está consultando."
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {related.map((r) => {
              const RIcon = getIcon(r.icono);
              return (
                <Link
                  key={r.slug}
                  href={`/hondurenos-en-espana/${r.slug}`}
                  className="card-premium group block overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-premium focus-visible:outline-none"
                >
                  <div className="p-5">
                    <div className="mb-3 flex items-center gap-2.5">
                      <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                        <RIcon size={18} aria-hidden="true" />
                      </div>
                      <h3 className="text-base font-bold text-text leading-tight">{r.titulo}</h3>
                    </div>
                    <p className="text-[13px] text-text-secondary leading-relaxed text-pretty">
                      {r.resumen}
                    </p>
                    <div className="mt-4 flex items-center gap-1.5 text-[12px] font-bold text-primary group-hover:text-accent-dark transition-colors">
                      Conocer más
                      <ArrowRight size={14} aria-hidden="true" className="transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </Section>
      )}

      <Section spacing="sm">
        <div className="text-center max-w-2xl mx-auto">
          <p className="text-text-secondary text-[14px] leading-relaxed mb-5">
            Si tiene una consulta específica sobre {sub.titulo.toLowerCase()},
            estaremos encantados de atenderle. Solicite una cita y le
            orientaremos sin compromiso.
          </p>
          <Link
            href="/solicitar-consulta"
            className="inline-flex items-center gap-2 h-12 px-6 rounded-md bg-primary text-white text-base font-bold hover:bg-primary-light transition-colors"
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
