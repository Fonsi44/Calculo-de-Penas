import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import {
  Scale, ShieldCheck, Briefcase, BookOpen,
  HeartHandshake, ArrowRight, Gavel, Award,
} from 'lucide-react';
import { site, FOUNDER_PROFILE, THANIA_PROFILE, EMIL_PROFILE } from '@/lib/site';
import { buildMetadata } from '@/lib/seo';
import { Section, SectionHeader, Container } from '@/components/marketing/section';
import { CTAGroup } from '@/components/marketing/cta-buttons';
import { Card } from '@/components/ui/card';
import { LiveOfficeStatus, StatsCounter } from '@/components/marketing/live-widgets';
import { PageHero } from '@/components/marketing/page-hero';
import { TrustBar } from '@/components/marketing/trust-bar';
import { ProcessStepper } from '@/components/marketing/process-stepper';
import { getCorporateImage } from '@/data/images';
import { getPageContent } from '@/lib/page-content-db';
import { ConsultationCTA } from '@/components/marketing/consultation-cta';
import { Breadcrumbs } from '@/components/marketing/breadcrumbs';
import { BlogHighlights } from '@/components/marketing/blog-highlights';
import { HubFaq } from '@/components/marketing/hub-faq';
import { FAQ_DESPACHO } from '@/data/faqs-hubs';
import { AnswerBlock } from '@/components/marketing/answer-block';
import { EditorialBlock } from '@/components/marketing/editorial-block';
import { TrustLimits } from '@/components/marketing/trust-limits';

export const metadata: Metadata = buildMetadata({
  // 56 chars. Antes 38 (subutilizado).
  title: `Bufete de Abogados en ${site.address.city} | 15+ Años de Experiencia`,
  // 152 chars. Antes 198 (se truncaba).
  description: `Bufete en ${site.address.city}, Valle. Más de 15 años en defensa penal, familia, laboral, civil y mercantil. Consulta confidencial y presupuesto por escrito.`,
  canonicalPath: '/despacho',
  keywords: ['abogados Nacaome', 'bufete jurídico Valle Honduras', 'abogados Nacaome Valle', 'despacho jurídico sur Honduras', 'equipo legal Nacaome', 'consulta confidencial Valle', 'bufete jurídico Nacaome', 'bufete jurídico sur Honduras', 'abogados Goascorán', 'abogados Amapala', 'abogados Pespire', 'abogados San Marcos de Colón', 'abogados Marcovia'],
  ogImage: `/api/og?tag=El+Despacho&title=${encodeURIComponent(`Bufete en ${site.address.city}, ${site.address.department}`)}&subtitle=${encodeURIComponent('Compromiso legal, rigor técnico y visión de vanguardia. Más de 15 años de ejercicio profesional.')}`,
  ogImageAlt: `${site.name} - Bufete jurídico en Nacaome, Valle`,
});

function despachoContent(content: Record<string, string>) {
  return {
    hero: {
      eyebrow: content['hero.eyebrow'] || 'El Despacho',
      badge: content['hero.badge'] || 'Multidisciplinar',
      title: content['hero.title'] || 'Bufete de Abogados en Nacaome, Valle — Compromiso Legal, Rigor Técnico y Visión de Vanguardia',
      subtitle: content['hero.subtitle'] || `${site.name} es un bufete jurídico fundado sobre los pilares del rigor metodológico, la confidencialidad absoluta y la excelencia jurídica. Nos especializamos en ofrecer soluciones legales estratégicas tanto en el ámbito penal como en las distintas ramas del derecho empresarial y privado. Nuestro enfoque combina una sólida solvencia técnica con la digitalización de procesos, garantizando a cada cliente un respaldo legal robusto, transparente y de alto nivel en un entorno global.`,
    },
    mision: {
      title: content['mision_vision.mision_title'] || 'Defender con técnica, servir con humanidad',
      desc: content['mision_vision.mision_desc'] || 'Garantizar que toda persona acceda a una defensa y orientación jurídica seria, técnica y respetuosa de sus derechos.',
    },
    vision: {
      title: content['mision_vision.vision_title'] || 'Justicia accesible y técnica',
      desc: content['mision_vision.vision_desc'] || 'Un sistema de justicia donde cada persona pueda ejercer su derecho a la defensa con un equipo que domine la técnica y actúe con prudencia.',
    },
    values: {
      sectionTitle: content['values.section_title'] || 'Lo que nos define como bufete',
      items: [
        { icon: ShieldCheck, title: content['values.value1_title'] || 'Defensa técnica, no promesas', desc: content['values.value1_desc'] || 'Aplicamos el Código Penal con rigor metodológico. Nunca prometemos resultados: le decimos lo que procede y lo que no.' },
        { icon: BookOpen, title: content['values.value2_title'] || 'Estudio permanente', desc: content['values.value2_desc'] || 'Nos actualizamos en jurisprudencia, reformas y doctrina. El derecho cambia, y nuestra práctica también.' },
        { icon: HeartHandshake, title: content['values.value3_title'] || 'Trato humano', desc: content['values.value3_desc'] || 'Detrás de cada caso hay una persona y una familia. Le escuchamos, le informamos y le acompañamos con respeto.' },
        { icon: Briefcase, title: content['values.value4_title'] || 'Tecnología al servicio del caso', desc: content['values.value4_desc'] || 'Motor de cálculo de penas, gestión documental, trazabilidad. Le entregamos cada actuación con fecha y firma.' },
      ],
    },
    commitments: [
      content['commitments.c1'] || 'Consulta inicial confidencial y sin compromiso',
      content['commitments.c2'] || 'Explicación clara de cada etapa procesal',
      content['commitments.c3'] || 'Honestidad sobre las expectativas reales del caso',
      content['commitments.c4'] || 'Presupuesto de honorarios por escrito',
      content['commitments.c5'] || 'Atención directa del abogado responsable',
      content['commitments.c6'] || 'Trazabilidad documental de cada actuación',
      content['commitments.c7'] || 'Coordinación interna entre áreas cuando su caso lo requiere',
      content['commitments.c8'] || 'Información actualizada sobre normativa y reformas',
    ],
  };
}

export default async function DespachoPage() {
  const contentMap = await getPageContent('despacho');
  const c = despachoContent(contentMap);

  const orgLd = {
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    '@id': `${site.url}/despacho#aboutpage`,
    name: `${site.name} — El Despacho`,
    url: `${site.url}/despacho`,
    description: `Bufete de abogados en ${site.address.city}, ${site.address.department}, Honduras. Más de 15 años de ejercicio profesional en defensa penal, familia, laboral, civil y mercantil.`,
    inLanguage: 'es-HN',
    isPartOf: { '@id': `${site.url}/#website` },
    about: { '@id': `${site.url}/#organization` },
    mainEntity: { '@id': `${site.url}/#organization` },
  };

  return (
    <>
      <Breadcrumbs items={[
        { label: 'Inicio', href: '/' },
        { label: 'El Despacho' },
      ]} />
      {/* HERO */}
      <PageHero
        eyebrow={c.hero.eyebrow}
        badge={c.hero.badge}
        title={c.hero.title}
        subtitle={c.hero.subtitle}
        cta={<CTAGroup variant="inverse" />}
        bgImage="/images/despacho/diosa-justicia.webp"
      />

      {/* TRUST BAR */}
      <TrustBar background="light" />

      {/* HERO CORPORATIVO */}
      {(() => {
        const heroImg = getCorporateImage('hero_despacho');
        return heroImg ? (
          <div className="relative aspect-[21/9] w-full overflow-hidden bg-primary">
            <Image
              src={heroImg}
              alt={`Interior del despacho ${site.name}`}
              fill
              sizes="100vw"
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-r from-primary/85 via-primary/55 to-transparent" aria-hidden="true" />
            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 h-full flex items-center">
              <div className="max-w-2xl text-text-inverse">
                <p className="eyebrow-rule text-xxs font-bold uppercase tracking-eyebrow text-accent mb-3">
                  Sede del bufete
                </p>
                <h2 className="font-serif font-extrabold text-2xl md:text-3xl lg:text-4xl leading-tight text-balance">
                  Atención presencial en Nacaome, Valle
                </h2>
                <p className="mt-3 text-sm md:text-base text-text-inverse/85 leading-relaxed text-pretty">
                  {site.address.line1}, {site.address.line2}.
                  Le recibimos con cita previa para garantizar confidencialidad.
                </p>
              </div>
            </div>
          </div>
        ) : null;
      })()}

      {/* BLOQUE EDITORIAL CANÓNICO — respuesta directa sobre QUIÉN ES el
          despacho. Modelo unificado: AnswerBlock en Section warm, mismo
          formato que el resto de páginas. */}
      <Section background="warm" spacing="md">
        <Container size="lg">
          <AnswerBlock
            eyebrow="El bufete"
            question="¿Quién es Pineda y Asociados?"
            answer={`${site.name} es un bufete jurídico fundado en Nacaome, Valle (Honduras), con más de 15 años de ejercicio profesional. Su pilar histórico es la defensa penal, complementada con derecho de familia, laboral, civil y notarial, mercantil y empresarial, administrativo y migratorio. Atiende con un único punto de contacto por caso y coordina internamente entre especialistas cuando un asunto cruza varias ramas del derecho.`}
          />
        </Container>
      </Section>

      {/* STATS + LIVE */}
      <Section background="muted" spacing="sm">
        <div className="grid lg:grid-cols-3 gap-4 items-stretch">
          <div className="lg:col-span-2">
            <StatsCounter />
          </div>
          <LiveOfficeStatus />
        </div>
      </Section>

      <BlogHighlights
        slugs={[
          'prescripcion-deudas-plazos-honduras',
          'estafas-fraudes-tipos-penales-honduras',
          'custodia-hijos-honduras-juez',
          'poder-legal-honduras-cuando-se-necesita',
        ]}
        eyebrow="Antes de su consulta"
        title="Temas que ya consultan en Google antes de contactar al despacho"
        subtitle="Estas guías concentran demanda orgánica real y ayudan a llegar a la primera consulta con mejor contexto, documentos y preguntas útiles."
        ctaLabel="Ver todas las guías del blog"
        ctaHref="/blog"
      />
      <div className="text-center -mt-4 pb-2">
        <Link href="/guia-legal-abogados-honduras" className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent-dark hover:text-primary transition-colors">
          Guía para contratar abogado en Honduras <ArrowRight size={14} />
        </Link>
      </div>

      {/* MISIÓN, VISIÓN Y VALORES — sección consolidada (Fase 3.2).
          Antes eran 3 bloques separados (Misión+compromisos, 4 cards derechas
          con Visión/Valores/Credenciales/Especialidad, y VALUES con 4 cards).
          Ahora es una sola sección coherente: Misión como bloque editorial
          con los compromisos como puntos, + columna derecha con Visión y la
          especialidad/credenciales combinadas. La saturación de 12 tarjetas
          temáticamente próximas se reduce a 2 columnas con jerarquía clara. */}
      <Section spacing="lg" ariaLabel="Misión, visión y valores" className="section-breath">
        <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          <div className="lg:col-span-7">
            <EditorialBlock
              eyebrow="Misión"
              title={c.mision.title}
              intro={c.mision.desc}
              points={c.commitments.map((commitment) => ({ title: commitment }))}
            />
          </div>
          <div className="lg:col-span-5 space-y-4">
            <Card padding="md" className="border-l-4 border-l-accent card-premium">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-11 h-11 rounded-lg bg-accent/15 text-accent-dark flex items-center justify-center border border-accent/30 flex-shrink-0">
                  <Scale size={20} aria-hidden="true" />
                </div>
                <div>
                  <p className="text-xxs font-bold uppercase tracking-widest text-accent-dark mb-1">
                    Visión
                  </p>
                  <p className="text-sm font-bold leading-tight text-text">{c.vision.title}</p>
                </div>
              </div>
              <p className="text-sm text-text leading-relaxed text-pretty">{c.vision.desc}</p>
            </Card>
            <Card padding="md" className="border-l-4 border-l-primary card-premium">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-11 h-11 rounded-lg bg-primary/10 text-primary flex items-center justify-center border border-primary/15 flex-shrink-0">
                  <Award size={20} aria-hidden="true" />
                </div>
                <p className="text-xxs font-bold uppercase tracking-widest text-primary">
                  Credenciales y especialidad
                </p>
              </div>
              <p className="text-sm text-text leading-relaxed text-pretty">
                Abogado colegiado en Honduras con registro profesional vigente y miembro del
                Colegio de Abogados. La <strong>defensa penal y procesal penal</strong> es el
                pilar histórico del bufete, con experiencia en asistencia a detenidos,
                audiencias iniciales, preliminares, juicio oral y recursos de casación.
              </p>
              <Link
                href="/derecho-penal"
                className="inline-flex items-center gap-1.5 mt-3 text-sm font-semibold text-accent-dark hover:text-primary transition-colors"
              >
                Ver especialidad en defensa penal <ArrowRight size={14} />
              </Link>
              <p className="text-xs text-text-muted leading-relaxed mt-3 text-pretty">
                Como referencia institucional del sistema judicial hondureño, puede consultar el
                sitio oficial del{' '}
                <a
                  href="https://www.poderjudicial.gob.hn/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-accent-dark hover:text-primary underline underline-offset-2 decoration-accent/40 transition-colors"
                >
                  Poder Judicial de Honduras
                </a>.
              </p>
            </Card>
          </div>
        </div>
      </Section>

      {/* VALORES — bloque editorial con divisores (Hito 9.4).
          Antes: grid de 4 tarjetas idénticas con icono central. Ahora:
          composición de dos columnas con divisores entre pares. */}
      <Section background="muted" spacing="md">
        <SectionHeader
          eyebrow="Nuestros valores"
          title={c.values.sectionTitle}
          subtitle="Cuatro principios que sostienen cada decisión, cada audiencia, cada escrito."
          align="center"
        />
        <dl className="max-w-4xl mx-auto divide-y divide-border/40 md:columns-2 md:gap-x-10 md:divide-y-0 [column-rule:1px_solid_hsl(220_10%_85%)]">
          {c.values.items.map((v) => (
            <div key={v.title} className="py-5 md:py-6 md:break-inside-avoid">
              <dt className="flex items-center gap-3">
                <span className="w-11 h-11 rounded-lg bg-accent/15 text-accent-dark flex items-center justify-center flex-shrink-0 border border-accent/30">
                  <v.icon size={20} aria-hidden="true" />
                </span>
                <span className="font-bold text-sm text-text leading-tight">{v.title}</span>
              </dt>
              <dd className="mt-2 ml-14 text-sm text-text-secondary leading-relaxed text-pretty">{v.desc}</dd>
            </div>
          ))}
        </dl>
      </Section>

      {/* EQUIPO — dueño canónico del bloque (Fase 3.2).
          La home y /solicitar-consulta referencian aquí; no duplican el
          bloque. Tres socios con identidad pública y foto; el resto del
          equipo técnico se identifica a clientes con relación constituida,
          conforme al secreto profesional. */}
      <Section background="muted" spacing="md">
        <SectionHeader
          eyebrow="Equipo"
          title="Los abogados responsables de cada área"
          subtitle="Tres socios con especialidades complementarias. Atención directa del abogado responsable en cada caso; el resto del equipo técnico se identifica a los clientes con relación de servicio constituida, conforme al secreto profesional."
        />
        {(() => {
          const meetingImg = getCorporateImage('corporate_meeting');
          return meetingImg ? (
            <div className="relative aspect-[21/9] w-full overflow-hidden rounded-lg mb-6 border border-border-light">
              <Image
                src={meetingImg}
                alt="Reunión profesional del bufete"
                fill
                sizes="100vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/55 via-transparent to-transparent" aria-hidden="true" />
            </div>
          ) : null;
        })()}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Danilo Pineda Maradiaga — socio director (identidad pública).
              Su foto y nombre se exponen con su consentimiento expreso. */}
          <Card padding="md" className="card-premium border-accent/30 h-full flex flex-col">
            <div className="flex items-center gap-4">
              <div className="relative flex-shrink-0">
                <div className="absolute -inset-1.5 rounded-lg bg-accent/15 blur-xl" aria-hidden="true" />
                <div className="relative w-20 h-20 rounded-lg border border-accent/30 overflow-hidden bg-surface-alt">
                  <Image
                    src="/images/equipo/danilo-pineda-maradiaga.webp"
                    alt={FOUNDER_PROFILE.imageAltText ?? 'Danilo Pineda Maradiaga, abogado penalista en Nacaome, Valle (Honduras)'}
                    width={160}
                    height={160}
                    className="w-full h-full object-cover"
                    sizes="80px"
                  />
                </div>
              </div>
              <div>
                <p className="text-xxs font-bold uppercase tracking-widest text-accent-dark mb-1">
                  Dirección y defensa penal
                </p>
                <p className="font-serif font-bold text-base text-text leading-tight">
                  {FOUNDER_PROFILE.name}
                </p>
                <p className="text-sm text-text-secondary leading-snug mt-0.5">
                  {FOUNDER_PROFILE.jobTitle}
                </p>
              </div>
            </div>
            {(FOUNDER_PROFILE.cah || FOUNDER_PROFILE.linkedin || FOUNDER_PROFILE.directorio) && (
              <div className="flex flex-wrap gap-2 mt-4">
                {FOUNDER_PROFILE.cah && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-surface border border-border-light text-xs text-text-secondary font-medium"><Award size={12}/> CAH: {FOUNDER_PROFILE.cah}</span>}
                {FOUNDER_PROFILE.linkedin && <a href={FOUNDER_PROFILE.linkedin} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-surface border border-border-light text-xs text-text-secondary hover:text-primary transition-colors">LinkedIn</a>}
                {FOUNDER_PROFILE.directorio && <a href={FOUNDER_PROFILE.directorio} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-surface border border-border-light text-xs text-text-secondary hover:text-primary transition-colors">Directorio Jurídico</a>}
              </div>
            )}
            <p className="text-sm text-text-secondary mt-4 leading-relaxed text-pretty flex-1">
              Abogado responsable del bufete. Más de 15 años de ejercicio profesional.
              Litigante en audiencias iniciales, preliminares, de sobreseimiento y juicio
              oral en el departamento de Valle y zonas circunvecinas. La defensa penal es
              el pilar histórico del despacho.
            </p>
            <Link
              href="/derecho-penal"
              className="inline-flex items-center gap-1.5 mt-3 text-sm font-semibold text-accent-dark hover:text-primary transition-colors"
            >
              Ver especialidad en defensa penal <ArrowRight size={14} />
            </Link>
          </Card>

          {/* Thania Marlene Paz — socia fundadora (administrativo, familia,
              civil y notarial, mercantil y empresarial). */}
          <Card padding="md" className="card-premium border-accent/30 h-full flex flex-col">
            <div className="flex items-center gap-4">
              <div className="relative flex-shrink-0">
                <div className="absolute -inset-1.5 rounded-lg bg-accent/15 blur-xl" aria-hidden="true" />
                <div className="relative w-20 h-20 rounded-lg border border-accent/30 overflow-hidden bg-surface-alt">
                  <Image
                    src="/images/equipo/thania-marlene-paz.webp"
                    alt={THANIA_PROFILE.imageAltText}
                    width={160}
                    height={160}
                    className="w-full h-full object-cover"
                    sizes="80px"
                  />
                </div>
              </div>
              <div>
                <p className="text-xxs font-bold uppercase tracking-widest text-accent-dark mb-1">
                  Familia · Mercantil · Administrativo
                </p>
                <p className="font-serif font-bold text-base text-text leading-tight">
                  {THANIA_PROFILE.name}
                </p>
                <p className="text-sm text-text-secondary leading-snug mt-0.5">
                  {THANIA_PROFILE.jobTitle}
                </p>
              </div>
            </div>
            {(THANIA_PROFILE.cah || THANIA_PROFILE.linkedin || THANIA_PROFILE.directorio) && (
              <div className="flex flex-wrap gap-2 mt-4">
                {THANIA_PROFILE.cah && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-surface border border-border-light text-xs text-text-secondary font-medium"><Award size={12}/> CAH: {THANIA_PROFILE.cah}</span>}
                {THANIA_PROFILE.linkedin && <a href={THANIA_PROFILE.linkedin} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-surface border border-border-light text-xs text-text-secondary hover:text-primary transition-colors">LinkedIn</a>}
                {THANIA_PROFILE.directorio && <a href={THANIA_PROFILE.directorio} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-surface border border-border-light text-xs text-text-secondary hover:text-primary transition-colors">Directorio Jurídico</a>}
              </div>
            )}
            <p className="text-sm text-text-secondary mt-4 leading-relaxed text-pretty flex-1">
              Abogada socia fundadora del bufete. Especializada en derecho
              administrativo, familia, civil y notarial, y mercantil y empresarial.
              Atiende casos en Nacaome, Valle y la zona sur de Honduras.
            </p>
            <Link
              href="/servicios-juridicos/derecho-de-familia"
              className="inline-flex items-center gap-1.5 mt-3 text-sm font-semibold text-accent-dark hover:text-primary transition-colors"
            >
              Ver especialidad en derecho de familia <ArrowRight size={14} />
            </Link>
          </Card>

          {/* Emil Barahona — socio del bufete (laboral, penal, civil y notarial). */}
          <Card padding="md" className="card-premium border-accent/30 h-full flex flex-col">
            <div className="flex items-center gap-4">
              <div className="relative flex-shrink-0">
                <div className="absolute -inset-1.5 rounded-lg bg-accent/15 blur-xl" aria-hidden="true" />
                <div className="relative w-20 h-20 rounded-lg border border-accent/30 overflow-hidden bg-surface-alt">
                  <Image
                    src="/images/equipo/emil-barahona.webp"
                    alt={EMIL_PROFILE.imageAltText}
                    width={160}
                    height={160}
                    className="w-full h-full object-cover"
                    sizes="80px"
                  />
                </div>
              </div>
              <div>
                <p className="text-xxs font-bold uppercase tracking-widest text-accent-dark mb-1">
                  Laboral · Civil y Notarial
                </p>
                <p className="font-serif font-bold text-base text-text leading-tight">
                  {EMIL_PROFILE.name}
                </p>
                <p className="text-sm text-text-secondary leading-snug mt-0.5">
                  {EMIL_PROFILE.jobTitle}
                </p>
              </div>
            </div>
            {(EMIL_PROFILE.cah || EMIL_PROFILE.linkedin || EMIL_PROFILE.directorio) && (
              <div className="flex flex-wrap gap-2 mt-4">
                {EMIL_PROFILE.cah && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-surface border border-border-light text-xs text-text-secondary font-medium"><Award size={12}/> CAH: {EMIL_PROFILE.cah}</span>}
                {EMIL_PROFILE.linkedin && <a href={EMIL_PROFILE.linkedin} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-surface border border-border-light text-xs text-text-secondary hover:text-primary transition-colors">LinkedIn</a>}
                {EMIL_PROFILE.directorio && <a href={EMIL_PROFILE.directorio} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-surface border border-border-light text-xs text-text-secondary hover:text-primary transition-colors">Directorio Jurídico</a>}
              </div>
            )}
            <p className="text-sm text-text-secondary mt-4 leading-relaxed text-pretty flex-1">
              Abogado socio del bufete. Especializado en derecho laboral, civil y
              notarial. Atiende casos en Nacaome, Valle y la zona sur de Honduras.
            </p>
            <Link
              href="/servicios-juridicos/derecho-laboral"
              className="inline-flex items-center gap-1.5 mt-3 text-sm font-semibold text-accent-dark hover:text-primary transition-colors"
            >
              Ver especialidad en derecho laboral <ArrowRight size={14} />
            </Link>
          </Card>
        </div>
      </Section>

      {/* CÓMO TRABAJAMOS */}
      <Section spacing="md">
        <SectionHeader
          eyebrow="Cómo trabajamos"
          title="Cuatro pasos para acompañarle en su caso"
          subtitle="Un método claro y trazable que aplicamos a todas las áreas del bufete, con la confidencialidad y el rigor técnico que su situación requiere."
        />
        <ProcessStepper
          steps={[
            { step: 1, title: 'Consulta inicial', desc: 'Evaluamos su caso de forma confidencial y le explicamos las opciones reales con honestidad, sea penal, civil, laboral o cualquier otra área.' },
            { step: 2, title: 'Estrategia legal', desc: 'Analizamos pruebas, normativa aplicable y diseñamos la estrategia jurídica óptima, identificando si requiere coordinación con otras áreas.' },
            { step: 3, title: 'Gestión y litigio', desc: 'Tramitamos su asunto con diligencia en sede administrativa, judicial o notarial, según corresponda. Le mantenemos informado en cada etapa.' },
            { step: 4, title: 'Cierre y seguimiento', desc: 'Le entregamos un informe claro del resultado y, si procede, los recursos o las actuaciones complementarias disponibles.' },
          ]}
          withConnector
        />
      </Section>

      {/* VISIÓN MULTIDISCIPLINAR — bloque editorial sobrio (Fase 3.2).
          Antes eran 4 tarjetas navy clonadas que repetían el patrón
          icono-texto de las secciones anteriores. Ahora es un bloque
          narrativo que explica el valor de la coordinación interna. */}
      <Section background="primary" spacing="md">
        <Container size="md">
          <EditorialBlock
            variant="inverted"
            align="center"
            eyebrow="Visión multidisciplinar"
            title="Su caso, atendido por el área correcta con respaldo del bufete completo"
            intro="La mayoría de los problemas jurídicos cruzan varias ramas del derecho. Un equipo coordinado es más rápido, más económico y más seguro que tratar cada frente por separado: un único punto de contacto, un solo expediente y una estrategia coherente."
            points={[
              { icon: Gavel, title: 'Penal con repercusión familiar y patrimonial', description: 'Acusaciones que arrastran custodia, bienes o responsabilidades civiles.' },
              { icon: Briefcase, title: 'Laboral y mercantil en empresas', description: 'Despidos, contratos y sociedades que requieren mirar varias ramas a la vez.' },
              { icon: Scale, title: 'Civil, tributario y bancario', description: 'Embargos, cobros y obligaciones que conectan patrimonio y fiscalidad.' },
              { icon: BookOpen, title: 'Notarial y registral', description: 'Compraventas, donaciones, sociedades y traspasos con trazabilidad.' },
            ]}
            cta={{ href: '/servicios-juridicos', label: 'Ver las áreas del derecho que atendemos' }}
          />
        </Container>
      </Section>

      {/* CÓMO SE ASIGNAN LOS ASUNTOS + PRESUPUESTO Y CONTRATACIÓN (FASE 2).
          Dos bloques breves que explican el proceso interno y la transparencia
          económica. Sin cifras fijas (R4): el presupuesto siempre es por
          escrito y caso a caso. No se prometen plazos cerrados ni resultados. */}
      <Section background="muted" spacing="md" ariaLabel="Asignación y contratación">
        <div className="grid md:grid-cols-2 gap-4 lg:gap-5">
          <Card padding="md" className="h-full border-l-4 border-l-accent card-premium">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-11 h-11 rounded-lg bg-accent/15 text-accent-dark flex items-center justify-center border border-accent/30 flex-shrink-0">
                <Scale size={20} aria-hidden="true" />
              </div>
              <h2 className="font-serif font-bold text-lg text-text leading-tight">
                Cómo se asignan los asuntos
              </h2>
            </div>
            <p className="text-sm text-text-secondary leading-relaxed text-pretty">
              En la primera consulta se identifica el área principal del caso y se
              asigna al abogado responsable de esa rama. Cuando el asunto cruza
              varias ramas, el equipo coordina internamente y el cliente mantiene
              un único punto de contacto. El responsable del caso es quien firma
              los escritos y comparece, no un intermediario.
            </p>
          </Card>
          <Card padding="md" className="h-full border-l-4 border-l-primary card-premium">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-11 h-11 rounded-lg bg-primary/10 text-primary flex items-center justify-center border border-primary/15 flex-shrink-0">
                <Briefcase size={20} aria-hidden="true" />
              </div>
              <h2 className="font-serif font-bold text-lg text-text leading-tight">
                Presupuesto y contratación
              </h2>
            </div>
            <p className="text-sm text-text-secondary leading-relaxed text-pretty">
              Tras la consulta inicial se entrega un presupuesto por escrito con el
              alcance del trabajo y los honorarios. Los honorarios dependen de la
              complejidad, la urgencia y las etapas previstas: no hay tarifa fija.
              Ninguna actuación profesional se inicia sin su autorización expresa,
              y la relación jurídica nace con la firma del contrato de prestación
              de servicios.
            </p>
          </Card>
        </div>
      </Section>

      {/* CONFIANZA Y LÍMITES (FASE 2) — reutiliza el componente de la home.
          En /despacho omitimos el enlace "Conozca el despacho" (estamos ya en
          ella). El bloque de límites declara de forma prudente lo que NO se
          garantiza, sin afirmaciones pendientes (P01–P15) ni cifras inventadas. */}
      <Section spacing="md" ariaLabel="Confianza y límites">
        <TrustLimits showLimitsLink={false} />
      </Section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgLd) }}
      />
      <ConsultationCTA />
      <HubFaq
        faqs={FAQ_DESPACHO}
        url={`${site.url}/despacho`}
        eyebrow="Conozca el bufete"
        title="Preguntas frecuentes sobre el despacho"
      />
    </>
  );
}

