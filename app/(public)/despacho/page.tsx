import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Scale, ShieldCheck, Briefcase, BookOpen,
  HeartHandshake, ArrowRight, Award,
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
import { getPageContent } from '@/lib/page-content-db';
import { ConsultationCTA } from '@/components/marketing/consultation-cta';
import { Breadcrumbs } from '@/components/marketing/breadcrumbs';
import { HubFaq } from '@/components/marketing/hub-faq';
import { FAQ_DESPACHO } from '@/data/faqs-hubs';
import { AnswerBlock } from '@/components/marketing/answer-block';
import { EditorialBlock } from '@/components/marketing/editorial-block';
import { TrustLimits } from '@/components/marketing/trust-limits';

export const metadata: Metadata = buildMetadata({
  // 50 chars. Plan maestro §6.1: "Bufete de Abogados en Nacaome | Nuestro Equipo"
  title: `Bufete de Abogados en ${site.address.city} | Nuestro Equipo`,
  // 155 chars. Plan §6.1
  description: `Conozca a los abogados colegiados de ${site.name}, sus áreas de práctica y la metodología de atención del bufete en ${site.address.city} y la zona sur de Honduras.`,
  canonicalPath: '/despacho',
  keywords: ['abogados Nacaome', 'bufete jurídico Valle Honduras', 'abogados Nacaome Valle', 'despacho jurídico sur Honduras', 'equipo legal Nacaome', 'consulta confidencial Valle', 'bufete jurídico Nacaome', 'bufete jurídico sur Honduras', 'abogados Goascorán', 'abogados Amapala', 'abogados Pespire', 'abogados San Marcos de Colón', 'abogados Marcovia'],
  ogImage: `/api/og?tag=El+Despacho&title=${encodeURIComponent(`Bufete en ${site.address.city}, ${site.address.department}`)}&subtitle=${encodeURIComponent('Compromiso legal, rigor técnico y visión de vanguardia. Más de 15 años de ejercicio profesional.')}`,
  ogImageAlt: `${site.name} - Bufete jurídico en Nacaome, Valle`,
});

function despachoContent(content: Record<string, string>) {
  const storedHeroTitle = content['hero.title']?.trim();
  const storedHeroSubtitle = content['hero.subtitle']?.trim();
  const heroTitle =
    !storedHeroTitle || storedHeroTitle.includes('Visión de Vanguardia')
      ? 'Bufete de abogados en Nacaome con experiencia en distintas áreas del derecho'
      : storedHeroTitle;
  const heroSubtitle =
    !storedHeroSubtitle
    || storedHeroSubtitle.includes('rigor metodológico')
    || storedHeroSubtitle.includes('confidencialidad absoluta')
      ? `${site.name} es un despacho fundado en Nacaome con más de 15 años de ejercicio profesional. La defensa penal es nuestro pilar histórico y la complementamos con atención en familia, laboral, civil, notarial, mercantil y otras áreas del derecho hondureño.`
      : storedHeroSubtitle;

  return {
    hero: {
      eyebrow: content['hero.eyebrow'] || 'El Despacho',
      badge: content['hero.badge'] || 'Multidisciplinar',
      title: heroTitle,
      subtitle: heroSubtitle,
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

      {/* BLOQUE EDITORIAL CANÓNICO — respuesta directa sobre QUIÉN ES el
          despacho. Modelo unificado: AnswerBlock en Section warm, mismo
          formato que el resto de páginas. */}
      <Section background="warm" spacing="md">
        <Container size="lg">
          <AnswerBlock
            eyebrow="El bufete"
            question="¿Quién es Pineda y Asociados?"
            answer={`${site.name} es un bufete jurídico con sede en ${site.address.city}, ${site.address.department}. El despacho atiende asuntos penales, familiares, laborales, civiles, notariales, mercantiles y administrativos mediante un equipo de abogados colegiados en Honduras. Cada caso se asigna según el área de práctica del abogado responsable y se gestiona con confidencialidad, trazabilidad documental y comunicación directa.`}
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Danilo Pineda Maradiaga — socio director (identidad pública).
              Su foto y nombre se exponen con su consentimiento expreso. */}
          <Card padding="md" className="card-premium border-accent/30 h-full flex flex-col relative group">
            <Link
              href="/equipo/danilo-pineda-maradiaga"
              aria-label={`Ver perfil completo de ${FOUNDER_PROFILE.name}`}
              className="absolute inset-0 z-0 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
            />
            <div className="flex items-center gap-4">
              <span className="team-monogram" aria-hidden="true">DP</span>
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
                {FOUNDER_PROFILE.linkedin && <a href={FOUNDER_PROFILE.linkedin} target="_blank" rel="noopener noreferrer" className="relative z-10 inline-flex items-center gap-1 px-2 py-0.5 rounded bg-surface border border-border-light text-xs text-text-secondary hover:text-primary transition-colors">LinkedIn</a>}
                {FOUNDER_PROFILE.directorio && <a href={FOUNDER_PROFILE.directorio} target="_blank" rel="noopener noreferrer" className="relative z-10 inline-flex items-center gap-1 px-2 py-0.5 rounded bg-surface border border-border-light text-xs text-text-secondary hover:text-primary transition-colors">Directorio Jurídico</a>}
              </div>
            )}
            <p className="text-sm text-text-secondary mt-4 leading-relaxed text-pretty flex-1">
              Abogado responsable del bufete. Más de 15 años de ejercicio profesional.
              Litigante en audiencias iniciales, preliminares, de sobreseimiento y juicio
              oral en el departamento de Valle y zonas circunvecinas. La defensa penal es
              el pilar histórico del despacho.
            </p>
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <Link
                href={`/equipo/danilo-pineda-maradiaga`}
                className="relative z-10 inline-flex items-center gap-1.5 text-sm font-semibold text-accent-dark hover:text-primary transition-colors"
              >
                Ver perfil completo <ArrowRight size={14} />
              </Link>
              <Link
                href="/derecho-penal"
                className="relative z-10 inline-flex items-center gap-1.5 text-sm font-semibold text-accent-dark hover:text-primary transition-colors"
              >
                Defensa penal <ArrowRight size={14} />
              </Link>
            </div>
          </Card>

          {/* Thania Marlene Paz — socia fundadora (administrativo, familia,
              civil y notarial, mercantil y empresarial). */}
          <Card padding="md" className="card-premium border-accent/30 h-full flex flex-col relative group">
            <Link
              href="/equipo/thania-marlene-paz"
              aria-label={`Ver perfil completo de ${THANIA_PROFILE.name}`}
              className="absolute inset-0 z-0 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
            />
            <div className="flex items-center gap-4">
              <span className="team-monogram" aria-hidden="true">TP</span>
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
                {THANIA_PROFILE.linkedin && <a href={THANIA_PROFILE.linkedin} target="_blank" rel="noopener noreferrer" className="relative z-10 inline-flex items-center gap-1 px-2 py-0.5 rounded bg-surface border border-border-light text-xs text-text-secondary hover:text-primary transition-colors">LinkedIn</a>}
                {THANIA_PROFILE.directorio && <a href={THANIA_PROFILE.directorio} target="_blank" rel="noopener noreferrer" className="relative z-10 inline-flex items-center gap-1 px-2 py-0.5 rounded bg-surface border border-border-light text-xs text-text-secondary hover:text-primary transition-colors">Directorio Jurídico</a>}
              </div>
            )}
            <p className="text-sm text-text-secondary mt-4 leading-relaxed text-pretty flex-1">
              Abogada socia fundadora del bufete. Especializada en derecho
              administrativo, familia, civil y notarial, y mercantil y empresarial.
              Atiende casos en Nacaome, Valle y la zona sur de Honduras.
            </p>
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <Link
                href={`/equipo/thania-marlene-paz`}
                className="relative z-10 inline-flex items-center gap-1.5 text-sm font-semibold text-accent-dark hover:text-primary transition-colors"
              >
                Ver perfil completo <ArrowRight size={14} />
              </Link>
              <Link
                href="/servicios-juridicos/derecho-de-familia"
                className="relative z-10 inline-flex items-center gap-1.5 text-sm font-semibold text-accent-dark hover:text-primary transition-colors"
              >
                Derecho de familia <ArrowRight size={14} />
              </Link>
            </div>
          </Card>

          {/* Emil Barahona — socio del bufete (laboral, penal, civil y notarial). */}
          <Card padding="md" className="card-premium border-accent/30 h-full flex flex-col relative group">
            <Link
              href="/equipo/emil-barahona"
              aria-label={`Ver perfil completo de ${EMIL_PROFILE.name}`}
              className="absolute inset-0 z-0 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
            />
            <div className="flex items-center gap-4">
              <span className="team-monogram" aria-hidden="true">EB</span>
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
                {EMIL_PROFILE.linkedin && <a href={EMIL_PROFILE.linkedin} target="_blank" rel="noopener noreferrer" className="relative z-10 inline-flex items-center gap-1 px-2 py-0.5 rounded bg-surface border border-border-light text-xs text-text-secondary hover:text-primary transition-colors">LinkedIn</a>}
                {EMIL_PROFILE.directorio && <a href={EMIL_PROFILE.directorio} target="_blank" rel="noopener noreferrer" className="relative z-10 inline-flex items-center gap-1 px-2 py-0.5 rounded bg-surface border border-border-light text-xs text-text-secondary hover:text-primary transition-colors">Directorio Jurídico</a>}
              </div>
            )}
            <p className="text-sm text-text-secondary mt-4 leading-relaxed text-pretty flex-1">
              Abogado socio del bufete. Especializado en derecho laboral, civil y
              notarial. Atiende casos en Nacaome, Valle y la zona sur de Honduras.
            </p>
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <Link
                href={`/equipo/emil-barahona`}
                className="relative z-10 inline-flex items-center gap-1.5 text-sm font-semibold text-accent-dark hover:text-primary transition-colors"
              >
                Ver perfil completo <ArrowRight size={14} />
              </Link>
              <Link
                href="/servicios-juridicos/derecho-laboral"
                className="relative z-10 inline-flex items-center gap-1.5 text-sm font-semibold text-accent-dark hover:text-primary transition-colors"
              >
                Derecho laboral <ArrowRight size={14} />
              </Link>
            </div>
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
