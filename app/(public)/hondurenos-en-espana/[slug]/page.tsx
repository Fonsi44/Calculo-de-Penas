import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight, BookOpen } from 'lucide-react';
import { site, absoluteUrl } from '@/lib/site';
import { Section, SectionHeader, Container } from '@/components/marketing/section';
import { Card } from '@/components/ui/card';
import { CTAGroup, ContactStrip } from '@/components/marketing/cta-buttons';
import { hubMigrantes, type AreaBase } from '@/data/areas-juridicas';
import { areaSchemas, migrantesHubHref } from '@/lib/schemas/legal-page';
import { getIcon } from '@/lib/icon-map';
import { ConsultationCTA } from '@/components/marketing/consultation-cta';
import { getPostsByCategory, formatDate } from '@/lib/blog';

export function generateStaticParams() {
  return hubMigrantes.subareas.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const subarea = hubMigrantes.subareas.find((s) => s.slug === slug);
  if (!subarea) return {};
  return {
    title: `${subarea.titulo} | Hondureños en España`,
    description: `${subarea.descripcion.substring(0, 160)} Consulta confidencial desde Honduras en ${site.name}, Nacaome, Valle.`,
    alternates: { canonical: `/hondurenos-en-espana/${slug}` },
  };
}

export default async function MigranteSubareaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const subarea = hubMigrantes.subareas.find((s) => s.slug === slug);
  if (!subarea) notFound();

  const url = migrantesHubHref();
  const subareaUrl = absoluteUrl(`/hondurenos-en-espana/${slug}`);
  const Icon = getIcon(subarea.icono);

  const related = subarea.areasRelacionadas
    .map((rSlug) => hubMigrantes.subareas.find((s) => s.slug === rSlug))
    .filter((a): a is AreaBase => Boolean(a));

  const ldSchemas = areaSchemas({
    service: {
      slug,
      name: `${subarea.titulo} — ${site.name}`,
      description: subarea.descripcion,
      serviceType: 'LegalService',
      keywords: subarea.keywords,
      url: subareaUrl,
    },
    faqs: subarea.faqs,
    breadcrumbs: [
      { name: 'Inicio', url: absoluteUrl('/') },
      { name: 'Hondureños en España', url },
      { name: subarea.titulo, url: subareaUrl },
    ],
    url: subareaUrl,
  });

  const blogPosts = (await getPostsByCategory('hondurenos-en-espana')).slice(0, 3);

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
              Hondureños en España
            </p>
            <h1 className="font-serif font-extrabold text-3xl md:text-4xl lg:text-5xl leading-tight">
              {subarea.titulo}
            </h1>
            <p className="mt-5 text-base md:text-lg text-text-inverse/85 leading-relaxed">
              {subarea.resumen}
            </p>
            <div className="mt-7">
              <CTAGroup variant="inverse" />
            </div>
          </div>
        </Container>
      </section>

      <Section background="default" spacing="md">
        <div className="max-w-3xl mb-8">
          <p className="text-xxs font-bold uppercase tracking-widest text-accent-dark mb-3">
            Qué hacemos
          </p>
          <h2 className="font-serif font-extrabold text-2xl md:text-3xl lg:text-4xl text-primary leading-tight">
            Servicios de {subarea.titulo.toLowerCase()}
          </h2>
          <p className="mt-4 text-sm md:text-base text-text-secondary leading-relaxed">
            {subarea.descripcion}
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {subarea.subservicios.map((s, i) => (
            <div key={i} className="flex items-start gap-4 bg-surface rounded-lg border border-border-light p-4 hover:border-accent/40 transition-colors">
              <span className="w-10 h-10 rounded-full border-2 border-accent flex items-center justify-center bg-white flex-shrink-0 mt-0.5">
                <Icon size={16} className="text-accent-dark" />
              </span>
              <div className="min-w-0 flex-1">
                <h4 className="font-bold text-sm md:text-base text-primary leading-snug">
                  {s.titulo}
                </h4>
                <p className="text-sm text-text-secondary leading-relaxed mt-1">
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
          title={`Dudas comunes sobre ${subarea.titulo.toLowerCase()}`}
          align="center"
        />
        <div className="max-w-3xl mx-auto space-y-3">
          {subarea.faqs.map((faq, i) => (
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

      {related.length > 0 && (
        <Section background="muted" spacing="md">
          <SectionHeader
            eyebrow="Áreas relacionadas"
            title="Otros servicios para migrantes que pueden interesarle"
            subtitle="Estas subáreas complementan o están vinculadas con los servicios descritos."
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {related.map((r) => {
              const RIcon = getIcon(r.icono);
              return (
                <Link key={r.slug} href={`/hondurenos-en-espana/${r.slug}`} className="group block focus-visible:outline-none">
                  <Card padding="md" className="h-full group-hover:border-accent group-hover:shadow-md transition-all">
                    <div className="w-11 h-11 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-3">
                      <RIcon size={20} aria-hidden="true" />
                    </div>
                    <h3 className="font-bold text-sm text-text leading-tight group-hover:text-primary transition-colors">
                      {r.titulo}
                    </h3>
                    <p className="text-sm text-text-secondary mt-1.5 leading-relaxed">
                      {r.resumen}
                    </p>
                    <span className="inline-flex items-center gap-1 mt-3 text-xs font-semibold text-accent-dark group-hover:text-primary transition-colors">
                      Conocer más <ArrowRight size={12} />
                    </span>
                  </Card>
                </Link>
              );
            })}
            <Link href="/hondurenos-en-espana" className="group block focus-visible:outline-none">
              <Card padding="md" className="h-full group-hover:border-accent group-hover:shadow-md transition-all">
                <div className="w-11 h-11 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-3">
                  <span className="font-extrabold text-lg">+</span>
                </div>
                <h3 className="font-bold text-sm text-text leading-tight group-hover:text-primary transition-colors">
                  Ver todos los servicios para migrantes
                </h3>
                <p className="text-sm text-text-secondary mt-1.5 leading-relaxed">
                  Volver al hub de hondureños en España para explorar todas las subáreas.
                </p>
                <span className="inline-flex items-center gap-1 mt-3 text-xs font-semibold text-accent-dark group-hover:text-primary transition-colors">
                  Conocer más <ArrowRight size={12} />
                </span>
              </Card>
            </Link>
          </div>
        </Section>
      )}

      <Section spacing="sm">
        <div className="text-center max-w-2xl mx-auto">
          {subarea.destacado && (
            <Card padding="md" className="border-l-4 border-l-accent mb-6 text-left">
              <p className="text-sm font-bold uppercase tracking-widest text-accent-dark mb-1">
                Dato destacado
              </p>
              <p className="text-sm text-text-secondary leading-relaxed">
                {subarea.destacado}
              </p>
            </Card>
          )}

        </div>
      </Section>

      <Section spacing="sm">
        <ContactStrip />
      </Section>

      {blogPosts.length > 0 && (
        <Section spacing="md">
          <SectionHeader
            eyebrow="Artículos relacionados"
            title="Aprenda más sobre trámites para hondureños en España"
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
              href="/blog/hondurenos-en-espana"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent-dark hover:text-primary transition-colors"
            >
              Ver todos los artículos de hondureños en España <ArrowRight size={16} />
            </Link>
          </div>
        </Section>
      )}

      {ldSchemas.map((schema, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      ))}
      <ConsultationCTA />
    </>
  );
}

