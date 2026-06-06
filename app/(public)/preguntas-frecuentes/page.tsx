import type { Metadata } from 'next';
import { ChevronDown, HelpCircle, MessageCircle, ArrowRight } from 'lucide-react';
import { site } from '@/lib/site';
import { Section, SectionHeader, Container } from '@/components/marketing/section';
import { CTAGroup, ContactStrip } from '@/components/marketing/cta-buttons';
import { categoriasFaq, totalPreguntas } from '@/data/faq';
import { faqPageSchema } from '@/lib/schemas/legal-page';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Preguntas Frecuentes',
  description: `Respuestas a las preguntas más frecuentes sobre defensa penal, derecho de familia, laboral, civil, mercantil y más en Honduras. Resuelva sus dudas legales con ${site.name}.`,
  alternates: { canonical: '/preguntas-frecuentes' },
};

export default function FaqPage() {
  const flatFaqs = categoriasFaq.flatMap((c) =>
    c.preguntas.map((p) => ({ pregunta: p.pregunta, respuesta: p.respuesta })),
  );

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Inicio', item: site.url },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Preguntas Frecuentes',
        item: `${site.url}/preguntas-frecuentes`,
      },
    ],
  };

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
              Preguntas Frecuentes
            </p>
            <h1 className="font-serif font-extrabold text-3xl md:text-4xl lg:text-5xl leading-tight">
              Resuelva sus dudas legales
            </h1>
            <p className="mt-5 text-base md:text-lg text-text-inverse/85 leading-relaxed">
              {totalPreguntas} preguntas organizadas en {categoriasFaq.length} categorías.
              Encuentre respuestas claras y prácticas sobre el sistema legal hondureño.
            </p>
            <div className="mt-7">
              <CTAGroup variant="inverse" />
            </div>
          </div>
        </Container>
      </section>

      <Section spacing="sm">
        <div className="flex flex-wrap gap-2 justify-center">
          {categoriasFaq.map((cat) => (
            <Link
              key={cat.slug}
              href={`#${cat.slug}`}
              className="inline-flex items-center gap-1.5 h-9 px-4 rounded-full bg-surface-alt text-[13px] font-medium text-text-secondary hover:bg-accent/20 hover:text-accent-dark transition-colors"
            >
              <HelpCircle size={14} />
              {cat.titulo}
              <span className="text-[11px] text-text-muted ml-1">({cat.preguntas.length})</span>
            </Link>
          ))}
        </div>
      </Section>

      {categoriasFaq.map((cat) => (
        <Section
          key={cat.slug}
          id={cat.slug}
          background={categoriasFaq.indexOf(cat) % 2 === 0 ? 'default' : 'muted'}
          spacing="md"
        >
          <SectionHeader
            eyebrow={cat.titulo}
            title={cat.descripcion}
          />
          <div className="space-y-3">
            {cat.preguntas.map((p, i) => (
              <details
                key={i}
                className="group bg-background rounded-lg border border-border hover:border-accent/40 transition-colors open:border-accent/60"
              >
                <summary className="flex items-center justify-between gap-3 cursor-pointer list-none px-5 py-4 text-[15px] font-semibold text-text leading-snug hover:text-primary transition-colors">
                  <span className="flex-1">{p.pregunta}</span>
                  <ChevronDown
                    size={18}
                    className="text-text-muted flex-shrink-0 transition-transform duration-200 group-open:rotate-180"
                  />
                </summary>
                <div className="px-5 pb-4 pt-0">
                  <div className="border-t border-border/50 pt-3">
                    <p className="text-[14px] text-text-secondary leading-relaxed">
                      {p.respuesta}
                    </p>
                  </div>
                </div>
              </details>
            ))}
          </div>
        </Section>
      ))}

      <Section background="primary" spacing="md">
        <SectionHeader
          eyebrow="¿No encontró su pregunta?"
          title="Estamos listos para ayudarle"
          subtitle="Cada caso es único. Si su duda no está aquí, contáctenos para recibir atención personalizada."
          align="center"
          invert
        />
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-2">
          <Link
            href="/solicitar-consulta"
            className="inline-flex items-center gap-2 h-12 px-6 rounded-md bg-aggravation text-white text-base font-bold hover:opacity-90 transition-opacity"
          >
            Solicitar consulta <ArrowRight size={18} />
          </Link>
          <Link
            href="/contacto"
            className="inline-flex items-center gap-2 h-12 px-6 rounded-md bg-white/15 text-white text-base font-semibold hover:bg-white/25 transition-colors"
          >
            <MessageCircle size={18} />
            Ir a contacto
          </Link>
        </div>
      </Section>

      <Section spacing="md">
        <SectionHeader
          eyebrow="Contacto directo"
          title="Hable hoy con un abogado"
        />
        <ContactStrip />
      </Section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            faqPageSchema(flatFaqs, `${site.url}/preguntas-frecuentes`),
            breadcrumbLd,
          ]),
        }}
      />
    </>
  );
}
