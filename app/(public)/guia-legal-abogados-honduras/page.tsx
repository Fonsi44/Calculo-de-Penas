import type { Metadata } from 'next';
import Link from 'next/link';
import { ShieldCheck, BookOpen, Scale, FileText, Users, Gavel, CheckCircle2, ArrowRight } from 'lucide-react';
import { site, absoluteUrl } from '@/lib/site';
import { buildMetadata } from '@/lib/seo';
import { Section, SectionHeader, Container } from '@/components/marketing/section';
import { Card } from '@/components/ui/card';
import { PageHero } from '@/components/marketing/page-hero';
import { CTAGroup } from '@/components/marketing/cta-buttons';
import { TrustBar } from '@/components/marketing/trust-bar';
import { Breadcrumbs } from '@/components/marketing/breadcrumbs';
import { ConsultationCTA } from '@/components/marketing/consultation-cta';
import { BlogHighlights } from '@/components/marketing/blog-highlights';
import { RelatedCities } from '@/components/marketing/related-links';
import { SemanticHubLinks } from '@/components/marketing/semantic-hub-links';
import { HubFaq } from '@/components/marketing/hub-faq';
import { AnswerBlock } from '@/components/marketing/answer-block';
import { FAQ_GUIA_LEGAL_HONDURAS } from '@/data/pilar/faqs-guia';

export const metadata: Metadata = buildMetadata({
  // 51 chars.
  title: 'Guía Legal para Contratar Abogado en Honduras',
  // 156 chars.
  description:
    'Cómo elegir abogado en Honduras: colegiación, honorarios, documentos para la primera consulta y errores a evitar. Guía práctica del bufete Pineda y Asociados.',
  canonicalPath: '/guia-legal-abogados-honduras',
  keywords: [
    'contratar abogado Honduras',
    'cómo elegir abogado Honduras',
    'colegiación abogados Honduras',
    'honorarios abogado Honduras',
    'primera consulta abogado',
    'bufete legal Honduras',
    'abogado colegiado Honduras',
    'guía legal Honduras',
  ],
  ogImage: '/og/civil.webp',
  ogImageAlt: `${site.name} - Guía legal para contratar abogado en Honduras`,
  ogType: 'article',
  publishedTime: '2026-07-04',
  modifiedTime: '2026-07-04',
  authors: [site.name],
});

const url = absoluteUrl('/guia-legal-abogados-honduras');

// JSON-LD Article para la página pilar (refuerzo E-E-A-T + autoría).
const articleSchema = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  '@id': `${url}#article`,
  headline: 'Guía legal para contratar abogado en Honduras',
  description:
    'Cómo elegir abogado en Honduras: colegiación, honorarios, documentos para la primera consulta y errores a evitar.',
  author: { '@id': `${site.url}/#danilo-pineda-maradiaga` },
  publisher: {
    '@type': 'LegalService',
    '@id': `${site.url}/#legal-service`,
    name: site.name,
    logo: {
      '@type': 'ImageObject',
      url: `${site.url}/images/logo.png`,
      width: 512,
      height: 512,
    },
  },
  mainEntityOfPage: { '@type': 'WebPage', '@id': url },
  datePublished: '2026-07-04',
  dateModified: '2026-07-04',
  inLanguage: 'es-HN',
};

export default function GuiaLegalPage() {
  return (
    <>
      <Breadcrumbs
        items={[
          { label: 'Inicio', href: '/' },
          { label: 'Servicios Jurídicos', href: '/servicios-juridicos' },
          { label: 'Guía legal para contratar abogado en Honduras' },
        ]}
      />
      <PageHero
        eyebrow="Guía legal · Honduras"
        badge="Guía práctica"
        title="Guía legal para contratar abogado en Honduras"
        subtitle="Cómo verificar la colegiación de un abogado, qué honorarios esperar, qué documentos llevar a la primera consulta y qué errores evitar. Guía práctica de Pineda y Asociados."
        cta={<CTAGroup variant="inverse" />}
        bgImage="/images/corporate/courthouse.webp"
      />
      <TrustBar />

      {/* BLOQUE EDITORIAL CANÓNICO — datos del despacho para IA.
          Modelo unificado: AnswerBlock en Section warm spacing=md. */}
      <Section background="warm" spacing="md">
        <Container size="lg">
          <AnswerBlock
            eyebrow="Datos del despacho"
            question="¿Quién es Pineda y Asociados?"
            answer={`${site.name} es un bufete jurídico con sede en Nacaome, Valle (Honduras), fundado por Danilo Pineda Maradiaga y Thania Marlene Paz. El equipo también incluye a Emil Barahona (laboral). Dirección: ${site.address.line2}, ${site.address.city}, ${site.address.department}. Contacto: WhatsApp ${site.phoneDisplay} · ${site.email}. Atención de lunes a sábado.`}
          />
        </Container>
      </Section>

      <Section background="warm" spacing="md">
        <Container size="md" className="prose-pilar">
          {/* INTRODUCCIÓN */}
          <p className="text-base md:text-lg text-text-secondary leading-relaxed">
            Elegir abogado en Honduras es una decisión que puede marcar la diferencia entre un caso
            bien llevado y un proceso frustrado. Esta guía reúne, en lenguaje claro, los criterios
            que un ciudadano debe verificar antes de contratar representación legal: colegiación
            vigente, contrato por escrito, presupuesto transparente y comunicación fluida. No
            promete resultados (nadie serio puede hacerlo), pero sí ofrece las preguntas correctas
            para tomar una decisión informada.
          </p>

          {/* H2: Importancia */}
          <h2 className="mt-10 font-serif text-2xl text-primary">
            Por qué es importante elegir bien al abogado
          </h2>
          <p className="mt-3 text-text-secondary leading-relaxed">
            Un proceso judicial penal, civil, laboral o de familia consume tiempo, dinero y energía.
            Un abogado idóneo identifica temprano las pruebas relevantes, respeta los plazos
            procesales y comunica al cliente los escenarios realistas. Un abogado sin la
            preparación adecuada puede incurrir en errores técnicos (recursos fuera de plazo,
            notificaciones mal gestionadas, defensa incompleta) que comprometen el caso de forma
            difícil de reparar. La decisión no debe tomarse por urgencia, precio o recomendación
            superficial: merece la misma atención que cualquier elección importante para usted o su
            familia.
          </p>

          {/* H2: Áreas */}
          <h2 className="mt-10 font-serif text-2xl text-primary">
            Qué áreas del derecho cubre un bufete hondureño
          </h2>
          <p className="mt-3 text-text-secondary leading-relaxed">
            Un bufete multidisciplinario permite coordinar varias ramas bajo un mismo equipo. Las
            áreas más demandadas en Honduras son:
          </p>
          <ul className="mt-4 space-y-2">
            {[
              ['Derecho penal', 'defensa en detenciones, audiencias, juicio oral y recursos.'],
              ['Derecho de familia', 'divorcio, pensión alimentaria, custodia, visitas, paternidad.'],
              ['Derecho laboral', 'despido injustificado, prestaciones, accidentes de trabajo.'],
              ['Derecho civil y notarial', 'contratos, sucesiones, testamentos, poderes, compraventas.'],
              ['Derecho mercantil', 'constitución de empresas, contratos comerciales, marcas.'],
              ['Derecho administrativo y constitucional', 'recursos contra actos de la administración, amparo.'],
              ['Derecho migratorio', 'regularización, asuntos para hondureños en el extranjero.'],
            ].map(([area, desc]) => (
              <li key={area} className="flex gap-3 text-text-secondary">
                <CheckCircle2 size={18} className="flex-shrink-0 mt-1 text-accent-dark" aria-hidden="true" />
                <span>
                <strong className="text-text">{area}:</strong> {desc}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-text-secondary">
            Consulte el detalle de cada área en nuestro{' '}
            <Link href="/servicios-juridicos" className="text-accent-dark underline underline-offset-2">
              catálogo de servicios jurídicos
            </Link>
            .
          </p>

          {/* H2: Colegiación */}
          <h2 className="mt-10 font-serif text-2xl text-primary">
            Cómo verificar que un abogado está colegiado en Honduras
          </h2>
          <p className="mt-3 text-text-secondary leading-relaxed">
            Para ejercer legalmente, un abogado en Honduras debe estar{' '}
            <strong className="text-text">colegiado e inscrito en el Colegio de Abogados de Honduras</strong>{' '}
            y, si va a autorizar actos notariales, autorizado por la Corte Suprema de Justicia para
            el ejercicio del notariado. Antes de firmar cualquier contrato, pida al abogado:
          </p>
          <ul className="mt-4 space-y-2">
            <li className="flex gap-3 text-text-secondary">
              <CheckCircle2 size={18} className="flex-shrink-0 mt-1 text-accent-dark" aria-hidden="true" />
              <span>Su número de colegiación y carné vigente.</span>
            </li>
            <li className="flex gap-3 text-text-secondary">
              <CheckCircle2 size={18} className="flex-shrink-0 mt-1 text-accent-dark" aria-hidden="true" />
              <span>Si el asunto requiere escritura pública, su registro notarial.</span>
            </li>
            <li className="flex gap-3 text-text-secondary">
              <CheckCircle2 size={18} className="flex-shrink-0 mt-1 text-accent-dark" aria-hidden="true" />
              <span>Referencia de su despacho (dirección física, teléfono, correo).</span>
            </li>
            <li className="flex gap-3 text-text-secondary">
              <CheckCircle2 size={18} className="flex-shrink-0 mt-1 text-accent-dark" aria-hidden="true" />
              <span>Contrato de prestación de servicios por escrito con honorarios detallados.</span>
            </li>
          </ul>
          <p className="mt-4 text-text-secondary leading-relaxed">
            Un abogado formalmente establecido emite recibos, mantiene oficina identificable y
            responde por su ejercicio profesional. Desconfíe de quien solo atiende por mensajería
            sin identificarse, no entrega contrato o pide pagos en efectivo sin recibo.
          </p>

          {/* H2: Honorarios */}
          <h2 className="mt-10 font-serif text-2xl text-primary">
            Cuánto cuesta contratar un abogado en Honduras
          </h2>
          <p className="mt-3 text-text-secondary leading-relaxed">
            No existe una tarifa única. Los honorarios dependen del tipo de asunto, la complejidad,
            la jurisdicción (penal, civil, laboral, familia) y el tiempo estimado del proceso.
            Algunos trámites notariales (escrituras, poderes, autenticaciones) tienen aranceles
            referenciales, pero la mayoría de los casos se presupuestan de forma individualizada.
          </p>
          <div className="mt-4 rounded-lg border-l-4 border-l-accent bg-accent/5 p-4">
            <p className="text-text-secondary leading-relaxed">
              <strong className="text-text">Recomendación:</strong> solicite siempre un{' '}
              <strong className="text-text">presupuesto por escrito</strong> antes de autorizar
              cualquier gestión. El presupuesto debe detallar el alcance del trabajo, los honorarios,
              los gastos (timbres, registros, peritos) y la forma de pago. Sin presupuesto escrito,
              cualquier discrepancia posterior es difícil de resolver.
            </p>
          </div>
          <p className="mt-4 text-text-secondary leading-relaxed">
            En Pineda y Asociados la evaluación inicial es confidencial y se entrega
            presupuesto por escrito. Solicítela por WhatsApp al {site.phoneDisplay} o mediante el{' '}
            <Link href="/solicitar-consulta" className="text-accent-dark underline underline-offset-2">
              formulario de consulta
            </Link>
            .
          </p>

          {/* H2: Documentos */}
          <h2 className="mt-10 font-serif text-2xl text-primary">
            Qué documentos llevar a la primera consulta
          </h2>
          <p className="mt-3 text-text-secondary leading-relaxed">
            Llegar bien preparado a la primera consulta acelera el análisis y permite al abogado
            plantear una estrategia inicial concreta. Recomendamos llevar:
          </p>
          <div className="mt-4 grid sm:grid-cols-2 gap-3 not-prose">
            {[
              { icon: FileText, text: 'Documentos de identidad de las partes involucradas.' },
              { icon: BookOpen, text: 'Contratos, acuerdos o escrituras relacionados con el caso.' },
              { icon: Scale, text: 'Resoluciones, notificaciones o citaciones judiciales previas.' },
              { icon: Users, text: 'Nombres y datos de contacto de testigos o contraparte.' },
              { icon: ShieldCheck, text: 'Correos, mensajes o cartas que documenten los hechos.' },
              { icon: Gavel, text: 'Cronología escrita de fechas relevantes (hechos, plazos, vencimientos).' },
            ].map(({ icon: Icon, text }) => (
              <Card key={text} padding="sm" className="flex items-start gap-3">
                <Icon size={18} className="flex-shrink-0 mt-0.5 text-accent-dark" aria-hidden="true" />
                <span className="text-sm text-text-secondary">{text}</span>
              </Card>
            ))}
          </div>
          <p className="mt-4 text-text-secondary leading-relaxed">
            Si no tiene documentación todavía, no postergue la consulta: el abogado le indicará
            qué conseguir, dónde obtenerlo y cómo preservar pruebas relevantes mientras tanto.
          </p>

          {/* H2: Errores a evitar */}
          <h2 className="mt-10 font-serif text-2xl text-primary">
            Errores frecuentes al contratar abogado
          </h2>
          <ul className="mt-4 space-y-2">
            {[
              'Firmar contrato sin leerlo o sin pedir aclaración de cláusulas confusas.',
              'Aceptar honorarios verbales sin desglose por escrito.',
              'Esperar garantías de resultado (nadie puede ofrecerlas en serio).',
              'Posponer la consulta hasta que el plazo procesal esté casi vencido.',
              'Cambiar de abogado sin recuperar el expediente completo.',
              'No conservar copias de todo lo entregado al abogado y de lo firmado.',
            ].map((item) => (
              <li key={item} className="flex gap-3 text-text-secondary">
                <span aria-hidden="true" className="flex-shrink-0 text-aggravation font-bold">✗</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>

          {/* CTA intermedio */}
          <div className="mt-10 rounded-lg bg-primary text-text-inverse p-6 text-center">
            <p className="font-serif text-xl">¿Necesita una consulta jurídica en Honduras?</p>
            <p className="mt-2 text-text-inverse/85 text-sm">
              Atendemos en Nacaome, Valle y toda la zona sur. Evaluación inicial confidencial.
            </p>
            <Link
              href="/solicitar-consulta"
              className="inline-flex items-center gap-2 mt-4 rounded-lg bg-accent px-5 py-2.5 text-sm font-bold text-primary hover:bg-accent-light transition-colors"
            >
              Solicitar consulta <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </div>
        </Container>
      </Section>

      {/* FAQ con schema */}
      <HubFaq
        faqs={FAQ_GUIA_LEGAL_HONDURAS}
        url={url}
        eyebrow="Resolvemos sus dudas"
        title="Preguntas frecuentes sobre contratar abogado en Honduras"
      />

      {/* Enlazado interno: servicios */}
      <Section spacing="md">
        <Container size="lg">
          <SectionHeader
            eyebrow="Recursos relacionados"
            title="Profundice en cada área del derecho"
            subtitle="Si ya sabe qué tipo de caso tiene, consulte el detalle del servicio correspondiente."
          />
          <div className="mt-6 grid sm:grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { href: '/derecho-penal', label: 'Defensa penal', desc: 'Detenciones, audiencias, juicio oral.' },
              { href: '/servicios-juridicos/derecho-de-familia', label: 'Derecho de familia', desc: 'Divorcio, custodia, pensión alimentaria.' },
              { href: '/servicios-juridicos/derecho-laboral', label: 'Derecho laboral', desc: 'Despido, prestaciones, accidentes.' },
              { href: '/servicios-juridicos/derecho-civil-y-notarial', label: 'Derecho civil y notarial', desc: 'Contratos, sucesiones, poderes.' },
              { href: '/servicios-juridicos/derecho-mercantil-empresarial', label: 'Derecho mercantil', desc: 'Empresas, contratos comerciales.' },
              { href: '/hondurenos-en-espana', label: 'Hondureños en España', desc: 'Gestión documental a distancia.' },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block rounded-lg border border-border-light bg-surface p-4 hover:border-accent hover:shadow-md transition-all group"
              >
                <p className="font-bold text-text group-hover:text-accent-dark transition-colors">{item.label}</p>
                <p className="mt-1 text-xs text-text-secondary">{item.desc}</p>
              </Link>
            ))}
          </div>
        </Container>
      </Section>

      {/* Cobertura local */}
      <Section background="muted" spacing="sm">
        <Container size="lg" className="space-y-4">
          <SemanticHubLinks variant="guia" />
          <RelatedCities limit={10} eyebrow="Atendemos en todo el sur de Honduras" />
        </Container>
      </Section>

      {/* Blog destacado */}
      <BlogHighlights
        slugs={[
          'como-elegir-abogado-honduras',
          'pension-alimenticia-honduras-guia-completa',
          'calcular-liquidacion-laboral-honduras',
          'que-hacer-si-me-detienen-en-honduras',
        ]}
        title="Guías prácticas del bufete"
        ctaLabel="Explorar todas las guías del blog"
        ctaHref="/blog"
      />

      <ConsultationCTA />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
    </>
  );
}
