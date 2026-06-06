import type { Metadata } from 'next';
import { ChevronDown, HelpCircle, MessageCircle, ArrowRight } from 'lucide-react';
import { site } from '@/lib/site';
import { Section, SectionHeader } from '@/components/marketing/section';
import { CTAGroup, ContactStrip } from '@/components/marketing/cta-buttons';
import { categoriasFaq, totalPreguntas } from '@/data/faq';
import { faqPageSchema } from '@/lib/schemas/legal-page';
import { PageHero } from '@/components/marketing/page-hero';
import { TrustBar } from '@/components/marketing/trust-bar';
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
      <PageHero
        eyebrow="Preguntas Frecuentes"
        badge="13 áreas del derecho"
        title="Resuelva sus dudas legales"
        subtitle={
          <>
            {totalPreguntas} preguntas organizadas en {categoriasFaq.length} categorías.
            Respuestas claras y prácticas sobre el sistema legal hondureño para
            <strong className="font-bold text-accent"> defensa penal</strong>,
            familia, laboral, civil, mercantil, tributario, bancario, administrativo,
            aduanero, sanitario, extranjería, propiedad intelectual, ambiental y
            conciliación/arbitraje.
          </>
        }
        cta={<CTAGroup variant="inverse" />}
      />

      <TrustBar background="light" />

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
                className="faq-anim group bg-background rounded-lg border border-border hover:border-accent/40 transition-colors open:border-accent/60 card-premium"
              >
                <summary className="flex items-center justify-between gap-3 cursor-pointer list-none px-5 py-4 text-[15px] font-semibold text-text leading-snug hover:text-primary transition-colors">
                  <span className="flex-1">{p.pregunta}</span>
                  <ChevronDown
                    size={18}
                    className="text-text-muted flex-shrink-0 transition-transform duration-200 group-open:rotate-180 group-open:text-accent"
                  />
                </summary>
                <div className="faq-content">
                  <div className="border-t border-border/50 pt-3">
                    <p className="text-[14px] text-text-secondary leading-relaxed text-pretty">
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
