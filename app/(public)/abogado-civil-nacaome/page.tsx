import type { Metadata } from 'next';
import { site, absoluteUrl, whatsappHref, telHref, THANIA_PROFILE } from '@/lib/site';
import { Section, SectionHeader, Container } from '@/components/marketing/section';
import { Card } from '@/components/ui/card';
import { CTAGroup } from '@/components/marketing/cta-buttons';
import { BlogHighlights } from '@/components/marketing/blog-highlights';
import { RelatedCities } from '@/components/marketing/related-links';
import { CargoHubBridge } from '@/components/marketing/cargo-hub-bridge';
import { FileText, Home, ScrollText, Scale, Phone } from 'lucide-react';

export const metadata: Metadata = {
  title: { absolute: 'Abogado Civil en Nacaome | Pineda y Asociados' },
  description:
    'Abogado civil en Nacaome, Valle. Contratos, herencias, testamentos, poderes notariales y trámites registrales en el sur de Honduras.',
  alternates: { canonical: '/abogado-civil-nacaome' },
  keywords: [
    'abogado civil Nacaome',
    'contratos Nacaome',
    'herencias Nacaome',
    'poder notarial Nacaome',
    'compraventa inmuebles Nacaome',
    'abogado notarial Nacaome',
  ],
  openGraph: {
    title: 'Abogado Civil en Nacaome | Contratos, Herencias y Notarial',
    description:
      'Abogado civil en Nacaome, Valle. Contratos, herencias, testamentos, poderes notariales y trámites registrales en el sur de Honduras.',
    url: '/abogado-civil-nacaome',
    siteName: site.name,
    locale: 'es_HN',
    type: 'website',
    images: [{ url: '/og/nacaome.webp', width: 1200, height: 630, alt: 'Abogado Civil en Nacaome' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Abogado Civil en Nacaome | Contratos, Herencias y Notarial',
    description:
      'Abogado civil en Nacaome, Valle. Contratos, herencias, testamentos, poderes notariales y trámites registrales en el sur de Honduras.',
    images: ['/og/nacaome.webp'],
  },
};

const whatsappMsg = 'Necesito un abogado civil en Nacaome para contratos o herencias. Vi su sitio web.';

export default async function AbogadoCivilNacaomePage() {
  const canonical = '/abogado-civil-nacaome';
  const url = absoluteUrl(canonical);

  return (
    <>
      <section className="bg-primary text-text-inverse py-16 md:py-20">
        <Container>
          <p className="text-xxs font-bold uppercase tracking-widest text-accent mb-3">
            Derecho civil y notarial · Nacaome, Valle
          </p>
          <h1 className="font-serif font-extrabold text-3xl md:text-4xl lg:text-5xl mb-4">
            Abogado Civil en Nacaome
          </h1>
          <p className="text-base md:text-lg text-text-inverse/85 max-w-3xl mb-8">
            Contratos seguros, compraventas de inmuebles, herencias, testamentos y poderes
            notariales. Asesoría civil y notarial con validez en todo Honduras, desde Nacaome.
          </p>
          <CTAGroup variant="inverse" message={whatsappMsg} phone={THANIA_PROFILE.phone} phoneDisplay={THANIA_PROFILE.phoneDisplay} contactName="Thania" />
        </Container>
      </section>

      <CargoHubBridge
        hubHref="/servicios-juridicos/derecho-civil-y-notarial"
        hubLabel="Ver el servicio civil y notarial completo"
        title="La explicación completa del servicio está en Derecho Civil"
        body="Esta página orienta la búsqueda local en Nacaome. Contratos, herencias y trámites notariales están en el hub. Thania Marlene Paz atiende el área; el presupuesto va por escrito."
        profileHref="/equipo/thania-marlene-paz"
        profileLabel="Perfil de Thania"
      />

      <Section background="default" spacing="md">
        <h2 className="font-serif font-extrabold text-2xl md:text-3xl text-primary mb-4">
          Derecho Civil y Notarial en Nacaome, Valle
        </h2>
        <p className="text-text-secondary leading-relaxed max-w-3xl">
          El derecho civil regula las relaciones jurídicas entre particulares: contratos, propiedad,
          sucesiones y obligaciones. El derecho notarial da fe pública a estos actos. En Pineda y
          Asociados, combinamos ambas especialidades para ofrecerle seguridad jurídica en cada
          trámite, desde la redacción de un contrato hasta la escrituración de una propiedad.
        </p>
      </Section>

      <Section background="muted" spacing="md">
        <SectionHeader
          eyebrow="Servicios civiles y notariales"
          title="Áreas de práctica civil y notarial"
          subtitle="Asesoría en contratos, propiedad, sucesiones y trámites notariales en Nacaome."
        />
        <div className="grid sm:grid-cols-2 gap-4 mt-6">
          {[
            { icon: Home, title: 'Compraventa de inmuebles', desc: 'Due diligence, redacción de escritura de compraventa, inscripción en el Registro de la Propiedad y asesoría fiscal.' },
            { icon: FileText, title: 'Contratos civiles', desc: 'Redacción y revisión de contratos de arrendamiento, compraventa, préstamo, obra, servicios y más. Cláusulas claras y seguras.' },
            { icon: ScrollText, title: 'Herencias y sucesiones', desc: 'Declaratoria de herederos, sucesión testamentaria e intestada, partición de bienes y aceptación de herencia.' },
            { icon: Scale, title: 'Poderes notariales', desc: 'Poder general, especial, generalísimo y para pleitos. Escritura pública con validez en todo el territorio hondureño.' },
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
          title="Lo que debe saber sobre derecho civil y notarial"
        />
        <div className="space-y-3 mt-6 max-w-3xl mx-auto">
          {[
            { q: '¿Qué necesito para comprar una casa en Honduras?', a: 'Debe verificar que el vendedor sea el dueño legítimo, que la propiedad esté libre de gravámenes y al día en impuestos. Le asistimos con la debida diligencia, redacción de la escritura e inscripción registral.' },
            { q: '¿Cuánto cuesta un poder notarial en Nacaome?', a: 'El costo varía según el tipo de poder. Un poder especial tiene un costo menor que un poder general. Solicite una evaluación inicial confidencial para recibir un presupuesto por escrito.' },
            { q: '¿Qué pasa si alguien muere sin testamento?', a: 'Se abre la sucesión intestada. Los herederos legales deben tramitar la declaratoria de herederos ante notario o juez para poder disponer de los bienes del fallecido.' },
            { q: '¿Cómo sé si una propiedad tiene problemas legales?', a: 'Realizamos un estudio registral completo: revisión de antecedentes en el Registro de la Propiedad, verificación de impuestos municipales y comprobación de que no existan embargos o anotaciones preventivas.' },
            { q: '¿Qué diferencia hay entre un contrato privado y una escritura pública?', a: 'La escritura pública otorga fecha cierta, fe pública notarial y es necesaria para inscribir en el Registro de la Propiedad. El contrato privado es válido entre las partes pero tiene limitaciones probatorias frente a terceros.' },
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
            Consulta civil confidencial en Nacaome
          </p>
          <h2 className="font-serif font-extrabold text-2xl md:text-3xl text-primary mb-3">
            ¿Necesita un contrato seguro o gestionar una herencia?
          </h2>
          <p className="text-text-secondary max-w-lg mx-auto mb-6">
            No arriesgue su patrimonio con documentos mal redactados. Hable con un abogado civil
            que le garantice seguridad jurídica en cada trámite.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href={whatsappHref('Necesito un abogado civil para contratos o herencias en Nacaome.')}
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
              Solicitar consulta civil
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
          'compraventa-inmuebles-aspectos-legales-honduras',
          'testamentos-sucesiones-herencia-honduras',
          'contratos-arrendamiento-derechos-obligaciones-honduras',
          'errores-contratos-civiles-honduras',
          'usucapion-prescripcion-adquisitiva-honduras',
          'danos-perjuicios-indemnizacion-honduras',
          'prescripcion-deudas-plazos-honduras',
          'poder-notarial-honduras-tipos-requisitos',
        ]}
        eyebrow="Guías de derecho civil y notarial"
        title="Todo sobre derecho civil y notarial en Honduras"
        subtitle="Guías prácticas sobre contratos, compraventas, herencias, poderes notariales y más."
        ctaLabel="Ver todas las guías de derecho civil"
        ctaHref="/blog/derecho-civil"
      />

      {/* ENLAZADO INTERNO (Fase 3.7) — reconecta esta landing de cargo al
          grafo del sitio. Antes era una hoja huérfana: solo enlazaba a
          WhatsApp y al blog. Ahora enlaza al catálogo de áreas y a ciudades. */}
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
              '@id': `${url}/#webpage`,
              url,
              name: 'Abogado Civil en Nacaome | Contratos, Herencias y Notarial',
              isPartOf: { '@id': `${site.url}/#website` },
              about: { '@id': `${site.url}/#legal-service` },
            },
            {
              '@context': 'https://schema.org',
              '@type': 'FAQPage',
              '@id': `${url}/#faqpage`,
              mainEntity: [
                { '@type': 'Question', name: '¿Qué necesito para comprar una casa en Honduras?', acceptedAnswer: { '@type': 'Answer', text: 'Verificar que el vendedor sea dueño legítimo, que la propiedad esté libre de gravámenes y al día en impuestos. Le asistimos con la debida diligencia.' } },
                { '@type': 'Question', name: '¿Cuánto cuesta un poder notarial en Nacaome?', acceptedAnswer: { '@type': 'Answer', text: 'Varía según el tipo de poder. Solicite una evaluación inicial confidencial para recibir un presupuesto por escrito.' } },
                { '@type': 'Question', name: '¿Qué pasa si alguien muere sin testamento?', acceptedAnswer: { '@type': 'Answer', text: 'Se abre la sucesión intestada. Los herederos deben tramitar la declaratoria de herederos ante notario o juez.' } },
                { '@type': 'Question', name: '¿Cómo sé si una propiedad tiene problemas legales?', acceptedAnswer: { '@type': 'Answer', text: 'Realizamos un estudio registral completo: revisión de antecedentes, impuestos y verificación de embargos.' } },
                { '@type': 'Question', name: '¿Qué diferencia hay entre contrato privado y escritura pública?', acceptedAnswer: { '@type': 'Answer', text: 'La escritura pública otorga fecha cierta y fe pública notarial. Es necesaria para inscribir en el Registro de la Propiedad.' } },
              ],
            },
            {
              '@context': 'https://schema.org',
              '@type': 'BreadcrumbList',
              itemListElement: [
                { '@type': 'ListItem', position: 1, name: 'Inicio', item: site.url },
                { '@type': 'ListItem', position: 2, name: 'Abogado Civil en Nacaome', item: url },
              ],
            },
          ]),
        }}
      />
    </>
  );
}
