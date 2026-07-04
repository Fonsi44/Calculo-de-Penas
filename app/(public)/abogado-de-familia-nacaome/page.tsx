import type { Metadata } from 'next';
import { site, absoluteUrl, whatsappHref, telHref } from '@/lib/site';
import { Section, SectionHeader, Container } from '@/components/marketing/section';
import { Card } from '@/components/ui/card';
import { CTAGroup } from '@/components/marketing/cta-buttons';
import { BlogHighlights } from '@/components/marketing/blog-highlights';
import { RelatedCities } from '@/components/marketing/related-links';
import { Heart, Users, Baby, FileText, Phone } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Abogado de Familia en Nacaome | Pensión, Custodia y Divorcio',
  description:
    'Abogado de familia en Nacaome, Valle. Pensión alimenticia, custodia, divorcios. 15+ años de experiencia. Consulta sin costo. WhatsApp +504 9536-3724.',
  alternates: { canonical: '/abogado-de-familia-nacaome' },
  keywords: [
    'abogado de familia Nacaome',
    'divorcio Nacaome',
    'custodia hijos Nacaome',
    'pensión alimenticia Nacaome',
    'abogado familia Valle Honduras',
  ],
  openGraph: {
    title: 'Abogado de Familia en Nacaome | Pensión, Custodia y Divorcio',
    description:
      'Abogado de familia en Nacaome, Valle. Pensión alimenticia, custodia, divorcios. 15+ años de experiencia. Consulta sin costo.',
    url: '/abogado-de-familia-nacaome',
    siteName: site.name,
    locale: 'es_HN',
    type: 'website',
    images: [{ url: '/og/nacaome.webp', width: 1200, height: 630, alt: 'Abogado de Familia en Nacaome' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Abogado de Familia en Nacaome | Pensión, Custodia y Divorcio',
    description:
      'Abogado de familia en Nacaome, Valle. Pensión alimenticia, custodia, divorcios. 15+ años de experiencia. Consulta sin costo.',
    images: ['/og/nacaome.webp'],
  },
};

const whatsappMsg = 'Necesito un abogado de familia en Nacaome. Vi su sitio web.';

export default async function AbogadoDeFamiliaNacaomePage() {
  const canonical = '/abogado-de-familia-nacaome';
  const url = absoluteUrl(canonical);

  return (
    <>
      <section className="bg-primary text-text-inverse py-16 md:py-20">
        <Container>
          <p className="text-xxs font-bold uppercase tracking-widest text-accent mb-3">
            Derecho de familia · Nacaome, Valle
          </p>
          <h1 className="font-serif font-extrabold text-3xl md:text-4xl lg:text-5xl mb-4">
            Abogado de Familia en Nacaome
          </h1>
          <p className="text-base md:text-lg text-text-inverse/85 max-w-3xl mb-8">
            Divorcios, custodia de menores, pensión alimenticia, régimen de visitas y adopciones.
            Asesoría legal con sensibilidad y discreción en los juzgados de familia de Nacaome y
            la zona sur de Honduras.
          </p>
          <CTAGroup variant="inverse" message={whatsappMsg} />
        </Container>
      </section>

      <Section background="default" spacing="md">
        <h2 className="font-serif font-extrabold text-2xl md:text-3xl text-primary mb-4">
          Derecho de Familia en Nacaome, Valle
        </h2>
        <p className="text-text-secondary leading-relaxed max-w-3xl">
          Los asuntos de familia requieren un enfoque humano y una defensa técnica sólida. El
          Código de Familia de Honduras regula divorcios, pensiones alimenticias, custodia de
          menores y adopciones. En Pineda y Asociados, le acompañamos en cada etapa del proceso
          con confidencialidad y respeto por la situación personal de cada cliente.
        </p>
      </Section>

      <Section background="muted" spacing="md">
        <SectionHeader
          eyebrow="Servicios de familia"
          title="Áreas de práctica en derecho de familia"
          subtitle="Asesoría integral en procesos familiares ante los juzgados de Nacaome y Choluteca."
        />
        <div className="grid sm:grid-cols-2 gap-4 mt-6">
          {[
            { icon: Heart, title: 'Divorcios', desc: 'Divorcio por mutuo consentimiento, contencioso y express. Asesoría en disolución de la sociedad conyugal y liquidación de bienes.' },
            { icon: Users, title: 'Custodia y visitas', desc: 'Defensa de la custodia de menores, régimen de visitas para el progenitor no custodio y modificación de medidas.' },
            { icon: Baby, title: 'Pensión alimenticia', desc: 'Fijación, modificación y ejecución de pensión alimenticia. Cálculo del porcentaje según ingresos y número de hijos.' },
            { icon: FileText, title: 'Adopciones y tutelas', desc: 'Trámites de adopción nacional, declaración de idoneidad y procedimientos ante el Juzgado de Familia y DINAF.' },
          ].map((s) => (
            <Card key={s.title} padding="md" className="border-l-4 border-l-accent/40">
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-lg border border-accent/30 bg-accent/10 flex items-center justify-center shrink-0">
                  <s.icon size={20} className="text-accent-dark" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-text mb-1">{s.title}</h3>
                  <p className="text-sm text-text-secondary leading-relaxed">{s.desc}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </Section>

      <Section spacing="md" id="preguntas-frecuentes">
        <SectionHeader
          align="center"
          eyebrow="Preguntas frecuentes"
          title="Lo que debe saber sobre derecho de familia"
        />
        <div className="space-y-3 mt-6 max-w-3xl mx-auto">
          {[
            { q: '¿Cuánto cuesta un divorcio en Nacaome?', a: 'El costo depende del tipo de divorcio. El divorcio por mutuo consentimiento es el más rápido y económico. Solicite una consulta sin costo para recibir un presupuesto por escrito adaptado a su caso.' },
            { q: '¿Cómo se calcula la pensión alimenticia?', a: 'El juez fija un porcentaje del salario del obligado según el número de hijos y las necesidades del menor. En Honduras, oscila típicamente entre el 15% y el 50% del ingreso neto, según las circunstancias.' },
            { q: '¿Quién se queda con la custodia de los hijos?', a: 'El juez decide según el interés superior del menor. Puede otorgar custodia exclusiva a uno de los padres o custodia compartida. Se evalúan factores como la estabilidad, el entorno y la capacidad de cada progenitor.' },
            { q: '¿Puedo divorciarme si mi cónyuge no quiere?', a: 'Sí. El divorcio contencioso procede aunque uno de los cónyuges no esté de acuerdo. Se requiere invocar una causal legal del Código de Familia. Un abogado le guiará en el proceso.' },
            { q: '¿Qué documentos necesito para un divorcio?', a: 'Acta de matrimonio certificada, actas de nacimiento de los hijos (si los hay), documentos de identidad de ambos cónyuges, y si hay bienes, documentos de propiedad o escrituras.' },
          ].map((faq) => (
            <Card key={faq.q} padding="md" className="border-l-4 border-l-accent">
              <p className="text-sm font-semibold text-text mb-1">{faq.q}</p>
              <p className="text-sm text-text-secondary leading-relaxed">{faq.a}</p>
            </Card>
          ))}
        </div>
      </Section>

      <Section background="muted" spacing="md">
        <Card padding="lg" className="max-w-3xl mx-auto text-center border-accent/30">
          <p className="text-xxs font-bold uppercase tracking-wider text-accent-dark mb-2">
            Consulta familiar confidencial en Nacaome
          </p>
          <h2 className="font-serif font-extrabold text-2xl md:text-3xl text-primary mb-3">
            ¿Necesita orientación en un asunto de familia?
          </h2>
          <p className="text-text-secondary max-w-lg mx-auto mb-6">
            Divorcio, custodia, pensión alimenticia o adopción. Hable con un abogado de familia
            que trata su caso con la sensibilidad y discreción que merece.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href={whatsappHref('Necesito un abogado de familia para divorcio o custodia.')}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-shadow-success h-12 px-5 rounded-lg bg-success text-white font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90"
            >
              WhatsApp — Consultar ahora
            </a>
            <a
              href="/solicitar-consulta#formulario"
              className="btn-shimmer btn-shadow-accent h-12 px-5 rounded-lg bg-accent text-primary font-semibold text-sm flex items-center justify-center gap-2"
            >
              Solicitar consulta familiar
            </a>
            <a
              href={telHref()}
              className="btn-shadow-secondary btn-shadow-secondary-hover h-12 px-5 rounded-lg bg-surface border border-border-strong text-primary font-semibold text-sm flex items-center justify-center gap-2 hover:border-accent transition-colors"
            >
              <Phone size={18} aria-hidden="true" />
              Llamar ahora
            </a>
          </div>
        </Card>
      </Section>

      <BlogHighlights
        slugs={[
          'divorcio-honduras-guia-completa',
          'pension-alimenticia-honduras-guia-completa',
          'custodia-hijos-honduras-juez',
          'pension-alimenticia-porcentaje-honduras-2026',
          'union-de-hecho-requisitos-derechos-honduras',
          'adopcion-requisitos-proceso-honduras',
          'divorcio-choluteca',
          'pension-alimenticia-choluteca',
        ]}
        eyebrow="Guías de derecho de familia"
        title="Todo sobre derecho de familia en Honduras"
        subtitle="Guías prácticas sobre divorcios, pensión alimenticia, custodia de menores y más."
        ctaLabel="Ver todas las guías de derecho de familia"
        ctaHref="/blog/derecho-de-familia"
      />

      {/* ENLAZADO INTERNO (Fase 3.7) — reconecta esta landing de cargo al
          grafo del sitio. Antes era una hoja huérfana. */}
      <Section spacing="sm">
        <Container size="lg">
          <RelatedCities mentionedCitySlug="nacaome" limit={6} eyebrow="Atendemos en el sur de Honduras" />
        </Container>
      </Section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            {
              '@context': 'https://schema.org',
              '@type': 'WebPage',
              '@id': `${url}#webpage`,
              url,
              name: 'Abogado de Familia en Nacaome | Pensión, Custodia y Divorcio',
              isPartOf: { '@id': `${site.url}#website` },
              about: { '@id': `${site.url}#legal-service` },
            },
            {
              '@context': 'https://schema.org',
              '@type': 'FAQPage',
              '@id': `${url}#faqpage`,
              mainEntity: [
                { '@type': 'Question', name: '¿Cuánto cuesta un divorcio en Nacaome?', acceptedAnswer: { '@type': 'Answer', text: 'Depende del tipo de divorcio. Solicite una consulta sin costo para recibir un presupuesto por escrito.' } },
                { '@type': 'Question', name: '¿Cómo se calcula la pensión alimenticia?', acceptedAnswer: { '@type': 'Answer', text: 'El juez fija un porcentaje del salario según el número de hijos. En Honduras oscila entre el 15% y el 50% del ingreso neto.' } },
                { '@type': 'Question', name: '¿Quién se queda con la custodia?', acceptedAnswer: { '@type': 'Answer', text: 'El juez decide según el interés superior del menor. Puede ser custodia exclusiva o compartida.' } },
                { '@type': 'Question', name: '¿Puedo divorciarme si mi cónyuge no quiere?', acceptedAnswer: { '@type': 'Answer', text: 'Sí. El divorcio contencioso procede aunque uno de los cónyuges no esté de acuerdo.' } },
                { '@type': 'Question', name: '¿Qué documentos necesito para un divorcio?', acceptedAnswer: { '@type': 'Answer', text: 'Acta de matrimonio, actas de nacimiento de hijos, documentos de identidad y documentos de propiedad.' } },
              ],
            },
            {
              '@context': 'https://schema.org',
              '@type': 'BreadcrumbList',
              itemListElement: [
                { '@type': 'ListItem', position: 1, name: 'Inicio', item: site.url },
                { '@type': 'ListItem', position: 2, name: 'Abogado de Familia en Nacaome', item: url },
              ],
            },
          ]),
        }}
      />
    </>
  );
}
