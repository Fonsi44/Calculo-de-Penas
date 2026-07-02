import type { Metadata } from 'next';
import { site, absoluteUrl, whatsappHref } from '@/lib/site';
import { Section, SectionHeader, Container } from '@/components/marketing/section';
import { Card } from '@/components/ui/card';
import { CTAGroup } from '@/components/marketing/cta-buttons';
import { BlogHighlights } from '@/components/marketing/blog-highlights';
import { Scale, FileText, ShieldCheck, Briefcase } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Abogado Laboralista en Nacaome — Despidos y Prestaciones',
  description:
    'Abogado laboralista en Nacaome, Valle. Reclamación de despidos, prestaciones, liquidaciones y acoso laboral. Consulta sin costo. WhatsApp: +504 9536-3724.',
  alternates: { canonical: '/abogado-laboralista-nacaome' },
  keywords: [
    'abogado laboralista Nacaome',
    'abogado laboral Nacaome',
    'despido injustificado Nacaome',
    'prestaciones laborales Nacaome',
    'reclamo laboral Valle Honduras',
  ],
  openGraph: {
    title: 'Abogado Laboralista en Nacaome — Despidos y Prestaciones',
    description:
      'Abogado laboralista en Nacaome, Valle. Reclamación de despidos, prestaciones y liquidaciones. Primera consulta sin costo.',
    url: '/abogado-laboralista-nacaome',
    siteName: site.name,
    locale: 'es_HN',
    type: 'website',
    images: [{ url: '/og/nacaome.webp', width: 1200, height: 630, alt: 'Abogado Laboralista en Nacaome' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Abogado Laboralista en Nacaome — Despidos y Prestaciones',
    description: 'Reclamación de despidos, prestaciones y liquidaciones en Nacaome, Valle.',
    images: ['/og/nacaome.webp'],
  },
};

const whatsappMsg = 'Me despidieron y necesito un abogado laboralista en Nacaome. Vi su sitio web.';

export default async function AbogadoLaboralistaNacaomePage() {
  const canonical = '/abogado-laboralista-nacaome';
  const url = absoluteUrl(canonical);

  return (
    <>
      <section className="bg-primary text-text-inverse py-16 md:py-20">
        <Container>
          <p className="text-xxs font-bold uppercase tracking-widest text-accent mb-3">
            Derecho laboral · Nacaome, Valle
          </p>
          <h1 className="font-serif font-extrabold text-3xl md:text-4xl lg:text-5xl mb-4">
            Abogado Laboralista en Nacaome
          </h1>
          <p className="text-base md:text-lg text-text-inverse/85 max-w-3xl mb-8">
            Si lo despidieron sin justa causa, no le pagaron sus prestaciones o sufre acoso laboral,
            un abogado laboralista puede ayudarle a reclamar lo que le corresponde conforme al
            Código de Trabajo de Honduras.
          </p>
          <CTAGroup variant="inverse" message={whatsappMsg} />
        </Container>
      </section>

      <Section background="default" spacing="md">
        <h2 className="font-serif font-extrabold text-2xl md:text-3xl text-primary mb-4">
          Derecho Laboral en Nacaome, Valle
        </h2>
        <p className="text-text-secondary leading-relaxed max-w-3xl">
          El Código de Trabajo de Honduras protege sus derechos como trabajador: indemnización por
          despido injustificado, pago de prestaciones, aguinaldo, vacaciones y más. Si su empleador
          no cumple, tiene derecho a reclamar. En Pineda y Asociados le asistimos en cada paso del
          proceso, desde la conciliación administrativa hasta la demanda judicial.
        </p>
      </Section>

      <Section background="muted" spacing="md">
        <SectionHeader
          eyebrow="Servicios laborales"
          title="Áreas de práctica en derecho laboral"
          subtitle="Defensa de trabajadores y asesoría a empleadores en Nacaome y la zona sur de Honduras."
        />
        <div className="grid sm:grid-cols-2 gap-4 mt-6">
          {[
            { icon: Briefcase, title: 'Despidos injustificados', desc: 'Reclamación de indemnización por despido sin causa justificada. Cálculo de prestaciones e intereses conforme al Código de Trabajo.' },
            { icon: FileText, title: 'Liquidaciones y finiquitos', desc: 'Revisión y cálculo de su liquidación laboral completa: preaviso, auxilio de cesantía, vacaciones y décimo cuarto mes proporcionales.' },
            { icon: ShieldCheck, title: 'Acoso laboral (mobbing)', desc: 'Denuncia y defensa en casos de acoso laboral, hostigamiento y discriminación en el lugar de trabajo.' },
            { icon: Scale, title: 'Demandas laborales', desc: 'Representación ante la Secretaría de Trabajo y los juzgados laborales de Nacaome, Choluteca y San Lorenzo.' },
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
          title="Lo que debe saber sobre derecho laboral"
        />
        <div className="space-y-3 mt-6 max-w-3xl mx-auto">
          {[
            { q: '¿Me despidieron sin justa causa, qué hago?', a: 'Tiene derecho a una indemnización. Reúna su contrato, comprobantes de pago y cualquier comunicación con el empleador. Contáctenos para evaluar su caso y calcular cuánto le corresponde.' },
            { q: '¿Cuánto me toca de liquidación?', a: 'La liquidación incluye: preaviso, auxilio de cesantía, vacaciones y décimo cuarto mes proporcionales, más salarios adeudados. Le ayudamos a calcular el monto exacto según su antigüedad y salario.' },
            { q: '¿Cuánto tiempo tengo para demandar tras un despido?', a: 'Las acciones laborales prescriben en plazos cortos. Lo recomendable es actuar dentro de los 30 días posteriores al despido. No espere: cada día cuenta.' },
            { q: '¿Qué cubre el fuero maternal?', a: 'La trabajadora embarazada no puede ser despedida sin autorización judicial. Si fue despedida estando embarazada, tiene derecho a reintegro e indemnización. La ley protege también el período de lactancia.' },
            { q: '¿Atienden casos de empleadas domésticas?', a: 'Sí. Las empleadas domésticas tienen los mismos derechos laborales: salario mínimo, vacaciones, aguinaldo y prestaciones. Si no se los reconocen, podemos ayudarle a reclamarlos.' },
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
            Consulta laboral confidencial en Nacaome
          </p>
          <h2 className="font-serif font-extrabold text-2xl md:text-3xl text-primary mb-3">
            ¿Lo despidieron o no le pagaron?
          </h2>
          <p className="text-text-secondary max-w-lg mx-auto mb-6">
            No deje pasar el tiempo. Cada día cuenta para reclamar sus derechos laborales.
            Hable hoy con un abogado laboralista en Nacaome.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href={whatsappHref('Me despidieron y necesito reclamar mis derechos laborales.')}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-shadow-success h-12 px-5 rounded-lg bg-success text-white font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90"
            >
              WhatsApp — Reclamar ahora
            </a>
            <a
              href="/solicitar-consulta#formulario"
              className="btn-shimmer btn-shadow-accent h-12 px-5 rounded-lg bg-accent text-primary font-semibold text-sm flex items-center justify-center gap-2"
            >
              Solicitar consulta laboral
            </a>
          </div>
        </Card>
      </Section>

      <BlogHighlights
        slugs={[
          'despido-laboral-honduras-guia-completa',
          'despido-injustificado-honduras-derechos-trabajador',
          'calcular-prestaciones-laborales-honduras',
          'calcular-liquidacion-laboral-honduras',
          'acoso-laboral-mobbing-honduras',
          'derechos-trabajadora-embarazada-honduras',
          'derechos-laborales-basicos-honduras',
          'empleador-no-paga-salario-honduras',
        ]}
        eyebrow="Guías de derecho laboral"
        title="Todo sobre derecho laboral en Honduras"
        subtitle="Guías prácticas sobre despidos, prestaciones, liquidaciones, acoso laboral y derechos del trabajador."
        ctaLabel="Ver todas las guías de derecho laboral"
        ctaHref="/blog/derecho-laboral"
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            {
              '@context': 'https://schema.org',
              '@type': 'WebPage',
              '@id': `${url}#webpage`,
              url,
              name: 'Abogado Laboralista en Nacaome — Despidos y Prestaciones',
              isPartOf: { '@id': `${site.url}#website` },
              about: { '@id': `${site.url}#legal-service` },
            },
            {
              '@context': 'https://schema.org',
              '@type': 'FAQPage',
              '@id': `${url}#faqpage`,
              mainEntity: [
                { '@type': 'Question', name: '¿Me despidieron sin justa causa, qué hago?', acceptedAnswer: { '@type': 'Answer', text: 'Tiene derecho a una indemnización. Reúna su contrato y comprobantes. Contáctenos para evaluar su caso.' } },
                { '@type': 'Question', name: '¿Cuánto me toca de liquidación?', acceptedAnswer: { '@type': 'Answer', text: 'Incluye preaviso, auxilio de cesantía, vacaciones y décimo cuarto mes proporcionales, más salarios adeudados.' } },
                { '@type': 'Question', name: '¿Cuánto tiempo tengo para demandar?', acceptedAnswer: { '@type': 'Answer', text: 'Lo recomendable es actuar dentro de los 30 días posteriores al despido. Cada día cuenta.' } },
                { '@type': 'Question', name: '¿Qué cubre el fuero maternal?', acceptedAnswer: { '@type': 'Answer', text: 'La trabajadora embarazada no puede ser despedida sin autorización judicial. Tiene derecho a reintegro e indemnización.' } },
                { '@type': 'Question', name: '¿Atienden casos de empleadas domésticas?', acceptedAnswer: { '@type': 'Answer', text: 'Sí. Las empleadas domésticas tienen los mismos derechos laborales. Si no se los reconocen, podemos ayudarle.' } },
              ],
            },
            {
              '@context': 'https://schema.org',
              '@type': 'BreadcrumbList',
              itemListElement: [
                { '@type': 'ListItem', position: 1, name: 'Inicio', item: site.url },
                { '@type': 'ListItem', position: 2, name: 'Abogado Laboralista en Nacaome', item: url },
              ],
            },
          ]),
        }}
      />
    </>
  );
}
