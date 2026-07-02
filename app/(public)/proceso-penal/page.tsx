import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Gavel, Scale, ShieldCheck, Clock, Search, FileText } from 'lucide-react';
import { site, absoluteUrl } from '@/lib/site';
import { Section, SectionHeader } from '@/components/marketing/section';
import { Card } from '@/components/ui/card';
import { CTAGroup } from '@/components/marketing/cta-buttons';
import { PageHero } from '@/components/marketing/page-hero';
import { TrustBar } from '@/components/marketing/trust-bar';
import { Breadcrumbs } from '@/components/marketing/breadcrumbs';
import { ConsultationCTA } from '@/components/marketing/consultation-cta';
import { BlogHighlights } from '@/components/marketing/blog-highlights';
import { serviceSchema, faqPageSchema, breadcrumbsSchema } from '@/lib/schemas/legal-page';

export const metadata: Metadata = {
  title: { absolute: `Proceso Penal en Honduras — Etapas, Plazos y Defensa Técnica` },
  description: `Conozca las etapas del proceso penal hondureño: investigación, audiencia inicial, etapa intermedia, juicio oral y recursos. Defensa técnica en Nacaome, Valle y zona sur. Consulta confidencial.`,
  alternates: { canonical: '/proceso-penal' },
  keywords: [
    'proceso penal Honduras',
    'etapas proceso penal Honduras',
    'audiencia inicial Honduras',
    'juicio oral Honduras',
    'defensa penal Nacaome',
    'abogado proceso penal Valle',
    'Código Procesal Penal Honduras',
    'investigación penal Honduras',
  ],
  twitter: {
    card: 'summary_large_image',
    title: `Proceso Penal en Honduras — Etapas y Defensa Técnica`,
    description: `Guía del proceso penal hondureño: investigación, audiencia inicial, juicio oral y recursos. Defensa técnica en Nacaome, Valle y zona sur.`,
    images: [`${site.url}/og-image.png`],
  },
  openGraph: {
    title: `Proceso Penal en Honduras — Etapas, Plazos y Defensa Técnica`,
    description: `Conozca las etapas del proceso penal hondureño y cómo una defensa técnica oportuna puede marcar la diferencia. Atendemos en Nacaome, Valle, San Lorenzo y Choluteca.`,
    url: `${site.url}/proceso-penal`,
    siteName: site.name,
    locale: 'es_HN',
    type: 'website',
    images: [{ url: `${site.url}/og/penal.webp`, width: 1200, height: 630, alt: `Proceso Penal en Honduras — ${site.name}` }],
  },
};

const etapas = [
  {
    icon: Search,
    titulo: 'Investigación preliminar',
    descripcion: 'El Ministerio Público reúne indicios y decide si formaliza la investigación. Es la etapa más temprana y silenciosa del proceso.',
    riesgo: 'Declaraciones sin defensa técnica que comprometan la estrategia.',
    accion: 'Si tiene conocimiento de una investigación en su contra, busque asesoría legal antes de declarar o presentar documentos.',
    enlace: '/blog/derecho-penal/que-hacer-si-me-detienen-en-honduras',
  },
  {
    icon: Gavel,
    titulo: 'Audiencia inicial',
    descripcion: 'El juez controla la legalidad de la detención, formula la imputación y resuelve sobre las medidas cautelares solicitadas.',
    riesgo: 'Medidas cautelares desfavorables si la defensa no presenta elementos de arraigo.',
    accion: 'La defensa técnica en audiencia inicial puede evitar la prisión preventiva y lograr medidas sustitutivas.',
    enlace: '/blog/derecho-penal/audiencia-inicial-proceso-penal-honduras',
  },
  {
    icon: FileText,
    titulo: 'Etapa intermedia',
    descripcion: 'El juez revisa la acusación, depura la prueba, resuelve excepciones y dicta el auto de apertura a juicio o el sobreseimiento.',
    riesgo: 'Prueba ilícita admitida o exclusión de prueba de descargo por falta de formalidad.',
    accion: 'La defensa técnica oferta prueba, objeta la ilícita y presenta excepciones para evitar la apertura a juicio.',
    enlace: '/blog/proceso-penal/sobreseimiento-definitivo-provisional',
  },
  {
    icon: Scale,
    titulo: 'Juicio oral',
    descripcion: 'Tribunal de sentencia conoce la prueba de cargo y descargo. Se presentan alegatos de apertura y clausura, y se dicta sentencia.',
    riesgo: 'Testigos mal preparados o peritajes oficiales no controvertidos.',
    accion: 'Preparación de testigos, contraperitajes y litigación estratégica para construir la teoría del caso.',
    enlace: '/blog/proceso-penal/juicio-oral-etapas-que-esperar-honduras',
  },
  {
    icon: ShieldCheck,
    titulo: 'Recursos',
    descripcion: 'Apelación ante Corte de Apelaciones, casación ante Sala de lo Penal de la CSJ, revisión y acciones constitucionales.',
    riesgo: 'Perder oportunidad de impugnar por extemporaneidad o falta de técnica recursiva.',
    accion: 'Evaluar agravios y presentar el recurso dentro del término legal. Cada recurso tiene plazos perentorios.',
    enlace: '/blog/proceso-penal/recursos-sentencia-penal-apelacion-casacion-honduras',
  },
  {
    icon: Clock,
    titulo: 'Ejecución penal',
    descripcion: 'Cumplimiento de la condena, beneficios penitenciarios, libertad condicional, redención de pena y revisión de cómputo.',
    riesgo: 'No acceder a beneficios por desconocimiento de requisitos o falta de gestión.',
    accion: 'Solicitar beneficios penitenciarios, libertad condicional y redención de pena por trabajo o estudio.',
    enlace: '/derecho-penal/ejecucion-penal-y-beneficios',
  },
];

const faqs = [
  {
    pregunta: '¿Cuánto dura un proceso penal en Honduras?',
    respuesta: 'Depende de la complejidad del caso. Los procesos simples pueden resolverse entre 6 y 12 meses. Los complejos (varios imputados, prueba pericial extensa, delitos graves) pueden durar entre 3 y 5 años hasta sentencia firme.',
  },
  {
    pregunta: '¿Qué pasa si no tengo recursos para un abogado privado?',
    respuesta: 'La Constitución de Honduras garantiza la defensa pública gratuita. Sin embargo, la Defensoría Pública tiene alta carga de trabajo. Un abogado privado puede dedicar más tiempo y recursos a su caso. Ofrecemos consulta inicial para evaluar su situación y presupuesto por escrito.',
  },
  {
    pregunta: '¿Puedo evitar la prisión preventiva?',
    respuesta: 'Sí. En audiencia inicial, la defensa puede solicitar medidas sustitutivas como presentación periódica, caución económica, arraigo domiciliario o prohibición de salida del país. La decisión depende del riesgo procesal que el juez perciba.',
  },
  {
    pregunta: '¿Qué es el sobreseimiento definitivo?',
    respuesta: 'Es una resolución judicial que pone fin al proceso penal cuando no existen suficientes elementos de cargo contra el imputado. Tiene efectos de cosa juzgada: no se puede reabrir el caso por los mismos hechos.',
  },
  {
    pregunta: '¿Cuándo prescribe un delito en Honduras?',
    respuesta: 'Los plazos de prescripción varían según la gravedad del delito. Van desde 3 años para delitos leves hasta 20 años para delitos graves. Algunos delitos como el femicidio o la desaparición forzada son imprescriptibles.',
  },
];

export default function ProcesoPenalPage() {
  const url = absoluteUrl('/proceso-penal');
  const ldSchemas = [
    serviceSchema({
      slug: 'proceso-penal',
      name: 'Proceso Penal en Honduras — Defensa Técnica en Todas las Etapas',
      description: 'Acompañamiento integral del proceso penal hondureño desde la investigación hasta la ejecución penal. Defensa técnica en audiencias, juicio oral y recursos.',
      serviceType: 'Defensa Penal',
      keywords: ['proceso penal Honduras', 'defensa penal', 'audiencia inicial', 'juicio oral', 'abogado penalista Nacaome', 'recursos penales Honduras'],
      url,
    }),
    faqPageSchema(faqs, url),
    breadcrumbsSchema([
      { name: 'Inicio', url: absoluteUrl('/') },
      { name: 'Proceso Penal', url },
    ]),
  ];

  return (
    <>
      <Breadcrumbs items={[
        { label: 'Inicio', href: '/' },
        { label: 'Proceso Penal' },
      ]} />
      <PageHero
        eyebrow="Guía del proceso penal"
        badge="Etapas y defensa técnica"
        title="Proceso Penal en Honduras: Etapas, Plazos y Cómo Defenderse"
        subtitle="Conocer las etapas del proceso penal hondureño le permite tomar decisiones informadas y proteger sus derechos desde el primer momento. La defensa técnica temprana marca la diferencia entre una resolución favorable y una condena evitable."
        cta={<CTAGroup variant="inverse" />}
        bgImage="/images/penal/litigio-complejo.webp"
      />

      <TrustBar background="light" />

      <Section spacing="md">
        <SectionHeader
          eyebrow="Conexión estratégica"
          title="El Proceso Penal como parte de la Defensa Penal Integral"
          subtitle="Esta guía del proceso penal hondureño complementa nuestra práctica en derecho penal. Conocer las etapas le ayuda a entender la estrategia de defensa y los plazos críticos de cada fase."
        />
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-text-secondary leading-relaxed">
            El proceso penal en Honduras está regulado por el <strong>Código Procesal Penal</strong> y el <strong>Código Penal (Decreto 130-2017)</strong>.
            Nuestro despacho en <Link href="/abogados-en-nacaome" className="text-accent-dark hover:text-primary underline font-semibold">Nacaome, Valle</Link> ofrece
            defensa técnica en todas las etapas del proceso, con cobertura en <Link href="/abogados-en-san-lorenzo" className="text-accent-dark hover:text-primary underline font-semibold">San Lorenzo</Link>,{' '}
            <Link href="/abogados-en-choluteca" className="text-accent-dark hover:text-primary underline font-semibold">Choluteca</Link> y la zona sur de Honduras.
          </p>
          <div className="mt-6">
            <Link
              href="/derecho-penal"
              className="inline-flex items-center gap-2 px-6 h-12 rounded-lg bg-primary text-white text-sm font-bold hover:bg-primary-light transition-colors"
            >
              Ver defensa penal completa <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </Section>

      <Section background="muted" spacing="md">
        <SectionHeader
          eyebrow="Etapas del proceso"
          title="Las 6 etapas del proceso penal hondureño"
          subtitle="Cada etapa tiene plazos, riesgos y oportunidades específicas. Una defensa técnica anticipada puede cambiar el rumbo del caso."
        />
        <div className="grid gap-5 max-w-4xl mx-auto">
          {etapas.map((etapa) => {
            const Icon = etapa.icon;
            return (
              <Card key={etapa.titulo} padding="md" className="border-l-4 border-l-accent">
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Icon className="text-accent-dark" size={20} />
                  </div>
                  <div className="flex-1">
                    <h2 className="font-bold text-base text-primary">{etapa.titulo}</h2>
                    <p className="text-sm text-text-secondary mt-1 leading-relaxed">{etapa.descripcion}</p>
                    <div className="grid sm:grid-cols-2 gap-3 mt-3">
                      <div className="bg-danger/5 rounded-lg p-3 border border-danger/10">
                        <p className="text-xxs font-bold uppercase tracking-wider text-danger mb-0.5">Riesgo principal</p>
                        <p className="text-xs text-text-secondary">{etapa.riesgo}</p>
                      </div>
                      <div className="bg-success/5 rounded-lg p-3 border border-success/10">
                        <p className="text-xxs font-bold uppercase tracking-wider text-success mb-0.5">Acción recomendada</p>
                        <p className="text-xs text-text-secondary">{etapa.accion}</p>
                      </div>
                    </div>
                    {etapa.enlace && (
                      <Link
                        href={etapa.enlace}
                        className="inline-flex items-center gap-1 mt-3 text-xs font-semibold text-accent-dark hover:text-primary transition-colors"
                      >
                        Leer guía detallada <ArrowRight size={12} />
                      </Link>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </Section>

      <Section spacing="md">
        <SectionHeader
          eyebrow="Preguntas frecuentes"
          title="Dudas comunes sobre el proceso penal en Honduras"
          align="center"
        />
        <div className="max-w-3xl mx-auto space-y-3">
          {faqs.map((faq) => (
            <Card key={faq.pregunta} padding="md" className="border-l-4 border-l-accent">
              <h3 className="font-bold text-sm text-text leading-tight mb-1.5">{faq.pregunta}</h3>
              <p className="text-sm text-text-secondary leading-relaxed">{faq.respuesta}</p>
            </Card>
          ))}
        </div>
      </Section>

      <Section background="muted" spacing="md">
        <BlogHighlights
          slugs={[
            'que-hacer-si-me-detienen-en-honduras',
            'audiencia-inicial-proceso-penal-honduras',
            'medidas-sustitutivas-prision-preventiva-honduras',
            'cuando-prescribe-delito-en-honduras',
            'derechos-detenido-honduras-guia-constitucional',
            'defensa-penal-honduras',
          ]}
          eyebrow="Artículos relacionados"
          title="Guías de defensa penal y proceso penal"
          subtitle="Amplíe sus conocimientos sobre el proceso penal hondureño con estos artículos de nuestro equipo legal."
          ctaLabel="Ver todos los artículos de derecho penal"
          ctaHref="/blog/derecho-penal"
        />
      </Section>

      <Section spacing="sm">
        <div className="max-w-3xl mx-auto text-center">
          <div className="bg-primary/5 rounded-2xl p-8 border border-primary/10">
            <h2 className="font-serif font-extrabold text-2xl text-primary">
              Defensa penal técnica en Nacaome, Valle y zona sur
            </h2>
            <p className="mt-3 text-sm text-text-secondary leading-relaxed max-w-xl mx-auto">
              Atendemos casos penales desde la investigación hasta la ejecución penal.
              Presupuesto por escrito, atención directa del abogado responsable y
              comunicación clara en cada etapa.
            </p>
            <div className="mt-6 flex flex-wrap gap-3 justify-center">
              <Link
                href="/derecho-penal"
                className="inline-flex items-center gap-2 h-11 px-5 rounded-lg bg-primary text-white text-sm font-bold hover:bg-primary-light transition-colors"
              >
                Conozca nuestra defensa penal <ArrowRight size={16} />
              </Link>
              <Link
                href="/solicitar-consulta"
                className="inline-flex items-center gap-2 h-11 px-5 rounded-lg border border-border-light bg-surface text-text text-sm font-bold hover:border-accent/40 transition-colors"
              >
                Solicitar consulta
              </Link>
            </div>
          </div>
        </div>
      </Section>

      {ldSchemas.map((schema, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      ))}

      <ConsultationCTA />
    </>
  );
}
