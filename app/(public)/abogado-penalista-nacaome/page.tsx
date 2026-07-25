import type { Metadata } from 'next';
import { site, absoluteUrl, whatsappHref, telHref } from '@/lib/site';
import { Section, SectionHeader, Container } from '@/components/marketing/section';
import { Card } from '@/components/ui/card';
import { CTAGroup } from '@/components/marketing/cta-buttons';
import { BlogHighlights } from '@/components/marketing/blog-highlights';
import { RelatedCities } from '@/components/marketing/related-links';
import { Scale, Shield, Clock, Gavel, Phone } from 'lucide-react';

export const metadata: Metadata = {
  title: { absolute: 'Abogado Penalista Nacaome | Pineda y Asociados' },
  description:
    'Abogado penalista en Nacaome, Valle. Defensa en audiencias, medidas cautelares, juicio oral y recursos. Atención urgente para detenidos.',
  alternates: { canonical: '/abogado-penalista-nacaome' },
  keywords: [
    'abogado penalista Nacaome',
    'defensa penal Nacaome',
    'abogado penal Valle Honduras',
    'asistencia a detenidos Nacaome',
    'audiencia inicial Nacaome',
  ],
  openGraph: {
    title: 'Abogado Penalista en Nacaome | Defensa Urgente 24/7 · Valle',
    description:
      'Abogado penalista en Nacaome, Valle. Defensa en audiencias, medidas cautelares, juicio oral y recursos. Atención urgente para detenidos.',
    url: '/abogado-penalista-nacaome',
    siteName: site.name,
    locale: 'es_HN',
    type: 'website',
    images: [{ url: '/og/nacaome.webp', width: 1200, height: 630, alt: 'Abogado Penalista en Nacaome' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Abogado Penalista en Nacaome | Defensa Urgente 24/7 · Valle',
    description:
      'Abogado penalista en Nacaome, Valle. Defensa en audiencias, medidas cautelares, juicio oral y recursos. Atención urgente para detenidos.',
    images: ['/og/nacaome.webp'],
  },
};

const whatsappMsg = 'Necesito un abogado penalista urgente en Nacaome. Vi su sitio web.';

export default async function AbogadoPenalistaNacaomePage() {
  const canonical = '/abogado-penalista-nacaome';
  const url = absoluteUrl(canonical);

  return (
    <>
      {/* Hero */}
      <section className="bg-primary text-text-inverse py-16 md:py-20">
        <Container>
          <p className="text-xxs font-bold uppercase tracking-widest text-accent mb-3">
            Defensa penal · Nacaome, Valle
          </p>
          <h1 className="font-serif font-extrabold text-3xl md:text-4xl lg:text-5xl mb-4">
            Abogado Penalista en Nacaome
          </h1>
          <p className="text-base md:text-lg text-text-inverse/85 max-w-3xl mb-8">
            Defensa técnica inmediata conforme al Código Penal hondureño. Asistencia desde la detención,
            audiencia inicial y hasta el juicio oral. Más de 15 años de ejercicio profesional en el
            sur de Honduras.
          </p>
          <CTAGroup variant="inverse" message={whatsappMsg} />
        </Container>
      </section>

      {/* Intro */}
      <Section background="default" spacing="md">
        <h2 className="font-serif font-extrabold text-2xl md:text-3xl text-primary mb-4">
          Defensa Penal en Nacaome, Valle
        </h2>
        <p className="text-text-secondary leading-relaxed max-w-3xl">
          Enfrentar un proceso penal en Honduras sin defensa técnica puede tener consecuencias graves.
          La Constitución garantiza el derecho a un abogado desde el primer momento de la detención
          y a ser presentado ante un juez en un plazo máximo de 24 horas. En Pineda y Asociados,
          asumimos su defensa con estrategia, conocimiento del Código Penal (Decreto 130-2017 y
          reformas) y presencia en los juzgados de Nacaome, Choluteca y San Lorenzo.
        </p>
      </Section>

      {/* Servicios */}
      <Section background="muted" spacing="md">
        <SectionHeader
          eyebrow="Servicios penales"
          title="Áreas de defensa penal en Nacaome"
          subtitle="Cubrimos todas las etapas del proceso penal hondureño, desde la investigación hasta los recursos de casación."
        />
        <div className="grid sm:grid-cols-2 gap-4 mt-6">
          {[
            { icon: Shield, title: 'Asistencia a detenidos', desc: 'Presencia inmediata ante la Fiscalía. Hábeas corpus, control de detención y defensa en la audiencia inicial.' },
            { icon: Gavel, title: 'Juicio oral y audiencias', desc: 'Representación en audiencia inicial, preliminar, de sobreseimiento y juicio oral ante los tribunales de sentencia.' },
            { icon: Scale, title: 'Recursos y apelaciones', desc: 'Interposición de recursos de apelación y casación contra sentencias penales condenatorias.' },
            { icon: Clock, title: 'Medidas cautelares', desc: 'Defensa contra la prisión preventiva. Solicitud de medidas sustitutivas, fianzas y revisión de oficio.' },
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

      {/* FAQ */}
      <Section spacing="md" id="preguntas-frecuentes">
        <SectionHeader
          align="center"
          eyebrow="Preguntas frecuentes"
          title="Lo que debe saber sobre defensa penal"
          subtitle="Respuestas a las dudas más comunes de nuestros clientes en Nacaome."
        />
        <div className="space-y-3 mt-6 max-w-3xl mx-auto">
          {[
            { q: '¿Qué hacer si me detienen en Nacaome?', a: `Tiene derecho a un abogado desde el primer momento. No declare sin representación legal. Contáctenos por WhatsApp al ${site.whatsappDisplay} y acudimos de inmediato.` },
            { q: '¿Cuánto cuesta un abogado penalista en Nacaome?', a: 'Ofrecemos una primera consulta sin costo para evaluar su caso. Tras el análisis, le entregamos un presupuesto por escrito. Los honorarios dependen de la complejidad y etapa del proceso.' },
            { q: '¿Atienden emergencias penales 24 horas?', a: 'Sí. En caso de detención o urgencia penal, contáctenos por WhatsApp a cualquier hora. La defensa en las primeras horas es decisiva para el resultado del caso.' },
            { q: '¿Qué delitos defienden?', a: 'Defendemos todo tipo de delitos del Código Penal hondureño: homicidio, hurto, robo, estafa, lesiones, delitos sexuales, narcotráfico, lavado de activos, extorsión, portación ilegal de armas, violencia doméstica y más.' },
            { q: '¿Cómo funciona el proceso penal en Honduras?', a: 'El proceso penal tiene tres etapas: investigación (Fiscalía), etapa intermedia (audiencia preliminar) y juicio oral. La defensa técnica puede lograr un sobreseimiento definitivo desde la etapa inicial.' },
          ].map((faq) => (
            <Card key={faq.q} padding="md" className="border-l-4 border-l-accent">
              <p className="text-sm font-semibold text-text mb-1">{faq.q}</p>
              <p className="text-sm text-text-secondary leading-relaxed">{faq.a}</p>
            </Card>
          ))}
        </div>
      </Section>

      {/* CTA final */}
      <Section background="muted" spacing="md">
        <Card padding="lg" className="max-w-3xl mx-auto text-center border-accent/30">
          <p className="text-xxs font-bold uppercase tracking-wider text-accent-dark mb-2">
            Consulta penal confidencial en Nacaome
          </p>
          <h2 className="font-serif font-extrabold text-2xl md:text-3xl text-primary mb-3">
            ¿Necesita defensa penal inmediata?
          </h2>
          <p className="text-text-secondary max-w-lg mx-auto mb-6">
            Las primeras 24 horas tras una detención son determinantes. Hable hoy con un abogado
            penalista que conoce los juzgados de Nacaome, Valle y la zona sur.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href={whatsappHref('Necesito defensa penal urgente en Nacaome.')}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-shadow-success h-12 px-5 rounded-lg bg-success text-white font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90"
            >
              WhatsApp — Defensa urgente
            </a>
            <a
              href="/solicitar-consulta#formulario"
              className="btn-shimmer btn-shadow-accent h-12 px-5 rounded-lg bg-accent text-primary font-semibold text-sm flex items-center justify-center gap-2"
            >
              Solicitar consulta penal
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
          'defensa-penal-honduras',
          'que-hacer-si-me-detienen-en-honduras',
          'derechos-detenido-honduras-guia-constitucional',
          'medidas-sustitutivas-prision-preventiva-honduras',
          'audiencia-inicial-proceso-penal-honduras',
          'cuando-necesito-abogado-penalista-honduras',
          'abogado-penalista-sur-honduras',
          'delitos-mas-comunes-honduras',
        ]}
        eyebrow="Guías de derecho penal"
        title="Todo sobre defensa penal en Honduras"
        subtitle="Guías prácticas sobre el proceso penal, derechos del detenido, medidas cautelares y estrategia de defensa."
        ctaLabel="Ver todas las guías de derecho penal"
        ctaHref="/blog/derecho-penal"
      />

      {/* ENLAZADO INTERNO (Fase 3.7) — reconecta esta landing de cargo al
          grafo del sitio. Antes era una hoja huérfana. */}
      <Section spacing="sm">
        <Container size="lg">
          <RelatedCities mentionedCitySlug="nacaome" limit={6} eyebrow="Atendemos en el sur de Honduras" />
        </Container>
      </Section>

      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            {
              '@context': 'https://schema.org',
              '@type': 'WebPage',
              '@id': `${url}/#webpage`,
              url,
              name: 'Abogado Penalista en Nacaome | Defensa Urgente 24/7 · Valle',
              description:
                'Abogado penalista en Nacaome, Valle. Defensa penal urgente, detenciones, audiencias. 15+ años de experiencia. Consulta sin costo.',
              isPartOf: { '@id': `${site.url}/#website` },
              about: { '@id': `${site.url}/#legal-service` },
            },
            {
              '@context': 'https://schema.org',
              '@type': 'FAQPage',
              '@id': `${url}/#faqpage`,
              mainEntity: [
                { '@type': 'Question', name: '¿Qué hacer si me detienen en Nacaome?', acceptedAnswer: { '@type': 'Answer', text: `Tiene derecho a un abogado desde el primer momento. No declare sin representación legal. Contáctenos por WhatsApp al ${site.whatsappDisplay} y acudimos de inmediato.` } },
                { '@type': 'Question', name: '¿Cuánto cuesta un abogado penalista en Nacaome?', acceptedAnswer: { '@type': 'Answer', text: 'Ofrecemos una primera consulta sin costo para evaluar su caso. Tras el análisis, le entregamos un presupuesto por escrito.' } },
                { '@type': 'Question', name: '¿Atienden emergencias penales 24 horas?', acceptedAnswer: { '@type': 'Answer', text: 'Sí. En caso de detención o urgencia penal, contáctenos por WhatsApp a cualquier hora.' } },
                { '@type': 'Question', name: '¿Qué delitos defienden?', acceptedAnswer: { '@type': 'Answer', text: 'Defendemos todo tipo de delitos del Código Penal hondureño: homicidio, hurto, robo, estafa, lesiones, delitos sexuales, narcotráfico, lavado de activos, extorsión y más.' } },
                { '@type': 'Question', name: '¿Cómo funciona el proceso penal en Honduras?', acceptedAnswer: { '@type': 'Answer', text: 'El proceso penal tiene tres etapas: investigación (Fiscalía), etapa intermedia (audiencia preliminar) y juicio oral.' } },
              ],
            },
            {
              '@context': 'https://schema.org',
              '@type': 'BreadcrumbList',
              itemListElement: [
                { '@type': 'ListItem', position: 1, name: 'Inicio', item: site.url },
                { '@type': 'ListItem', position: 2, name: 'Abogado Penalista en Nacaome', item: url },
              ],
            },
          ]),
        }}
      />
    </>
  );
}
