import type { Metadata } from 'next';
import Link from 'next/link';
import { site, absoluteUrl, whatsappHref, telHref } from '@/lib/site';
import { Section, SectionHeader, Container } from '@/components/marketing/section';
import { Card } from '@/components/ui/card';
import { CTAGroup } from '@/components/marketing/cta-buttons';
import { Breadcrumbs } from '@/components/marketing/breadcrumbs';
import { Scale, Shield, Clock, Gavel, Phone, MapPin } from 'lucide-react';
import { ConsultationCTA } from '@/components/marketing/consultation-cta';
import { RelatedCities } from '@/components/marketing/related-links';

/**
 * Landing comercial — Abogado Penalista en Choluteca.
 *
 * Antes esta URL redirigía a un post editorial (audit SEO Jul 2026, C8).
 * La intención comercial "abogado penalista Choluteca" requiere una landing
 * propia con CTA, NAP coherente, FAQ local y enlaces hacia el hub penal.
 *
 * Datos verificables (R4 — no inventar):
 *   - Sede física única: Nacaome (a ~52 km de Choluteca).
 *   - Cobertura declarada en areaServed (lib/site.ts): Choluteca.
 *   - Código Penal Decreto 130-2017 y reformas vigentes.
 *   - Sin sedes, colegiaciones ni reseñas inventadas.
 */
export const metadata: Metadata = {
  title:
    'Abogado Penalista en Choluteca | Defensa Penal Urgente · Sur de Honduras',
  description:
    'Abogado penalista en Choluteca. Defensa técnica en detenciones, audiencias, medidas cautelares y juicio oral. Consulta confidencial. WhatsApp +504 9536-3724.',
  alternates: { canonical: '/abogado-penalista-choluteca' },
  keywords: [
    'abogado penalista Choluteca',
    'defensa penal Choluteca',
    'abogado penalista sur Honduras',
    'asistencia a detenidos Choluteca',
    'audiencia inicial Choluteca',
    'abogado urgente penalista Choluteca',
    'defensa criminal Choluteca',
    'medidas cautelares Choluteca',
  ],
  openGraph: {
    title:
      'Abogado Penalista en Choluteca | Defensa Penal Urgente · Sur de Honduras',
    description:
      'Abogado penalista en Choluteca. Defensa técnica en detenciones, audiencias y juicio oral. Consulta confidencial. WhatsApp +504 9536-3724.',
    url: '/abogado-penalista-choluteca',
    siteName: site.name,
    locale: 'es_HN',
    type: 'website',
    images: [
      {
        url: '/og/penal.webp',
        width: 1200,
        height: 630,
        alt: 'Abogado Penalista en Choluteca - Pineda y Asociados',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title:
      'Abogado Penalista en Choluteca | Defensa Penal Urgente · Sur de Honduras',
    description:
      'Abogado penalista en Choluteca. Defensa técnica en detenciones, audiencias y juicio oral. Consulta confidencial.',
    images: ['/og/penal.webp'],
  },
};

const whatsappMsg =
  'Necesito un abogado penalista en Choluteca. Vi su sitio web.';

export default async function AbogadoPenalistaCholutecaPage() {
  const canonical = '/abogado-penalista-choluteca';
  const url = absoluteUrl(canonical);

  return (
    <>
      <Breadcrumbs
        items={[
          { label: 'Inicio', href: '/' },
          { label: 'Derecho Penal', href: '/derecho-penal' },
          { label: 'Abogado Penalista en Choluteca' },
        ]}
      />

      {/* Hero */}
      <section className="bg-primary text-text-inverse py-16 md:py-20">
        <Container>
          <p className="text-xxs font-bold uppercase tracking-widest text-accent mb-3">
            Defensa penal · Choluteca, Honduras
          </p>
          <h1 className="font-serif font-extrabold text-3xl md:text-4xl lg:text-5xl mb-4">
            Abogado Penalista en Choluteca
          </h1>
          <p className="text-base md:text-lg text-text-inverse/85 max-w-3xl mb-8">
            Defensa técnica inmediata conforme al Código Penal hondureño
            (Decreto 130-2017 y reformas). Asistencia desde la detención y
            audiencia inicial hasta el juicio oral y los recursos, coordinando
            presencia en los juzgados de Choluteca.
          </p>
          <CTAGroup variant="inverse" message={whatsappMsg} />
        </Container>
      </section>

      {/* Intro — bloque declarativo GEO */}
      <Section background="default" spacing="md">
        <div className="max-w-3xl">
          <h2 className="font-serif font-extrabold text-2xl md:text-3xl text-primary mb-4">
            Defensa penal en Choluteca y el sur de Honduras
          </h2>
          <p className="text-text-secondary leading-relaxed mb-4">
            <strong>Pineda y Asociados</strong> es un bufete jurídico con sede en
            Nacaome, Valle, que presta servicios de{' '}
            <strong>defensa penal en Choluteca</strong> y el sur de Honduras.
            Atendemos detenciones, audiencias iniciales, medidas cautelares,
            juicio oral y recursos, con más de 15 años de ejercicio profesional
            y presencia activa en los juzgados de la región.
          </p>
          <p className="text-text-secondary leading-relaxed">
            Enfrentar un proceso penal sin defensa técnica puede tener
            consecuencias graves. La Constitución de Honduras garantiza el
            derecho a un abogado desde el primer momento de la detención y a ser
            presentado ante un juez en un plazo máximo de 24 horas. Coordinamos
            la atención para clientes de Choluteca ciudad, Marcovia, San Marcos
            de Colón y el corredor de la Carretera Panamericana.
          </p>
        </div>
      </Section>

      {/* Servicios penales */}
      <Section background="muted" spacing="md">
        <SectionHeader
          eyebrow="Servicios penales"
          title="Áreas de defensa penal en Choluteca"
          subtitle="Cubrimos todas las etapas del proceso penal hondureño y los delitos más frecuentes en el departamento de Choluteca."
        />
        <div className="grid sm:grid-cols-2 gap-4 mt-6">
          {[
            {
              icon: Shield,
              title: 'Asistencia a detenidos',
              desc: 'Presencia inmediata ante la Fiscalía. Control de detención, hábeas corpus y defensa en la audiencia inicial.',
            },
            {
              icon: Gavel,
              title: 'Juicio oral y audiencias',
              desc: 'Representación en audiencia inicial, preliminar, de sobreseimiento y juicio oral ante los tribunales de Choluteca.',
            },
            {
              icon: Scale,
              title: 'Recursos y apelaciones',
              desc: 'Interposición de recursos de apelación y casación contra sentencias penales condenatorias.',
            },
            {
              icon: Clock,
              title: 'Medidas cautelares y fianza',
              desc: 'Defensa contra la prisión preventiva. Solicitud de medidas sustitutivas, fianzas y revisión de oficio.',
            },
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

        {/* Delitos frecuentes — bloque informativo */}
        <div className="mt-8 max-w-3xl">
          <h3 className="font-serif font-bold text-lg text-primary mb-3">
            Tipos de casos penales que atendemos
          </h3>
          <p className="text-sm text-text-secondary leading-relaxed mb-3">
            Defendemos casos conforme al Código Penal hondureño vigente, entre
            otros:
          </p>
          <ul className="grid sm:grid-cols-2 gap-x-6 gap-y-2 text-sm text-text-secondary">
            <li>• Delitos patrimoniales (hurto, robo, estafa, fraude)</li>
            <li>• Violencia doméstica e intrafamiliar</li>
            <li>• Lesiones personales</li>
            <li>• Homicidio y delitos contra la vida</li>
            <li>• Delitos sexuales</li>
            <li>• Narcotráfico y tenencia de drogas</li>
            <li>• Portación ilegal de armas</li>
            <li>• Tránsito con consecuencias penales</li>
            <li>• Extorsión y lavado de activos</li>
            <li>• Amenazas y coacciones</li>
          </ul>
          <p className="mt-4 text-xs text-text-muted leading-relaxed">
            Cada caso requiere análisis individual. La estrategia procesal
            depende de los hechos, la prueba disponible y las resoluciones de la
            autoridad competente. Esta enumeración es informativa y no
            constituye asesoría legal personalizada.
          </p>
        </div>
      </Section>

      {/* Cobertura local + NAP */}
      <Section spacing="md">
        <div className="grid lg:grid-cols-2 gap-8 items-start">
          <div>
            <SectionHeader
              align="left"
              eyebrow="Cobertura local"
              title="Atendemos Choluteca desde Nacaome"
              subtitle="Sede física en Nacaome (Valle), a aproximadamente 52 km de Choluteca ciudad. Coordinamos presencia en audiencias y diligencias en los juzgados del departamento de Choluteca."
            />
            <div className="mt-5 flex items-start gap-3">
              <MapPin size={20} className="text-accent-dark shrink-0 mt-0.5" aria-hidden="true" />
              <p className="text-sm text-text-secondary leading-relaxed">
                <strong className="text-text">Sede:</strong> {site.address.line1},{' '}
                {site.address.line2}, {site.address.city}, {site.address.department}, Honduras.
                <br />
                <strong className="text-text">Horario:</strong> {site.hours}
              </p>
            </div>
          </div>
          <Card padding="lg" className="border-accent/30 bg-accent/5">
            <h3 className="font-serif font-bold text-lg text-primary mb-3">
              Contacto directo para urgencias penales
            </h3>
            <p className="text-sm text-text-secondary leading-relaxed mb-4">
              En casos de detención o citación, el tiempo de respuesta es
              decisivo. Escríbanos por WhatsApp o llámenos ahora.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href={whatsappHref(whatsappMsg)}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-shadow-success h-11 px-5 rounded-lg bg-success text-white font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90"
              >
                WhatsApp — Consulta penal
              </a>
              <a
                href={telHref()}
                className="btn-shadow-secondary h-11 px-5 rounded-lg bg-surface border border-border-strong text-primary font-semibold text-sm flex items-center justify-center gap-2 hover:border-accent transition-colors"
              >
                <Phone size={16} aria-hidden="true" /> {site.phoneDisplay}
              </a>
            </div>
          </Card>
        </div>
      </Section>

      {/* FAQ local */}
      <Section background="muted" spacing="md" id="preguntas-frecuentes">
        <SectionHeader
          align="center"
          eyebrow="Preguntas frecuentes"
          title="Defensa penal en Choluteca: lo que debe saber"
        />
        <div className="space-y-3 mt-6 max-w-3xl mx-auto">
          {[
            {
              q: '¿Tienen oficina en Choluteca?',
              a: 'Nuestra sede física está en Nacaome, Valle, a unos 52 km de Choluteca. Atendemos a clientes de Choluteca desde esa oficina y coordinamos las audiencias y diligencias necesarias en los juzgados del departamento de Choluteca.',
            },
            {
              q: '¿Qué hacer si me detienen en Choluteca?',
              a: 'Tiene derecho a un abogado desde el primer momento. No declare sin representación legal. Contáctenos por WhatsApp al +504 9536-3724 y coordinamos la asistencia a la mayor brevedad posible.',
            },
            {
              q: '¿Atienden emergencias penales fuera de horario?',
              a: 'En casos de detención o urgencia penal, contáctenos por WhatsApp a cualquier hora. La defensa en las primeras horas es decisiva para el resultado del caso.',
            },
            {
              q: '¿Cuánto cuesta un abogado penalista en Choluteca?',
              a: 'Ofrecemos una primera consulta sin costo para evaluar su caso. Tras el análisis, le entregamos un presupuesto por escrito. Los honorarios dependen de la complejidad y de la etapa del proceso.',
            },
            {
              q: '¿Qué delitos defienden?',
              a: 'Defendemos todo tipo de delitos del Código Penal hondureño: homicidio, hurto, robo, estafa, lesiones, delitos sexuales, narcotráfico, lavado de activos, extorsión, portación ilegal de armas, violencia doméstica y más.',
            },
          ].map((faq) => (
            <Card key={faq.q} padding="md" className="border-l-4 border-l-accent">
              <p className="text-sm font-semibold text-text mb-1">{faq.q}</p>
              <p className="text-sm text-text-secondary leading-relaxed">{faq.a}</p>
            </Card>
          ))}
        </div>
      </Section>

      {/* Enlaces contextuales hacia posts penales */}
      <Section spacing="md">
        <SectionHeader
          eyebrow="Recursos relacionados"
          title="Guías de defensa penal aplicables a Choluteca"
          subtitle="Recursos editoriales del bufete sobre el proceso penal hondureño."
        />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          {[
            {
              href: '/derecho-penal',
              title: 'Derecho Penal — Hub de defensa',
              desc: 'Etapas del proceso penal, riesgos y acción recomendada en el sur de Honduras.',
            },
            {
              href: '/blog/derecho-penal/estafas-fraudes-tipos-penales-honduras',
              title: 'Estafas y fraudes: tipos penales',
              desc: 'Delitos patrimoniales frecuentes en Honduras y su defensa.',
            },
            {
              href: '/blog/derecho-penal/que-hacer-si-me-detienen-en-honduras',
              title: 'Qué hacer si me detienen',
              desc: 'Guía práctica de los primeros pasos tras una detención.',
            },
            {
              href: '/blog/derecho-penal/violencia-domestica-ruta-legal-honduras',
              title: 'Violencia doméstica: ruta legal',
              desc: 'Denuncia, medidas de protección y defensa en casos de violencia intrafamiliar.',
            },
          ].map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="group block focus-visible:outline-none"
            >
              <Card padding="md" className="h-full group-hover:border-accent group-hover:shadow-md transition-all">
                <h3 className="font-bold text-sm text-text leading-tight group-hover:text-primary transition-colors">
                  {l.title}
                </h3>
                <p className="text-xs text-text-secondary mt-1.5 leading-relaxed">{l.desc}</p>
              </Card>
            </Link>
          ))}
        </div>
      </Section>

      {/* CTA final */}
      <Section background="muted" spacing="md">
        <Card padding="lg" className="max-w-3xl mx-auto text-center border-accent/30">
          <p className="text-xxs font-bold uppercase tracking-wider text-accent-dark mb-2">
            Consulta penal confidencial — Choluteca
          </p>
          <h2 className="font-serif font-extrabold text-2xl md:text-3xl text-primary mb-3">
            ¿Necesita defensa penal en Choluteca?
          </h2>
          <p className="text-text-secondary max-w-lg mx-auto mb-6">
            Las primeras horas tras una detención son determinantes. Hable hoy
            con un abogado penalista que conoce los juzgados del sur de Honduras.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href={whatsappHref('Necesito defensa penal urgente en Choluteca.')}
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
          </div>
        </Card>
      </Section>

      <ConsultationCTA />

      {/* ENLAZADO INTERNO (Fase 4) — reconecta esta landing al grafo.
          Antes era una hoja huérfana de autoridad. */}
      <Section spacing="sm">
        <Container size="lg">
          <RelatedCities mentionedCitySlug="choluteca" limit={6} eyebrow="Atendemos en el sur de Honduras" />
        </Container>
      </Section>

      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            {
              '@context': 'https://schema.org',
              '@type': ['Service', 'WebPage'],
              '@id': `${url}#webpage`,
              url,
              name: 'Abogado Penalista en Choluteca | Defensa Penal Urgente',
              description:
                'Abogado penalista en Choluteca. Defensa técnica en detenciones, audiencias, medidas cautelares y juicio oral.',
              inLanguage: 'es-HN',
              isPartOf: { '@id': `${site.url}#website` },
              about: { '@id': `${site.url}#legal-service` },
              provider: { '@id': `${site.url}#legal-service` },
              serviceType: 'Defensa Penal',
              areaServed: [
                { '@type': 'City', name: 'Choluteca' },
                { '@type': 'State', name: 'Choluteca' },
                { '@type': 'Country', name: 'Honduras' },
              ],
            },
            {
              '@context': 'https://schema.org',
              '@type': 'FAQPage',
              '@id': `${url}#faqpage`,
              mainEntity: [
                {
                  '@type': 'Question',
                  name: '¿Tienen oficina en Choluteca?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Nuestra sede física está en Nacaome, Valle, a unos 52 km de Choluteca. Atendemos a clientes de Choluteca desde esa oficina y coordinamos las audiencias y diligencias en los juzgados del departamento de Choluteca.',
                  },
                },
                {
                  '@type': 'Question',
                  name: '¿Qué hacer si me detienen en Choluteca?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Tiene derecho a un abogado desde el primer momento. No declare sin representación legal. Contáctenos por WhatsApp al +504 9536-3724.',
                  },
                },
                {
                  '@type': 'Question',
                  name: '¿Cuánto cuesta un abogado penalista en Choluteca?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Ofrecemos una primera consulta sin costo. Tras el análisis, le entregamos un presupuesto por escrito.',
                  },
                },
                {
                  '@type': 'Question',
                  name: '¿Qué delitos defienden?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Defendemos todo tipo de delitos del Código Penal hondureño: homicidio, hurto, robo, estafa, lesiones, delitos sexuales, narcotráfico, lavado de activos, extorsión, portación ilegal de armas, violencia doméstica y más.',
                  },
                },
              ],
            },
            {
              '@context': 'https://schema.org',
              '@type': 'BreadcrumbList',
              itemListElement: [
                { '@type': 'ListItem', position: 1, name: 'Inicio', item: site.url },
                { '@type': 'ListItem', position: 2, name: 'Derecho Penal', item: `${site.url}/derecho-penal` },
                { '@type': 'ListItem', position: 3, name: 'Abogado Penalista en Choluteca', item: url },
              ],
            },
          ]),
        }}
      />
    </>
  );
}
